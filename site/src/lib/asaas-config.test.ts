/** Nomes das variáveis do Asaas iguais aos da Vercel (asaas-config.ts). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ambienteAsaas, chaveAsaas, tokenWebhookAsaas } from "./asaas-config.ts";

const TUDO = {
  ASAAS_API_KEY: "chave-producao",
  ASAAS_API_KEY_SANDBOX: "chave-sandbox",
  Token_Autenticacao: "token-producao",
  Token_Autenticacao_Sandbox: "token-sandbox",
};

test("sem ASAAS_ENVIROMENT: sandbox, com a chave e o token do sandbox", () => {
  assert.equal(ambienteAsaas(TUDO), "sandbox");
  assert.equal(chaveAsaas(TUDO), "chave-sandbox");
  assert.equal(tokenWebhookAsaas(TUDO), "token-sandbox");
});

test("ASAAS_ENVIROMENT de produção (várias grafias): chave e token de produção", () => {
  for (const v of ["producao", "PRODUCAO", " produção ", "production", "prod"]) {
    const env = { ...TUDO, ASAAS_ENVIROMENT: v };
    assert.equal(ambienteAsaas(env), "producao", v);
    assert.equal(chaveAsaas(env), "chave-producao");
    assert.equal(tokenWebhookAsaas(env), "token-producao");
  }
});

test("valor desconhecido cai para sandbox (nunca cobra de verdade por engano)", () => {
  for (const v of ["sandbox", "teste", "homologacao", ""]) assert.equal(ambienteAsaas({ ASAAS_ENVIROMENT: v }), "sandbox");
});

test("nunca usa a chave de um ambiente no outro", () => {
  assert.equal(chaveAsaas({ ASAAS_API_KEY: "chave-producao" }), "");
  assert.equal(chaveAsaas({ ASAAS_API_KEY_SANDBOX: "chave-sandbox", ASAAS_ENVIROMENT: "producao" }), "");
  assert.equal(tokenWebhookAsaas({ Token_Autenticacao: "token-producao" }), "");
});
