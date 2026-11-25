/**
 * Configurações do site num lugar só.
 * SUPOSIÇÕES (decisões do T04, ainda do Mateus): nome, preço e limites do plano.
 */
export const SITE = {
  // Nome provisório. "Impostômetro" já é marca conhecida da Associação Comercial de SP,
  // então não usamos esse nome no site. Trocar quando o T04 decidir.
  nome: "Calcula Reforma",
  descricao:
    "Descubra em 2 minutos quanto sua empresa vai pagar de CBS e IBS em 2027. Grátis, sem cadastro e com a conta aberta, usando a calculadora oficial da Receita Federal.",
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
