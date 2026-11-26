import { test } from "node:test";
import assert from "node:assert/strict";
import { buscarAtividades } from "./busca.ts";
import { buscarOficiais } from "./busca-oficial.ts";

const DATA = "2027-01-01";

test("pizzaria mantém o atalho do dicionário; FGTS precisa da busca oficial", () => {
  assert.equal(buscarAtividades("pizzaria")[0].id, "restaurante");
  assert.equal(buscarAtividades("fgts").length, 0);
  assert.ok(buscarOficiais("fgts", DATA).some((r) => r.codigo === "200017"));
});

test("descrição oficial aceita acentos, caixa e todas as palavras fora de ordem", () => {
  const resultado = buscarOficiais("PÚBLICA emergência", DATA);
  assert.ok(resultado.some((r) => r.codigo === "200006"));
  assert.ok(resultado.every((r) => r.tipo === "classificacao"));
});

test("cClassTrib vencido não reaparece para a data da simulação", () => {
  assert.ok(buscarOficiais("220001", "2026-01-01").some((r) => r.codigo === "220001"));
  assert.equal(buscarOficiais("220001", DATA).some((r) => r.codigo === "220001"), false);
});

test("códigos NCM e NBS completos são encontrados com e sem máscara", () => {
  assert.ok(buscarOficiais("6109.10.00", DATA).some((r) => r.tipo === "ncm" && r.codigo === "61091000"));
  assert.ok(buscarOficiais("122011200", DATA).some((r) => r.tipo === "nbs" && r.codigo === "122011200"));
});

test("prefixos só retornam códigos completos, com no máximo seis opções", () => {
  const resultado = buscarOficiais("61", DATA);
  assert.ok(resultado.length > 0 && resultado.length <= 6);
  assert.ok(resultado.every((r) => r.tipo !== "ncm" || r.codigo.length === 8));
  assert.equal(new Set(resultado.map((r) => `${r.tipo}:${r.codigo}`)).size, resultado.length);
});

test("código inexistente e termos vazios não geram sugestão inventada", () => {
  for (const termo of ["", "a", " ", "9".repeat(120), "termoquejamaisexiste", "x".repeat(121)]) {
    assert.deepEqual(buscarOficiais(termo, DATA), []);
  }
});

test("busca não presume cClassTrib de um NCM ou código de uma classificação", () => {
  const codigo = buscarOficiais("61091000", DATA)[0];
  assert.equal(codigo.tipo, "ncm");
  assert.equal("cClassTrib" in codigo, false);
  const classificacao = buscarOficiais("200028", DATA)[0];
  assert.equal(classificacao.tipo, "classificacao");
  assert.equal("ncm" in classificacao, false);
});
