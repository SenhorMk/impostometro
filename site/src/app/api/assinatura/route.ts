import { cancelarAssinatura, criarAssinatura, criarCliente, ErroAsaas, linkAsaasSeguro, linkDaPrimeiraCobranca } from "@/lib/asaas";
import { assinaturaDe, assinaturaObrigatoria } from "@/lib/acesso";
import { hojeBrasil, precoCentavos, temAcesso } from "@/lib/assinatura";
import { documentoPagador } from "@/lib/contas";
import { CorpoInvalido, dentroDoLimite, ipDoPedido, lerJson, muitosPedidos } from "@/lib/limite";
import { admin, usuarioDoPedido } from "@/lib/supabase-servidor";

/**
 * POST /api/assinatura  { documento, nome }  →  { link }   (T14)
 * Cria (ou reaproveita) o cliente no Asaas, cria a assinatura mensal e devolve o link da
 * página de pagamento do Asaas, onde a pessoa escolhe Pix, cartão ou boleto.
 *
 * DELETE /api/assinatura  →  { ok }
 * Cancela sozinho, sem falar com ninguém. O acesso vale até o fim do mês já pago.
 *
 * As duas pedem "Authorization: Bearer <token do login>".
 *
 * Segurança (revisão de nov/2026):
 *  - limite de pedidos por IP e por conta (cada POST cria coisas no Asaas);
 *  - antes de criar uma assinatura nova, a antiga que não foi cancelada é encerrada no Asaas,
 *    para ninguém ficar com duas cobranças mensais;
 *  - dois cliques ao mesmo tempo: a gravação só vale se a linha não mudou desde a leitura;
 *    quem perdeu a corrida cancela no Asaas a assinatura que acabou de criar;
 *  - o link de pagamento só é aceito se for HTTPS do próprio Asaas.
 */

const indisponivel = () => Response.json({ erro: "A assinatura ainda não está disponível." }, { status: 503 });

function falha(e: unknown) {
  console.error("[assinatura]", e instanceof ErroAsaas ? `${e.status} ${e.detalhe}` : e);
  const msg = e instanceof ErroAsaas && e.status === 400 ? `O Asaas recusou: ${e.detalhe}` : "Não conseguimos falar com o sistema de pagamento. Tente de novo.";
  return Response.json({ erro: msg }, { status: 502 });
}

/** Cancela no Asaas. Se o Asaas diz que ela não existe mais (404), já está encerrada. */
async function encerrarNoAsaas(assinaturaId: string) {
  try {
    await cancelarAssinatura(assinaturaId);
  } catch (e) {
    if (!(e instanceof ErroAsaas && e.status === 404)) throw e;
  }
}

export async function POST(request: Request) {
  if (!assinaturaObrigatoria()) return indisponivel();
  const usuario = await usuarioDoPedido(request);
  if (!usuario) return Response.json({ erro: "Entre na sua conta." }, { status: 401 });
  if (!dentroDoLimite(`assinatura:ip:${ipDoPedido(request)}`, 10) || !dentroDoLimite(`assinatura:conta:${usuario.id}`, 5)) return muitosPedidos();

  let corpo: { documento?: unknown; nome?: unknown };
  try {
    corpo = ((await lerJson(request, 2_048)) ?? {}) as typeof corpo;
  } catch (e) {
    return Response.json({ erro: "Pedido inválido." }, { status: e instanceof CorpoInvalido ? e.status : 400 });
  }
  const documento = documentoPagador(String(corpo.documento ?? ""));
  const nome = String(corpo.nome ?? "").trim().slice(0, 100);
  if (!documento) return Response.json({ erro: "Informe um CPF ou CNPJ válido." }, { status: 400 });
  if (nome.length < 2) return Response.json({ erro: "Informe o nome de quem paga." }, { status: 400 });

  try {
    const atual = await assinaturaDe(usuario.id);
    if (atual && atual.status !== "cancelada" && temAcesso(atual)) return Response.json({ erro: "Você já é assinante." }, { status: 409 });
    const linkGuardado = linkAsaasSeguro(atual?.link_pagamento);
    // Pedido anterior ainda esperando pagamento (status "pendente", ou "cancelada" com link
    // quando a pessoa voltou a assinar com dias pagos sobrando): devolve o mesmo link.
    if (linkGuardado && (atual?.status === "pendente" || atual?.status === "cancelada")) return Response.json({ link: linkGuardado });

    // Assinatura antiga ainda viva no Asaas (pendente sem link, atrasada...): encerra antes.
    if (atual?.asaas_assinatura_id && (atual.status !== "cancelada" || atual.link_pagamento)) await encerrarNoAsaas(atual.asaas_assinatura_id);

    const cliente = atual?.asaas_cliente_id ?? (await criarCliente({ nome, cpfCnpj: documento, email: usuario.email, usuarioId: usuario.id })).id;
    const valor = precoCentavos();
    const assinatura = await criarAssinatura({
      cliente,
      valorCentavos: valor,
      vencimento: hojeBrasil(),
      usuarioId: usuario.id,
      descricao: "Assinatura mensal Calcula Reforma",
    });
    const link = linkAsaasSeguro((await linkDaPrimeiraCobranca(assinatura.id).catch(() => null)) ?? assinatura.paymentLink);

    // Quem cancelou e ainda tem dias pagos continua com eles até o novo pagamento cair.
    const aindaValido = atual && temAcesso(atual);
    const dados = {
      usuario_id: usuario.id,
      asaas_cliente_id: cliente,
      asaas_assinatura_id: assinatura.id,
      status: aindaValido ? "cancelada" : "pendente",
      valido_ate: aindaValido ? atual.valido_ate : null,
      valor_centavos: valor,
      link_pagamento: link,
      atualizado_em: new Date().toISOString(),
    };
    // Grava só se ninguém mexeu na linha desde a leitura (dois cliques ao mesmo tempo).
    const sb = admin()!;
    let gravou: boolean;
    if (!atual) {
      const r = await sb.from("assinaturas").insert(dados);
      if (r.error && r.error.code !== "23505") throw new Error(`falha ao gravar assinatura: ${r.error.message}`);
      gravou = !r.error;
    } else {
      let q = sb.from("assinaturas").update(dados).eq("usuario_id", usuario.id).eq("atualizado_em", atual.atualizado_em);
      q = atual.asaas_assinatura_id ? q.eq("asaas_assinatura_id", atual.asaas_assinatura_id) : q.is("asaas_assinatura_id", null);
      const r = await q.select("usuario_id");
      if (r.error) throw new Error(`falha ao gravar assinatura: ${r.error.message}`);
      gravou = (r.data?.length ?? 0) > 0;
    }
    if (!gravou) {
      await cancelarAssinatura(assinatura.id).catch((e) => console.error("[assinatura] não cancelou a duplicada", assinatura.id, e));
      return Response.json({ erro: "Já existe um pedido de assinatura em andamento. Recarregue a página." }, { status: 409 });
    }
    if (!link) return Response.json({ erro: "A assinatura foi criada, mas o link de pagamento não veio. Confira o seu e-mail." }, { status: 502 });
    return Response.json({ link });
  } catch (e) {
    return falha(e);
  }
}

export async function DELETE(request: Request) {
  if (!assinaturaObrigatoria()) return indisponivel();
  const usuario = await usuarioDoPedido(request);
  if (!usuario) return Response.json({ erro: "Entre na sua conta." }, { status: 401 });
  if (!dentroDoLimite(`assinatura:conta:${usuario.id}`, 5)) return muitosPedidos();
  try {
    const atual = await assinaturaDe(usuario.id);
    // "cancelada" com link = voltou a assinar e a nova cobrança ainda está aberta no Asaas.
    if (!atual?.asaas_assinatura_id || (atual.status === "cancelada" && !atual.link_pagamento)) return Response.json({ ok: true });
    await encerrarNoAsaas(atual.asaas_assinatura_id);
    const { error } = await admin()!
      .from("assinaturas")
      .update({ status: "cancelada", link_pagamento: null, atualizado_em: new Date().toISOString() })
      .eq("usuario_id", usuario.id);
    if (error) throw new Error(`falha ao gravar cancelamento: ${error.message}`);
    return Response.json({ ok: true });
  } catch (e) {
    return falha(e);
  }
}
