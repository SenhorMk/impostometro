/**
 * Cliente do Supabase para o NAVEGADOR (T13 e T15).
 *
 * Usa a chave publicável: ela sozinha não lê nada. Quem decide o que cada pessoa vê
 * são as regras do banco (RLS em supabase/migrations/): cada conta só enxerga as
 * próprias linhas. Sem as variáveis configuradas, as contas ficam desligadas.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  cliente = url && chave ? createClient(url, chave, { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true } }) : null;
  return cliente;
}
