/**
 * Junta o Imposto Seletivo, a CBS e o IBS de um item e monta o grupo de saída.
 *
 * Porte de `domain/service/calculotributo/CalculoTributoService.java` e
 * `CalculoImpostoSeletivoService.java`.
 */
import {
  type Dec,
  ZERO,
  arredondarAliquotaPublicada,
  arredondarValorFiscal,
  fracaoParaPercentual,
  percentualParaFracao,
} from "./decimal.ts";
import { type CbsIbsSaida, CBS, IBS_ESTADUAL, IBS_MUNICIPAL, type Diferimento, type ReducaoAliquota, calcularCbsIbs } from "./calculo-cbs-ibs.ts";
import type { ItemEntrada } from "./entrada.ts";
import { valorImpostoSeletivoInformado } from "./entrada.ts";
import { ErroPorte } from "./erros.ts";
import { avaliar } from "./expressao.ts";
import { gerarMemoriaCalculoCbsIbs, gerarMemoriaCalculoImpostoSeletivo } from "./memoria.ts";
import { type TratamentoClassificacaoDTO, buscarPercentualTransferencia, buscarTratamentoTributario } from "./tabelas.ts";

// ─── Tipos de saída (os "Domain" do Java) ───────────────────────────────────

export type ImpostoSeletivo = {
  CSTIS: string | null;
  cClassTribIS: string | null;
  vBCIS: Dec | null;
  pIS: Dec | null;
  pISEspec: Dec | null;
  adRemIS: Dec | null;
  uTrib: string | null;
  qTrib: Dec | null;
  vIS: Dec | null;
  memoriaCalculo: string | null;
};
export type GrupoTributo = { aliquota: Dec | null; gDif: Diferimento | null; gRed: ReducaoAliquota | null; valor: Dec | null };
export type TributacaoRegular = {
  CSTReg: string | null;
  cClassTribReg: string | null;
  pAliqEfetRegIBSUF: Dec;
  vTribRegIBSUF: Dec;
  pAliqEfetRegIBSMun: Dec;
  vTribRegIBSMun: Dec;
  pAliqEfetRegCBS: Dec;
  vTribRegCBS: Dec;
};
export type GrupoIBSCBS = {
  vBC: Dec | null;
  gIBSUF: GrupoTributo | null;
  gIBSMun: GrupoTributo | null;
  vIBS: Dec;
  gCBS: GrupoTributo | null;
  gTribRegular: TributacaoRegular | null;
};
export type MemoriaCalculo = { cbs: string | null; ibsUF: string | null; ibsMun: string | null };
export type IBSCBS = { CST: string | null; cClassTrib: string | null; gIBSCBS: GrupoIBSCBS | null; memoriaCalculo: MemoriaCalculo | null };
export type Tributos = { IS: ImpostoSeletivo | null; IBSCBS: IBSCBS };

export type AliquotaImpostoSeletivo = { aliquotaAdValorem: Dec | null; aliquotaAdRem: Dec | null; unidadeMedida: string | null };

export type TratamentoClassificacaoModel = {
  tratamentoClassificacaoCbsIbs: TratamentoClassificacaoDTO;
  tratamentoClassificacaoImpostoSeletivo: TratamentoClassificacaoDTO | null;
  tratamentoClassificacaoCbsIbsDesoneracao: TratamentoClassificacaoDTO | null;
  aliquotaImpostoSeletivo: AliquotaImpostoSeletivo | null;
  temDesoneracao: boolean;
};

export type OperacaoModel = {
  data: string;
  codigoMunicipio: number;
  codigoUf: number;
  item: ItemEntrada;
  tratamentoClassificacao: TratamentoClassificacaoModel;
  pRedutor: Dec;
};

const CALCULO_IBS_HABILITADO = true; // application.ibs.enabled no perfil "offline"

const v = (pares: Record<string, Dec | null | undefined>) => Object.fromEntries(Object.entries(pares).map(([k, x]) => [k, x ?? ZERO]));
const preenchida = (e: string | null): e is string => e !== null && e.trim() !== "";

function calcularImpostoSeletivo(item: ItemEntrada, tc: TratamentoClassificacaoDTO, aliquota: AliquotaImpostoSeletivo): ImpostoSeletivo {
  const tt = buscarTratamentoTributario(tc.idTratamentoTributario);
  const is = item.impostoSeletivo!;
  const quantidade = is.quantidade;
  const baseCalculoInformada = is.baseCalculo;
  const impostoSeletivoInformado = valorImpostoSeletivoInformado(is);

  // alíquotas publicadas (4 casas): são elas que entram na conta
  let aliquotaAdValorem = arredondarAliquotaPublicada(aliquota.aliquotaAdValorem);
  if (aliquotaAdValorem !== null) aliquotaAdValorem = percentualParaFracao(aliquotaAdValorem);
  const aliquotaAdRem = arredondarAliquotaPublicada(aliquota.aliquotaAdRem);

  const base = {
    quantidade,
    aliquota: null,
    aliquotaEfetiva: null,
    baseCalculoInformada,
    impostoSeletivoInformado,
    impostoSeletivoCalculado: ZERO,
    percentualReducao: null,
    aliquotaPadraoOuReferencia: null,
    aliquotaReferencia: null,
    aliquotaAdValorem,
    aliquotaAdRem,
    ajuste: null,
    redutor: null,
  };
  if (!preenchida(tt.expressaoBaseCalculo) || !preenchida(tt.expressaoTributoCalculado)) throw new ErroPorte("Expressão do Imposto Seletivo vazia");
  const vBC = arredondarValorFiscal(avaliar(tt.expressaoBaseCalculo, v(base)));
  const calculado = arredondarValorFiscal(avaliar(tt.expressaoTributoCalculado, v({ ...base, baseCalculo: vBC })));
  let devido: Dec | null = null;
  if (preenchida(tt.expressaoTributoDevido)) {
    devido = arredondarValorFiscal(avaliar(tt.expressaoTributoDevido, v({ ...base, baseCalculo: vBC, tributoCalculado: calculado })));
  }
  return {
    CSTIS: is.cst,
    cClassTribIS: is.cClassTrib,
    qTrib: quantidade,
    uTrib: is.unidade,
    vIS: devido,
    pIS: fracaoParaPercentual(aliquotaAdValorem),
    pISEspec: aliquotaAdRem,
    adRemIS: aliquotaAdRem,
    vBCIS: vBC,
    memoriaCalculo: null,
  };
}

function grupo(t: CbsIbsSaida | null): GrupoTributo | null {
  if (!t) return null;
  return { aliquota: t.aliquota, gDif: t.grupoDiferimento, gRed: t.grupoReducao, valor: t.tributoDevido };
}

function tributacaoRegular(cbs: CbsIbsSaida | null, uf: CbsIbsSaida | null, mun: CbsIbsSaida | null): TributacaoRegular | null {
  let r: TributacaoRegular | null = null;
  const iniciar = (tr: NonNullable<CbsIbsSaida["tributacaoRegular"]>): TributacaoRegular => ({
    CSTReg: tr.cst,
    cClassTribReg: tr.cClassTrib,
    pAliqEfetRegIBSUF: ZERO,
    vTribRegIBSUF: ZERO,
    pAliqEfetRegIBSMun: ZERO,
    vTribRegIBSMun: ZERO,
    pAliqEfetRegCBS: ZERO,
    vTribRegCBS: ZERO,
  });
  // Mesma ordem e mesmo comportamento do Java: cada etapa só continua se a anterior existiu.
  if (cbs?.tributacaoRegular) {
    r = iniciar(cbs.tributacaoRegular);
    r.pAliqEfetRegCBS = cbs.tributacaoRegular.aliquotaEfetiva;
    r.vTribRegCBS = cbs.tributacaoRegular.tributoDevido;
  } else {
    r = null;
  }
  if (uf?.tributacaoRegular) {
    r ??= iniciar(uf.tributacaoRegular);
    r.pAliqEfetRegIBSUF = uf.tributacaoRegular.aliquotaEfetiva;
    r.vTribRegIBSUF = uf.tributacaoRegular.tributoDevido;
  } else {
    r = null;
  }
  if (mun?.tributacaoRegular) {
    r ??= iniciar(mun.tributacaoRegular);
    r.pAliqEfetRegIBSMun = mun.tributacaoRegular.aliquotaEfetiva;
    r.vTribRegIBSMun = mun.tributacaoRegular.tributoDevido;
  } else {
    r = null;
  }
  return r;
}

function grupoIBSCBS(cbs: CbsIbsSaida | null, uf: CbsIbsSaida | null, mun: CbsIbsSaida | null, data: string): GrupoIBSCBS | null {
  // CST sem gIBSCBS (ex.: imunidade): nenhum tributo foi calculado
  if (!cbs && !uf && !mun) return null;
  const vBC = mun?.baseCalculo ?? uf?.baseCalculo ?? cbs?.baseCalculo ?? null;
  // O Java consulta o percentual de transferência sempre (só é usado na compra governamental, fora do porte)
  if (buscarPercentualTransferencia(data) === null) {
    throw new ErroPorte("Percentual de transferência de CBS para ente federativo não encontrada.");
  }
  const gIBSUF = grupo(uf);
  const gIBSMun = grupo(mun);
  const vIBS = (gIBSUF?.valor ?? ZERO).plus(gIBSMun?.valor ?? ZERO);
  return { vBC, gIBSUF, gIBSMun, vIBS, gCBS: grupo(cbs), gTribRegular: tributacaoRegular(cbs, uf, mun) };
}

export function calcularTributos(op: OperacaoModel): Tributos {
  const { item, data } = op;
  const t = op.tratamentoClassificacao;
  const tcCbsIbs = t.tratamentoClassificacaoCbsIbs;
  const tcIs = t.tratamentoClassificacaoImpostoSeletivo;
  const temDesoneracao = t.temDesoneracao;
  const tcMemoria = temDesoneracao ? t.tratamentoClassificacaoCbsIbsDesoneracao! : tcCbsIbs;

  let impostoSeletivo: ImpostoSeletivo | null = null;
  if (tcIs) {
    impostoSeletivo = calcularImpostoSeletivo(item, tcIs, t.aliquotaImpostoSeletivo!);
    impostoSeletivo.memoriaCalculo = gerarMemoriaCalculoImpostoSeletivo(
      tcIs,
      impostoSeletivo.vBCIS,
      impostoSeletivo.pIS,
      impostoSeletivo.pISEspec,
      item.impostoSeletivo!.quantidadeTexto,
      item.impostoSeletivo!.unidade,
      data,
    );
  }

  const isCalculado = impostoSeletivo?.vIS ?? ZERO;
  const an = item.aliquotasNominais;
  const calcularUF = CALCULO_IBS_HABILITADO || !!item.nbs || an?.ibsEstadual != null;
  const calcularMun = CALCULO_IBS_HABILITADO || !!item.nbs || an?.ibsMunicipal != null;

  const cbs = calcularCbsIbs(CBS, null, null, item, tcCbsIbs, isCalculado, temDesoneracao, data, op.pRedutor);
  const uf = calcularUF ? calcularCbsIbs(IBS_ESTADUAL, op.codigoUf, null, item, tcCbsIbs, isCalculado, temDesoneracao, data, op.pRedutor) : null;
  const mun = calcularMun ? calcularCbsIbs(IBS_MUNICIPAL, null, op.codigoMunicipio, item, tcCbsIbs, isCalculado, temDesoneracao, data, op.pRedutor) : null;

  const base = item.baseCalculo;
  const memoriaCalculo: MemoriaCalculo = {
    cbs: gerarMemoriaCalculoCbsIbs(tcMemoria, cbs, base, item.quantidadeTexto, item.unidade, data),
    ibsUF: calcularUF ? gerarMemoriaCalculoCbsIbs(tcMemoria, uf, base, item.quantidadeTexto, item.unidade, data) : null,
    ibsMun: calcularMun ? gerarMemoriaCalculoCbsIbs(tcMemoria, mun, base, item.quantidadeTexto, item.unidade, data) : null,
  };

  return {
    IS: impostoSeletivo,
    IBSCBS: { CST: item.cst, cClassTrib: item.cClassTrib, gIBSCBS: grupoIBSCBS(cbs, uf, mun, data), memoriaCalculo },
  };
}
