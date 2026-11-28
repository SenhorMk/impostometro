/**
 * LGPD (T40 e T41): o inventário dos dados pessoais que o site trata, num lugar só.
 *
 * A página /privacidade, o arquivo "Baixar meus dados" e o registro das operações
 * (docs/lgpd.md) leem daqui, para os três nunca dizerem coisas diferentes.
 * Mudou um fluxo de dados (tabela nova, serviço novo, prazo novo)? Mude aqui, em
 * docs/lgpd.md e suba VERSAO_TERMOS em contas.ts (quem tem conta aceita de novo).
 *
 * Só funções puras e constantes (testadas em privacidade.test.ts).
 */

/** Por que a LGPD permite tratar o dado (art. 7º da Lei 13.709/2018). */
export type BaseLegal = "contrato" | "obrigacao-legal" | "legitimo-interesse" | "exercicio-direitos";

export const BASES_LEGAIS: Record<BaseLegal, string> = {
  contrato: "Execução do contrato que você aceita ao criar a conta (art. 7º, V)",
  "obrigacao-legal": "Cumprimento de obrigação legal (art. 7º, II)",
  "legitimo-interesse": "Legítimo interesse, com o mínimo de dados (art. 7º, IX e art. 10)",
  "exercicio-direitos": "Exercício regular de direitos, inclusive em processo (art. 7º, VI)",
};

export type Tratamento = {
  id: string;
  /** o que é, em linguagem simples */
  nome: string;
  dados: string;
  finalidade: string;
  base: BaseLegal;
  /** quanto tempo fica guardado */
  retencao: string;
  /** onde fica e quem trata por nós (operadores) */
  onde: string;
  /** só existe para quem tem conta */
  conta: boolean;
};

/** Prazo de inatividade para apagar a conta sozinha (T42). Igual ao SQL 20261128120000_lgpd.sql. */
export const MESES_INATIVIDADE = 24;

export const TRATAMENTOS: Tratamento[] = [
  {
    id: "simulacao",
    nome: "Simulação grátis",
    dados: "Atividade, valor e cidade da venda. Nenhum nome, e-mail, CPF ou CNPJ.",
    finalidade: "Fazer a conta da CBS e do IBS.",
    base: "legitimo-interesse",
    retencao: "Não é guardada. Estado e cidade ficam só no seu navegador, para a próxima simulação.",
    onde: "Servidor do site na Vercel, em São Paulo.",
    conta: false,
  },
  {
    id: "buscas",
    nome: "Buscas sem resultado",
    dados: "O termo digitado na busca, a versão da tabela e a data. Sem IP, conta ou cookie.",
    finalidade: "Melhorar o dicionário de atividades.",
    base: "legitimo-interesse",
    retencao: "30 dias, com limpeza diária automática.",
    onde: "Banco de dados no Supabase, em São Paulo.",
    conta: false,
  },
  {
    id: "funil",
    nome: "Contagem de uso",
    dados: "Só o total do dia (por exemplo, 37 simulações em 10/01). Sem IP, cookie ou identificador.",
    finalidade: "Saber em que etapa as pessoas desistem.",
    base: "legitimo-interesse",
    retencao: "Totais por dia, sem prazo, porque não identificam ninguém.",
    onde: "Banco de dados no Supabase, em São Paulo.",
    conta: false,
  },
  {
    id: "acesso",
    nome: "Registros técnicos de acesso",
    dados: "Endereço IP, data, página pedida e navegador, gravados automaticamente pela hospedagem.",
    finalidade: "Segurança: limitar abusos (até 1 minuto na memória) e investigar falhas e ataques.",
    base: "legitimo-interesse",
    retencao: "Pelo prazo curto definido pela Vercel e pelo Supabase para os registros do plano usado.",
    onde: "Vercel e Supabase.",
    conta: false,
  },
  {
    id: "erros",
    nome: "Erros técnicos",
    dados: "Mensagem de erro e página. Configurado sem IP, cookies, cabeçalhos ou valores digitados.",
    finalidade: "Encontrar e corrigir falhas.",
    base: "legitimo-interesse",
    retencao: "Pelo prazo do plano do Sentry (serviço de monitoramento).",
    onde: "Sentry, fora do Brasil (só quando o monitoramento estiver ligado).",
    conta: false,
  },
  {
    id: "conta",
    nome: "Conta",
    dados: "E-mail, data de criação e do último acesso, forma de entrar (link por e-mail ou Google).",
    finalidade: "Entrar sem senha e mostrar o que é seu.",
    base: "contrato",
    retencao: `Até você apagar a conta. Contas sem nenhum acesso há ${MESES_INATIVIDADE} meses e sem assinatura ativa são apagadas sozinhas.`,
    onde: "Supabase, em São Paulo. O e-mail com o link de acesso passa pelo provedor de e-mail configurado no Supabase.",
    conta: true,
  },
  {
    id: "aceites",
    nome: "Aceite dos termos e da privacidade",
    dados: "Versão dos documentos aceita e data de cada aceite.",
    finalidade: "Provar o que foi combinado com você e quando.",
    base: "contrato",
    retencao: "Até você apagar a conta.",
    onde: "Supabase, em São Paulo.",
    conta: true,
  },
  {
    id: "empresa",
    nome: "Dados da empresa",
    dados: "Estado, cidade e regime. CNPJ e razão social só se você quiser informar.",
    finalidade: "Preencher a cidade e o regime nos cálculos.",
    base: "contrato",
    retencao: "Até você apagar ou mudar os dados ou a conta.",
    onde: "Supabase, em São Paulo.",
    conta: true,
  },
  {
    id: "historico",
    nome: "Histórico de cálculos",
    dados:
      "Resultado de cada cálculo feito com a conta aberta. Nas notas: data, número, cidade e produtos (NCM, descrição e valores). Nome, CPF/CNPJ e endereço do cliente final são descartados no seu navegador antes de qualquer envio.",
    finalidade: "Você reabrir e comparar cálculos depois.",
    base: "contrato",
    retencao: "Até você apagar o cálculo (a qualquer momento) ou a conta.",
    onde: "Supabase, em São Paulo. Os arquivos XML nunca saem do seu computador.",
    conta: true,
  },
  {
    id: "assinatura",
    nome: "Assinatura",
    dados:
      "No site: códigos da assinatura no Asaas, situação, valor e validade. No Asaas: nome, CPF ou CNPJ e e-mail de quem paga. Dados de cartão ficam só no Asaas.",
    finalidade: "Cobrar a assinatura e liberar o acesso de assinante.",
    base: "contrato",
    retencao:
      "No site, até apagar a conta. No Asaas, pelo prazo que a lei exige para registros de pagamento e fiscais (em geral 5 anos), mesmo depois de cancelar.",
    onde: "Supabase (São Paulo) e Asaas (instituição de pagamento brasileira).",
    conta: true,
  },
  {
    id: "atendimento",
    nome: "Atendimento",
    dados: "O que você escrever para o e-mail de contato.",
    finalidade: "Responder dúvidas e pedidos, inclusive os pedidos sobre seus dados.",
    base: "exercicio-direitos",
    retencao: "Até 5 anos depois do último contato, para comprovar que o pedido foi atendido.",
    onde: "Caixa de e-mail do atendimento.",
    conta: false,
  },
];

/** Direitos do titular (art. 18) e como exercer cada um no site. */
export const DIREITOS: { direito: string; como: string }[] = [
  { direito: "Saber se tratamos dados seus e acessá-los", como: "Minha conta → Baixar meus dados, ou pelo e-mail de contato." },
  { direito: "Corrigir dados incompletos ou errados", como: "Minha conta → Dados da empresa. Para trocar o e-mail, escreva para o contato." },
  { direito: "Levar seus dados para outro serviço (portabilidade)", como: "Minha conta → Baixar meus dados (arquivo JSON, formato aberto)." },
  { direito: "Apagar seus dados", como: "Apague um cálculo no histórico ou a conta inteira em Minha conta. Os dados somem na hora." },
  { direito: "Saber com quem compartilhamos", como: "Nesta página, na coluna “Onde fica”." },
  { direito: "Se opor a um tratamento ou pedir revisão", como: "Escreva para o e-mail de contato explicando o pedido." },
  { direito: "Reclamar à ANPD", como: "Autoridade Nacional de Proteção de Dados, em gov.br/anpd." },
];

/** Prazo que nos damos para responder pedidos sobre dados (art. 19, II: até 15 dias). */
export const PRAZO_RESPOSTA_DIAS = 15;

// ----------------------------------------------------------------------------------------
// "Baixar meus dados" (T41)

export type DadosDaConta = {
  usuario: {
    id: string;
    email: string | null;
    criado_em: string | null;
    ultimo_acesso_em: string | null;
    formas_de_entrar: string[];
  };
  perfil: Record<string, unknown> | null;
  aceites: Record<string, unknown>[];
  empresa: Record<string, unknown> | null;
  assinatura: Record<string, unknown> | null;
  calculos: Record<string, unknown>[];
  /** o que está guardado só neste navegador */
  navegador: Record<string, string | null>;
};

/**
 * Monta o arquivo de "Baixar meus dados": os dados da conta, com a explicação de cada
 * parte e o que fica com terceiros (que o site não consegue ler, como o cadastro no Asaas).
 */
export function montarExportacao(d: DadosDaConta, geradoEm: Date, versaoTermos: string) {
  return {
    sobre: {
      o_que_e: "Cópia de todos os dados pessoais guardados na sua conta, em formato aberto (JSON).",
      gerado_em: geradoEm.toISOString(),
      versao_da_politica: versaoTermos,
      lei: "Lei 13.709/2018 (LGPD), art. 18, II e V",
      fora_deste_arquivo:
        "Nome, CPF ou CNPJ e e-mail de quem paga ficam no Asaas, que não deixa o site ler esses dados de volta. Registros técnicos de acesso (IP) ficam na Vercel e no Supabase por pouco tempo. Para recebê-los, escreva para o contato.",
    },
    tratamentos: TRATAMENTOS.filter((t) => t.conta).map((t) => ({
      nome: t.nome,
      finalidade: t.finalidade,
      base_legal: BASES_LEGAIS[t.base],
      retencao: t.retencao,
      onde: t.onde,
    })),
    conta: d.usuario,
    aceites_dos_termos: d.aceites.length ? d.aceites : d.perfil ? [d.perfil] : [],
    empresa: d.empresa,
    assinatura: d.assinatura,
    historico_de_calculos: d.calculos,
    guardado_neste_navegador: d.navegador,
  };
}

/** Nome do arquivo baixado, com a data (ex.: meus-dados-2026-11-28.json). */
export function nomeArquivoExportacao(data: Date): string {
  return `meus-dados-${data.toISOString().slice(0, 10)}.json`;
}
