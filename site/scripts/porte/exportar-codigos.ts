/**
 * Exporta a lista oficial de NCM (produtos) e NBS (serviços), com as descrições
 * da Receita, para a busca "o que você vende?" do site (T10).
 *
 *   node scripts/porte/exportar-codigos.ts <caminho/calculadora-pro.db>
 *
 * Normalmente roda junto com `npm run porte:tabelas`.
 *
 * Para cada código, também lista as classificações tributárias (cClassTrib) com
 * tratamento especial que podem valer para ele (anexos da LC 214/2025). Cada par
 * código + classificação é conferido no porte: só entra se a calculadora calcula.
 * A classificação 000001 (tributação integral) vale para todos.
 *
 * Saída: src/dados/codigos-oficiais.json (não é usado pelo porte, só pela busca).
 */
import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calcularOperacao } from "../../src/motor/observabilidade.ts";
import { VERSAO_BANCO } from "../../src/motor/tabelas.ts";

const caminhoBanco = process.argv[2];
if (!caminhoBanco) {
  console.error("Uso: node scripts/porte/exportar-codigos.ts <calculadora-pro.db>");
  process.exit(1);
}
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DESTINO = path.join(AQUI, "../../src/dados/codigos-oficiais.json");
const DATA = "2027-01-01"; // data de referência: o ano que o site calcula

const db = new DatabaseSync(caminhoBanco, { readOnly: true });
type Linha = Record<string, string | number | null>;
const todas = (sql: string, ...p: (string | number)[]) => db.prepare(sql).all(...p) as Linha[];
const vigente = (ini: string, fim: string) => `${ini} <= '${DATA}' AND (${fim} IS NULL OR ${fim} >= '${DATA}')`;

/** "- <i>De</i> algodão" → "De algodão" */
const limpar = (s: unknown) =>
  String(s ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/^[\s–—-]+/, "")
    .replace(/\s+/g, " ")
    .trim();

// ─── Classificações com anexo (código → cClassTrib possíveis) ───────────────
const classificacoes = todas(
  `SELECT CLTR_ID, CLTR_CD, CLTR_DESCRICAO FROM CLASSIFICACAO_TRIBUTARIA WHERE ${vigente("CLTR_INICIO_VIGENCIA", "CLTR_FIM_VIGENCIA")}`,
);
const porId = new Map(classificacoes.map((c) => [c.CLTR_ID, c]));
const anexoNcm = todas(`SELECT NCMA_NCM_CD AS cd, NCMA_CLTR_ID AS id FROM NCM_APLICAVEL WHERE ${vigente("NCMA_INICIO_VIGENCIA", "NCMA_FIM_VIGENCIA")}`);
const anexoNbs = todas(`SELECT NBSA_NBS_CD AS cd, NBSA_CLTR_ID AS id FROM NBS_APLICAVEL WHERE ${vigente("NBSA_INICIO_VIGENCIA", "NBSA_FIM_VIGENCIA")}`);

function candidatas(codigo: string, anexo: Linha[]): string[] {
  const cds = new Set<string>();
  for (const a of anexo) if (codigo.startsWith(String(a.cd))) {
    const c = porId.get(a.id);
    if (c) cds.add(String(c.CLTR_CD));
  }
  return [...cds].sort();
}

// ─── Conferência no porte ────────────────────────────────────────────────────
function calcula(tipo: "ncm" | "nbs", codigo: string, cClassTrib: string): boolean {
  const item: Record<string, unknown> = {
    numero: 1, [tipo]: codigo, cst: cClassTrib.slice(0, 3), cClassTrib, baseCalculo: 100,
    aliquotasNominais: { cbs: 11.2, ibsEstadual: 0.05, ibsMunicipal: 0.05 },
  };
  if (tipo === "ncm") Object.assign(item, { quantidade: 1, unidade: "UN" });
  const r = calcularOperacao({ id: "busca", versao: "1.0.0", dhFatoGerador: `${DATA}T12:00:00-03:00`, municipio: 3550308, uf: "SP", itens: [item] });
  const obj = (r.corpo as { objetos?: { estadoItem: string }[] }).objetos?.[0];
  return r.status === 200 && obj?.estadoItem === "CALCULO_SIMULADO";
}

// ─── Descrições: "posição › folha", com o caminho todo para a busca ─────────
function montar(tipo: "ncm" | "nbs", tamanhoFolha: number, linhas: Linha[], anexo: Linha[]) {
  const desc = new Map(linhas.map((l) => [String(l.cd), limpar(l.ds)]));
  const saida: (string | number[])[][] = [];
  let pares = 0;
  let recusados = 0;
  for (const [cd, ds] of desc) {
    if (cd.length !== tamanhoFolha) continue;
    const ancestrais: string[] = [];
    const porNivel: [number, string][] = [];
    for (let n = 2; n < cd.length; n++) {
      const a = desc.get(cd.slice(0, n));
      if (a && !ancestrais.includes(a)) {
        ancestrais.push(a);
        porNivel.push([n, a]);
      }
    }
    if (!calcula(tipo, cd, "000001")) { recusados++; continue; }
    const especiais = candidatas(cd, anexo).filter((c) => c !== "000001" && (pares++, calcula(tipo, cd, c)));
    // [tipo, código, descrição curta, caminho para busca, classificações especiais]
    // título: posição (4 dígitos no NCM, 5 no NBS) › nível intermediário mais próximo › folha
    const nivelPosicao = tipo === "ncm" ? 4 : 5;
    const generico = (x: string) => /^(outr[oa]s?|demais)\b/i.test(x);
    const posicao = porNivel.filter(([n]) => n <= nivelPosicao).at(-1)?.[1];
    const meio = porNivel.filter(([n, x]) => n > nivelPosicao && !generico(x) && x !== ds).at(-1)?.[1];
    const titulo = [posicao, meio, ds].filter(Boolean).join(" › ");
    saida.push([tipo, cd, titulo, ancestrais.join(" › "), especiais.map((c) => indiceClassificacao(c))]);
  }
  return { saida, pares, recusados };
}

const tabelaClassificacoes: [string, string][] = [];
function indiceClassificacao(cd: string): number {
  let i = tabelaClassificacoes.findIndex(([c]) => c === cd);
  if (i < 0) {
    const c = classificacoes.find((x) => x.CLTR_CD === cd)!;
    i = tabelaClassificacoes.push([cd, limpar(c.CLTR_DESCRICAO)]) - 1;
  }
  return i;
}

const ncm = montar("ncm", 8, todas(`SELECT NCM_CD AS cd, NCM_DESCRICAO AS ds FROM NCM WHERE ${vigente("NCM_INICIO_VIGENCIA", "NCM_FIM_VIGENCIA")} ORDER BY NCM_CD`), anexoNcm);
const nbs = montar("nbs", 9, todas(`SELECT NBS_CD AS cd, NBS_DESCRICAO AS ds FROM NBS WHERE ${vigente("NBS_INICIO_VIGENCIA", "NBS_FIM_VIGENCIA")} ORDER BY NBS_CD`), anexoNbs);

writeFileSync(
  DESTINO,
  JSON.stringify({
    origem: "Tabelas oficiais da calculadora da Receita Federal (NCM e NBS), exportadas por scripts/porte/exportar-codigos.ts",
    versaoBanco: VERSAO_BANCO.versao,
    dataReferencia: DATA,
    classificacoes: tabelaClassificacoes,
    codigos: [...ncm.saida, ...nbs.saida],
  }),
);
console.log(
  `✅ ${ncm.saida.length} NCM e ${nbs.saida.length} NBS (${ncm.pares + nbs.pares} classificações especiais conferidas no porte; ` +
    `${ncm.recusados + nbs.recusados} códigos que a calculadora não aceita ficaram de fora) → ${path.relative(process.cwd(), DESTINO)}`,
);
