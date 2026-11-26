/** T10: consultas de leitura fora do porte; não altera suas tabelas nem regras. */
import banco from "../motor/dados/tabelas.json" with { type: "json" };
import { normalizar } from "./busca.ts";
import type { ResultadoBuscaOficial } from "./busca-oficial-tipos.ts";

type Celula = string | number | null;
type Tabela = { colunas: string[]; linhas: Celula[][] };
type Entrada = ResultadoBuscaOficial & { inicio: string; fim: string | null; texto: string };

function entradas(tabela: Tabela, prefixo: string, tipo: ResultadoBuscaOficial["tipo"]): Entrada[] {
  const posicao = (coluna: string) => tabela.colunas.indexOf(`${prefixo}_${coluna}`);
  return tabela.linhas.flatMap((linha) => {
    const codigo = String(linha[posicao("CD")]);
    // Capítulos e posições parciais de NCM/NBS não podem preencher um item.
    if (tipo !== "classificacao" && codigo.length !== (tipo === "ncm" ? 8 : 9)) return [];
    const descricao = tipo === "classificacao" ? String(linha[posicao("DESCRICAO")]) : `${tipo.toUpperCase()} ${codigo}`;
    return [{
      tipo, codigo, descricao,
      nomenclatura: tipo === "classificacao" ? String(linha[posicao("NOMENCLATURA")] ?? "") || null : null,
      inicio: String(linha[posicao("INICIO_VIGENCIA")]),
      fim: linha[posicao("FIM_VIGENCIA")] as string | null,
      texto: normalizar(descricao),
    }];
  });
}

const indice = [
  ...entradas(banco.tabelas.CLASSIFICACAO_TRIBUTARIA, "CLTR", "classificacao"),
  ...entradas(banco.tabelas.NCM, "NCM", "ncm"),
  ...entradas(banco.tabelas.NBS, "NBS", "nbs"),
];

export const VERSAO_TABELA_OFICIAL = banco.versaoBanco.versao;

/** Texto procura descrições de cClassTrib; números procuram códigos completos vigentes. */
export function buscarOficiais(consulta: string, data: string): ResultadoBuscaOficial[] {
  const q = normalizar(consulta);
  if (q.length < 2 || q.length > 120) return [];
  const numerica = /^[\d\s./-]+$/.test(q);
  const codigo = q.replace(/\D/g, "");
  const palavras = q.split(/\s+/).filter(Boolean);
  const vistos = new Set<string>();

  return indice
    .filter((item) => {
      if (data < item.inicio || (item.fim !== null && data > item.fim)) return false;
      if (numerica ? !codigo || !item.codigo.startsWith(codigo) : item.tipo !== "classificacao" || !palavras.every((p) => item.texto.includes(p))) return false;
      const chave = `${item.tipo}:${item.codigo}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
    .sort((a, b) => Number(b.codigo === codigo) - Number(a.codigo === codigo) || a.codigo.localeCompare(b.codigo) || a.tipo.localeCompare(b.tipo))
    .slice(0, 6)
    .map(({ tipo, codigo, descricao, nomenclatura }) => ({ tipo, codigo, descricao, nomenclatura }));
}
