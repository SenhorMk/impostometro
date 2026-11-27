"use client";

/**
 * Histórico de cálculos no NAVEGADOR (T18): grava, lista, abre e apaga.
 * Usa o login da pessoa (chave publicável + RLS): cada conta só mexe nas próprias linhas.
 * Sem login ou sem contas configuradas, salvar não faz nada.
 */
import type { CalculoSalvo, Detalhe, NovoCalculo } from "./historico";
import { supabase } from "./supabase-navegador";

const COLUNAS_LISTA =
  "id, criado_em, origem, titulo, base_centavos, cbs_centavos, ibs_centavos, itens_calculados, itens_com_erro, versao_motor, versao_tabela_motor, versao_tabela_aliquotas";

/** Grava no histórico se houver alguém logado. Nunca atrapalha o cálculo: falhas só vão para o console. */
export async function salvarNoHistorico(calculo: NovoCalculo | null): Promise<"salvo" | "sem-login" | "falha"> {
  const sb = supabase();
  if (!sb || !calculo) return "sem-login";
  const { data } = await sb.auth.getSession();
  if (!data.session) return "sem-login";
  const { error } = await sb.from("calculos").insert(calculo);
  if (error) {
    console.warn("Não foi possível salvar no histórico", error.code);
    return "falha";
  }
  return "salvo";
}

export async function listarHistorico(limite = 100): Promise<CalculoSalvo[]> {
  const { data, error } = await supabase()!.from("calculos").select(COLUNAS_LISTA).order("criado_em", { ascending: false }).limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? []) as CalculoSalvo[];
}

export async function abrirDoHistorico(id: string): Promise<Detalhe | null> {
  const { data, error } = await supabase()!.from("calculos").select("detalhe").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.detalhe as Detalhe | null) ?? null;
}

export async function apagarDoHistorico(id: string): Promise<void> {
  const { error } = await supabase()!.from("calculos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
