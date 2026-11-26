import { test } from "node:test";
import assert from "node:assert/strict";
import { cnpjValido, validarEmpresa } from "./contas.ts";

test("CNPJ: aceita válidos (com ou sem máscara) e recusa inválidos", () => {
  assert.equal(cnpjValido("11.222.333/0001-81"), true);
  assert.equal(cnpjValido("11222333000181"), true);
  assert.equal(cnpjValido("11222333000182"), false);
  assert.equal(cnpjValido("00000000000000"), false);
  assert.equal(cnpjValido("123"), false);
});

test("empresa: CNPJ e razão social são opcionais; cidade e regime não", () => {
  assert.deepEqual(validarEmpresa({ uf: "SP", municipio: 3550308, regime: "regular", cnpj: "", razaoSocial: "  " }), {
    uf: "SP", municipio: 3550308, regime: "regular", cnpj: null, razao_social: null,
  });
  assert.equal(typeof validarEmpresa({ uf: "SP", municipio: 0, regime: "regular", cnpj: "", razaoSocial: "" }), "string");
  assert.equal(typeof validarEmpresa({ uf: "SP", municipio: 3550308, regime: "lucro", cnpj: "", razaoSocial: "" }), "string");
  assert.equal(typeof validarEmpresa({ uf: "SP", municipio: 3550308, regime: "simples", cnpj: "11222333000182", razaoSocial: "" }), "string");
});

test("pagador: aceita CPF ou CNPJ válidos", async () => {
  const { documentoPagador, cpfValido } = await import("./contas.ts");
  assert.equal(cpfValido("529.982.247-25"), true);
  assert.equal(cpfValido("52998224726"), false);
  assert.equal(documentoPagador("529.982.247-25"), "52998224725");
  assert.equal(documentoPagador("11.222.333/0001-81"), "11222333000181");
  assert.equal(documentoPagador("123"), null);
});
