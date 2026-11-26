/**
 * Supabase no SERVIDOR (T14). Só para rotas de API.
 *
 * - admin(): usa a chave SECRETA (SUPABASE_SECRET_KEY), que passa por cima das regras do banco.
 *   Fica só na Vercel, nunca no navegador nem no git. Usada para gravar a assinatura.
 * - usuarioDoPedido(): descobre quem está logado pelo token que o navegador manda
 *   em "Authorization: Bearer ...", conferindo com o Supabase.
 */
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

let clienteAdmin: SupabaseClient | null | undefined;

export function admin(): SupabaseClient | null {
  if (clienteAdmin !== undefined) return clienteAdmin;
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  clienteAdmin = url && chave ? createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return clienteAdmin;
}

export async function usuarioDoPedido(request: Request): Promise<User | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const sb = admin();
  if (!token || !sb) return null;
  const { data, error } = await sb.auth.getUser(token);
  return error ? null : data.user;
}
