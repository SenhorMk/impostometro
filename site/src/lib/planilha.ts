/**
 * Planilha do lote para mandar ao contador ("Relatório para mandar ao contador", plano assinante).
 *
 * CSV no jeito do Excel brasileiro: separador ";", vírgula decimal e marca UTF-8 no começo
 * (sem ela o Excel mostra os acentos errados). Uma linha por item, com os mesmos números
 * da tela; item que a calculadora não calculou sai com o motivo e sem valores.
 */
import type { NotaCalculada } from "./lote.ts";
import type { NotaLida } from "./nfe.ts";
import type { Premissas } from "./premissas.ts";
import { montarRelatorio, type Cobertura } from "./relatorio.ts";

export type NotaParaPlanilha = Pick<NotaLida, "chave" | "modelo" | "numero" | "serie" | "data" | "uf" | "itens">;
export type Versoes = { versaoMotor: string; versaoTabelaMotor: string; versaoTabelaAliquotas: string };

const COLUNAS = [
  "Modelo", "Número", "Série", "Data", "UF", "Chave de acesso",
  "Item", "Descrição", "NCM", "CFOP", "cClassTrib", "Origem da classificação", "Origem da base",
  "Base (R$)", "CBS (R$)", "IBS (R$)", "CBS + IBS (R$)", "Redução CBS (%)", "Alíquota efetiva CBS (%)", "Situação",
  "Memória de cálculo oficial (CBS)",
];

/** centavos → "1234,56" (sem separador de milhar, para o Excel ler como número) */
const reais = (c: number | undefined) => (c === undefined ? "" : `${c < 0 ? "-" : ""}${Math.floor(Math.abs(c) / 100)},${String(Math.abs(c) % 100).padStart(2, "0")}`);
const pct = (t: string | undefined) => (t ? t.replace(".", ",") : "");
const dataBR = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "");

/** Protege o texto: aspas, ";" e quebras de linha; e não deixa o Excel rodar fórmula (=, +, -, @). */
export function celula(v: string): string {
  let t = v.replace(/\r?\n/g, " ");
  if (/^[=+\-@\t]/.test(t)) t = `'${t}`;
  return /[";]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

/** Código só com números (chave de 44 dígitos, NCM com zero à esquerda): o Excel estragaria
 * como número (1,23E+43, ou 01022990 → 1022990). ="..." faz o Excel mostrar como texto. */
type Celula = string | { codigo: string };
const codigo = (v: string): Celula => (/^\d+$/.test(v) ? { codigo: v } : v);
const escrever = (c: Celula) => (typeof c === "string" ? celula(c) : `="${c.codigo}"`);

export function planilhaDoLote(
  notas: NotaCalculada[],
  lidas: NotaParaPlanilha[],
  versoes: Versoes,
  premissas?: Premissas,
  cobertura?: Cobertura | null,
  geradoEm = new Date(),
): string {
  // T27: as linhas e os totais vêm do mesmo relatório do PDF (nada é recalculado aqui).
  const r = montarRelatorio({ notas, ...versoes, premissas }, lidas, cobertura ?? null, geradoEm);
  const linhas: Celula[][] = [COLUNAS];
  for (const l of r.linhas) {
    const total = l.calculado ? (l.cbsCentavos ?? 0) + (l.ibsCentavos ?? 0) : undefined;
    linhas.push([
      l.nota.modelo, l.nota.numero, l.nota.serie, dataBR(l.nota.data), l.nota.uf, codigo(l.nota.chave),
      String(l.item), l.descricao, codigo(l.ncm), l.cfop, codigo(l.cClassTrib),
      l.origemClassificacao === "não informada" ? "" : l.origemClassificacao,
      l.baseEstimada ? "estimada" : "informada na nota",
      reais(l.baseCentavos), reais(l.cbsCentavos), reais(l.ibsCentavos), reais(total),
      pct(l.reducaoCbs), pct(l.aliquotaEfetivaCbs),
      l.calculado ? "calculado" : `não calculado: ${l.motivo}`,
      l.memoria ?? "",
    ]);
  }
  const t = r.totais;
  linhas.push([]);
  linhas.push(["Total dos itens calculados", "", "", "", "", "", "", "", "", "", "", "", "", reais(t.baseCentavos), reais(t.cbsCentavos), reais(t.ibsCentavos), reais(t.totalCentavos)]);
  if (premissas)
    linhas.push([
      premissas.itensSugeridos > 0
        ? `RASCUNHO (revisão ${premissas.revisao}): ${premissas.itensSugeridos} itens com classificação sugerida e não confirmada.`
        : `Revisão ${premissas.revisao}: classificações confirmadas pelo usuário em ${premissas.confirmadoEm?.slice(0, 16).replace("T", " ")} (UTC).`,
    ]);
  linhas.push([`Calculadora oficial da Receita Federal (licença MIT) versão ${versoes.versaoMotor}, tabelas ${versoes.versaoTabelaMotor}, tabela de alíquotas ${versoes.versaoTabelaAliquotas}. Simulação: não substitui a apuração oficial.`]);

  // Resumo do período (T27): duas colunas, rótulo e valor.
  linhas.push([]);
  linhas.push(["Resumo do período"]);
  linhas.push(["Empresa", r.empresa]);
  linhas.push(["Período", r.periodo]);
  linhas.push(["Cenário", r.cenario]);
  linhas.push(["Gerado em (UTC)", r.geradoEm.slice(0, 16).replace("T", " ")]);
  linhas.push(["Notas incluídas", String(r.notasIncluidas)]);
  for (const f of r.cobertura?.fora ?? [])
    linhas.push([`Notas fora da soma: ${f.nome}`, `${f.quantidade}${f.numeros.length ? ` (números ${f.numeros.join(", ")}${f.quantidade > f.numeros.length ? "…" : ""})` : ""}`]);
  for (const x of r.cobertura?.pendencias ?? []) linhas.push(["Pendência", `${x.quantidade} × ${x.explicacao}`]);
  for (const x of r.naoCalculados) linhas.push(["Itens não calculados", `${x.quantidade} × ${x.motivo}`]);
  for (const a of r.avisos) linhas.push(["Aviso", a]);
  linhas.push(["Como ler", "Separador ponto e vírgula; valores em reais com vírgula decimal e sem separador de milhar; percentuais sem o símbolo %; datas DD/MM/AAAA; códigos (chave, NCM, cClassTrib) como texto. Campos explicados em docs/relatorio.md."]);
  return "\uFEFF" + linhas.map((l) => l.map(escrever).join(";")).join("\r\n") + "\r\n";
}

export function nomeDaPlanilha(lidas: Pick<NotaLida, "data">[]): string {
  const datas = lidas.map((n) => n.data).filter(Boolean).sort();
  const periodo = datas.length ? (datas[0] === datas.at(-1) ? datas[0] : `${datas[0]}_a_${datas.at(-1)}`) : "notas";
  return `cbs-ibs-${periodo}.csv`;
}
