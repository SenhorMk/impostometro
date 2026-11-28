/** Regras das contas (T13) e da empresa (T15) que não dependem do banco. */

/** Versão dos termos e da privacidade que a pessoa aceita ao criar a conta. Mudou o texto? Mude aqui. */
export const VERSAO_TERMOS = "2026-11-28";

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

export const REGIMES = [
  { valor: "regular", nome: "Lucro Real ou Presumido (regime regular)" },
  { valor: "simples", nome: "Simples Nacional" },
  { valor: "mei", nome: "MEI" },
] as const;
export type Regime = (typeof REGIMES)[number]["valor"];

export type Empresa = {
  uf: string;
  municipio: number;
  regime: Regime;
  cnpj: string | null;
  razao_social: string | null;
};

/** Confere os dígitos verificadores do CNPJ (só números, 14 dígitos). */
export function cnpjValido(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, "");
  if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return false;
  const digito = (base: string) => {
    let soma = 0;
    let peso = base.length - 7;
    for (const c of base) {
      soma += Number(c) * peso--;
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return digito(d.slice(0, 12)) === Number(d[12]) && digito(d.slice(0, 13)) === Number(d[13]);
}

/** Confere e limpa o formulário da empresa. Devolve a mensagem de erro ou a empresa pronta para salvar. */
export function validarEmpresa(f: { uf: string; municipio: number; regime: string; cnpj: string; razaoSocial: string }): string | Empresa {
  if (!/^[A-Z]{2}$/.test(f.uf)) return "Escolha o estado.";
  if (!Number.isInteger(f.municipio) || f.municipio < 1000000 || f.municipio > 9999999) return "Escolha a cidade.";
  if (!REGIMES.some((r) => r.valor === f.regime)) return "Escolha o regime da empresa.";
  const cnpj = f.cnpj.replace(/\D/g, "");
  if (cnpj && !cnpjValido(cnpj)) return "Esse CNPJ não é válido. Confira os números ou deixe em branco.";
  const razao = f.razaoSocial.trim().slice(0, 150);
  return { uf: f.uf, municipio: f.municipio, regime: f.regime as Regime, cnpj: cnpj || null, razao_social: razao || null };
}

/** Confere os dígitos verificadores do CPF (só números, 11 dígitos). */
export function cpfValido(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

/** CPF ou CNPJ de quem paga a assinatura (o Asaas exige um dos dois). Devolve só os números, ou null. */
export function documentoPagador(texto: string): string | null {
  const d = texto.replace(/\D/g, "");
  if (d.length === 11) return cpfValido(d) ? d : null;
  if (d.length === 14) return cnpjValido(d) ? d : null;
  return null;
}
