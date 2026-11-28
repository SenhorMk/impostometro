/**
 * T35: origem das classificações, rascunho, revisões e reaproveitamento por empresa.
 *   npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ItemNota, NotaLida } from "./nfe.ts";
import {
  aplicarClassificacoes,
  contextoDoItem,
  ehRascunho,
  guardarMemoria,
  lerMemoria,
  mudancasEntre,
  resumirPremissas,
  valorDoContexto,
} from "./premissas.ts";
import { planilhaDoLote } from "./planilha.ts";

const item = (numero: number, ncm: string, cfop: string, cClassTrib: string | null = null, origemBase: ItemNota["origemBase"] = "estimada"): ItemNota => ({
  numero, descricao: `produto ${numero}`, ncm, cfop, quantidade: "1", unidade: "UN", baseCentavos: 10000, origemBase, cst: cClassTrib ? cClassTrib.slice(0, 3) : null, cClassTrib,
});
const nota = (itens: ItemNota[]): NotaLida => ({
  arquivo: "a.xml", chave: "3".repeat(44), modelo: "NF-e", numero: "1", serie: "1", data: "2027-03-10", municipio: 3550308, uf: "SP", itens, avisos: [],
  emitente: "12345678000190", autorizacao: { situacao: "autorizada", codigo: "100" },
});

/** localStorage de mentira */
function memoriaFalsa() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

const notas = [nota([item(1, "61091000", "5102"), item(2, "61091000", "5949"), item(3, "22030000", "5102", "200003", "nota"), item(4, "123", "5102")])];

test("000001 sugerido não vira classificação validada sem confirmação", () => {
  const r = aplicarClassificacoes(notas, () => "000001", false);
  assert.equal(r[0].itens[0].origemClassificacao, "sugerida");
  assert.equal(r[0].itens[2].origemClassificacao, "nota", "a da nota continua da nota");
  assert.equal(r[0].itens[2].classificacaoUsada, "200003");
  assert.equal(r[0].itens[3].origemClassificacao, undefined, "sem NCM válido não recebe classificação");
  const p = resumirPremissas(r, 1, null);
  assert.ok(ehRascunho(p));
  assert.deepEqual([p.itensDaNota, p.itensConfirmados, p.itensSugeridos, p.itensBaseEstimada], [1, 0, 2, 3]);
});

test("confirmado: nada fica como rascunho e a data da confirmação é guardada", () => {
  const r = aplicarClassificacoes(notas, () => "000001", true);
  const p = resumirPremissas(r, 1, "2027-03-31T12:00:00.000Z");
  assert.equal(ehRascunho(p), false);
  assert.equal(p.itensConfirmados, 2);
  assert.equal(p.confirmadoEm, "2027-03-31T12:00:00.000Z");
});

test("mesmo NCM em operações diferentes (CFOP) tem classificações independentes", () => {
  assert.notEqual(contextoDoItem(notas[0].itens[0]), contextoDoItem(notas[0].itens[1]));
  const escolhas = { "61091000|5949": "410999" };
  const r = aplicarClassificacoes(notas, (c) => valorDoContexto(c, escolhas, {}).codigo, true);
  assert.equal(r[0].itens[0].classificacaoUsada, "000001");
  assert.equal(r[0].itens[1].classificacaoUsada, "410999");
});

test("mudar uma classificação gera revisão nova e mostra o que mudou", () => {
  const r1 = resumirPremissas(aplicarClassificacoes(notas, () => "000001", true), 1, "x");
  const r2 = resumirPremissas(aplicarClassificacoes(notas, (c) => (c === "61091000|5949" ? "410999" : "000001"), true), 2, "y");
  assert.equal(r2.revisao, 2);
  assert.deepEqual(mudancasEntre(r1, r2), [{ contexto: "61091000|5949", de: "000001", para: "410999" }]);
  assert.equal(r1.classificacoes["61091000|5949"].codigo, "000001", "a revisão anterior não é alterada");
});

test("reaproveitamento: só o que foi confirmado, só na mesma empresa, e volta como 'usada antes'", () => {
  const armazenamento = memoriaFalsa();
  const sugerido = resumirPremissas(aplicarClassificacoes(notas, () => "410999", false), 1, null);
  guardarMemoria("12345678000190", sugerido, armazenamento);
  assert.deepEqual(lerMemoria("12345678000190", armazenamento), {}, "sugestão nunca vira memória");

  const confirmado = resumirPremissas(aplicarClassificacoes(notas, () => "410999", true), 1, "x");
  guardarMemoria("12345678000190", confirmado, armazenamento);
  const mem = lerMemoria("12345678000190", armazenamento);
  assert.deepEqual(mem, { "61091000|5102": "410999", "61091000|5949": "410999" });
  assert.deepEqual(lerMemoria("98765432000110", armazenamento), {}, "outra empresa não herda");
  assert.deepEqual(valorDoContexto("61091000|5102", {}, mem), { codigo: "410999", origem: "usada_antes" });
  assert.deepEqual(valorDoContexto("61091000|5102", { "61091000|5102": "000001" }, mem), { codigo: "000001", origem: "escolhida" });
  assert.deepEqual(valorDoContexto("99999999|5102", {}, mem), { codigo: "000001", origem: "sugestao" });
});

test("memória estragada ou sem navegador não quebra", () => {
  assert.deepEqual(lerMemoria("12345678000190", { getItem: () => "{não é json", setItem: () => {} }), {});
  assert.deepEqual(lerMemoria("12345678000190", null), {});
  assert.deepEqual(lerMemoria("", memoriaFalsa()), {});
});

test("planilha mostra a origem da classificação e avisa quando é rascunho", () => {
  const lidas = aplicarClassificacoes(notas, () => "000001", false);
  const calc = { chave: "x", dataCalculo: "2027-03-10", itens: lidas[0].itens.map((i) => ({ numero: i.numero, estado: "CALCULADO", ok: true, baseCentavos: 10000, cbsCentavos: 1120, ibsCentavos: 10 })), totais: { baseCentavos: 40000, cbsCentavos: 4480, ibsCentavos: 40, itensCalculados: 4, itensComErro: 0 } };
  const csv = planilhaDoLote([calc], lidas, { versaoMotor: "1", versaoTabelaMotor: "V", versaoTabelaAliquotas: "A" }, resumirPremissas(lidas, 1, null));
  assert.match(csv, /Origem da classificação/);
  assert.match(csv, /sugestão NÃO confirmada/);
  assert.match(csv, /da nota/);
  assert.match(csv, /RASCUNHO \(revisão 1\)/);
});
