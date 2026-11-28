import { test } from "node:test";
import assert from "node:assert/strict";
import { celula, nomeDaPlanilha, planilhaDoLote } from "./planilha.ts";
import type { NotaCalculada } from "./lote.ts";

const item = (numero: number, descricao: string) => ({ numero, descricao, ncm: "61091000", cfop: "5102", quantidade: "1", unidade: "UN", baseCentavos: 10450, origemBase: "estimada" as const, cst: null, cClassTrib: null });
const lida = { chave: "3".repeat(44), modelo: "NF-e" as const, numero: "123", serie: "1", data: "2027-03-10", uf: "SP", itens: [item(1, 'Camiseta "algodão"; azul'), item(2, "=HYPERLINK(1)")] };
const nota: NotaCalculada = {
  chave: lida.chave,
  dataCalculo: "2027-03-10",
  itens: [
    { numero: 1, estado: "CALCULADO", ok: true, baseCentavos: 10450, cbsCentavos: 1170, ibsCentavos: 10, reducaoCbs: "0.00", aliquotaEfetivaCbs: "11.20" },
    { numero: 2, estado: "SEM_NCM", ok: false, mensagem: "A nota não informa o NCM deste item." },
  ],
  totais: { baseCentavos: 10450, cbsCentavos: 1170, ibsCentavos: 10, itensCalculados: 1, itensComErro: 1 },
};
const versoes = { versaoMotor: "1.7.2", versaoTabelaMotor: "V0073", versaoTabelaAliquotas: "2026-11-25" };

test("planilha no jeito do Excel brasileiro, com os números da tela", () => {
  const csv = planilhaDoLote([nota], [lida], versoes);
  assert.ok(csv.startsWith("﻿Modelo;Número;"));
  const linhas = csv.split("\r\n");
  assert.equal(linhas[1], `NF-e;123;1;10/03/2027;SP;="${lida.chave}";1;"Camiseta ""algodão""; azul";="61091000";5102;;;estimada;104,50;11,70;0,10;11,80;0,00;11,20;calculado;`);
  assert.match(linhas[2], /^NF-e;123;.*;'=HYPERLINK\(1\);.*;;;;;;;não calculado: A nota não informa o NCM deste item\.;$/);
  assert.equal(linhas[4], "Total dos itens calculados;;;;;;;;;;;;;104,50;11,70;0,10;11,80");
  assert.match(linhas[5], /versão 1\.7\.2, tabelas V0073/);
  // resumo do período no fim, sem cobertura registrada: avisa
  assert.ok(linhas.includes("Resumo do período"));
  assert.ok(linhas.some((l) => l.startsWith("Aviso;Cobertura do período não registrada")));
  assert.ok(linhas.some((l) => l.startsWith("Itens não calculados;1 × A nota não informa o NCM")));
});

test("planilha leva a memória de cálculo e o resumo da cobertura", () => {
  const comMemoria: NotaCalculada = { ...nota, itens: [{ ...nota.itens[0], memoria: "=104,50 x 11,2%" }, nota.itens[1]] };
  const cobertura = {
    resumo: "12.345.678/0001-90 · março de 2027", parcial: true, motivos: ["há 2 números de nota faltando na sequência"],
    empresa: "12.345.678/0001-90", periodo: "março de 2027", incluidas: 1,
    fora: [{ motivo: "repetida" as const, nome: "1 repetida", quantidade: 1, numeros: ["123"] }],
    pendencias: [], lacunas: [], datas: null,
  };
  const linhas = planilhaDoLote([comMemoria], [lida], versoes, undefined, cobertura, new Date("2027-04-01T10:00:00Z")).split("\r\n");
  assert.ok(linhas[1].endsWith(";'=104,50 x 11,2%"), "memória protegida contra fórmula");
  assert.ok(linhas.includes("Empresa;12.345.678/0001-90"));
  assert.ok(linhas.includes("Período;março de 2027"));
  assert.ok(linhas.includes("Notas fora da soma: 1 repetida;1 (números 123)"));
  assert.ok(linhas.some((l) => l.startsWith("Aviso;Cobertura parcial: há 2 números")));
  assert.ok(linhas.includes("Gerado em (UTC);2027-04-01 10:00"));
});

test("célula protege fórmulas e separadores", () => {
  assert.equal(celula("+5"), "'+5");
  assert.equal(celula("-x"), "'-x");
  assert.equal(celula("a;b"), '"a;b"');
  assert.equal(celula("linha\nnova"), "linha nova");
});

test("nome do arquivo com o período", () => {
  assert.equal(nomeDaPlanilha([{ data: "2027-03-10" }, { data: "2027-01-02" }]), "cbs-ibs-2027-01-02_a_2027-03-10.csv");
  assert.equal(nomeDaPlanilha([{ data: "2027-03-10" }]), "cbs-ibs-2027-03-10.csv");
});
