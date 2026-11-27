/**
 * Quem pode usar o quê (T37). Regras puras, sem banco nem Asaas, para poder testar.
 * Quem aplica é o SERVIDOR (src/lib/acesso.ts); a tela só mostra o que o servidor decidiu.
 *
 * Matriz completa em docs/acesso.md. Resumo:
 *  - Simulação de uma venda (/api/calcular): sempre grátis, para todos, em qualquer modo.
 *  - Importar notas (/api/calcular-lote) depende do MODO_ACESSO:
 *      "previa"     → aberta a todos, com limite pequeno (LIMITE_NOTAS_PREVIA por vez);
 *      "assinatura" → só assinante com pagamento em dia; precisa da cobrança configurada;
 *      "fechado"    → ninguém importa; a calculadora grátis segue no ar.
 *  - Sem MODO_ACESSO: "assinatura" se a cobrança estiver configurada, senão "fechado".
 *    Ou seja: segredo faltando NUNCA abre a importação. A prévia só existe se alguém escrever
 *    MODO_ACESSO=previa na Vercel.
 */
import { temAcesso, type Assinatura } from "./assinatura.ts";

export type ModoAcesso = "previa" | "assinatura" | "fechado";

/** O que a pessoa pode fazer na importação agora. */
export type Situacao = "liberado" | "previa" | "entrar" | "assinar" | "indisponivel";

/** Suposição: 20 notas por vez bastam para testar com um dia de vendas. Ajustável aqui. */
export const LIMITE_NOTAS_PREVIA = 20;
/** Assinante: o mesmo limite que o importador já tinha (500 notas por lote). */
export const LIMITE_NOTAS_ASSINANTE = 500;

export type Env = Record<string, string | undefined>;

export type Modo = {
  modo: ModoAcesso;
  /** Asaas + banco com chave secreta prontos: dá para criar e cancelar assinaturas. */
  cobrancaConfigurada: boolean;
  /** Aviso para o log do servidor (nunca para a tela) quando a configuração está estranha. */
  aviso?: string;
};

export function cobrancaConfigurada(env: Env): boolean {
  return Boolean(env.ASAAS_API_KEY && env.SUPABASE_URL && env.SUPABASE_SECRET_KEY);
}

export function modoDeAcesso(env: Env = process.env): Modo {
  const configurada = cobrancaConfigurada(env);
  const pedido = env.MODO_ACESSO?.trim().toLowerCase() || "";
  if (pedido === "previa" || pedido === "prévia") return { modo: "previa", cobrancaConfigurada: configurada };
  if (pedido === "fechado") return { modo: "fechado", cobrancaConfigurada: configurada };
  if (pedido === "assinatura" || pedido === "") {
    if (configurada) return { modo: "assinatura", cobrancaConfigurada: true };
    return {
      modo: "fechado",
      cobrancaConfigurada: false,
      aviso: "importação fechada: a cobrança não está configurada (faltam ASAAS_API_KEY, SUPABASE_URL ou SUPABASE_SECRET_KEY)",
    };
  }
  return { modo: "fechado", cobrancaConfigurada: configurada, aviso: `MODO_ACESSO desconhecido ("${pedido}"); importação fechada` };
}

/** Só no modo "assinatura" o site oferece o botão de assinar. */
export function vendeAssinatura(m: Modo): boolean {
  return m.modo === "assinatura";
}

export type Decisao = {
  situacao: Situacao;
  /** Quantas notas por lote a pessoa pode mandar. 0 = nenhuma. */
  limiteNotas: number;
  /** Código HTTP da resposta quando a importação for negada (200 = pode seguir). */
  status: 200 | 401 | 402 | 503;
  /** Texto para a pessoa, sem termos técnicos. */
  mensagem: string;
  proximoPasso: { texto: string; href: string } | null;
};

/**
 * `assinatura`: a linha da pessoa no banco, null se não tem, ou "erro" se não deu para ler.
 * Quem chama só procura a assinatura quando a pessoa está logada.
 */
export function decidirImportacao(
  modo: ModoAcesso,
  pessoa: { logado: boolean; assinatura: Assinatura | null | "erro" },
  hoje?: string,
): Decisao {
  const assinante = pessoa.logado && pessoa.assinatura !== "erro" && temAcesso(pessoa.assinatura, hoje);

  if (modo === "fechado")
    return {
      situacao: "indisponivel",
      limiteNotas: 0,
      status: 503,
      mensagem: "A importação de notas está fechada no momento. A simulação de uma venda continua grátis.",
      proximoPasso: { texto: "Simular uma venda", href: "/" },
    };

  if (modo === "previa") {
    // Quem já paga não perde nada se o site voltar para a prévia.
    if (assinante) return liberado();
    return {
      situacao: "previa",
      limiteNotas: LIMITE_NOTAS_PREVIA,
      status: 200,
      mensagem: `Prévia gratuita: até ${LIMITE_NOTAS_PREVIA} notas por vez, enquanto a assinatura não abre.`,
      proximoPasso: null,
    };
  }

  if (!pessoa.logado)
    return {
      situacao: "entrar",
      limiteNotas: 0,
      status: 401,
      mensagem: "Entre na sua conta para importar notas.",
      proximoPasso: { texto: "Entrar", href: "/entrar" },
    };
  if (pessoa.assinatura === "erro")
    return {
      situacao: "indisponivel",
      limiteNotas: 0,
      status: 503,
      mensagem: "Não conseguimos conferir a sua assinatura agora. Tente de novo em alguns minutos.",
      proximoPasso: null,
    };
  if (!assinante)
    return {
      situacao: "assinar",
      limiteNotas: 0,
      status: 402,
      mensagem: "Importar notas é para assinantes. A simulação de uma venda continua grátis.",
      proximoPasso: { texto: "Assinar na minha conta", href: "/conta" },
    };
  return liberado();
}

function liberado(): Decisao {
  return { situacao: "liberado", limiteNotas: LIMITE_NOTAS_ASSINANTE, status: 200, mensagem: "", proximoPasso: null };
}
