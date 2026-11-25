/**
 * Cálculo da CBS, do IBS estadual e do IBS municipal de um item.
 *
 * Porte de `domain/service/calculotributo/CalculoCbsIbsService.java`.
 *
 * Política numérica da Receita (ADR003), seguida à risca:
 *  - a base (vBC) é arredondada a 2 casas antes de multiplicar;
 *  - a alíquota e a alíquota efetiva são arredondadas a 4 casas (em %) e é a
 *    efetiva publicada que multiplica a base: valor = arred2(vBC × efetiva ÷ 100);
 *  - com diferimento, vDif = arred2(vBC × alíquota ÷ 100 × pDif ÷ 100).
 */
import {
  type Dec,
  UM,
  ZERO,
  arredondarAliquotaPublicada,
  arredondarValorFiscal,
  fracaoParaPercentual,
  multiplicar,
  percentualParaFracao,
} from "./decimal.ts";
import type { ItemEntrada } from "./entrada.ts";
import { valorImpostoSeletivoInformado } from "./entrada.ts";
import { ErroCalculadora, ErroPorte } from "./erros.ts";
import { avaliar } from "./expressao.ts";
import {
  type ClassificacaoTributariaCalculoDTO,
  type TratamentoClassificacaoDTO,
  buscarAliquotaAdValoremPorClassificacaoTributaria,
  buscarAliquotaAdValoremServico,
  buscarAliquotaPadrao,
  buscarAliquotaReferencia,
  buscarClassificacaoTributariaCalculo,
  buscarPercentualReducao,
  buscarTratamentoTributario,
  consultarSituacaoTributariaPorCodigo,
} from "./tabelas.ts";

export type Tributo = { id: 2 | 3 | 4; nome: "CBS" | "IBS_ESTADUAL" | "IBS_MUNICIPAL" };
export const CBS: Tributo = { id: 2, nome: "CBS" };
export const IBS_ESTADUAL: Tributo = { id: 3, nome: "IBS_ESTADUAL" };
export const IBS_MUNICIPAL: Tributo = { id: 4, nome: "IBS_MUNICIPAL" };

export type ReducaoAliquota = { pRedAliq: Dec | null; pAliqEfet: Dec | null };
export type Diferimento = { pDif: Dec; vDif: Dec };
export type TributacaoRegularSaida = { cst: string | null; cClassTrib: string | null; baseCalculo: Dec; aliquotaEfetiva: Dec; tributoDevido: Dec };

/** Resultado de um tributo (CbsIbsOutput no Java). */
export type CbsIbsSaida = {
  grupoReducao: ReducaoAliquota | null;
  tributacaoRegular: TributacaoRegularSaida | null;
  grupoDiferimento: Diferimento | null;
  tributoCalculado: Dec | null;
  tributoDevido: Dec | null;
  aliquota: Dec | null;
  baseCalculo: Dec | null;
  quantidade: Dec | null;
};

/** A fração vai a %, é arredondada uma vez a 4 casas e volta a fração (publicarAliquota). */
function publicarAliquota(fracao: Dec | null): Dec | null {
  return percentualParaFracao(arredondarAliquotaPublicada(fracaoParaPercentual(fracao)));
}

function variaveis(pares: Record<string, Dec | null | undefined>): Record<string, Dec> {
  // entry(...) no Java troca nulo por ZERO
  return Object.fromEntries(Object.entries(pares).map(([k, v]) => [k, v ?? ZERO]));
}

function aliquotaNominal(tributo: Tributo, item: ItemEntrada): Dec | null {
  const an = item.aliquotasNominais;
  if (!an) return null;
  if (tributo.nome === "CBS") return an.cbs;
  if (tributo.nome === "IBS_ESTADUAL") return an.ibsEstadual;
  return an.ibsMunicipal;
}

const expressaoUsaAliquota = (e: string | null) => !!e && e.trim() !== "" && /\baliquota\b/.test(e);
const preenchida = (e: string | null): e is string => e !== null && e.trim() !== "";

function buscarAliquotaPadraoOuReferencia(idTributo: number, codigoUf: number | null, codigoMunicipio: number | null, data: string): Dec {
  const a = buscarAliquotaPadrao(idTributo, codigoUf, codigoMunicipio, data);
  if (!a) {
    throw new ErroCalculadora(
      "AliquotaNaoEncontrada",
      `Alíquota de referencia ou padrão não encontrada para o tributo com id ${idTributo}, UF ${codigoUf}, município ${codigoMunicipio} e data ${data}`,
    );
  }
  // AliquotaResultadoDTO: valida e escolhe o valor aplicável
  if (a.valorReferencia === null) throw new ErroCalculadora("AliquotaReferenciaNaoEncontrada", "Alíquota de referência não encontrada");
  if (a.valorReferencia.isNegative() && !a.valorReferencia.isZero()) {
    throw new ErroCalculadora("AliquotaNegativa", "Alíquota de referência não pode ter valor negativo");
  }
  let padrao = a.valorPadrao;
  if (padrao !== null) {
    if (padrao.isNegative() && !padrao.isZero()) throw new ErroCalculadora("AliquotaNegativa", "Alíquota padrão não pode ter valor negativo");
    if (a.formaAplicacao === null) throw new ErroPorte("Forma de aplicação da alíquota própria não definida");
    if (a.formaAplicacao === "ACRESCIMO") padrao = a.valorReferencia.plus(padrao);
    else if (a.formaAplicacao === "DECRESCIMO") padrao = a.valorReferencia.minus(padrao);
    else if (a.formaAplicacao !== "SUBSTITUICAO") throw new ErroPorte("Forma de aplicação da alíquota própria não tratada");
    if (padrao.isNegative() && !padrao.isZero()) throw new ErroCalculadora("AliquotaNegativa", "Alíquota aplicável resultante não pode ter valor negativo");
  } else if (a.formaAplicacao !== null) {
    throw new ErroCalculadora("AliquotaPadraoNaoEncontrada", "Alíquota padrão não encontrada");
  }
  return percentualParaFracao(padrao ?? a.valorReferencia)!;
}

export function calcularCbsIbs(
  tributo: Tributo,
  codigoUf: number | null,
  codigoMunicipio: number | null,
  item: ItemEntrada,
  tratamentoClassificacao: TratamentoClassificacaoDTO,
  impostoSeletivoCalculado: Dec,
  temTributacaoRegular: boolean,
  data: string,
  pRedutorCompraGov: Dec,
): CbsIbsSaida | null {
  const idTributo = tributo.id;
  const tt = buscarTratamentoTributario(tratamentoClassificacao.idTratamentoTributario);
  const ct: ClassificacaoTributariaCalculoDTO | null = buscarClassificacaoTributariaCalculo(tratamentoClassificacao.idClassificacaoTributaria);
  if (!ct) {
    throw new ErroCalculadora(
      "ClassificacaoTributariaNaoEncontrada",
      `Classificação tributária não encontrada para id ${tratamentoClassificacao.idClassificacaoTributaria}`,
    );
  }
  const situacao = consultarSituacaoTributariaPorCodigo(item.cst, idTributo, data);

  const cst = temTributacaoRegular ? item.tributacaoRegular!.cst : null;
  const cClassTrib = temTributacaoRegular ? item.tributacaoRegular!.cClassTrib : null;

  if (tt.inPossuiAjuste) {
    throw new ErroCalculadora(
      "ErroFaltaImplementacao",
      `A classificação tributária ${ct.codigo} ainda não possui tratamento tributário implementado na Calculadora. Essa funcionalidade está prevista no roadmap e será disponibilizada em versão futura.`,
    );
  }
  if (tt.inPossuiMonofasia) {
    // Toda monofasia da versão portada tem "ajuste" e cai no erro acima. Se um dia não cair, o porte precisa crescer.
    throw new ErroPorte(`Monofasia (cClassTrib ${ct.codigo}) ainda não está no porte`);
  }

  const baseCalculoInformada = item.baseCalculo;
  const quantidade = item.quantidade;
  const impostoSeletivoInformado = item.impostoSeletivo ? valorImpostoSeletivoInformado(item.impostoSeletivo) : null;

  let valorPercentualReducao: Dec | null = null;
  if (tt.inPossuiPercentualReducao) {
    const p = buscarPercentualReducao(ct.id, idTributo, data);
    if (p === null) {
      throw new ErroCalculadora(
        "PercentualReducaoNaoEncontrado",
        `Percentual de redução não encontrado para classificação tributária com id ${ct.id} e data ${data}`,
      );
    }
    valorPercentualReducao = percentualParaFracao(p);
  }

  // ajuste para 510001 (igual ao Java): trata como alíquota "Padrão"
  const tipoAliquota = ct.codigo === "510001" ? "Padrão" : ct.tipoAliquota;
  const aliquotaInformada = aliquotaNominal(tributo, item);

  let valorAliquota: Dec | null = null;
  let aliquotaInformadaAplicada = false;
  let aliquotaDivididaPorCem = false;
  switch (tipoAliquota) {
    case "Padrão":
      if (aliquotaInformada !== null) {
        valorAliquota = percentualParaFracao(aliquotaInformada);
        aliquotaInformadaAplicada = true;
      } else {
        valorAliquota = buscarAliquotaPadraoOuReferencia(idTributo, codigoUf, codigoMunicipio, data);
      }
      aliquotaDivididaPorCem = true;
      break;
    case "Uniforme nacional (referência)":
      if (aliquotaInformada !== null) {
        valorAliquota = percentualParaFracao(aliquotaInformada);
        aliquotaInformadaAplicada = true;
      } else {
        const r = buscarAliquotaReferencia(idTributo, data);
        if (r === null) {
          throw new ErroCalculadora("AliquotaReferenciaNaoEncontrada", `Alíquota de referência não encontrada para o tributo com id ${idTributo} e data ${data}`);
        }
        valorAliquota = percentualParaFracao(r);
      }
      aliquotaDivididaPorCem = true;
      break;
    case "Uniforme setorial":
      if (aliquotaInformada !== null) {
        valorAliquota = percentualParaFracao(aliquotaInformada);
        aliquotaInformadaAplicada = true;
      } else {
        let a = buscarAliquotaAdValoremServico(item.nbs, idTributo, ct.id, data);
        if (a === null) {
          a = buscarAliquotaAdValoremPorClassificacaoTributaria(idTributo, ct.id, data);
          if (a === null) throw new ErroCalculadora("ErroGenericoValidacao", `Alíquota uniforme setorial não encontrada em ${data}`);
        }
        valorAliquota = percentualParaFracao(a);
      }
      aliquotaDivididaPorCem = true;
      break;
    case "Fixa":
      if (aliquotaInformada !== null) {
        valorAliquota = percentualParaFracao(aliquotaInformada);
        aliquotaInformadaAplicada = true;
      } else {
        const a = buscarAliquotaAdValoremPorClassificacaoTributaria(idTributo, ct.id, data);
        if (a === null) throw new ErroCalculadora("ErroGenericoValidacao", `Alíquota fixa não encontrada em ${data}`);
        valorAliquota = percentualParaFracao(a);
      }
      aliquotaDivididaPorCem = true;
      break;
    case "Sem alíquota":
      if (aliquotaInformada !== null) {
        valorAliquota = percentualParaFracao(aliquotaInformada);
        aliquotaInformadaAplicada = true;
        aliquotaDivididaPorCem = true;
      } else {
        valorAliquota = ZERO;
      }
      break;
    case "Alíquotas Combinadas (Ad Valorem e Ad Rem)":
      // "para fazer" no Java: segue sem alíquota
      break;
    default:
      throw new ErroCalculadora("TipoAliquotaDesconhecido", `Tipo de alíquota (${tipoAliquota}) desconhecido para cClassTrib ${cClassTrib} e CST ${cst}`);
  }

  const comuns = {
    percentualReducao: valorPercentualReducao,
    aliquotaPadraoOuReferencia: null,
    aliquotaReferencia: null,
    aliquotaAdValorem: null,
    aliquotaAdRem: null,
    ajuste: null,
    redutor: null,
  };

  let resultadoAliquota: Dec | null = null;
  if (aliquotaInformadaAplicada && !expressaoUsaAliquota(tt.expressaoAliquota)) {
    // a alíquota informada prevalece sobre uma expressão fixa, como "0"
    resultadoAliquota = valorAliquota;
  } else if (preenchida(tt.expressaoAliquota)) {
    resultadoAliquota = avaliar(tt.expressaoAliquota, variaveis({ ...comuns, aliquota: valorAliquota, quantidade }));
  }
  if (aliquotaDivididaPorCem) resultadoAliquota = publicarAliquota(resultadoAliquota);

  let resultadoAliquotaEfetiva: Dec | null = null;
  if (preenchida(tt.expressaoAliquotaEfetiva)) {
    resultadoAliquotaEfetiva = avaliar(
      tt.expressaoAliquotaEfetiva,
      variaveis({ ...comuns, quantidade, aliquota: resultadoAliquota, pRedutorCompraGov }),
    );
    if (aliquotaDivididaPorCem) resultadoAliquotaEfetiva = publicarAliquota(resultadoAliquotaEfetiva);
  }

  const contexto = {
    ...comuns,
    quantidade,
    aliquota: resultadoAliquota,
    aliquotaEfetiva: resultadoAliquotaEfetiva,
    impostoSeletivoInformado,
    baseCalculoInformada,
    impostoSeletivoCalculado,
  };
  if (!preenchida(tt.expressaoBaseCalculo)) throw new ErroPorte("Expressão da base de cálculo vazia");
  let resultadoBaseCalculo = arredondarValorFiscal(avaliar(tt.expressaoBaseCalculo, variaveis(contexto)));
  if (resultadoBaseCalculo.isNegative() && !resultadoBaseCalculo.isZero()) resultadoBaseCalculo = ZERO;

  if (!preenchida(tt.expressaoTributoCalculado)) throw new ErroPorte("Expressão do tributo calculado vazia");
  const tributoCalculadoExato = avaliar(tt.expressaoTributoCalculado, variaveis({ ...contexto, baseCalculo: resultadoBaseCalculo }));
  const resultadoTributoCalculado = arredondarValorFiscal(tributoCalculadoExato);

  let resultadoTributoDevido: Dec | null = null;
  if (preenchida(tt.expressaoTributoDevido)) {
    resultadoTributoDevido = arredondarValorFiscal(
      avaliar(tt.expressaoTributoDevido, variaveis({ ...contexto, baseCalculo: resultadoBaseCalculo, tributoCalculado: resultadoTributoCalculado })),
    );
  }

  let resultadoPercentualDiferimento: Dec | null = null;
  let resultadoValorDiferimento: Dec | null = null;
  if (preenchida(tt.expressaoPercentualDiferimento) && preenchida(tt.expressaoValorDiferimento)) {
    const base5 = {
      ...comuns,
      tributoCalculado: resultadoTributoCalculado,
      quantidade,
      baseCalculo: resultadoBaseCalculo,
      aliquota: resultadoAliquota,
      aliquotaEfetiva: resultadoAliquotaEfetiva,
      baseCalculoInformada,
      impostoSeletivoInformado,
      impostoSeletivoCalculado,
    };
    resultadoPercentualDiferimento = publicarAliquota(avaliar(tt.expressaoPercentualDiferimento, variaveis(base5)));
    // o vDif recebe o tributo calculado EXATO e é arredondado uma única vez
    resultadoValorDiferimento = arredondarValorFiscal(
      avaliar(
        tt.expressaoValorDiferimento,
        variaveis({ ...base5, percentualDiferimento: resultadoPercentualDiferimento, tributoCalculado: tributoCalculadoExato }),
      ),
    );
    resultadoTributoDevido = resultadoTributoCalculado.minus(resultadoValorDiferimento);
    if (resultadoTributoDevido.isNegative() && !resultadoTributoDevido.isZero()) resultadoTributoDevido = ZERO;
  }

  if (!situacao) throw new ErroPorte('Cannot invoke "SituacaoTributaria.getInGrupoIbsCbs()" because "situacaoTributaria" is null');
  if (!situacao.inGrupoIbsCbs) return null;

  return {
    grupoReducao: !ct.inGrupoReducao || temTributacaoRegular ? null : obterGrupoReducao(ct, resultadoAliquotaEfetiva, valorPercentualReducao, aliquotaDivididaPorCem),
    tributacaoRegular: temTributacaoRegular
      ? obterGrupoDesoneracao(cst, cClassTrib, resultadoBaseCalculo, resultadoAliquota, valorPercentualReducao ?? ZERO, aliquotaDivididaPorCem, tt.inPossuiPercentualReducao)
      : null,
    grupoDiferimento:
      resultadoValorDiferimento !== null && resultadoPercentualDiferimento !== null
        ? { vDif: resultadoValorDiferimento, pDif: fracaoParaPercentual(resultadoPercentualDiferimento)! }
        : null,
    tributoCalculado: temTributacaoRegular ? ZERO : resultadoTributoCalculado,
    tributoDevido: temTributacaoRegular ? ZERO : resultadoTributoDevido,
    aliquota: temTributacaoRegular ? ZERO : aliquotaDivididaPorCem && resultadoAliquota !== null ? fracaoParaPercentual(resultadoAliquota) : resultadoAliquota,
    baseCalculo: resultadoBaseCalculo,
    quantidade,
  };
}

function obterGrupoReducao(
  ct: ClassificacaoTributariaCalculoDTO,
  aliquotaEfetiva: Dec | null,
  percentualReducao: Dec | null,
  aliquotaDivididaPorCem: boolean,
): ReducaoAliquota | null {
  if (percentualReducao === null || aliquotaEfetiva === null || !ct.inGrupoReducao) return null;
  return {
    pRedAliq: fracaoParaPercentual(percentualReducao),
    pAliqEfet: aliquotaDivididaPorCem ? fracaoParaPercentual(aliquotaEfetiva) : aliquotaEfetiva,
  };
}

function obterGrupoDesoneracao(
  cst: string | null,
  cClassTrib: string | null,
  baseCalculo: Dec,
  aliquota: Dec | null,
  percentualReducao: Dec,
  aliquotaDivididaPorCem: boolean,
  possuiPercentualReducao: boolean,
): TributacaoRegularSaida {
  let aliquotaEfetiva = aliquota;
  if (possuiPercentualReducao) aliquotaEfetiva = multiplicar(aliquota, UM.minus(percentualReducao));
  if (aliquotaDivididaPorCem) aliquotaEfetiva = publicarAliquota(aliquotaEfetiva);
  if (aliquotaEfetiva === null) throw new ErroPorte("Alíquota nula na tributação regular");
  const tributoDevido = arredondarValorFiscal(baseCalculo.times(aliquotaEfetiva));
  return {
    cst,
    cClassTrib,
    baseCalculo,
    aliquotaEfetiva: aliquotaDivididaPorCem ? fracaoParaPercentual(aliquotaEfetiva)! : aliquotaEfetiva,
    tributoDevido,
  };
}
