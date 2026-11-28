import { test } from "node:test";
import assert from "node:assert/strict";
import type { NotaCalculada } from "./lote.ts";
import type { NotaLida } from "./nfe.ts";
import { planilhaDoLote } from "./planilha.ts";
import { prepararAnalise } from "./preparo.ts";
import { resumirPremissas } from "./premissas.ts";
import { conferirTotais, montarRelatorio, resumirCobertura, type NotaDoRelatorio } from "./relatorio.ts";

const versoes = { versaoMotor: "1.7.2", versaoTabelaMotor: "V0073", versaoTabelaAliquotas: "2026-11-25" };
const agora = new Date("2027-04-02T12:00:00Z");

function item(numero: number, base: number, extra: Partial<NotaLida["itens"][number]> = {}): NotaLida["itens"][number] {
  return { numero, descricao: `Produto ${numero}`, ncm: "61091000", cfop: "5102", quantidade: "1", unidade: "UN", baseCentavos: base, origemBase: "nota", cst: "000", cClassTrib: "000001", ...extra };
}

/** Nota "lida" e o resultado "calculado" com valores conhecidos (CBS 11,2% e IBS 0,1% de cada base, já em centavos). */
function par(numero: number, bases: number[], erros: number[] = []): { lida: NotaLida; calc: NotaCalculada } {
  const chave = String(numero).padStart(44, "3");
  const lida: NotaLida = {
    arquivo: `pasta-pessoal/joao-${numero}.xml`, chave, modelo: "NF-e", numero: String(numero), serie: "1", data: "2027-03-10",
    municipio: 3550308, uf: "SP", itens: bases.map((b, i) => item(i + 1, b)), avisos: [], emitente: "12345678000190",
    autorizacao: { situacao: "autorizada", codigo: "100" },
  };
  const itens = bases.map((b, i) =>
    erros.includes(i + 1)
      ? { numero: i + 1, estado: "NAO_IMPLEMENTADO", ok: false, mensagem: "Classificação ainda não calculada pela Receita." }
      : { numero: i + 1, estado: "CALCULADO", ok: true, baseCentavos: b, cbsCentavos: Math.round(b * 0.112), ibsCentavos: Math.round(b * 0.001), reducaoCbs: "0.00", aliquotaEfetivaCbs: "11.20", memoria: `${b} x 11,2%` },
  );
  const ok = itens.filter((i) => i.ok);
  return {
    lida,
    calc: {
      chave, dataCalculo: "2027-03-10", aliquotas: { cbs: 11.2, ibsEstadual: 0.05, ibsMunicipal: 0.05, status: "provisorio" }, itens,
      totais: {
        baseCentavos: ok.reduce((s, i) => s + (i.baseCentavos ?? 0), 0), cbsCentavos: ok.reduce((s, i) => s + (i.cbsCentavos ?? 0), 0),
        ibsCentavos: ok.reduce((s, i) => s + (i.ibsCentavos ?? 0), 0), itensCalculados: ok.length, itensComErro: itens.length - ok.length,
      },
    },
  };
}

test("relatório curto: totais ao centavo, itens não calculados fora da soma e avisos junto do total", () => {
  const a = par(101, [10450, 99]);
  const b = par(102, [100000, 3333], [2]);
  const lote = { notas: [a.calc, b.calc], ...versoes };
  assert.ok(conferirTotais(lote.notas));
  const r = montarRelatorio(lote, [a.lida, b.lida], null, agora);
  // 10450 + 99 + 100000 (3333 não calculado)
  assert.equal(r.totais.baseCentavos, 110549);
  assert.equal(r.totais.cbsCentavos, Math.round(10450 * 0.112) + Math.round(99 * 0.112) + Math.round(100000 * 0.112));
  assert.equal(r.totais.totalCentavos, r.totais.cbsCentavos + r.totais.ibsCentavos);
  assert.equal(r.totais.itensNaoCalculados, 1);
  assert.deepEqual(r.naoCalculados, [{ motivo: "Classificação ainda não calculada pela Receita.", quantidade: 1 }]);
  assert.ok(r.avisos.some((x) => x.startsWith("Alíquotas provisórias")));
  assert.ok(r.avisos.some((x) => x.startsWith("Cobertura do período não registrada")));
  assert.ok(r.avisos.some((x) => x.includes("Não é o imposto definitivo")));
  const naoCalc = r.linhas.find((l) => !l.calculado)!;
  assert.equal(naoCalc.cbsCentavos, undefined, "item não calculado não ganha número inventado");
  assert.equal(naoCalc.motivo, "Classificação ainda não calculada pela Receita.");
});

test("relatório extenso (500 notas, 20.000 itens): tela, relatório e planilha somam igual", () => {
  const pares = Array.from({ length: 500 }, (_, n) => par(1000 + n, Array.from({ length: 40 }, (_, i) => ((n * 7919 + i * 104729) % 250000) + 1), n % 17 === 0 ? [3] : []));
  const notas = pares.map((p) => p.calc);
  const tela = notas.reduce((s, n) => ({ base: s.base + n.totais.baseCentavos, cbs: s.cbs + n.totais.cbsCentavos, ibs: s.ibs + n.totais.ibsCentavos }), { base: 0, cbs: 0, ibs: 0 });
  const r = montarRelatorio({ notas, ...versoes }, pares.map((p) => p.lida), null, agora);
  assert.equal(r.linhas.length, 20_000);
  assert.deepEqual([r.totais.baseCentavos, r.totais.cbsCentavos, r.totais.ibsCentavos], [tela.base, tela.cbs, tela.ibs]);
  const csv = planilhaDoLote(notas, pares.map((p) => p.lida), versoes, undefined, null, agora);
  const total = csv.split("\r\n").find((l) => l.startsWith("Total dos itens calculados"))!.split(";");
  const centavos = (t: string) => Number(t.replace(",", ""));
  assert.deepEqual([centavos(total[13]), centavos(total[14]), centavos(total[15])], [tela.base, tela.cbs, tela.ibs]);
});

test("conferirTotais acusa resultado alterado no caminho", () => {
  const a = par(1, [500, 700]);
  assert.ok(conferirTotais([a.calc]));
  assert.equal(conferirTotais([{ ...a.calc, totais: { ...a.calc.totais, cbsCentavos: a.calc.totais.cbsCentavos + 1 } }]), false);
});

test("cobertura vem do preparo (T34) sem nomes de arquivo", () => {
  const a = par(101, [1000]);
  const repetida = { ...par(101, [1000]).lida, arquivo: "copia-pessoal.xml" };
  const outra = { ...par(105, [1000]).lida, data: "2027-02-01" };
  const preparo = prepararAnalise({ lidas: [a.lida, repetida, outra], limiteNotas: 50, escopo: { empresa: null, periodo: "2027-03" } });
  const c = resumirCobertura(preparo);
  assert.equal(c.empresa, "12.345.678/0001-90");
  assert.equal(c.periodo, "março de 2027");
  assert.equal(c.incluidas, 1);
  assert.deepEqual(c.fora?.map((f) => [f.motivo, f.quantidade, f.numeros]).sort(), [["fora_do_periodo", 1, ["105"]], ["repetida", 1, ["101"]]]);
  assert.ok(!JSON.stringify(c).includes(".xml"), "nenhum nome de arquivo vai para o relatório nem para o histórico");
  const r = montarRelatorio({ notas: [a.calc], ...versoes }, [a.lida], c, agora);
  assert.equal(r.empresa, "12.345.678/0001-90");
  assert.ok(!r.avisos.some((x) => x.startsWith("Cobertura do período não registrada")));
});

test("rascunho e premissas aparecem no cenário e nos avisos", () => {
  const a = par(1, [1000]);
  const lida: NotaDoRelatorio = { ...a.lida, itens: [{ ...a.lida.itens[0], cClassTrib: null, classificacaoUsada: "000001", origemClassificacao: "sugerida", origemBase: "estimada" }] };
  const premissas = resumirPremissas([{ ...a.lida, itens: lida.itens }], 2, null);
  const r = montarRelatorio({ notas: [a.calc], ...versoes, premissas }, [lida], null, agora);
  assert.equal(r.rascunho, true);
  assert.equal(r.cenario, "Revisão 2 (rascunho)");
  assert.ok(r.avisos[0].startsWith("RASCUNHO"));
  assert.ok(r.avisos.some((x) => x.startsWith("Base estimada em 1 item")));
  assert.equal(r.linhas[0].origemClassificacao, "sugestão NÃO confirmada");
});
