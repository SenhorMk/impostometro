import { test } from "node:test";
import assert from "node:assert/strict";
import { aplicarEvento, hojeBrasil, precoCentavos, somarMes, temAcesso } from "./assinatura.ts";

test("somarMes não pula o fim do mês", () => {
  assert.equal(somarMes("2027-01-31"), "2027-02-28");
  assert.equal(somarMes("2027-12-15"), "2028-01-15");
  assert.equal(somarMes("2028-01-31"), "2028-02-29");
});

test("pagamento confirmado ativa até vencimento + 1 mês + 3 dias", () => {
  const a = aplicarEvento({ status: "pendente", valido_ate: null }, "PAYMENT_CONFIRMED", { dueDate: "2027-01-10" });
  assert.deepEqual(a, { status: "ativa", valido_ate: "2027-02-13" });
  assert.equal(temAcesso(a, "2027-02-13"), true);
  assert.equal(temAcesso(a, "2027-02-14"), false);
});

test("atraso muda o status, mas mantém o que já foi pago", () => {
  const a = aplicarEvento({ status: "ativa", valido_ate: "2027-02-13" }, "PAYMENT_OVERDUE");
  assert.deepEqual(a, { status: "atrasada", valido_ate: "2027-02-13" });
  assert.equal(temAcesso(a, "2027-02-11"), true);
});

test("cancelar vale até o fim do mês pago; estorno corta na hora", () => {
  const c = aplicarEvento({ status: "ativa", valido_ate: "2027-02-13" }, "SUBSCRIPTION_DELETED")!;
  assert.equal(c.status, "cancelada");
  assert.equal(temAcesso(c, "2027-02-01"), true);
  assert.equal(aplicarEvento(c, "PAYMENT_OVERDUE"), null);
  const e = aplicarEvento({ status: "ativa", valido_ate: "2027-02-13" }, "PAYMENT_REFUNDED");
  assert.equal(temAcesso(e, "2027-02-01"), false);
});

test("aviso repetido ou antigo não encurta o acesso", () => {
  const a = aplicarEvento({ status: "ativa", valido_ate: "2027-03-13" }, "PAYMENT_RECEIVED", { dueDate: "2027-01-10" });
  assert.equal(a!.valido_ate, "2027-03-13");
});

test("pendente não tem acesso; eventos desconhecidos não mudam nada", () => {
  assert.equal(temAcesso({ status: "pendente", valido_ate: "2099-01-01" }), false);
  assert.equal(aplicarEvento({ status: "ativa", valido_ate: null }, "PAYMENT_CHECKOUT_VIEWED"), null);
});

test("preço: R$ 29 por padrão; variável só aceita a partir de R$ 1", () => {
  assert.equal(precoCentavos({}), 2900);
  assert.equal(precoCentavos({ ASSINATURA_PRECO_CENTAVOS: "100" }), 100);
  assert.equal(precoCentavos({ ASSINATURA_PRECO_CENTAVOS: "5" }), 2900);
  assert.equal(hojeBrasil(new Date("2027-01-01T02:00:00Z")), "2026-12-31");
});
