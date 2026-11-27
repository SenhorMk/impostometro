/**
 * Plano grátis × assinante (T14), no SERVIDOR.
 * Simulação manual: sempre grátis. Importar XML: só assinante, quando a cobrança estiver ligada
 * (ASAAS_API_KEY e SUPABASE_SECRET_KEY configuradas). Sem elas, /importar segue como prévia aberta.
 */
import type { User } from "@supabase/supabase-js";
import { asaasConfigurado } from "./asaas";
import { temAcesso, type Assinatura } from "./assinatura";
import { admin, usuarioDoPedido } from "./supabase-servidor";

export function assinaturaObrigatoria(): boolean {
  return asaasConfigurado() && admin() !== null;
}

export type LinhaAssinatura = Assinatura & {
  usuario_id: string;
  asaas_cliente_id: string;
  asaas_assinatura_id: string | null;
  link_pagamento: string | null;
  valor_centavos: number;
  atualizado_em: string;
};

export async function assinaturaDe(usuarioId: string): Promise<LinhaAssinatura | null> {
  const { data, error } = await admin()!.from("assinaturas").select("*").eq("usuario_id", usuarioId).maybeSingle();
  if (error) throw new Error(`falha ao ler assinatura: ${error.message}`);
  return data as LinhaAssinatura | null;
}

/** null = pode seguir. Senão, a resposta de erro para devolver. */
export async function exigirAssinante(request: Request): Promise<{ usuario: User | null; erro: Response | null }> {
  if (!assinaturaObrigatoria()) return { usuario: null, erro: null };
  const usuario = await usuarioDoPedido(request);
  if (!usuario) return { usuario, erro: Response.json({ erro: "Entre na sua conta para importar notas." }, { status: 401 }) };
  if (!temAcesso(await assinaturaDe(usuario.id)))
    return { usuario, erro: Response.json({ erro: "Importar notas é para assinantes. Assine na página da sua conta." }, { status: 402 }) };
  return { usuario, erro: null };
}
