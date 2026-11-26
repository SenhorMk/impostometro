/**
 * Busca nas tabelas oficiais de NCM (produtos) e NBS (serviços) da Receita (T10).
 * Usada quando o que a pessoa digitou não está no nosso dicionário de atividades.
 *
 * Os dados vêm de src/dados/codigos-oficiais.json, exportado das tabelas da
 * calculadora oficial por scripts/porte/exportar-codigos.ts. Roda só no servidor
 * (o arquivo é grande demais para mandar ao navegador).
 */
import dados from "@/dados/codigos-oficiais.json";
import { normalizar } from "./busca";

export type Classificacao = { cClassTrib: string; descricao: string };
export type CodigoOficial = {
  tipo: "ncm" | "nbs";
  codigo: string;
  descricao: string;
  /** classificações com tratamento especial que a calculadora aceita para este código, além da 000001 */
  especiais: Classificacao[];
};

type Linha = [string, string, string, string, number[]];
const bruto = dados as unknown as { classificacoes: [string, string][]; codigos: Linha[]; versaoBanco: string };

const indice = bruto.codigos.map((l) => ({ linha: l, titulo: normalizar(l[2]), caminho: normalizar(l[3]) }));

export const VERSAO_CODIGOS = bruto.versaoBanco;

/** Todas as palavras precisam aparecer. Pontua: palavra no título > no caminho; código digitado = prefixo. */
export function buscarCodigos(consulta: string, limite = 8): CodigoOficial[] {
  const q = normalizar(consulta);
  const digitos = q.replace(/[.\s-]/g, "");
  let achados: { linha: Linha; pontos: number }[];

  if (/^\d{2,9}$/.test(digitos)) {
    achados = indice.filter((x) => x.linha[1].startsWith(digitos)).map((x) => ({ linha: x.linha, pontos: 100 - x.linha[1].length }));
  } else {
    const palavras = q.split(/\s+/).filter((p) => p.length >= 2);
    if (palavras.length === 0) return [];
    achados = [];
    for (const x of indice) {
      let pontos = 0;
      let todas = true;
      for (const p of palavras) {
        const re = new RegExp(`(^|[^a-z0-9])${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
        if (re.test(x.titulo)) pontos += 10;
        else if (re.test(x.caminho)) pontos += 3;
        else if (x.titulo.includes(p) || x.caminho.includes(p)) pontos += 1;
        else {
          todas = false;
          break;
        }
      }
      if (todas) achados.push({ linha: x.linha, pontos: pontos - x.titulo.length / 1000 });
    }
  }

  return achados
    .sort((a, b) => b.pontos - a.pontos || a.linha[1].localeCompare(b.linha[1]))
    .slice(0, limite)
    .map(({ linha: [tipo, codigo, descricao, , esp] }) => ({
      tipo: tipo as "ncm" | "nbs",
      codigo,
      descricao,
      especiais: esp.map((i) => ({ cClassTrib: bruto.classificacoes[i][0], descricao: bruto.classificacoes[i][1] })),
    }));
}
