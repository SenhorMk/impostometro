/**
 * O pedido de cálculo (o JSON que entra) e a validação dos campos.
 *
 * Porte de `api/model/input/OperacaoInput.java`, `ItemOperacaoInput.java`,
 * `ImpostoSeletivoInput.java`, `TributacaoRegularInput.java`,
 * `AliquotasNominaisInput.java` e `AliquotasNominaisImpostoSeletivo.java`,
 * incluindo as anotações de validação (@NotNull, @Size, @Digits...) com as
 * mesmas mensagens padrão (em inglês) que o Hibernate Validator usa no Java.
 */
import { type Dec, dec, textoJava } from "./decimal.ts";
import { ErroCalculadora, ForaDoPorte } from "./erros.ts";

export type ImpostoSeletivoEntrada = {
  cst: string | null;
  cClassTrib: string | null;
  baseCalculo: Dec | null;
  quantidade: Dec | null;
  quantidadeTexto: string | null;
  unidade: string | null;
  impostoInformado: Dec | null;
};

export type ItemEntrada = {
  numero: number | null;
  ncm: string | null;
  nbs: string | null;
  cst: string | null;
  cClassTrib: string | null;
  baseCalculo: Dec | null;
  quantidade: Dec | null;
  /** Texto original da quantidade, para a memória de cálculo (o Java usa BigDecimal.toString()). */
  quantidadeTexto: string | null;
  unidade: string | null;
  impostoSeletivo: ImpostoSeletivoEntrada | null;
  tributacaoRegular: { cst: string | null; cClassTrib: string | null } | null;
  aliquotasNominais: {
    cbs: Dec | null;
    ibsEstadual: Dec | null;
    ibsMunicipal: Dec | null;
    impostoSeletivo: { adValorem: Dec | null; adRem: Dec | null } | null;
  } | null;
};

export type OperacaoEntrada = {
  id: string | null;
  versao: string | null;
  dhFatoGerador: string | null;
  dataHoraEmissao: string | null;
  municipio: number | null;
  uf: string | null;
  itens: ItemEntrada[] | null;
};

type Json = Record<string, unknown>;
const obj = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);
const texto = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const decimalOuNulo = (v: unknown): Dec | null => (v === null || v === undefined || v === "" ? null : dec(v as string | number));
const inteiro = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

/** IS informado (ou zero), como `getValorImpostoSeletivoInformado()`. */
export function valorImpostoSeletivoInformado(is: ImpostoSeletivoEntrada): Dec {
  return is.impostoInformado ?? dec(0)!;
}

/** Lê o JSON do pedido. Campos que o porte ainda não cobre fazem o pedido ser recusado. */
export function lerOperacao(json: unknown): OperacaoEntrada {
  const o = obj(json) ?? {};
  if (o.gCompraGov != null) throw new ForaDoPorte("Compra governamental (gCompraGov) ainda não está no porte.");
  if (o.tpDoc != null) throw new ForaDoPorte("Tipo de documento (tpDoc) ainda não está no porte.");
  const itens = Array.isArray(o.itens) ? o.itens.map(lerItem) : null;
  return {
    id: texto(o.id),
    versao: texto(o.versao),
    dhFatoGerador: texto(o.dhFatoGerador),
    dataHoraEmissao: texto(o.dataHoraEmissao),
    municipio: inteiro(o.municipio),
    uf: texto(o.uf),
    itens,
  };
}

function lerItem(json: unknown): ItemEntrada {
  const i = obj(json) ?? {};
  if (i.gComponentesBC != null) throw new ForaDoPorte("Componentes da base de cálculo (gComponentesBC) ainda não estão no porte.");
  const is = obj(i.impostoSeletivo);
  const tr = obj(i.tributacaoRegular);
  const an = obj(i.aliquotasNominais);
  const anIs = an ? obj(an.impostoSeletivo) : null;
  return {
    numero: inteiro(i.numero),
    ncm: texto(i.ncm),
    nbs: texto(i.nbs),
    cst: texto(i.cst),
    cClassTrib: texto(i.cClassTrib),
    baseCalculo: decimalOuNulo(i.baseCalculo),
    quantidade: decimalOuNulo(i.quantidade),
    quantidadeTexto: i.quantidade == null ? null : String(i.quantidade),
    unidade: texto(i.unidade),
    impostoSeletivo: is
      ? {
          cst: texto(is.cst),
          cClassTrib: texto(is.cClassTrib),
          baseCalculo: decimalOuNulo(is.baseCalculo),
          quantidade: decimalOuNulo(is.quantidade),
          quantidadeTexto: is.quantidade == null ? null : String(is.quantidade),
          unidade: texto(is.unidade),
          impostoInformado: decimalOuNulo(is.impostoInformado),
        }
      : null,
    tributacaoRegular: tr ? { cst: texto(tr.cst), cClassTrib: texto(tr.cClassTrib) } : null,
    aliquotasNominais: an
      ? {
          cbs: decimalOuNulo(an.cbs),
          ibsEstadual: decimalOuNulo(an.ibsEstadual),
          ibsMunicipal: decimalOuNulo(an.ibsMunicipal),
          impostoSeletivo: anIs ? { adValorem: decimalOuNulo(anIs.adValorem), adRem: decimalOuNulo(anIs.adRem) } : null,
        }
      : null,
  };
}

/** Data do fato gerador (getFatoGeradorAplicavel): a data local do horário informado. */
export function dataFatoGerador(op: OperacaoEntrada): string {
  const dh = op.dhFatoGerador ?? op.dataHoraEmissao;
  if (!dh) throw new ErroCalculadora("DataFatoGeradorNaoInformada", "A data do fato gerador não foi informada.");
  return dh.slice(0, 10);
}

// ─── Validação de campos (Bean Validation) ──────────────────────────────────

export type Violacao = { anotacao: string; campo: string; mensagem: string; valor: unknown };

function digitos(v: Dec) {
  const casas = Math.max(v.decimalPlaces(), 0);
  const inteiros = v.abs().truncated().isZero() ? 0 : v.abs().truncated().toFixed(0).length;
  return { inteiros, casas };
}

class Validador {
  readonly violacoes: Violacao[] = [];
  private add(anotacao: string, campo: string, mensagem: string, valor: unknown) {
    this.violacoes.push({ anotacao, campo, mensagem, valor });
  }
  notNull(campo: string, v: unknown) {
    if (v === null || v === undefined) this.add("NotNull", campo, "must not be null", null);
  }
  size(campo: string, v: string | null, min: number, max: number) {
    if (v !== null && (v.length < min || v.length > max)) this.add("Size", campo, `size must be between ${min} and ${max}`, v);
  }
  soDigitos(campo: string, v: string | null) {
    if (v !== null && !/^\d+$/.test(v)) this.add("Pattern", campo, "Informar somente dígitos", v);
  }
  min(campo: string, v: number | null, min: number) {
    if (v !== null && v < min) this.add("Min", campo, `must be greater than or equal to ${min}`, v);
  }
  max(campo: string, v: number | null, max: number) {
    if (v !== null && v > max) this.add("Max", campo, `must be less than or equal to ${max}`, v);
  }
  positivoOuZero(campo: string, v: Dec | null) {
    if (v !== null && v.isNegative() && !v.isZero()) this.add("PositiveOrZero", campo, "must be greater than or equal to 0", textoJava(v));
  }
  digits(campo: string, v: Dec | null, inteiros: number, casas: number) {
    if (v === null) return;
    const d = digitos(v);
    if (d.inteiros > inteiros || d.casas > casas) {
      this.add("Digits", campo, `numeric value out of bounds (<${inteiros} digits>.<${casas} digits> expected)`, textoJava(v));
    }
  }
  decimalMax(campo: string, v: Dec | null, max: string) {
    if (v !== null && v.greaterThan(max)) this.add("DecimalMax", campo, `must be less than or equal to ${max}`, textoJava(v));
  }
  decimalMin(campo: string, v: Dec | null, min: string) {
    if (v !== null && v.lessThan(min)) this.add("DecimalMin", campo, `must be greater than or equal to ${min}`, textoJava(v));
  }
  cstEClassificacao(prefixo: string, cst: string | null, cClassTrib: string | null) {
    this.notNull(`${prefixo}cst`, cst);
    this.soDigitos(`${prefixo}cst`, cst);
    this.size(`${prefixo}cst`, cst, 3, 3);
    this.notNull(`${prefixo}cClassTrib`, cClassTrib);
    this.soDigitos(`${prefixo}cClassTrib`, cClassTrib);
    this.size(`${prefixo}cClassTrib`, cClassTrib, 6, 6);
  }
}

/** Campos da operação (OperacaoInput), menos os itens, que são validados um a um. */
export function validarOperacao(op: OperacaoEntrada): Violacao[] {
  const v = new Validador();
  v.notNull("id", op.id);
  v.notNull("versao", op.versao);
  v.notNull("municipio", op.municipio);
  v.min("municipio", op.municipio, 0);
  v.max("municipio", op.municipio, 9999999);
  v.size("uf", op.uf, 2, 2);
  if (!op.itens || op.itens.length === 0) v.violacoes.push({ anotacao: "NotEmpty", campo: "itens", mensagem: "must not be empty", valor: Array.isArray(op.itens) ? "[]" : null }); // List.toString() do Java
  return v.violacoes;
}

/** Campos de um item (ItemOperacaoInput e grupos dentro dele). */
export function validarItem(item: ItemEntrada): Violacao[] {
  const v = new Validador();
  v.notNull("numero", item.numero);
  v.min("numero", item.numero, 1);
  v.max("numero", item.numero, 9999999);
  v.cstEClassificacao("", item.cst, item.cClassTrib);
  v.positivoOuZero("baseCalculo", item.baseCalculo);
  v.digits("baseCalculo", item.baseCalculo, 13, 2);
  v.digits("quantidade", item.quantidade, 11, 4);
  const is = item.impostoSeletivo;
  if (is) {
    v.cstEClassificacao("impostoSeletivo.", is.cst, is.cClassTrib);
    v.notNull("impostoSeletivo.baseCalculo", is.baseCalculo);
    v.positivoOuZero("impostoSeletivo.baseCalculo", is.baseCalculo);
    v.digits("impostoSeletivo.baseCalculo", is.baseCalculo, 13, 2);
    v.positivoOuZero("impostoSeletivo.quantidade", is.quantidade);
    v.digits("impostoSeletivo.quantidade", is.quantidade, 11, 4);
    v.positivoOuZero("impostoSeletivo.impostoInformado", is.impostoInformado);
    v.digits("impostoSeletivo.impostoInformado", is.impostoInformado, 13, 2);
  }
  if (item.tributacaoRegular) v.cstEClassificacao("tributacaoRegular.", item.tributacaoRegular.cst, item.tributacaoRegular.cClassTrib);
  const an = item.aliquotasNominais;
  if (an) {
    for (const campo of ["cbs", "ibsEstadual", "ibsMunicipal"] as const) {
      v.positivoOuZero(`aliquotasNominais.${campo}`, an[campo]);
      v.digits(`aliquotasNominais.${campo}`, an[campo], 3, 4);
      v.decimalMax(`aliquotasNominais.${campo}`, an[campo], "100.00");
    }
    if (an.impostoSeletivo) {
      v.positivoOuZero("aliquotasNominais.impostoSeletivo.adValorem", an.impostoSeletivo.adValorem);
      v.digits("aliquotasNominais.impostoSeletivo.adValorem", an.impostoSeletivo.adValorem, 3, 4);
      v.decimalMax("aliquotasNominais.impostoSeletivo.adValorem", an.impostoSeletivo.adValorem, "100.00");
      v.decimalMin("aliquotasNominais.impostoSeletivo.adRem", an.impostoSeletivo.adRem, "0.00");
    }
  }
  return v.violacoes;
}

/** Texto do erro de validação, igual ao `buildValidationDetail` do Java. */
export function detalheValidacao(viol: Violacao): string {
  if (viol.valor !== null && viol.valor !== undefined) return `Campo '${viol.campo}' ${viol.mensagem}, recebido: '${viol.valor}'`;
  return `Campo '${viol.campo}' ${viol.mensagem}`;
}
