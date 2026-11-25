const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const emReais = (v: number) => reais.format(v);
export const emPercentual = (v: number) => `${pct.format(v)}%`;

/** "1.234,56" ou "1234,56" ou "1234.56" -> 1234.56 */
export function lerValor(texto: string): number {
  const limpo = texto.replace(/[^\d,.-]/g, "");
  if (limpo.includes(",")) return Number(limpo.replace(/\./g, "").replace(",", "."));
  return Number(limpo);
}

export function dataBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
