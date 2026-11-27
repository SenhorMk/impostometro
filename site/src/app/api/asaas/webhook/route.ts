import { timingSafeEqual } from "node:crypto";
import { buscarCobranca, COBRANCA_PAGA } from "@/lib/asaas";
import { aplicarEvento, type Assinatura } from "@/lib/assinatura";
import { CorpoInvalido, lerJson } from "@/lib/limite";
import { admin } from "@/lib/supabase-servidor";

/**
 * POST /api/asaas/webhook   (T14)
 * Avisos do Asaas: pagamento confirmado, atrasado, estornado, assinatura cancelada...
 * Cada aviso atualiza a assinatura sozinho (regras em src/lib/assinatura.ts).
 *
 * Segurança (revisão de nov/2026), em camadas:
 *  1. o Asaas manda o token configurado no webhook no cabeçalho "asaas-access-token"; ele
 *     precisa ser igual a ASAAS_WEBHOOK_TOKEN (comparação em tempo constante);
 *  2. aviso de PAGAMENTO CONFIRMADO não é aceito só pela palavra do aviso: o site pergunta
 *     ao próprio Asaas (com a chave da API) se aquela cobrança está mesmo paga e se é daquela
 *     assinatura. Assim, mesmo que o token vaze, ninguém libera acesso de graça;
 *  3. o mesmo aviso pode chegar mais de uma vez (ou duas vezes ao mesmo tempo): primeiro
 *     "reservamos" o id em asaas_eventos e só quem conseguiu reservar processa;
 *  4. corpo maior que 64 KB é recusado.
 * Erro de banco ou do Asaas responde 500 para o Asaas tentar de novo.
 */

function tokenConfere(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Aviso = {
  id?: unknown;
  event?: unknown;
  payment?: { id?: string; subscription?: string | null; dueDate?: string };
  subscription?: { id?: string };
};

const PAGAMENTO_CONFIRMADO = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);

export async function POST(request: Request) {
  if (!tokenConfere(request.headers.get("asaas-access-token"))) return Response.json({ erro: "token inválido" }, { status: 401 });
  const sb = admin();
  if (!sb) return Response.json({ erro: "banco não configurado" }, { status: 503 });

  let aviso: Aviso | null;
  try {
    aviso = (await lerJson(request, 65_536)) as Aviso | null;
  } catch (e) {
    return Response.json({ erro: "corpo inválido" }, { status: e instanceof CorpoInvalido ? e.status : 400 });
  }
  if (!aviso || typeof aviso !== "object") return Response.json({ ok: true, ignorado: "corpo vazio" });
  const id = typeof aviso.id === "string" ? aviso.id.slice(0, 100) : "";
  const evento = typeof aviso.event === "string" ? aviso.event.slice(0, 60) : "";
  if (!id || !evento) return Response.json({ ok: true, ignorado: "sem id ou evento" });
  const assinaturaId = aviso.payment?.subscription ?? aviso.subscription?.id;
  if (!assinaturaId || typeof assinaturaId !== "string") return Response.json({ ok: true, ignorado: "não é de assinatura" });

  // Reserva o aviso. Se já existe (23505), outro processamento já pegou: ignora.
  const reserva = await sb.from("asaas_eventos").insert({ id, evento });
  if (reserva.error) {
    if (reserva.error.code === "23505") return Response.json({ ok: true, ignorado: "repetido" });
    return Response.json({ erro: "banco" }, { status: 500 });
  }
  // Deu errado no meio? Solta a reserva para o Asaas poder reenviar.
  const desistir = async (status = 500) => {
    await sb.from("asaas_eventos").delete().eq("id", id);
    return Response.json({ erro: "falha ao processar" }, { status });
  };

  try {
    // Só aceita avisos da assinatura ATUAL da pessoa (não de uma antiga já cancelada).
    const linha = await sb.from("assinaturas").select("usuario_id, status, valido_ate").eq("asaas_assinatura_id", assinaturaId).maybeSingle();
    if (linha.error) return desistir();
    if (!linha.data) return Response.json({ ok: true, ignorado: "assinatura desconhecida" });

    let pagamento = aviso.payment;
    if (PAGAMENTO_CONFIRMADO.has(evento)) {
      const cobrancaId = aviso.payment?.id;
      if (!cobrancaId) return Response.json({ ok: true, ignorado: "pagamento sem id" });
      const cobranca = await buscarCobranca(cobrancaId);
      if (!cobranca.status || !COBRANCA_PAGA.has(cobranca.status) || cobranca.subscription !== assinaturaId) {
        console.warn("[webhook] aviso de pagamento não confere com o Asaas", { cobrancaId, status: cobranca.status });
        return Response.json({ ok: true, ignorado: "pagamento não confere com o Asaas" });
      }
      pagamento = { dueDate: cobranca.dueDate }; // usa a data do Asaas, não a do aviso
    }

    const novo = aplicarEvento(linha.data as Assinatura, evento, pagamento);
    if (novo) {
      const r = await sb
        .from("assinaturas")
        .update({ ...novo, atualizado_em: new Date().toISOString(), ...(novo.status === "ativa" ? { link_pagamento: null } : {}) })
        .eq("asaas_assinatura_id", assinaturaId);
      if (r.error) return desistir();
      // Funil (T22): só contadores do dia, sem dado pessoal.
      const antes = (linha.data as Assinatura).status;
      const etapa = novo.status === "ativa" && (antes === "pendente" || antes === "cancelada") ? "assinatura" : novo.status === "cancelada" && antes !== "cancelada" ? "cancelamento" : null;
      if (etapa) await sb.rpc("contar_evento", { evento: etapa }).then(() => {}, () => {});
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[webhook]", e instanceof Error ? e.message : e);
    return desistir();
  }
}
