/**
 * Compara o PORTE (TypeScript) com a calculadora OFICIAL da Receita (Java, Docker).
 *
 *   docker compose up -d                       # na raiz: liga a calculadora oficial
 *   cd site && npm run porte:comparar          # manda os mesmos pedidos aos dois
 *
 * O que é testado (cada pedido vai aos dois motores e as respostas JSON
 * precisam ser IDÊNTICAS, campo a campo, inclusive textos e ordem):
 *  1. o exemplo oficial da Receita;
 *  2. os 30 testes dourados (testes-dourados/casos.py, lidos daqui);
 *  3. as 52 atividades do "o que você vende?" do site;
 *  4. uma varredura de TODAS as classificações tributárias (cClassTrib) vigentes,
 *     com NCM/NBS do anexo de cada uma, em vários valores e datas;
 *  5. Imposto Seletivo (bebidas, cigarros, veículos...) e tributação regular;
 *  6. erros de propósito (campos inválidos, NCM inexistente, UF errada...);
 *  7. 300 pedidos aleatórios (semente fixa) para forçar arredondamentos difíceis.
 *
 * Variável CALCULADORA_URL muda o endereço do oficial (padrão: localhost:8080);
 * MOTOR_CHAVE, se ele estiver atrás de um porteiro com chave (opcional).
 * Termina com código 1 se qualquer resposta for diferente.
 */
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calcularOperacao } from "../../src/motor/observabilidade.ts";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, "../../..");
const URL_OFICIAL = process.env.CALCULADORA_URL ?? "http://localhost:8080/api/calculadora";
const CABECALHOS: Record<string, string> = { "Content-Type": "application/json" };
if (process.env.MOTOR_CHAVE) CABECALHOS.Authorization = `Bearer ${process.env.MOTOR_CHAVE}`;

type Json = Record<string, unknown>;
type Caso = { nome: string; entrada: Json };

// ─── Montagem dos pedidos ───────────────────────────────────────────────────

const NOMINAIS = { cbs: 8.8, ibsEstadual: 0.05, ibsMunicipal: 0.05 };
const NOMINAIS_2027 = { cbs: 11.2, ibsEstadual: 0.05, ibsMunicipal: 0.05 };
const SP = { municipio: 3550308, uf: "SP" };

function operacao(id: string, itens: Json[], extra: Json = {}): Json {
  return { id, versao: "1.0.0", dhFatoGerador: "2027-03-10T10:00:00-03:00", ...SP, itens, ...extra };
}

function item(numero: number, campos: Json): Json {
  const i: Json = { numero, ...campos };
  if (i.cClassTrib && !i.cst) i.cst = String(i.cClassTrib).slice(0, 3);
  return i;
}

/** Lê a lista CASOS do arquivo Python dos testes dourados (sem precisar do Python). */
function casosDourados(): Caso[] {
  const py = readFileSync(path.join(RAIZ, "testes-dourados/casos.py"), "utf8");
  const municipios: Record<string, [number, string]> = {};
  const linhaMun = py.match(/^SP, RJ, BH, POA, REC = (.+)$/m)![1];
  const pares = [...linhaMun.matchAll(/\((\d+), "(\w\w)"\)/g)];
  ["SP", "RJ", "BH", "POA", "REC"].forEach((nome, i) => (municipios[nome] = [Number(pares[i][1]), pares[i][2]]));
  const casos: Caso[] = [];
  for (const m of py.matchAll(/\("(\d\d)", "([^"]+)",\s+"(\d{6})", "(ncm|nbs)", "(\d+)",\s+([\d.]+), (\w+)\)/g)) {
    const [, id, desc, cClassTrib, tipo, codigo, base, mun] = m;
    const [municipio, uf] = municipios[mun];
    const it = item(1, { [tipo]: codigo, cClassTrib, baseCalculo: Number(base), aliquotasNominais: NOMINAIS });
    if (tipo === "ncm") Object.assign(it, { quantidade: 1, unidade: "UN" });
    casos.push({ nome: `dourado ${id} (${desc})`, entrada: operacao(`dourado-${id}`, [it], { municipio, uf }) });
  }
  if (casos.length !== 30) throw new Error(`Esperava 30 testes dourados, li ${casos.length}`);
  return casos;
}

function casosAtividades(): Caso[] {
  const atividades = JSON.parse(readFileSync(path.join(AQUI, "../../src/dados/atividades.json"), "utf8")) as Json[];
  return atividades.map((a) => {
    const it = item(1, { [String(a.tipo)]: a.codigo, cClassTrib: a.cClassTrib, baseCalculo: 1000, aliquotasNominais: NOMINAIS_2027 });
    if (a.tipo === "ncm") Object.assign(it, { quantidade: 1, unidade: "UN" });
    return { nome: `atividade ${a.id}`, entrada: operacao(`ativ-${a.id}`, [it]) };
  });
}

/** Varredura: todas as classificações vigentes, com um código do anexo de cada uma. */
function casosVarredura(): Caso[] {
  const bruto = JSON.parse(readFileSync(path.join(AQUI, "../../src/motor/dados/tabelas.json"), "utf8"));
  const t = (nome: string) => {
    const { colunas, linhas } = bruto.tabelas[nome] as { colunas: string[]; linhas: unknown[][] };
    return linhas.map((l) => Object.fromEntries(colunas.map((c, i) => [c, l[i]]))) as Record<string, unknown>[];
  };
  const data = "2027-03-10";
  const vig = (r: Record<string, unknown>, p: string) =>
    String(r[`${p}_INICIO_VIGENCIA`]) <= data && (r[`${p}_FIM_VIGENCIA`] == null || data <= String(r[`${p}_FIM_VIGENCIA`]));
  const ncms = t("NCM").filter((n) => String(n.NCM_CD).length === 8 && vig(n, "NCM")).map((n) => String(n.NCM_CD));
  const nbss = t("NBS").filter((n) => String(n.NBS_CD).length === 9 && vig(n, "NBS")).map((n) => String(n.NBS_CD));
  const situacoes = new Map(t("SITUACAO_TRIBUTARIA").map((s) => [s.SITR_ID, s]));
  const tst = t("TRIBUTO_SITUACAO_TRIBUTARIA");
  const ncmAplic = t("NCM_APLICAVEL");
  const nbsAplic = t("NBS_APLICAVEL");
  const tratamentos = t("TRATAMENTO_CLASSIFICACAO");
  const tt = new Map(t("TRATAMENTO_TRIBUTARIO").map((x) => [x.TRTR_ID, x]));

  const casos: Caso[] = [];
  const bases = [1234.56, 0.01, 99.99, 1000000];
  let n = 0;
  const itens: { nome: string; item: Json }[] = [];
  for (const ct of t("CLASSIFICACAO_TRIBUTARIA")) {
    if (!vig(ct, "CLTR")) continue;
    const st = situacoes.get(ct.CLTR_SITR_ID)!;
    const ehCbsIbs = tst.some((x) => x.TRST_SITR_ID === st.SITR_ID && x.TRST_TBTO_ID === 2);
    if (!ehCbsIbs) continue;
    const cClassTrib = String(ct.CLTR_CD);
    const cst = String(st.SITR_CD);
    const prefNcm = ncmAplic.find((a) => a.NCMA_CLTR_ID === ct.CLTR_ID && vig(a, "NCMA"));
    const prefNbs = nbsAplic.find((a) => a.NBSA_CLTR_ID === ct.CLTR_ID && vig(a, "NBSA"));
    const codigos: Json[] = [];
    if (prefNcm) {
      const c = ncms.find((x) => x.startsWith(String(prefNcm.NCMA_NCM_CD)));
      if (c) codigos.push({ ncm: c, quantidade: 2, unidade: "UN" });
      codigos.push({ ncm: "61091000", quantidade: 1, unidade: "UN" }); // fora do anexo: deve dar REG-011
    }
    if (prefNbs) {
      const c = nbss.find((x) => x.startsWith(String(prefNbs.NBSA_NBS_CD)));
      if (c) codigos.push({ nbs: c });
    }
    if (!prefNcm && !prefNbs) codigos.push({ ncm: "84713012", quantidade: 1, unidade: "UN" }, { nbs: "115021000" }, {});
    const trat = tratamentos.find((x) => x.TRCL_CLTR_ID === ct.CLTR_ID && vig(x, "TRCL"));
    const exigeRegular = trat && tt.get(trat.TRCL_TRTR_ID)?.TRTR_IN_EXIGE_GRUPO_DESONERACAO === 1;
    for (const cod of codigos) {
      const base = bases[n++ % bases.length];
      const it: Json = { cst, cClassTrib, baseCalculo: base, aliquotasNominais: NOMINAIS_2027, ...cod };
      if (exigeRegular) it.tributacaoRegular = { cst: "000", cClassTrib: "000001" };
      itens.push({ nome: `${cClassTrib} ${JSON.stringify(cod)}`, item: it });
      if (exigeRegular) {
        // também sem o grupo (REG-009) e com uma classificação reduzida
        itens.push({ nome: `${cClassTrib} sem tributacaoRegular`, item: { ...it, tributacaoRegular: undefined } });
        itens.push({ nome: `${cClassTrib} regular 200052`, item: { ...it, nbs: "113022100", ncm: undefined, tributacaoRegular: { cst: "200", cClassTrib: "200052" } } });
      }
    }
  }
  // um pedido por classificação/código (erros de item não atrapalham os outros)
  for (const [i, x] of itens.entries()) casos.push({ nome: `varredura ${x.nome}`, entrada: operacao(`varre-${i}`, [item(1, x.item)]) });
  // e lotes de 15 itens no mesmo pedido, para testar os totais
  for (let i = 0; i < itens.length; i += 15) {
    const lote = itens.slice(i, i + 15).map((x, j) => item(j + 1, x.item));
    casos.push({ nome: `lote de itens ${i}–${i + lote.length - 1}`, entrada: operacao(`lote-${i}`, lote) });
  }
  // datas de 2026 (alíquotas de teste da Receita, sem informar alíquota) e de 2028
  for (const [i, x] of itens.filter((_, k) => k % 4 === 0).entries()) {
    const sem = { ...x.item, aliquotasNominais: undefined };
    casos.push({ nome: `2026 ${x.nome}`, entrada: operacao(`a2026-${i}`, [item(1, sem)], { dhFatoGerador: "2026-06-15T10:00:00-03:00" }) });
    casos.push({ nome: `2028 ${x.nome}`, entrada: operacao(`a2028-${i}`, [item(1, x.item)], { dhFatoGerador: "2028-01-02T09:00:00-03:00" }) });
  }
  return casos;
}

function casosImpostoSeletivo(): Caso[] {
  const is = (ncm: string, base: number, extra: Json = {}, nominais: Json = NOMINAIS_2027) =>
    item(1, {
      ncm,
      cClassTrib: "000001",
      quantidade: 12,
      unidade: "UN",
      impostoSeletivo: { cst: "000", cClassTrib: "000001", baseCalculo: base, quantidade: 12, unidade: "LT", ...extra },
      aliquotasNominais: nominais,
    });
  const ncmsIS = ["22030000", "22041010", "22084000", "24022000", "87032100", "87038000", "27090010", "71081310", "22021000", "22029900"];
  const casos: Caso[] = [];
  for (const ncm of ncmsIS) {
    casos.push({ nome: `IS ${ncm} sem alíquota informada`, entrada: operacao(`is-${ncm}-a`, [is(ncm, 150)]) });
    casos.push({
      nome: `IS ${ncm} com ad valorem informada`,
      entrada: operacao(`is-${ncm}-b`, [is(ncm, 150, {}, { ...NOMINAIS_2027, impostoSeletivo: { adValorem: 10 } })]),
    });
    casos.push({
      nome: `IS ${ncm} com ad rem informada`,
      entrada: operacao(`is-${ncm}-c`, [is(ncm, 333.33, { impostoInformado: 12.5 }, { ...NOMINAIS_2027, impostoSeletivo: { adValorem: 7.5, adRem: 1.25 } })]),
    });
    casos.push({
      nome: `IS ${ncm} sem grupo IS`,
      entrada: operacao(`is-${ncm}-d`, [item(1, { ncm, cClassTrib: "000001", baseCalculo: 150, aliquotasNominais: NOMINAIS_2027 })]),
    });
  }
  return casos;
}

function casosErros(): Caso[] {
  const ok = { ncm: "61091000", cClassTrib: "000001", baseCalculo: 100, aliquotasNominais: NOMINAIS_2027 };
  const c = (nome: string, entrada: Json): Caso => ({ nome: `erro: ${nome}`, entrada });
  return [
    c("cst curto", operacao("e1", [item(1, { ...ok, cst: "00" })])),
    c("cst com letra", operacao("e2", [item(1, { ...ok, cst: "0a0" })])),
    c("cClassTrib ausente", operacao("e3", [{ numero: 1, cst: "000", ncm: "61091000", baseCalculo: 100, aliquotasNominais: NOMINAIS_2027 }])),
    c("sem base", operacao("e4", [item(1, { ...ok, baseCalculo: undefined })])),
    c("base negativa", operacao("e5", [item(1, { ...ok, baseCalculo: -1 })])),
    c("base com 3 casas", operacao("e6", [item(1, { ...ok, baseCalculo: 10.123 })])),
    c("NCM inexistente", operacao("e7", [item(1, { ...ok, ncm: "99999999" })])),
    c("NBS inexistente", operacao("e8", [item(1, { ...ok, ncm: undefined, nbs: "199999999" })])),
    c("NCM e NBS juntas", operacao("e9", [item(1, { ...ok, nbs: "115021000" })])),
    c("cClassTrib inexistente", operacao("e10", [item(1, { ...ok, cClassTrib: "999999" })])),
    c("CST não combina com cClassTrib", operacao("e11", [item(1, { ...ok, cst: "200" })])),
    c("CST inexistente", operacao("e12", [item(1, { ...ok, cst: "999", cClassTrib: "999001" })])),
    c("sem alíquotas nominais em 2027", operacao("e13", [item(1, { ...ok, aliquotasNominais: undefined })])),
    c("alíquotas nominais em 2026", operacao("e14", [item(1, ok)], { dhFatoGerador: "2026-05-05T10:00:00-03:00" })),
    c("alíquota acima de 100", operacao("e15", [item(1, { ...ok, aliquotasNominais: { ...NOMINAIS_2027, cbs: 150 } })])),
    c("NCM incompleta", operacao("e16", [item(1, { ...ok, ncm: "6109", cClassTrib: "200035" })])),
    c("quantidade zero", operacao("e17", [item(1, { ...ok, quantidade: 0 })])),
    c("município de outra UF", operacao("e18", [item(1, ok)], { uf: "RJ" })),
    c("município inexistente", operacao("e19", [item(1, ok)], { municipio: 1234567 })),
    c("UF inexistente", operacao("e20", [item(1, ok)], { uf: "XX" })),
    c("UF não informada (descobre pelo município)", operacao("e21", [item(1, ok)], { uf: undefined })),
    c("sem itens", operacao("e22", [])),
    c("sem id", operacao("e23", [item(1, ok)], { id: undefined })),
    c("sem data", operacao("e24", [item(1, ok)], { dhFatoGerador: undefined })),
    c("número do item zero", operacao("e25", [item(0, ok)])),
    c("vários erros no mesmo item", operacao("e26", [item(1, { ...ok, ncm: "99999999", baseCalculo: undefined })])),
    c("itens fora de ordem", operacao("e27", [item(3, ok), item(1, { ...ok, ncm: "84713012" }), item(2, { ...ok, ncm: "99999999" })])),
    c("valores em texto", operacao("e28", [item(1, { ...ok, baseCalculo: "250.50", aliquotasNominais: { cbs: "11.2", ibsEstadual: "0.05", ibsMunicipal: "0.05" } })])),
    c("item sem NCM nem NBS", operacao("e29", [item(1, { ...ok, ncm: undefined })])),
    c("alíquota com 5 casas", operacao("e30", [item(1, { ...ok, aliquotasNominais: { ...NOMINAIS_2027, cbs: 11.12345 } })])),
  ];
}

// ─── Execução e comparação ──────────────────────────────────────────────────

async function oficial(entrada: Json): Promise<{ status: number; corpo: unknown }> {
  const r = await fetch(`${URL_OFICIAL}/observabilidade/regime-geral`, { method: "POST", headers: CABECALHOS, body: JSON.stringify(entrada) });
  return { status: r.status, corpo: await r.json() };
}

/** Campos que mudam a cada chamada e não fazem parte do cálculo. */
function limpar(corpo: unknown): unknown {
  if (corpo && typeof corpo === "object" && !Array.isArray(corpo)) {
    const { timestamp: _t, instance: _i, ...resto } = corpo as Json;
    void _t;
    void _i;
    return resto;
  }
  return corpo;
}

function primeiraDiferenca(a: unknown, b: unknown, caminho = "$"): string | null {
  if (isDeepStrictEqual(a, b)) return null;
  if (a && b && typeof a === "object" && typeof b === "object") {
    const chaves = new Set([...Object.keys(a as Json), ...Object.keys(b as Json)]);
    for (const k of chaves) {
      const d = primeiraDiferenca((a as Json)[k], (b as Json)[k], `${caminho}.${k}`);
      if (d) return d;
    }
    const ordemA = Object.keys(a as Json).join(",");
    const ordemB = Object.keys(b as Json).join(",");
    if (ordemA !== ordemB) return `${caminho}: ordem dos campos (oficial: ${ordemA} | porte: ${ordemB})`;
  }
  return `${caminho}: oficial = ${JSON.stringify(a)} | porte = ${JSON.stringify(b)}`;
}

/** Valores aleatórios (semente fixa: sempre os mesmos) para forçar arredondamentos difíceis. */
function casosAleatorios(): Caso[] {
  let semente = 20271;
  const rnd = () => ((semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648);
  const escolher = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  const atividades = JSON.parse(readFileSync(path.join(AQUI, "../../src/dados/atividades.json"), "utf8"));
  const lista: Json[] = (Array.isArray(atividades) ? atividades : atividades.atividades) as Json[];
  const cidades = [{ municipio: 3550308, uf: "SP" }, { municipio: 3304557, uf: "RJ" }, { municipio: 3106200, uf: "MG" }, { municipio: 4314902, uf: "RS" }, { municipio: 2611606, uf: "PE" }];
  const datas = ["2026-02-01T08:00:00-03:00", "2027-01-01T00:00:00-03:00", "2027-07-15T12:00:00-03:00", "2028-12-31T23:59:59-03:00"];
  const casos: Caso[] = [];
  for (let i = 0; i < 300; i++) {
    const a = escolher(lista);
    const centavos = escolher([1, 7, 99, 1234, 100005, 33333, 9999999, 123456789, 99999999999]);
    const base = (Math.floor(rnd() * centavos) + 1) / 100;
    const campos: Json = { [String(a.tipo)]: a.codigo, cClassTrib: a.cClassTrib, baseCalculo: base };
    if (rnd() < 0.7) {
      const r4 = (max: number) => Math.round(rnd() * max * 10000) / 10000;
      campos.aliquotasNominais = { cbs: r4(30), ibsEstadual: r4(20), ibsMunicipal: r4(10) };
    }
    if (rnd() < 0.5) {
      campos.quantidade = escolher([1, 3, 0.5, 12.3456, 1000]);
      campos.unidade = escolher(["UN", "KG", "LT", "M2"]);
    }
    const data = escolher(datas);
    if (data.startsWith("2026") || data.startsWith("2028")) delete campos.aliquotasNominais;
    casos.push({ nome: `aleatório ${i}`, entrada: operacao(`rnd-${i}`, [item(1, campos)], { ...escolher(cidades), dhFatoGerador: data }) });
  }
  return casos;
}

async function main() {
  const exemplo = JSON.parse(readFileSync(path.join(RAIZ, "calculadora/exemplos/operacao-oficial.json"), "utf8"));
  const casos: Caso[] = [
    { nome: "exemplo oficial da Receita", entrada: exemplo },
    ...casosDourados(),
    ...casosAtividades(),
    ...casosVarredura(),
    ...casosImpostoSeletivo(),
    ...casosErros(),
    ...casosAleatorios(),
  ];
  console.log(`Comparando ${casos.length} pedidos: porte (TypeScript) × calculadora oficial (${URL_OFICIAL})\n`);

  let iguais = 0;
  let itens = 0;
  const diferentes: string[] = [];
  const estados: Record<string, number> = {};
  for (const caso of casos) {
    const o = await oficial(caso.entrada);
    let p: { status: number; corpo: unknown };
    try {
      p = calcularOperacao(caso.entrada);
    } catch (e) {
      p = { status: 0, corpo: { erroNoPorte: String(e) } };
    }
    const objetos = ((o.corpo as Json)?.objetos as Json[] | undefined) ?? [];
    itens += objetos.length;
    for (const ob of objetos) estados[String(ob.estadoItem)] = (estados[String(ob.estadoItem)] ?? 0) + 1;
    const a = { status: o.status, corpo: limpar(o.corpo) };
    const b = { status: p.status, corpo: limpar(p.corpo) };
    if (isDeepStrictEqual(a, b) && JSON.stringify(a) === JSON.stringify(b)) iguais++;
    else diferentes.push(`✗ ${caso.nome}\n    ${primeiraDiferenca(a, b)}`);
  }

  console.log(`Itens calculados pelo oficial, por estado: ${JSON.stringify(estados)}`);
  console.log(`Total de itens comparados: ${itens}\n`);
  if (diferentes.length) {
    console.log(diferentes.join("\n"));
    console.log(`\n❌ ${diferentes.length} de ${casos.length} pedidos com resposta diferente.`);
    process.exit(1);
  }
  console.log(`✅ ${iguais} de ${casos.length} pedidos com resposta IDÊNTICA à da calculadora oficial.`);
}

await main();
