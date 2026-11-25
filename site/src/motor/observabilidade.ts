/**
 * Ponto de entrada do porte: "cálculo com observabilidade" de uma operação.
 *
 * Porte de `domain/service/ObservabilidadeService.java`, dos totais
 * (`api/model/roc/*TotalDomain.java` e `reduce/*Accumulator.java`) e do formato
 * JSON da resposta (ordem dos campos, campos nulos omitidos e números como
 * texto, igual aos serializers da Receita).
 *
 * Recebe o MESMO JSON que o endpoint oficial
 * `POST /api/calculadora/observabilidade/regime-geral` e devolve a MESMA resposta.
 */
import { type Dec, ZERO, formatarAliquota, formatarMoeda, formatarQuantidade } from "./decimal.ts";
import {
  type ItemEntrada,
  type OperacaoEntrada,
  dataFatoGerador,
  detalheValidacao,
  lerOperacao,
  validarItem,
  validarOperacao,
} from "./entrada.ts";
import { ColetorItem, type ErroDetalhe, ErrosCalculo, type EstadoItem, ErroCalculadora, VALIDACAO } from "./erros.ts";
import type { GrupoTributo, ImpostoSeletivo, Tributos } from "./calculo-tributo.ts";
import { processarItem } from "./processamento-item.ts";
import { buscarUfPorMunicipio, consultarUfPorSigla, validarMunicipio } from "./tabelas.ts";

type ItemResultado = { nObj: number; estadoItem: EstadoItem; tribCalc: Tributos | null; erros: ErroDetalhe[] | null };

export type RespostaCalculo = { status: 200 | 422; corpo: unknown };

// ─── Serialização (JsonInclude NON_NULL + JsonPropertyOrder) ────────────────

/** Monta um objeto só com os campos não nulos, na ordem dada. */
function semNulos(pares: [string, unknown][]): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const [k, v] of pares) if (v !== null && v !== undefined) o[k] = v;
  return o;
}

function naoNegativo(v: Dec, tipo: string): Dec {
  if (v.isNegative() && !v.isZero()) throw new Error(`Números negativos não são permitidos para ${tipo}`);
  return v;
}
const moeda = (v: Dec | null) => (v === null ? null : formatarMoeda(naoNegativo(v, "TDec1302")));
const aliquota = (v: Dec | null) => (v === null ? null : formatarAliquota(naoNegativo(v, "TDec_0302_04")));
const quantidade = (v: Dec | null) => (v === null ? null : formatarQuantidade(naoNegativo(v, "TDec_1104OpRTC")));

function jsonGrupo(g: GrupoTributo | null, campoAliquota: string, campoValor: string) {
  if (!g) return null;
  return semNulos([
    [campoAliquota, aliquota(g.aliquota)],
    ["gDif", g.gDif ? semNulos([["pDif", aliquota(g.gDif.pDif)], ["vDif", moeda(g.gDif.vDif)]]) : null],
    ["gRed", g.gRed ? semNulos([["pRedAliq", aliquota(g.gRed.pRedAliq)], ["pAliqEfet", aliquota(g.gRed.pAliqEfet)]]) : null],
    [campoValor, moeda(g.valor)],
  ]);
}

function jsonIS(is: ImpostoSeletivo | null) {
  if (!is) return null;
  return semNulos([
    ["CSTIS", is.CSTIS],
    ["cClassTribIS", is.cClassTribIS],
    ["vBCIS", moeda(is.vBCIS)],
    ["pIS", aliquota(is.pIS)],
    ["pISEspec", aliquota(is.pISEspec)],
    ["adRemIS", aliquota(is.adRemIS)],
    ["uTrib", is.uTrib],
    ["qTrib", quantidade(is.qTrib)],
    ["vIS", moeda(is.vIS)],
    ["memoriaCalculo", is.memoriaCalculo],
  ]);
}

function jsonTributos(t: Tributos) {
  const ibscbs = t.IBSCBS;
  const g = ibscbs.gIBSCBS;
  const r = g?.gTribRegular ?? null;
  return semNulos([
    ["IS", jsonIS(t.IS)],
    [
      "IBSCBS",
      semNulos([
        ["CST", ibscbs.CST],
        ["cClassTrib", ibscbs.cClassTrib],
        [
          "gIBSCBS",
          g
            ? semNulos([
                ["vBC", moeda(g.vBC)],
                ["gIBSUF", jsonGrupo(g.gIBSUF, "pIBSUF", "vIBSUF")],
                ["gIBSMun", jsonGrupo(g.gIBSMun, "pIBSMun", "vIBSMun")],
                ["vIBS", moeda(g.vIBS)],
                ["gCBS", jsonGrupo(g.gCBS, "pCBS", "vCBS")],
                [
                  "gTribRegular",
                  r
                    ? semNulos([
                        ["CSTReg", r.CSTReg],
                        ["cClassTribReg", r.cClassTribReg],
                        ["pAliqEfetRegIBSUF", aliquota(r.pAliqEfetRegIBSUF)],
                        ["vTribRegIBSUF", moeda(r.vTribRegIBSUF)],
                        ["pAliqEfetRegIBSMun", aliquota(r.pAliqEfetRegIBSMun)],
                        ["vTribRegIBSMun", moeda(r.vTribRegIBSMun)],
                        ["pAliqEfetRegCBS", aliquota(r.pAliqEfetRegCBS)],
                        ["vTribRegCBS", moeda(r.vTribRegCBS)],
                      ])
                    : null,
                ],
              ])
            : null,
        ],
        [
          "memoriaCalculo",
          ibscbs.memoriaCalculo
            ? semNulos([
                ["cbs", ibscbs.memoriaCalculo.cbs],
                ["ibsUF", ibscbs.memoriaCalculo.ibsUF],
                ["ibsMun", ibscbs.memoriaCalculo.ibsMun],
              ])
            : null,
        ],
      ]),
    ],
  ]);
}

// ─── Totais (ValoresTotaisDomain) ───────────────────────────────────────────

function somar(valores: (Dec | null | undefined)[]): Dec {
  return valores.reduce<Dec>((s, v) => s.plus(v ?? ZERO), ZERO);
}

function totais(calculados: Tributos[]) {
  if (calculados.length === 0) return null;
  const comIS = calculados.filter((t) => t.IS);
  const grupos = calculados.map((t) => t.IBSCBS.gIBSCBS);
  const totalTributo = (sel: (g: NonNullable<(typeof grupos)[number]>) => GrupoTributo | null) => {
    const gs = grupos.filter((g) => g && sel(g)).map((g) => sel(g!)!);
    return gs.length === 0 ? null : { vDif: somar(gs.map((x) => x.gDif?.vDif)), vDevTrib: ZERO, valor: somar(gs.map((x) => x.valor)) };
  };
  const uf = totalTributo((g) => g.gIBSUF) ?? { vDif: ZERO, vDevTrib: ZERO, valor: ZERO };
  const mun = totalTributo((g) => g.gIBSMun) ?? { vDif: ZERO, vDevTrib: ZERO, valor: ZERO };
  const cbs = totalTributo((g) => g.gCBS) ?? { vDif: ZERO, vDevTrib: ZERO, valor: ZERO };
  return {
    tribCalc: semNulos([
      ["ISTot", comIS.length > 0 ? { vIS: moeda(somar(comIS.map((t) => t.IS!.vIS ?? ZERO))) } : null],
      [
        "IBSCBSTot",
        {
          vBCIBSCBS: moeda(somar(grupos.map((g) => g?.vBC))),
          gIBS: {
            gIBSUF: { vDif: moeda(uf.vDif), vDevTrib: moeda(uf.vDevTrib), vIBSUF: moeda(uf.valor) },
            gIBSMun: { vDif: moeda(mun.vDif), vDevTrib: moeda(mun.vDevTrib), vIBSMun: moeda(mun.valor) },
            vIBS: moeda(somar(grupos.map((g) => g?.vIBS))),
            vCredPres: moeda(ZERO),
            vCredPresCondSus: moeda(ZERO),
          },
          gCBS: { vDif: moeda(cbs.vDif), vDevTrib: moeda(cbs.vDevTrib), vCBS: moeda(cbs.valor), vCredPres: moeda(ZERO), vCredPresCondSus: moeda(ZERO) },
          gMono: {
            vIBSMono: moeda(ZERO),
            vCBSMono: moeda(ZERO),
            vIBSMonoReten: moeda(ZERO),
            vCBSMonoReten: moeda(ZERO),
            vIBSMonoRet: moeda(ZERO),
            vCBSMonoRet: moeda(ZERO),
          },
        },
      ],
    ]),
  };
}

// ─── Processamento ──────────────────────────────────────────────────────────

function processarItemComValidacao(op: OperacaoEntrada, item: ItemEntrada, index: number, data: string, baseURL: string): ItemResultado {
  const coletor = new ColetorItem(index, baseURL);
  const nObj = item.numero ?? index + 1;
  for (const v of validarItem(item)) coletor.addErroValidacao(v.anotacao, v.campo, detalheValidacao(v));
  if (coletor.temErros()) return { nObj, estadoItem: coletor.estado, tribCalc: null, erros: coletor.erros };
  try {
    const tribCalc = processarItem(op, item, data);
    return { nObj, estadoItem: item.aliquotasNominais === null ? "CALCULADO" : "CALCULO_SIMULADO", tribCalc, erros: null };
  } catch (ex) {
    coletor.addErro(ex);
    return { nObj, estadoItem: coletor.estado, tribCalc: null, erros: coletor.erros };
  }
}

function errosGlobaisDeValidacao(op: OperacaoEntrada, baseURL: string): ErroDetalhe[] {
  return validarOperacao(op).map((v) => {
    const c = VALIDACAO[v.anotacao] ?? { codigo: "VAL-000", titulo: "Erro de validação" };
    return {
      type: `${baseURL}/calculadora/observabilidade/erros?codigo=${c.codigo}`,
      title: c.titulo,
      code: c.codigo,
      pointer: `#/${v.campo.replace(/\[(\d+)]/g, "/$1").replaceAll(".", "/")}`,
      detail: detalheValidacao(v),
    };
  });
}

/** Mesma lógica do processarOperacao: erros da operação viram 422; erros de item ficam no item. */
function processarOperacao(op: OperacaoEntrada, baseURL: string) {
  const globais = errosGlobaisDeValidacao(op, baseURL);
  if (globais.length > 0) throw new ErrosCalculo(globais);

  let data: string;
  try {
    if (op.uf === null) {
      const uf = buscarUfPorMunicipio(op.municipio!);
      if (uf === null) throw new ErroCalculadora("MunicipioNaoEncontrado", `Município de código ${op.municipio} não encontrado`);
      op.uf = uf;
    }
    if (consultarUfPorSigla(op.uf) === null) throw new ErroCalculadora("UfNaoEncontrada", `UF de sigla ${op.uf} não encontrada`);
    const m = validarMunicipio(op.municipio, op.uf);
    if (m === 1) throw new ErroCalculadora("MunicipioNaoEncontrado", `Município de código ${op.municipio} não encontrado`);
    if (m === 2) throw new ErroCalculadora("MunicipioNaoPertencente", `Município de código ${op.municipio} não pertence à UF de sigla ${op.uf}`);
    data = dataFatoGerador(op);
  } catch (ex) {
    const coletor = new ColetorItem(-1, baseURL);
    coletor.addErro(ex);
    throw new ErrosCalculo(coletor.erros);
  }

  const resultados = op.itens!.map((item, i) => processarItemComValidacao(op, item, i, data, baseURL)).sort((a, b) => a.nObj - b.nObj);
  const calculados = resultados.filter((r) => r.estadoItem === "CALCULADO" || r.estadoItem === "CALCULO_SIMULADO").map((r) => r.tribCalc!);

  return semNulos([
    [
      "objetos",
      resultados.map((r) =>
        semNulos([
          ["nObj", r.nObj],
          ["estadoItem", r.estadoItem],
          ["tribCalc", r.tribCalc ? jsonTributos(r.tribCalc) : null],
          ["erros", r.erros],
        ]),
      ),
    ],
    ["total", totais(calculados)],
  ]);
}

/**
 * Calcula uma operação no formato oficial da Receita.
 * `baseURL` só entra no campo `type` dos erros (no Java vem do endereço do servidor).
 */
export function calcularOperacao(json: unknown, baseURL = "http://localhost"): RespostaCalculo {
  try {
    const op = lerOperacao(json);
    return { status: 200, corpo: processarOperacao(op, baseURL) };
  } catch (ex) {
    if (ex instanceof ErrosCalculo) {
      return {
        status: 422,
        corpo: {
          detail: `O cálculo contém ${ex.erros.length} erro(s).`,
          status: 422,
          title: "Erros no processamento do cálculo",
          type: "about:blank",
          errors: ex.erros,
        },
      };
    }
    throw ex;
  }
}
