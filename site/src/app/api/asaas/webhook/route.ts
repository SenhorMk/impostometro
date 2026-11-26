import { timingSafeEqual } from "node:crypto";
import { aplicarEvento, type Assinatura } from "@/lib/assinatura";
import { admin } from "@/lib/supabase-servidor";

/**
 * POST /api/asaas/webhook   (T14)
 * Avisos do Asaas: pagamento confirmado, atrasado, estornado, assinatura cancelada...
 * Cada aviso atualiza a assinatura sozinho (regras em src/lib/assinatura.ts).
 *
 * Segurança: o Asaas manda o token configurado no webhook no cabeçalho "asaas-access-token";
 * ele precisa ser igual a ASAAS_WEBHOOK_TOKEN. O mesmo aviso pode chegar mais de uma vez:
 * guardamos o id em asaas_eventos e ignoramos repetidos. Respondemos 200 rápido; erro de
 * banco responde 500 para o Asaas tentar de novo.
 */

function tokenConfere(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Aviso = {
  id?: string;
  event?: string;
  payment?: { subscription?: string | null; dueDate?: string };
  subscription?: { id?: string };
};

export async function POST(request: Request) {
  if (!tokenConfere(request.headers.get("asaas-access-token"))) return Response.json({ erro: "token inválido" }, { status: 401 });
  const sb = admin();
  if (!sb) return Response.json({ erro: "banco não configurado" }, { status: 503 });

  const aviso = (await request.json().catch(() => null)) as Aviso | null;
  if (!aviso?.id || !aviso.event) return Response.json({ ok: true, ignorado: "sem id ou evento" });
  const assinaturaId = aviso.payment?.subscription ?? aviso.subscription?.id;
  if (!assinaturaId) return Response.json({ ok: true, ignorado: "não é de assinatura" });

  const ja = await sb.from("asaas_eventos").select("id").eq("id", aviso.id).maybeSingle();
  if (ja.error) return Response.json({ erro: "banco" }, { status: 500 });
  if (ja.data) return Response.json({ ok: true, ignorado: "repetido" });

  // Só aceita avisos da assinatura ATUAL da pessoa (não de uma antiga já cancelada).
  const linha = await sb.from("assinaturas").select("usuario_id, status, valido_ate").eq("asaas_assinatura_id", assinaturaId).maybeSingle();
  if (linha.error) return Response.json({ erro: "banco" }, { status: 500 });

  if (linha.data) {
    const novo = aplicarEvento(linha.data as Assinatura, aviso.event, aviso.payment);
    if (novo) {
      const r = await sb
        .from("assinaturas")
        .update({ ...novo, atualizado_em: new Date().toISOString(), ...(novo.status === "ativa" ? { link_pagamento: null } : {}) })
        .eq("asaas_assinatura_id", assinaturaId);
      if (r.error) return Response.json({ erro: "banco" }, { status: 500 });
    }
  }
  const r = await sb.from("asaas_eventos").insert({ id: aviso.id, evento: aviso.event });
  if (r.error && r.error.code !== "23505") return Response.json({ erro: "banco" }, { status: 500 });
  return Response.json({ ok: true });
}
