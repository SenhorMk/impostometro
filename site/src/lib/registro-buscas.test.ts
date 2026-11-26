import { test } from "node:test";
import assert from "node:assert/strict";
import { termoParaRegistro } from "./registro-buscas.ts";

test("termos úteis são normalizados sem descartar códigos NCM/NBS", () => {
  assert.equal(termoParaRegistro("  PeÇas   de Barco  "), "pecas de barco");
  assert.equal(termoParaRegistro("99999999"), "99999999");
  assert.equal(termoParaRegistro("999999999"), "999999999");
});

test("contatos, documentos e consultas fora do limite não são registrados", () => {
  for (const q of ["a", "", "x".repeat(121), "a@b.com", "https://site.com", "cpf 12345678900", "CNPJ da empresa", "(11) 99999-9999", "12345678901234"]) {
    assert.equal(termoParaRegistro(q), null, q);
  }
});
