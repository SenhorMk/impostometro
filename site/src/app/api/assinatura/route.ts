import { cancelarAssinatura, criarAssinatura, criarCliente, ErroAsaas, linkDaPrimeiraCobranca } from "@/lib/asaas";
import { assinaturaDe, assinaturaObrigatoria } from "@/lib/acesso";
import { hojeBrasil, precoCentavos, temAcesso } from "@/lib/assinatura";
import { documentoPagador } from "@/lib/contas";
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
 */

const indisponivel = () => Response.json({ erro: "A assinatura ainda não está disponível." }, { status: 503 });

function falha(e: unknown) {
  console.error("[assinatura]", e instanceof ErroAsaas ? `${e.status} ${e.detalhe}` : e);
  const msg = e instanceof ErroAsaas && e.status === 400 ? `O Asaas recusou: ${e.detalhe}` : "Não conseguimos falar com o sistema de pagamento. Tente de novo.";
  return Response.json({ erro: msg }, { status: 502 });
}

export async function POST(request: Request) {
  if (!assinaturaObrigatoria()) return indisponivel();
  const usuario = await usuarioDoPedido(request);
  if (!usuario) return Response.json({ erro: "Entre na sua conta." }, { status: 401 });

  const corpo = (await request.json().catch(() => ({}))) as { documento?: unknown; nome?: unknown };
  const documento = documentoPagador(String(corpo.documento ?? ""));
  const nome = String(corpo.nome ?? "").trim().slice(0, 100);
  if (!documento) return Response.json({ erro: "Informe um CPF ou CNPJ válido." }, { status: 400 });
  if (nome.length < 2) return Response.json({ erro: "Informe o nome de quem paga." }, { status: 400 });

  try {
    const atual = await assinaturaDe(usuario.id);
    if (atual && atual.status !== "cancelada" && temAcesso(atual)) return Response.json({ erro: "Você já é assinante." }, { status: 409 });
    if (atual?.status === "pendente" && atual.link_pagamento) return Response.json({ link: atual.link_pagamento });

    const cliente = atual?.asaas_cliente_id ?? (await criarCliente({ nome, cpfCnpj: documento, email: usuario.email, usuarioId: usuario.id })).id;
    const valor = precoCentavos();
    const assinatura = await criarAssinatura({
      cliente,
      valorCentavos: valor,
      vencimento: hojeBrasil(),
      usuarioId: usuario.id,
      descricao: "Assinatura mensal Calcula Reforma",
    });
    const link = (await linkDaPrimeiraCobranca(assinatura.id).catch(() => null)) ?? assinatura.paymentLink ?? null;

    // Quem cancelou e ainda tem dias pagos continua com eles até o novo pagamento cair.
    const aindaValido = atual && temAcesso(atual);
    const { error } = await admin()!.from("assinaturas").upsert({
      usuario_id: usuario.id,
      asaas_cliente_id: cliente,
      asaas_assinatura_id: assinatura.id,
      status: aindaValido ? "cancelada" : "pendente",
      valido_ate: aindaValido ? atual.valido_ate : null,
      valor_centavos: valor,
      link_pagamento: link,
      atualizado_em: new Date().toISOString(),
    });
    if (error) throw new Error(`falha ao gravar assinatura: ${error.message}`);
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
  try {
    const atual = await assinaturaDe(usuario.id);
    if (!atual?.asaas_assinatura_id || atual.status === "cancelada") return Response.json({ ok: true });
    await cancelarAssinatura(atual.asaas_assinatura_id);
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
