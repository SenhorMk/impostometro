/**
 * Validações de negócio de um item e preparação do cálculo.
 *
 * Porte de `domain/service/ProcessamentoItemService.java` (sem o tipo de
 * documento `tpDoc` e sem os componentes da base, que estão fora do porte) e
 * dos serviços pequenos que ele usa (NcmAplicavelService, NbsAplicavelService,
 * SituacaoTributariaService, ClassificacaoTributariaService...).
 */
import { type Dec, UM, ZERO } from "./decimal.ts";
import type { ItemEntrada, OperacaoEntrada } from "./entrada.ts";
import { textoJava } from "./decimal.ts";
import { ErroCalculadora } from "./erros.ts";
import { type AliquotaImpostoSeletivo, type Tributos, type TratamentoClassificacaoModel, calcularTributos } from "./calculo-tributo.ts";
import {
  type ClassificacaoTributariaDTO,
  buscarAliquotaAdRem,
  buscarAliquotaAdValoremProduto,
  buscarAliquotaAdValoremServico,
  buscarClassificacaoTributaria,
  buscarTratamentoClassificacao,
  consultarSituacaoTributariaPorCodigo,
  consultarUfPorSigla,
  existeCst,
  existeNbs,
  existeNbsAdValorem,
  existeNcm,
  existeNcmAdValorem,
  nbsAplicavel,
  ncmAplicavel,
} from "./tabelas.ts";

const ANO_LIMITE_ALIQUOTAS_NOMINAIS = 2027;
const vazio = (s: string | null) => s === null || s.trim() === "";
const naoBranco = (s: string | null) => s !== null && s.trim() !== "";
const ano = (data: string) => Number(data.slice(0, 4));

function validarCst(cst: string | null, idTributo: number, data: string) {
  if (!existeCst(cst, idTributo, data)) {
    const tributo = idTributo === 1 ? "Imposto Seletivo" : "CBS e IBS";
    throw new ErroCalculadora("SituacaoTributariaNaoEncontrada", `Situação tributária (CST) não encontrada para código ${cst} e data ${data} (${tributo})`);
  }
}

function classificacao(codigo: string | null, idTributo: number, data: string): ClassificacaoTributariaDTO {
  const tipo = idTributo === 1 ? "Imposto Seletivo" : "CBS e IBS";
  const c = buscarClassificacaoTributaria(codigo, idTributo, data);
  if (!c) throw new ErroCalculadora("ClassificacaoTributariaNaoEncontrada", `Classificação tributária não encontrada para código ${codigo} e data ${data} (${tipo})`);
  return c;
}

function tratamento(idClassificacaoTributaria: number, data: string) {
  const t = buscarTratamentoClassificacao(idClassificacaoTributaria, data);
  if (!t) {
    throw new ErroCalculadora(
      "TratamentoClassificacaoNaoEncontrado",
      `Tratamento tributário não encontrado para classificação tributária com id ${idClassificacaoTributaria} e data ${data}`,
    );
  }
  return t;
}

/** NcmAplicavelService.validarNcmAplicavel / NbsAplicavelService.validarNbsAplicavel */
function validarAplicavel(tipo: "NCM" | "NBS", codigo: string | null, ct: ClassificacaoTributariaDTO, data: string) {
  const ap = tipo === "NCM" ? ncmAplicavel : nbsAplicavel;
  const completo = (codigo?.length ?? 0) === (tipo === "NCM" ? 8 : 9);
  const temAnexo = ap.tem(ct.id, data);
  if (temAnexo && !completo) {
    throw new ErroCalculadora(tipo === "NCM" ? "NcmCompletoNaoInformado" : "NbsCompletoNaoInformado", `${tipo} completo não informado`);
  }
  if (completo && temAnexo) {
    const naoVinculada = () =>
      new ErroCalculadora(
        tipo === "NCM" ? "NcmNaoVinculada" : "NbsNaoVinculada",
        `${tipo} de código ${codigo} não vinculada à Classificação Tributária de código ${ct.codigo} (CBS e IBS)`,
      );
    if (!ap.temAplicavel(codigo!, ct.id, data)) throw naoVinculada();
    if (ap.temExcecao(codigo!, ct.id, data) && !ap.temSemExcecao(codigo!, ct.id, data)) throw naoVinculada();
  }
}

function validarClassificacaoCbsIbs(ct: ClassificacaoTributariaDTO, cst: string | null, ncm: string | null, nbs: string | null) {
  if (vazio(ncm) && vazio(nbs)) return; // "sob demanda da plataforma"
  if (ct.cst !== cst) {
    throw new ErroCalculadora(
      "ClassificacaoTributariaNaoVinculadaSituacaoTributaria",
      `Classificação tributária (cClassTrib) de código ${ct.codigo} não está vinculada à situação tributária (CST) de código ${cst} (CBS e IBS)`,
    );
  }
}

function nomenclatura(ncm: string | null, nbs: string | null) {
  return naoBranco(ncm) ? { tipo: "NCM", codigo: ncm } : { tipo: "NBS", codigo: nbs };
}

function existeIncidenciaImpostoSeletivo(ncm: string | null, nbs: string | null, data: string): boolean {
  if (naoBranco(ncm) && ncm!.length === 8) return existeNcmAdValorem(ncm!, 1, data) || buscarAliquotaAdRem(ncm!, 1, data) !== null;
  if (naoBranco(nbs) && nbs!.length === 9) return existeNbsAdValorem(nbs!, 1, data);
  return false;
}

function analisarAliquotaImpostoSeletivo(item: ItemEntrada, data: string): AliquotaImpostoSeletivo | null {
  const { ncm, nbs } = item;
  // alíquotas do IS informadas só valem se o grupo impostoSeletivo veio
  const informadas = item.impostoSeletivo ? (item.aliquotasNominais?.impostoSeletivo ?? null) : null;
  if (informadas?.adRem != null && vazio(item.impostoSeletivo!.unidade)) {
    throw new ErroCalculadora(
      "ErroGenericoValidacao",
      "A unidade de medida do Imposto Seletivo deve ser informada quando a alíquota ad rem é informada pelo usuário",
    );
  }
  let adValorem: Dec | null = informadas?.adValorem ?? null;
  let adRem: Dec | null = informadas?.adRem ?? null;
  let unidade = adRem !== null ? item.impostoSeletivo!.unidade : null;

  if (naoBranco(ncm) && ncm!.length === 8) {
    if (adValorem === null) {
      const banco = buscarAliquotaAdValoremProduto(ncm!, 1, data);
      if (banco) adValorem = banco.valor;
    }
    if (adRem === null) {
      const banco = buscarAliquotaAdRem(ncm!, 1, data);
      if (banco) {
        adRem = banco.valor;
        unidade = banco.unidadeMedida;
      }
    }
  } else if (naoBranco(nbs) && nbs!.length === 9) {
    if (adValorem === null) adValorem = buscarAliquotaAdValoremServico(nbs, 1, null, data);
  }
  if (adValorem !== null || adRem !== null) return { aliquotaAdValorem: adValorem, aliquotaAdRem: adRem, unidadeMedida: unidade };
  return null;
}

function validarQuantidadeEUnidade(item: ItemEntrada, aliquota: AliquotaImpostoSeletivo) {
  const is = item.impostoSeletivo;
  if (aliquota.aliquotaAdRem !== null && is) {
    if (is.quantidade === null) throw new ErroCalculadora("ErroGenericoValidacao", "A quantidade do Imposto Seletivo deve ser informada para alíquota ad rem");
    if (is.quantidade.lessThanOrEqualTo(0)) {
      throw new ErroCalculadora("ErroGenericoValidacao", "A quantidade do Imposto Seletivo deve ser maior do que zero para alíquota ad rem");
    }
    if (is.unidade === null) throw new ErroCalculadora("ErroGenericoValidacao", "A unidade de medida do Imposto Seletivo deve ser informada para alíquota ad rem");
  }
  if (item.quantidade !== null && item.quantidade.lessThanOrEqualTo(0)) {
    throw new ErroCalculadora("ErroGenericoValidacao", "A quantidade do item deve ser maior do que zero");
  }
}

function obterTratamentoClassificacao(item: ItemEntrada, data: string): TratamentoClassificacaoModel {
  const { ncm, nbs } = item;
  let ctCbsIbs = classificacao(item.cClassTrib, 2, data);
  validarClassificacaoCbsIbs(ctCbsIbs, item.cst, ncm, nbs);
  let tcCbsIbs = tratamento(ctCbsIbs.id, data);
  let tcDesoneracao = null;
  let temDesoneracao = false;

  if (tcCbsIbs.inExigeGrupoDesoneracao) {
    if (!item.tributacaoRegular) {
      throw new ErroCalculadora("TributacaoRegularNaoInformada", `Dados da tributação regular devem ser informados para cClassTrib ${item.cClassTrib} e CST ${item.cst}`);
    }
    const cst = item.tributacaoRegular.cst;
    const cClassTrib = item.tributacaoRegular.cClassTrib;
    tcDesoneracao = tcCbsIbs;
    ctCbsIbs = classificacao(cClassTrib, 2, data);
    validarClassificacaoCbsIbs(ctCbsIbs, cst, ncm, nbs);
    tcCbsIbs = tratamento(ctCbsIbs.id, data);
    if (tcCbsIbs.inIncompativelComSuspensao) {
      throw new ErroCalculadora("IncompatibilidadeSuspensao", `Classificação tributária (cClassTrib) ${cClassTrib} e situação tributária (CST) ${cst} incompatíveis com suspensão`);
    }
    temDesoneracao = true;
  }

  // NCM/NBS contra o anexo da classificação (sem tpDoc)
  if (vazio(ncm) && vazio(nbs)) {
    validarAplicavel("NCM", ncm, ctCbsIbs, data);
    validarAplicavel("NBS", nbs, ctCbsIbs, data);
  }
  if (!vazio(ncm) && vazio(nbs)) validarAplicavel("NCM", ncm, ctCbsIbs, data);
  if (!vazio(nbs) && vazio(ncm)) validarAplicavel("NBS", nbs, ctCbsIbs, data);

  let ctIs: ClassificacaoTributariaDTO | null = null;
  if (item.impostoSeletivo) {
    validarCst(item.impostoSeletivo.cst, 1, data);
    ctIs = classificacao(item.impostoSeletivo.cClassTrib, 1, data);
    if (ctIs.cst !== item.impostoSeletivo.cst) {
      throw new ErroCalculadora(
        "ClassificacaoTributariaNaoVinculadaSituacaoTributaria",
        `Classificação tributária (cClassTrib) de código ${ctIs.codigo} não está vinculada à situação tributária (CST) de código ${item.impostoSeletivo.cst} (Imposto Seletivo)`,
      );
    }
  }

  const aliquotaIs = analisarAliquotaImpostoSeletivo(item, data);
  const n = nomenclatura(ncm, nbs);

  // A partir de 2027 o IS incide se existe o registro de alíquota, mesmo sem valor em lei
  if (aliquotaIs === null && ano(data) >= ANO_LIMITE_ALIQUOTAS_NOMINAIS && existeIncidenciaImpostoSeletivo(ncm, nbs, data)) {
    if (!item.impostoSeletivo) {
      throw new ErroCalculadora("ImpostoSeletivoNaoInformado", `Dados do Imposto Seletivo devem ser informados para ${n.tipo} ${n.codigo} e data ${data}`);
    }
    throw new ErroCalculadora(
      "AliquotaImpostoSeletivoNaoInformada",
      `A alíquota do Imposto Seletivo deve ser informada em aliquotasNominais.impostoSeletivo para ${n.tipo} ${n.codigo} e data ${data}, pois ainda não foi definida em lei`,
    );
  }

  let tcIs = null;
  if (aliquotaIs !== null) {
    if (!item.impostoSeletivo) {
      throw new ErroCalculadora("ImpostoSeletivoNaoInformado", `Dados do Imposto Seletivo devem ser informados para ${n.tipo} ${n.codigo} e data ${data}`);
    }
    validarQuantidadeEUnidade(item, aliquotaIs);
    tcIs = tratamento(ctIs!.id, data);
  }

  return {
    tratamentoClassificacaoCbsIbs: tcCbsIbs,
    tratamentoClassificacaoImpostoSeletivo: tcIs,
    tratamentoClassificacaoCbsIbsDesoneracao: tcDesoneracao,
    aliquotaImpostoSeletivo: aliquotaIs,
    temDesoneracao,
  };
}

function validarBaseCalculoLegado(item: ItemEntrada) {
  const is = item.impostoSeletivo;
  if (!is) {
    if (item.baseCalculo === null) {
      throw new ErroCalculadora("BaseCalculoNaoInformada", "A base de cálculo de CBS e IBS deve ser informada quando o grupo do Imposto Seletivo não é informado");
    }
    return;
  }
  if (is.baseCalculo === null) {
    throw new ErroCalculadora("ErroGenericoValidacao", "A base de cálculo do Imposto Seletivo deve ser informada quando o grupo de Imposto Seletivo é informado");
  }
  if (item.baseCalculo === null) {
    item.baseCalculo = is.baseCalculo.plus(is.impostoInformado ?? ZERO);
    return;
  }
  if (is.impostoInformado !== null) {
    if (!item.baseCalculo.equals(is.baseCalculo.plus(is.impostoInformado))) {
      throw new ErroCalculadora(
        "BaseCalculoInconsistente",
        `A base de cálculo de CBS e IBS informada ${textoJava(item.baseCalculo)} difere da soma da base de cálculo do Imposto Seletivo ${textoJava(is.baseCalculo)} com o Imposto Seletivo informado ${textoJava(is.impostoInformado)}`,
      );
    }
  } else if (item.baseCalculo.lessThan(is.baseCalculo)) {
    throw new ErroCalculadora(
      "BaseCalculoMenorBaseCalculoImpostoSeletivo",
      `A base de cálculo de CBS e IBS informada ${textoJava(item.baseCalculo)} é menor que a base de cálculo do Imposto Seletivo ${textoJava(is.baseCalculo)}`,
    );
  }
}

function validarNcmNbs(ncm: string | null, nbs: string | null, data: string) {
  if (!vazio(ncm) && !vazio(nbs)) throw new ErroCalculadora("NcmNbsSimultaneas", "Não é permitido informar NCM e NBS simultaneamente para um item");
  if (!vazio(ncm) && !existeNcm(ncm!, data)) throw new ErroCalculadora("NcmNaoEncontrada", `NCM de código ${ncm} não encontrada para a data ${data}`);
  if (!vazio(nbs) && !existeNbs(nbs!, data)) throw new ErroCalculadora("NbsNaoEncontrada", `NBS de código ${nbs} não encontrada para a data ${data}`);
}

function validarAliquotasNominais(item: ItemEntrada, data: string) {
  const an = item.aliquotasNominais;
  if (ano(data) < ANO_LIMITE_ALIQUOTAS_NOMINAIS) {
    const informou =
      !!an && (an.cbs !== null || an.ibsEstadual !== null || an.ibsMunicipal !== null || (!!an.impostoSeletivo && (an.impostoSeletivo.adValorem !== null || an.impostoSeletivo.adRem !== null)));
    if (informou) {
      throw new ErroCalculadora(
        "AliquotasNominaisInformadasIndevidamente",
        "As alíquotas nominais não podem ser informadas para operações com fato gerador anterior a 01/01/2027, pois a calculadora resolve as alíquotas vigentes",
      );
    }
    return;
  }
  const situacao = consultarSituacaoTributariaPorCodigo(item.cst, 2, data);
  if (!situacao || !situacao.inGrupoIbsCbs) return;
  if (!an || an.cbs === null || an.ibsEstadual === null || an.ibsMunicipal === null) {
    throw new ErroCalculadora(
      "AliquotasNominaisNaoInformadas",
      "As alíquotas nominais (os três campos cbs, ibsEstadual e ibsMunicipal) devem ser informadas para operações com fato gerador a partir de 01/01/2027",
    );
  }
}

export function processarItem(op: OperacaoEntrada, item: ItemEntrada, data: string): Tributos {
  if (item.quantidade === null) {
    item.quantidade = UM;
    item.quantidadeTexto = "1";
  }
  if (item.unidade === null) item.unidade = "UN";

  validarBaseCalculoLegado(item);
  validarNcmNbs(item.ncm, item.nbs, data);
  validarCst(item.cst, 2, data);
  validarAliquotasNominais(item, data);

  const tratamentoClassificacao = obterTratamentoClassificacao(item, data);
  const codigoUf = consultarUfPorSigla(op.uf);
  if (codigoUf === null) throw new ErroCalculadora("UfNaoEncontrada", `UF de sigla ${op.uf} não encontrada`);

  return calcularTributos({
    data,
    codigoMunicipio: op.municipio!,
    codigoUf,
    item,
    tratamentoClassificacao,
    pRedutor: ZERO, // compra governamental está fora do porte
  });
}
