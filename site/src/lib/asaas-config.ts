/**
 * Nomes das variáveis do Asaas, iguais aos que o Mateus cadastrou na Vercel (27/11/2026).
 * Regras puras (recebem o env), para poder testar sem rede. Só no SERVIDOR.
 *
 * Na Vercel existem as duas chaves e os dois tokens, e ASAAS_ENVIROMENT escolhe qual par vale:
 *
 * | ASAAS_ENVIROMENT          | chave da API usada      | token do webhook usado       | endereço da API       |
 * |---------------------------|-------------------------|------------------------------|-----------------------|
 * | vazio ou "sandbox"        | ASAAS_API_KEY_SANDBOX   | Token_Autenticacao_Sandbox   | api-sandbox.asaas.com |
 * | "producao" / "production" | ASAAS_API_KEY           | Token_Autenticacao           | api.asaas.com         |
 *
 * Atenção: "ENVIROMENT" está escrito assim (sem o N do meio) de propósito, igual à Vercel.
 * Se um dia o nome for corrigido lá, corrija aqui também.
 *
 * Suposição: Token_Autenticacao(_Sandbox) é o "Token de autenticação" do webhook no painel do
 * Asaas, que chega no cabeçalho "asaas-access-token".
 *
 * Valor desconhecido em ASAAS_ENVIROMENT cai para sandbox: nunca cobra de verdade por engano.
 */

export type Env = Record<string, string | undefined>;
export type AmbienteAsaas = "sandbox" | "producao";

const PRODUCAO = new Set(["producao", "produção", "production", "prod"]);

export function ambienteAsaas(env: Env = process.env): AmbienteAsaas {
  const valor = env.ASAAS_ENVIROMENT?.trim().toLowerCase() ?? "";
  return PRODUCAO.has(valor) ? "producao" : "sandbox";
}

/** Chave da API do ambiente escolhido (vazia se não cadastrada). */
export function chaveAsaas(env: Env = process.env): string {
  const chave = ambienteAsaas(env) === "producao" ? env.ASAAS_API_KEY : env.ASAAS_API_KEY_SANDBOX;
  return chave?.trim() ?? "";
}

/** Token que o Asaas manda no webhook, do ambiente escolhido (vazio se não cadastrado). */
export function tokenWebhookAsaas(env: Env = process.env): string {
  const token = ambienteAsaas(env) === "producao" ? env.Token_Autenticacao : env.Token_Autenticacao_Sandbox;
  return token?.trim() ?? "";
}
