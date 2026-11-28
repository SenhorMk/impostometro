"use client";

/**
 * LGPD no NAVEGADOR (T41): gravar o aceite dos termos e juntar a cópia dos dados da conta.
 * Usa o login da pessoa (chave publicável + RLS): só lê e grava as próprias linhas.
 */
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { CHAVE_ACEITE } from "@/components/Entrar";
import { VERSAO_TERMOS } from "./contas";
import type { DadosDaConta } from "./privacidade";

/** O banco ainda não tem a função/tabela (SQL 20261128120000_lgpd.sql não rodou). */
const faltaNoBanco = (codigo?: string) => codigo === "PGRST202" || codigo === "PGRST205" || codigo === "42883" || codigo === "42P01";

/**
 * Grava o aceite da versão atual (perfil + histórico de aceites).
 * Enquanto o SQL novo não roda, cai no jeito antigo (só o primeiro aceite, no perfil).
 */
export async function gravarAceite(sb: SupabaseClient, usuarioId: string): Promise<"ok" | "erro" | "sem-sql"> {
  const r = await sb.rpc("aceitar_termos", { versao: VERSAO_TERMOS });
  if (!r.error) return "ok";
  if (!faltaNoBanco(r.error.code)) return "erro";
  const antigo = await sb.from("perfis").insert({ usuario_id: usuarioId, termos_versao: VERSAO_TERMOS });
  if (!antigo.error) return "ok";
  return antigo.error.code === "23505" ? "sem-sql" : "erro"; // 23505: já tem perfil e não dá para atualizar sem o SQL
}

/** Lê tudo o que a conta tem no banco, para o "Baixar meus dados". Lança erro se algo falhar. */
export async function juntarDados(sb: SupabaseClient, usuario: User): Promise<DadosDaConta> {
  const um = async (tabela: string) => {
    const { data, error } = await sb.from(tabela).select("*").eq("usuario_id", usuario.id).maybeSingle();
    if (error) throw new Error(`${tabela}: ${error.message}`);
    return (data as Record<string, unknown> | null) ?? null;
  };

  const aceites = await sb.from("aceites_termos").select("versao, aceito_em").order("aceito_em");
  if (aceites.error && !faltaNoBanco(aceites.error.code)) throw new Error(`aceites_termos: ${aceites.error.message}`);

  // Histórico em páginas: cada cálculo pode ter alguns MB.
  const calculos: Record<string, unknown>[] = [];
  for (let de = 0; ; de += 50) {
    const { data, error } = await sb.from("calculos").select("*").order("criado_em").range(de, de + 49);
    if (error) throw new Error(`calculos: ${error.message}`);
    calculos.push(...((data ?? []) as Record<string, unknown>[]));
    if (!data || data.length < 50) break;
  }

  const navegador: Record<string, string | null> = {};
  try {
    for (const chave of [CHAVE_ACEITE, "calc:local"]) navegador[chave] = localStorage.getItem(chave);
  } catch {
    /* sem acesso ao armazenamento do navegador */
  }

  return {
    usuario: {
      id: usuario.id,
      email: usuario.email ?? null,
      criado_em: usuario.created_at ?? null,
      ultimo_acesso_em: usuario.last_sign_in_at ?? null,
      formas_de_entrar: (usuario.identities ?? []).map((i) => i.provider),
    },
    perfil: await um("perfis"),
    aceites: (aceites.data ?? []) as Record<string, unknown>[],
    empresa: await um("empresas"),
    assinatura: await um("assinaturas"),
    calculos,
    navegador,
  };
}
