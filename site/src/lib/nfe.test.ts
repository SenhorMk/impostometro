/**
 * Testes da leitura de XML de NF-e/NFC-e (T16). Notas fictícias em exemplos-nfe/.
 *   npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { centavos, lerNota } from "./nfe.ts";

const pasta = path.join(path.dirname(fileURLToPath(import.meta.url)), "exemplos-nfe");
const ler = (nome: string) => lerNota(nome, readFileSync(path.join(pasta, nome), "utf8"));

test("centavos: sem arredondar pelo caminho", () => {
  assert.equal(centavos("100.00"), 10000);
  assert.equal(centavos("0.1"), 10);
  assert.equal(centavos("5.5"), 550);
  assert.equal(centavos("39.90"), 3990);
  assert.equal(centavos(""), 0);
  assert.throws(() => centavos("1.234"));
});

test("NF-e de venda com protocolo: dados da nota e dos itens", () => {
  const r = ler("nfe-venda.xml");
  assert.ok(r.ok);
  const n = r.nota;
  assert.equal(n.modelo, "NF-e");
  assert.equal(n.numero, "123");
  assert.equal(n.data, "2027-03-10");
  assert.equal(n.municipio, 3550308);
  assert.equal(n.uf, "SP");
  assert.equal(n.chave, "35270100000000000000550010000001231000001230");
  assert.equal(n.itens.length, 2);
  // item 1: sem grupo IBSCBS → base estimada = 100,00 + 10,00 de frete − 5,50 de desconto
  assert.deepEqual(
    { ...n.itens[0] },
    { numero: 1, descricao: "Camiseta de algodão", ncm: "61091000", cfop: "5102", quantidade: "2.0000", unidade: "UN", baseCentavos: 10450, origemBase: "estimada", cst: null, cClassTrib: null },
  );
  // item 2: a nota já traz a base e a classificação da reforma
  assert.equal(n.itens[1].baseCentavos, 9000);
  assert.equal(n.itens[1].origemBase, "nota");
  assert.equal(n.itens[1].cClassTrib, "200003");
  assert.equal(n.itens[1].cst, "200");
  // nada do cliente final é guardado
  assert.ok(!JSON.stringify(n).includes("Cliente que deve ser ignorado"));
});

test("NFC-e sem protocolo", () => {
  const r = ler("nfce-venda.xml");
  assert.ok(r.ok);
  assert.equal(r.nota.modelo, "NFC-e");
  assert.equal(r.nota.uf, "RJ");
  assert.equal(r.nota.itens[0].baseCentavos, 3990);
});

test("recusa nota de entrada, NFS-e e arquivo que não é XML", () => {
  const entrada = ler("nfe-entrada.xml");
  assert.ok(!entrada.ok && /entrada/.test(entrada.motivo));
  const nfse = ler("nfse.xml");
  assert.ok(!nfse.ok && /NFS-e/.test(nfse.motivo));
  const lixo = lerNota("foto.xml", "isto não é xml <<<");
  assert.ok(!lixo.ok);
});
