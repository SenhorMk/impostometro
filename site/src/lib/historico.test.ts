import { test } from "node:test";
import assert from "node:assert/strict";
import { calculoLote, calculoManual, LIMITE_DETALHE_BYTES, paraCentavos, tamanhoJson } from "./historico.ts";
import type { NotaCalculada } from "./lote.ts";
import type { NotaLida } from "./nfe.ts";
import type { ResultadoCalculo } from "./tipos.ts";

const parte = (valor: number) => ({ aliquota: 1, reducao: 0, aliquotaEfetiva: 1, valor });
const ok: ResultadoCalculo = {
  ok: true,
  estado: "CALCULADO",
  base: 1000,
  cbs: parte(112.0),
  ibsEstadual: parte(0.9),
  ibsMunicipal: parte(0.1),
  ibsTotal: 1.0,
  total: 113.0,
  percentualSobreVenda: 11.3,
  semAliquota: false,
  dataFatoGerador: "2027-01-01",
  versaoMotor: "1.2.3",
  versaoTabelaMotor: "V123",
  versaoTabelaAliquotas: "2027-01",
  periodoAliquotas: { id: "2027", status: "provisorio", explicacaoCbs: "", explicacaoIbs: "", fontes: [] },
};

test("centavos sem erro de ponto flutuante", () => {
  assert.equal(paraCentavos(0.1 + 0.2), 30);
  assert.equal(paraCentavos(42.24), 4224);
  assert.equal(paraCentavos(1234567.89), 123456789);
});

test("simulação manual guarda totais, versões e o resultado inteiro", () => {
  const c = calculoManual(ok, "Restaurante", "São Paulo/SP")!;
  assert.equal(c.origem, "manual");
  assert.equal(c.titulo, "Restaurante · São Paulo/SP");
  assert.deepEqual([c.base_centavos, c.cbs_centavos, c.ibs_centavos], [100000, 11200, 100]);
  assert.deepEqual([c.versao_motor, c.versao_tabela_motor, c.versao_tabela_aliquotas], ["1.2.3", "V123", "2027-01"]);
  assert.equal(c.detalhe?.tipo, "manual");
});

test("erro de cálculo não vai para o histórico", () => {
  assert.equal(calculoManual({ ok: false, estado: "FALHA_TECNICA", mensagem: "x" }, "a", "b"), null);
});

const nota = (chave: string, data: string, base: number, cbs: number, ibs: number, erros = 0): [NotaCalculada, NotaLida] => [
  { chave, dataCalculo: data, itens: [], totais: { baseCentavos: base, cbsCentavos: cbs, ibsCentavos: ibs, itensCalculados: 2, itensComErro: erros } },
  { arquivo: "segredo.xml", chave, modelo: "NF-e", numero: "1", serie: "1", data, municipio: 3550308, uf: "SP", itens: [], avisos: ["x"], emitente: "00000000000000", autorizacao: { situacao: "sem_protocolo" } },
];

test("lote soma as notas, mostra o período e não guarda nome de arquivo", () => {
  const [a, la] = nota("A", "2027-01-05", 10000, 1120, 10);
  const [b, lb] = nota("B", "2027-01-20", 5000, 560, 5, 1);
  const c = calculoLote({ notas: [a, b], lidas: [la, lb], versaoMotor: "1.2.3", versaoTabelaMotor: "V1", versaoTabelaAliquotas: "2027-01" })!;
  assert.equal(c.origem, "xml");
  assert.equal(c.titulo, "2 notas de XML · 05/01/2027 a 20/01/2027");
  assert.deepEqual([c.base_centavos, c.cbs_centavos, c.ibs_centavos, c.itens_calculados, c.itens_com_erro], [15000, 1680, 15, 4, 1]);
  assert.ok(c.detalhe && c.detalhe.tipo === "xml");
  assert.ok(!JSON.stringify(c.detalhe).includes("segredo.xml"));
});

test("lote enorme guarda só os totais", () => {
  const [a, la] = nota("A", "2027-01-05", 1, 1, 1);
  la.itens = [{ numero: 1, descricao: "x".repeat(LIMITE_DETALHE_BYTES), ncm: "", cfop: "", quantidade: "1", unidade: "UN", baseCentavos: 1, origemBase: "estimada", cst: null, cClassTrib: null }];
  const c = calculoLote({ notas: [a], lidas: [la], versaoMotor: "1", versaoTabelaMotor: "V1", versaoTabelaAliquotas: "x" })!;
  assert.equal(c.detalhe, null);
  assert.equal(c.titulo, "1 nota de XML · 05/01/2027");
});

test("tamanho em bytes conta acentos", () => {
  assert.equal(tamanhoJson("é"), 4); // aspas + 2 bytes
});

test("lote vazio ou sem versão não é guardado", () => {
  assert.equal(calculoLote({ notas: [], lidas: [], versaoMotor: "1", versaoTabelaMotor: "V", versaoTabelaAliquotas: "x" }), null);
});
