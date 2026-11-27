/**
 * Configurações do site num lugar só.
 * SUPOSIÇÕES (decisões do T04, ainda do Mateus): nome, preço e limites do plano.
 */
export const SITE = {
  // Nome provisório. "Impostômetro" já é marca conhecida da Associação Comercial de SP,
  // então não usamos esse nome no site. Trocar quando o T04 decidir.
  nome: "Calcula Reforma",
  contatoUrl: "https://github.com/SenhorMk/impostometro/issues/new",
  descricao:
    "Simule a CBS e o IBS de uma venda em 2027 no regime regular. Grátis, sem cadastro, com alíquotas, fontes e premissas para conferir.",
};

export const PLANOS = {
  gratis: {
    nome: "Grátis",
    preco: "R$ 0",
    itens: ["Simulações ilimitadas, uma venda por vez", "Conta aberta em cada resultado", "Sem cadastro"],
  },
  assinante: {
    nome: "Assinante",
    preco: "R$ 29", // SUPOSIÇÃO: preço a definir no T04
    periodo: "/mês",
    itens: [
      "Importa o XML das notas do mês de uma vez",
      "Total de CBS e IBS do mês, nota por nota",
      "Histórico para comparar meses",
      "Relatório para mandar ao contador",
    ],
  },
};
