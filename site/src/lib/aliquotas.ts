import tabela from "@/dados/aliquotas.json";

export type PeriodoAliquota = (typeof tabela.periodos)[number];

/** Escolhe as alíquotas vigentes na data da venda (formato AAAA-MM-DD). */
export function aliquotasPara(data: string): PeriodoAliquota | null {
  return (
    tabela.periodos.find((p) => p.vigenciaInicio <= data && data <= p.vigenciaFim) ?? null
  );
}

export const VERSAO_TABELA = tabela.versaoTabela;
