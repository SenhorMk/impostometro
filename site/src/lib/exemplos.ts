/**
 * Exemplos calculados pelo PORTE (regra 3 do AGENTS.md: nenhum número é escrito à mão).
 *
 * A página inicial e as páginas "Imposto em 2027 para..." mostram uma venda de exemplo.
 * Em vez de digitar os valores, chamamos a mesma função da calculadora (lib/motor.ts)
 * na hora do build. Se a calculadora não calcular, a página mostra "não calculado".
 *
 * "use cache" guarda o resultado: o cálculo roda uma vez por atividade e o HTML sai
 * pronto (rápido no celular e bom para o Google).
 */
import { cacheLife } from "next/cache";
import atividades from "@/dados/atividades.json";
import { calcular } from "./motor";
import type { ResultadoCalculo } from "./tipos";

export type Atividade = (typeof atividades)[number];

export const ATIVIDADES: Atividade[] = atividades;

/** Venda de exemplo: R$ 1.000 em São Paulo (SP), no primeiro dia da CBS. */
export const EXEMPLO_PADRAO = {
  valor: 1000,
  municipio: 3550308,
  uf: "SP",
  cidade: "São Paulo (SP)",
  data: "2027-01-01",
} as const;

export function atividadePorId(id: string): Atividade | undefined {
  return ATIVIDADES.find((a) => a.id === id);
}

export async function calcularExemplo(id: string, valor: number = EXEMPLO_PADRAO.valor): Promise<ResultadoCalculo> {
  "use cache";
  cacheLife("max");
  const atividade = atividadePorId(id);
  if (!atividade) {
    return { ok: false, estado: "INCONSISTENCIA_ENTRADA", mensagem: "Atividade não encontrada no dicionário." };
  }
  return calcular({
    tipo: atividade.tipo as "ncm" | "nbs",
    codigo: atividade.codigo,
    cClassTrib: atividade.cClassTrib,
    valor,
    municipio: EXEMPLO_PADRAO.municipio,
    uf: EXEMPLO_PADRAO.uf,
    data: EXEMPLO_PADRAO.data,
  });
}

/** Frase simples para a redução que a calculadora aplicou (o número vem do porte). */
export function explicarReducao(reducao: number, semAliquota: boolean): string {
  if (semAliquota) return "Esta operação não tem CBS nem IBS na tabela oficial (imunidade ou não incidência).";
  if (reducao >= 100) return "A alíquota foi zerada para esta operação (redução de 100%).";
  if (reducao > 0) {
    const paga = Math.round((100 - reducao) * 100) / 100;
    return `Este setor tem redução de ${reducao.toLocaleString("pt-BR")}% na alíquota: paga ${paga.toLocaleString("pt-BR")}% da alíquota cheia.`;
  }
  return "Não há redução para esta operação: vale a alíquota cheia.";
}
