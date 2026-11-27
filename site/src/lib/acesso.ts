/**
 * Acesso no SERVIDOR (T14 + T37). Única porta de entrada das rotas para saber quem pode importar notas.
 * As regras em si ficam em acesso-regras.ts (testadas); aqui só se busca quem é a pessoa e a assinatura dela.
 *
 * Segurança: falta de configuração ou falha ao ler o banco NUNCA libera a importação.
 * A calculadora grátis (/api/calcular) não passa por aqui e segue no ar mesmo assim.
 */
import type { User } from "@supabase/supabase-js";
import { decidirImportacao, modoDeAcesso, type Decisao, type Modo } from "./acesso-regras.ts";
import type { Assinatura } from "./assinatura.ts";
import { admin, usuarioDoPedido } from "./supabase-servidor.ts";

export type LinhaAssinatura = Assinatura & {
  usuario_id: string;
  asaas_cliente_id: string;
  asaas_assinatura_id: string | null;
  link_pagamento: string | null;
  valor_centavos: number;
  atualizado_em: string;
};

let avisou = "";
/** O modo atual, com um aviso no log (uma vez por instância) se a configuração estiver estranha. */
export function modoAtual(): Modo {
  const m = modoDeAcesso();
  if (m.aviso && m.aviso !== avisou) {
    console.warn("[acesso]", m.aviso);
    avisou = m.aviso;
  }
  return m;
}

/** Dá para criar assinaturas agora? (só no modo "assinatura", que já exige a cobrança configurada) */
export function assinaturaObrigatoria(): boolean {
  return modoAtual().modo === "assinatura";
}

/** Dá para cancelar no Asaas? Vale em qualquer modo, para ninguém ficar preso a uma cobrança. */
export function cobrancaDisponivel(): boolean {
  return modoAtual().cobrancaConfigurada && admin() !== null;
}

export async function assinaturaDe(usuarioId: string): Promise<LinhaAssinatura | null> {
  const sb = admin();
  if (!sb) throw new Error("banco sem chave secreta");
  const { data, error } = await sb.from("assinaturas").select("*").eq("usuario_id", usuarioId).maybeSingle();
  if (error) throw new Error(`falha ao ler assinatura: ${error.message}`);
  return data as LinhaAssinatura | null;
}

export type Acesso = { modo: Modo; usuario: User | null; decisao: Decisao };

/** Decide, para este pedido, o que a pessoa pode fazer na importação de notas. */
export async function acessoImportacao(request: Request): Promise<Acesso> {
  const modo = modoAtual();
  if (modo.modo === "fechado") return { modo, usuario: null, decisao: decidirImportacao("fechado", { logado: false, assinatura: null }) };

  let usuario: User | null = null;
  let assinatura: Assinatura | null | "erro" = null;
  try {
    usuario = await usuarioDoPedido(request);
  } catch (e) {
    console.error("[acesso] falha ao conferir o login", e);
    // No modo assinatura, sem saber quem é, não libera. Na prévia, segue como visitante.
    if (modo.modo === "assinatura") assinatura = "erro";
  }
  if (usuario && admin()) {
    try {
      assinatura = await assinaturaDe(usuario.id);
    } catch (e) {
      console.error("[acesso] falha ao ler a assinatura", e);
      assinatura = "erro";
    }
  }
  // Falha ao conferir conta ou assinatura conta como "não deu para conferir" (503), nunca como liberado.
  const logado = usuario !== null || assinatura === "erro";
  return { modo, usuario, decisao: decidirImportacao(modo.modo, { logado, assinatura }) };
}

/** Resposta de acesso negado, com motivo e próximo passo (sem termos técnicos). */
export function respostaNegada(d: Decisao): Response {
  return Response.json({ erro: d.mensagem, situacao: d.situacao, proximoPasso: d.proximoPasso }, { status: d.status });
}
