/**
 * Planilha do lote para mandar ao contador ("Relatório para mandar ao contador", plano assinante).
 *
 * CSV no jeito do Excel brasileiro: separador ";", vírgula decimal e marca UTF-8 no começo
 * (sem ela o Excel mostra os acentos errados). Uma linha por item, com os mesmos números
 * da tela; item que a calculadora não calculou sai com o motivo e sem valores.
 */
import type { NotaCalculada } from "./lote.ts";
import type { NotaLida } from "./nfe.ts";

export type NotaParaPlanilha = Pick<NotaLida, "chave" | "modelo" | "numero" | "serie" | "data" | "uf" | "itens">;
export type Versoes = { versaoMotor: string; versaoTabelaMotor: string; versaoTabelaAliquotas: string };

const COLUNAS = [
  "Modelo", "Número", "Série", "Data", "UF", "Chave de acesso",
  "Item", "Descrição", "NCM", "CFOP", "cClassTrib", "Origem da base",
  "Base (R$)", "CBS (R$)", "IBS (R$)", "CBS + IBS (R$)", "Redução CBS (%)", "Alíquota efetiva CBS (%)", "Situação",
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

export function planilhaDoLote(notas: NotaCalculada[], lidas: NotaParaPlanilha[], versoes: Versoes): string {
  const linhas: Celula[][] = [COLUNAS];
  notas.forEach((n, k) => {
    const lida = lidas[k];
    if (!lida) return;
    for (const item of lida.itens) {
      const c = n.itens.find((x) => x.numero === item.numero);
      if (!c) continue;
      const total = c.ok ? (c.cbsCentavos ?? 0) + (c.ibsCentavos ?? 0) : undefined;
      linhas.push([
        lida.modelo, lida.numero, lida.serie, dataBR(lida.data), lida.uf, codigo(lida.chave),
        String(item.numero), item.descricao, codigo(item.ncm), item.cfop, codigo(item.cClassTrib ?? ""),
        item.origemBase === "nota" ? "informada na nota" : "estimada",
        c.ok ? reais(c.baseCentavos) : "", c.ok ? reais(c.cbsCentavos) : "", c.ok ? reais(c.ibsCentavos) : "", reais(total),
        c.ok ? pct(c.reducaoCbs) : "", c.ok ? pct(c.aliquotaEfetivaCbs) : "",
        c.ok ? "calculado" : `não calculado: ${c.mensagem ?? c.estado}`,
      ]);
    }
  });
  const t = notas.reduce((s, n) => ({ base: s.base + n.totais.baseCentavos, cbs: s.cbs + n.totais.cbsCentavos, ibs: s.ibs + n.totais.ibsCentavos }), { base: 0, cbs: 0, ibs: 0 });
  linhas.push([]);
  linhas.push(["Total dos itens calculados", "", "", "", "", "", "", "", "", "", "", "", reais(t.base), reais(t.cbs), reais(t.ibs), reais(t.cbs + t.ibs)]);
  linhas.push([`Calculadora oficial da Receita Federal (licença MIT) versão ${versoes.versaoMotor}, tabelas ${versoes.versaoTabelaMotor}, tabela de alíquotas ${versoes.versaoTabelaAliquotas}. Simulação: não substitui a apuração oficial.`]);
  return "﻿" + linhas.map((l) => l.map(escrever).join(";")).join("\r\n") + "\r\n";
}

export function nomeDaPlanilha(lidas: Pick<NotaLida, "data">[]): string {
  const datas = lidas.map((n) => n.data).filter(Boolean).sort();
  const periodo = datas.length ? (datas[0] === datas.at(-1) ? datas[0] : `${datas[0]}_a_${datas.at(-1)}`) : "notas";
  return `cbs-ibs-${periodo}.csv`;
}
