/**
 * Testes do porte que NÃO precisam de Docker (rodam em qualquer máquina e na CI do site):
 *  - o exemplo oficial da Receita dá a resposta oficial, byte a byte;
 *  - os 30 testes dourados dão os valores gravados a partir da calculadora oficial.
 *
 *   npm test
 *
 * A comparação completa (mais de 1.500 pedidos contra a calculadora oficial
 * ligada no Docker) é `npm run porte:comparar`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calcularOperacao } from "./observabilidade.ts";
import { VERSAO_CALCULADORA, versao } from "./versao.ts";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ler = (p: string) => JSON.parse(readFileSync(path.join(RAIZ, p), "utf8"));
type Json = Record<string, unknown>;

test("exemplo oficial da Receita: resposta idêntica à oficial", () => {
  const entrada = ler("calculadora/exemplos/operacao-oficial.json");
  const oficial = ler(`calculadora/exemplos/resposta-oficial-${VERSAO_CALCULADORA}.json`);
  const r = calcularOperacao(entrada);
  assert.equal(r.status, 200);
  assert.equal(JSON.stringify(r.corpo), JSON.stringify(oficial)); // inclusive a ordem dos campos
});

test("versão do porte bate com o Dockerfile da calculadora oficial", () => {
  const dockerfile = readFileSync(path.join(RAIZ, "calculadora/Dockerfile"), "utf8");
  assert.match(dockerfile, new RegExp(`ARG CALC_VERSION=${VERSAO_CALCULADORA.replaceAll(".", "\\.")}\\b`));
});

const pegar = (d: unknown, caminho: string[]) =>
  caminho.reduce<unknown>((x, k) => (x && typeof x === "object" ? (x as Json)[k] : undefined), d);

const CAMPOS: [string, string[]][] = [
  ["vBC", ["vBC"]],
  ["pCBS", ["gCBS", "pCBS"]],
  ["pRedCBS", ["gCBS", "gRed", "pRedAliq"]],
  ["pAliqEfetCBS", ["gCBS", "gRed", "pAliqEfet"]],
  ["vCBS", ["gCBS", "vCBS"]],
  ["pIBSUF", ["gIBSUF", "pIBSUF"]],
  ["vIBSUF", ["gIBSUF", "vIBSUF"]],
  ["pIBSMun", ["gIBSMun", "pIBSMun"]],
  ["vIBSMun", ["gIBSMun", "vIBSMun"]],
  ["vIBS", ["vIBS"]],
];

/** Mesmo resumo de testes-dourados/dourados.py. */
function resumir(corpo: unknown): Json {
  const obj = (corpo as { objetos: Json[] }).objetos[0];
  const r: Json = { estadoItem: obj.estadoItem };
  const erros = obj.erros as Json[] | undefined;
  if (erros?.length) r.erros = erros.map((e) => e.code);
  const g = pegar(obj, ["tribCalc", "IBSCBS", "gIBSCBS"]);
  if (g) for (const [nome, c] of CAMPOS) if (pegar(g, c) !== undefined) r[nome] = pegar(g, c);
  return r;
}

const pasta = path.join(RAIZ, "testes-dourados/esperados");
for (const arquivo of readdirSync(pasta).filter((f) => f.endsWith(".json")).sort()) {
  const caso = JSON.parse(readFileSync(path.join(pasta, arquivo), "utf8"));
  test(`dourado ${caso.id}: ${caso.descricao}`, () => {
    assert.equal(caso.motor, versao().versaoApp, "o arquivo foi gravado com outra versão da calculadora");
    assert.equal(caso.tabelas, versao().versaoDb, "o arquivo foi gravado com outra versão das tabelas");
    const r = calcularOperacao(caso.entrada);
    assert.equal(r.status, 200);
    assert.deepEqual(resumir(r.corpo), caso.esperado);
  });
}
