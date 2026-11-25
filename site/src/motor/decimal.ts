/**
 * Números com casas decimais exatas, do mesmo jeito que o Java (BigDecimal) faz.
 *
 * Porte de `shared/util/ArredondamentoUtils.java` da calculadora da Receita.
 *
 * Por que não usar o `number` do JavaScript? Porque ele erra centavos:
 * 0.1 + 0.2 dá 0.30000000000000004. A Receita faz a conta com BigDecimal,
 * que é exato. Aqui usamos a biblioteca decimal.js configurada para se
 * comportar igual:
 *  - soma, subtração e multiplicação são EXATAS (precisão enorme);
 *  - a divisão guarda 34 dígitos significativos (MathContext(34, HALF_EVEN));
 *  - todo arredondamento é "meio para o par" (HALF_EVEN), como na Receita.
 */
import Decimal from "decimal.js";

/** Decimal "exato": precisão grande o bastante para nunca arredondar soma e multiplicação. */
export const D = Decimal.clone({
  precision: 1000,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -1000,
  toExpPos: 1000,
});
export type Dec = InstanceType<typeof D>;

/** Contexto da divisão da Receita: 34 dígitos significativos, HALF_EVEN. */
const D34 = Decimal.clone({ precision: 34, rounding: Decimal.ROUND_HALF_EVEN, toExpNeg: -1000, toExpPos: 1000 });

const MODO = Decimal.ROUND_HALF_EVEN;
const ESCALA_VALOR_FISCAL = 2;
const ESCALA_ALIQUOTA_MIN = 2;
const ESCALA_ALIQUOTA_MAX = 4;
const ESCALA_QUANTIDADE = 4;

export const ZERO: Dec = new D(0);
export const UM: Dec = new D(1);

/** Converte texto ou número para Decimal. `null`/`undefined` continuam nulos. */
export function dec(v: string | number | Dec | null | undefined): Dec | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return new D(String(v));
  return new D(v);
}

export function multiplicar(a: Dec | null, b: Dec | null): Dec | null {
  return a === null || b === null ? null : a.times(b);
}

export function dividir(dividendo: Dec | null, divisor: Dec | null): Dec | null {
  if (dividendo === null || divisor === null) return null;
  return new D(D34.div(dividendo, divisor));
}

/** 8.8 (%) → 0.088. Equivale a `movePointLeft(2)`, que é exato. */
export function percentualParaFracao(p: Dec | null): Dec | null {
  return p === null ? null : p.div(100);
}

/** 0.088 → 8.8 (%). Equivale a `movePointRight(2)`. */
export function fracaoParaPercentual(f: Dec | null): Dec | null {
  return f === null ? null : f.times(100);
}

/** Valor em reais publicado: 2 casas, HALF_EVEN. */
export function arredondarValorFiscal(v: Dec): Dec;
export function arredondarValorFiscal(v: Dec | null): Dec | null;
export function arredondarValorFiscal(v: Dec | null): Dec | null {
  return v === null ? null : v.toDecimalPlaces(ESCALA_VALOR_FISCAL, MODO);
}

/** Alíquota publicada: 4 casas, HALF_EVEN. */
export function arredondarAliquotaPublicada(v: Dec): Dec;
export function arredondarAliquotaPublicada(v: Dec | null): Dec | null;
export function arredondarAliquotaPublicada(v: Dec | null): Dec | null {
  return v === null ? null : v.toDecimalPlaces(ESCALA_ALIQUOTA_MAX, MODO);
}

/** O Java não tem "-0"; o decimal.js tem. Normalizamos para não aparecer "-0.00". */
function semMenosZero(v: Dec): Dec {
  return v.isZero() ? ZERO : v;
}

// ─── Formatação da resposta (os "serializers" da Receita) ────────────────────

/** TDec1302: "1200.00". */
export function formatarMoeda(v: Dec): string {
  return semMenosZero(v).toFixed(ESCALA_VALOR_FISCAL, MODO);
}

/** TDec0302_04: de 2 a 4 casas, sem zeros sobrando ("8.80", "0.05", "3.5200" → "3.52"). */
export function formatarAliquota(v: Dec): string {
  const arredondado = semMenosZero(v.toDecimalPlaces(ESCALA_ALIQUOTA_MAX, MODO));
  const casas = Math.max(arredondado.decimalPlaces(), ESCALA_ALIQUOTA_MIN);
  return arredondado.toFixed(casas);
}

/** TDec1104OpRTC: inteiro sem casas ("12"), senão 4 casas. */
export function formatarQuantidade(v: Dec): string {
  if (v.isInteger()) return semMenosZero(v).toFixed(0);
  return semMenosZero(v).toFixed(ESCALA_QUANTIDADE, MODO);
}

// ─── Formatação da memória de cálculo (DecimalFormat pt-BR) ─────────────────

function formatoBrasileiro(v: Dec, minCasas: number, maxCasas: number): string {
  const arredondado = semMenosZero(v.toDecimalPlaces(maxCasas, MODO));
  const casas = Math.max(arredondado.decimalPlaces(), minCasas);
  const [inteiro, fracao] = arredondado.abs().toFixed(casas).split(".");
  const comPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${arredondado.isNegative() ? "-" : ""}${comPontos}${fracao ? `,${fracao}` : ""}`;
}

/** DecimalFormat("#,##0.00"): "1.200,00". Nulo vira "0,00". */
export function moedaBR(v: Dec | null): string {
  return formatoBrasileiro(v ?? ZERO, 2, 2);
}

/** DecimalFormat("#,##0.00##"): "8,80", "0,05", "3,5225". Nulo vira "0,00". */
export function percentualBR(v: Dec | null): string {
  return formatoBrasileiro(v ?? ZERO, 2, 4);
}

/** `BigDecimal.toString()` para os casos simples que aparecem nas mensagens. */
export function textoJava(v: Dec | null): string {
  return v === null ? "null" : v.toString();
}
