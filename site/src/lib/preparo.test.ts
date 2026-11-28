/**
 * T34: o que entra na análise e o que fica de fora. Amostras sintéticas.
 *   npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lerNota, type Autorizacao, type EventoNota, type NotaLida } from "./nfe.ts";
import { lacunasNaNumeracao, motivosNaoCalculados, prepararAnalise } from "./preparo.ts";

const EMPRESA = "12345678000190";
const OUTRA = "98765432000110";
const AUTORIZADA: Autorizacao = { situacao: "autorizada", codigo: "100" };

let seq = 0;
function nota(p: Partial<NotaLida> & { numero: string }): NotaLida {
  seq++;
  return {
    arquivo: `nota-${p.numero}.xml`,
    chave: `3527${String(seq).padStart(40, "0")}`,
    modelo: "NF-e",
    serie: "1",
    data: "2027-03-10",
    municipio: 3550308,
    uf: "SP",
    itens: [{ numero: 1, descricao: "x", ncm: "61091000", cfop: "5102", quantidade: "1", unidade: "UN", baseCentavos: 10000, origemBase: "estimada", cst: null, cClassTrib: null }],
    avisos: [],
    emitente: EMPRESA,
    autorizacao: AUTORIZADA,
    ...p,
  };
}

test("a mesma chave não soma duas vezes, inclusive vinda de outro envio, e a repetição aparece", () => {
  const a = nota({ numero: "1" });
  const copia = { ...a, arquivo: "segundo-envio.zip › nota-1.xml" };
  const p = prepararAnalise({ lidas: [a, nota({ numero: "2" }), copia], limiteNotas: 500 });
  assert.equal(p.aceitas.length, 2);
  assert.equal(p.fora.length, 1);
  assert.equal(p.fora[0].motivo, "repetida");
  assert.match(p.fora[0].explicacao, /nota-1\.xml/);
});

test("outra empresa e outro mês ficam de fora com motivo, nunca em silêncio", () => {
  const lidas = [
    nota({ numero: "1" }),
    nota({ numero: "2" }),
    nota({ numero: "3", emitente: OUTRA }),
    nota({ numero: "4", data: "2027-02-27" }),
  ];
  const p = prepararAnalise({ lidas, limiteNotas: 500 });
  assert.equal(p.escopo.empresa, EMPRESA, "escolhe a empresa que mais aparece");
  assert.equal(p.escopo.periodo, "2027-03", "escolhe o mês que mais aparece");
  assert.deepEqual(p.aceitas.map((n) => n.numero), ["1", "2"]);
  assert.deepEqual(p.fora.map((f) => [f.numero, f.motivo]), [["3", "outra_empresa"], ["4", "fora_do_periodo"]]);
  assert.match(p.fora[0].explicacao, /98\.765\.432\/0001-10/);
  assert.match(p.fora[1].explicacao, /27\/02\/2027.*março de 2027/);
  // contagens reconciliam: tudo que entrou + tudo que ficou de fora = tudo que foi lido
  assert.equal(p.aceitas.length + p.fora.length, lidas.length);
});

test("a pessoa pode escolher outra empresa ou todos os meses", () => {
  const lidas = [nota({ numero: "1" }), nota({ numero: "2", emitente: OUTRA }), nota({ numero: "3", data: "2027-04-02" })];
  assert.deepEqual(prepararAnalise({ lidas, limiteNotas: 500, escopo: { empresa: OUTRA, periodo: null } }).aceitas.map((n) => n.numero), ["2"]);
  const todos = prepararAnalise({ lidas, limiteNotas: 500, escopo: { empresa: EMPRESA, periodo: "todos" } });
  assert.deepEqual(todos.aceitas.map((n) => n.numero), ["1", "3"]);
  assert.ok(todos.parcial, "meses diferentes não viram 'mês completo'");
  assert.ok(todos.motivosParcial.some((m) => /meses diferentes/.test(m)));
});

test("cancelada pelo protocolo ou por evento sai da soma; denegada também", () => {
  const cancelada = nota({ numero: "1", autorizacao: { situacao: "cancelada", codigo: "101", descricao: "Cancelamento homologado" } });
  const denegada = nota({ numero: "2", autorizacao: { situacao: "denegada", codigo: "302", descricao: "Uso denegado" } });
  const comEvento = nota({ numero: "3" });
  const boa = nota({ numero: "4" });
  const eventos: EventoNota[] = [{ arquivo: "cancelamento.xml", chave: comEvento.chave, tipo: "110111", descricao: "Cancelamento", cancelamento: true }];
  const p = prepararAnalise({ lidas: [cancelada, denegada, comEvento, boa], eventos, limiteNotas: 500 });
  assert.deepEqual(p.aceitas.map((n) => n.numero), ["4"]);
  assert.deepEqual(p.fora.map((f) => f.motivo).sort(), ["cancelada", "cancelada", "denegada"]);
});

test("sem protocolo e evento desconhecido viram pendência; ausência de evento não prova nota válida", () => {
  const semProt = nota({ numero: "1", autorizacao: { situacao: "sem_protocolo" } });
  const eventos: EventoNota[] = [
    { arquivo: "cce.xml", chave: semProt.chave, tipo: "110110", descricao: "Carta de Correção", cancelamento: false },
    { arquivo: "solto.xml", chave: "9".repeat(44), tipo: "110111", descricao: "Cancelamento", cancelamento: true },
  ];
  const p = prepararAnalise({ lidas: [semProt], eventos, limiteNotas: 500 });
  assert.equal(p.aceitas.length, 1, "a nota entra, mas com aviso");
  assert.equal(p.pendencias.length, 3);
  assert.ok(p.pendencias.some((x) => /protocolo/.test(x.explicacao)));
  assert.ok(p.pendencias.some((x) => /Carta de Correção.*não é tratado/.test(x.explicacao)));
  assert.ok(p.pendencias.some((x) => /não está entre os arquivos/.test(x.explicacao)));
  assert.ok(p.parcial);
});

test("buraco na numeração marca a análise como parcial", () => {
  const lidas = ["101", "102", "105", "106"].map((numero) => nota({ numero }));
  const p = prepararAnalise({ lidas, limiteNotas: 500 });
  assert.deepEqual(p.lacunas, [{ modelo: "NF-e", serie: "1", faltando: 2, exemplos: ["103", "104"] }]);
  assert.ok(p.parcial);
  assert.match(p.motivosParcial[0], /2 números de nota faltando/);
  // séries diferentes não se misturam
  assert.deepEqual(lacunasNaNumeracao([nota({ numero: "1", serie: "1" }), nota({ numero: "5", serie: "2" })]), []);
});

test("sequência completa e tudo autorizado: não é marcada como parcial", () => {
  const p = prepararAnalise({ lidas: ["1", "2", "3"].map((numero) => nota({ numero })), limiteNotas: 500 });
  assert.equal(p.parcial, false);
  assert.deepEqual(p.datas, { primeira: "2027-03-10", ultima: "2027-03-10" });
  assert.equal(p.itens, 3);
});

test("limites de notas e de itens por lote", () => {
  const lidas = ["1", "2", "3"].map((numero) => nota({ numero }));
  const p = prepararAnalise({ lidas, limiteNotas: 2 });
  assert.equal(p.aceitas.length, 2);
  assert.equal(p.fora[0].motivo, "limite");
  assert.ok(p.parcial);
  const porItens = prepararAnalise({ lidas, limiteNotas: 500, limiteItens: 2 });
  assert.equal(porItens.aceitas.length, 2);
  assert.match(porItens.fora[0].explicacao, /itens/);
});

test("itens não calculados agrupados por motivo", () => {
  const r = motivosNaoCalculados([
    { ok: true },
    { ok: false, mensagem: "NCM inválido." },
    { ok: false, mensagem: "NCM inválido." },
    { ok: false, mensagem: "Sem alíquota." },
  ]);
  assert.deepEqual(r, [{ motivo: "NCM inválido.", quantidade: 2 }, { motivo: "Sem alíquota.", quantidade: 1 }]);
});

// ---------- Leitura do protocolo e dos eventos (nfe.ts) ----------

const pasta = path.join(path.dirname(fileURLToPath(import.meta.url)), "exemplos-nfe");

test("leitor guarda o CNPJ do emitente e a situação do protocolo", () => {
  const r = lerNota("nfe-venda.xml", readFileSync(path.join(pasta, "nfe-venda.xml"), "utf8"));
  assert.ok(r.ok);
  assert.equal(r.nota.emitente, "00000000000000");
  assert.deepEqual(r.nota.autorizacao, { situacao: "autorizada", codigo: "100" });
  const nfce = lerNota("nfce-venda.xml", readFileSync(path.join(pasta, "nfce-venda.xml"), "utf8"));
  assert.ok(nfce.ok);
  assert.equal(nfce.nota.autorizacao.situacao, "sem_protocolo");
});

test("protocolo de nota cancelada é reconhecido", () => {
  const xml = readFileSync(path.join(pasta, "nfe-venda.xml"), "utf8").replace("<cStat>100</cStat>", "<cStat>101</cStat><xMotivo>Cancelamento de NF-e homologado</xMotivo>");
  const r = lerNota("cancelada.xml", xml);
  assert.ok(r.ok);
  assert.equal(r.nota.autorizacao.situacao, "cancelada");
});

test("XML de evento de cancelamento é lido como evento, não como nota", () => {
  const chave = "35270100000000000000550010000001231000001230";
  const xml = `<?xml version="1.0"?><procEventoNFe versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe"><evento versao="1.00"><infEvento Id="ID1101113527"><cOrgao>35</cOrgao><chNFe>${chave}</chNFe><tpEvento>110111</tpEvento><detEvento versao="1.00"><descEvento>Cancelamento</descEvento></detEvento></infEvento></evento></procEventoNFe>`;
  const r = lerNota("evento.xml", xml);
  assert.ok(!r.ok);
  assert.deepEqual(r.evento, { arquivo: "evento.xml", chave, tipo: "110111", descricao: "Cancelamento", cancelamento: true });
});
