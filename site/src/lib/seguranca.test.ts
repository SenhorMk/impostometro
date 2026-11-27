/**
 * Testes das proteções da revisão de segurança (nov/2026).
 *   npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { zipSync, unzipSync, strToU8 } from "fflate";
import { linkAsaasSeguro } from "./asaas.ts";
import { CorpoInvalido, dentroDoLimite, ipDoPedido, lerJson, zerarLimites } from "./limite.ts";
import { ErroZip, filtroXmlDoZip, lerNota, xmlSuspeito } from "./nfe.ts";

test("limite por minuto: bloqueia depois do máximo e libera na janela seguinte", () => {
  zerarLimites();
  const t = 1_000_000;
  for (let i = 0; i < 3; i++) assert.equal(dentroDoLimite("x", 3, 60_000, t), true);
  assert.equal(dentroDoLimite("x", 3, 60_000, t + 10), false);
  assert.equal(dentroDoLimite("outra", 3, 60_000, t + 10), true);
  assert.equal(dentroDoLimite("x", 3, 60_000, t + 60_000), true);
});

test("IP vem do x-real-ip ou do primeiro x-forwarded-for", () => {
  assert.equal(ipDoPedido(new Request("http://a", { headers: { "x-real-ip": "1.2.3.4" } })), "1.2.3.4");
  assert.equal(ipDoPedido(new Request("http://a", { headers: { "x-forwarded-for": "5.6.7.8, 9.9.9.9" } })), "5.6.7.8");
  assert.equal(ipDoPedido(new Request("http://a")), "local");
});

test("lerJson recusa corpo grande demais, mesmo sem Content-Length", async () => {
  const grande = new Request("http://a", { method: "POST", body: JSON.stringify({ x: "a".repeat(5000) }) });
  await assert.rejects(lerJson(grande, 1000), (e) => e instanceof CorpoInvalido && e.status === 413);
  const ok = new Request("http://a", { method: "POST", body: '{"a":1}' });
  assert.deepEqual(await lerJson(ok, 1000), { a: 1 });
  const ruim = new Request("http://a", { method: "POST", body: "{nao é json" });
  await assert.rejects(lerJson(ruim, 1000), (e) => e instanceof CorpoInvalido && e.status === 400);
});

test("link de pagamento: só HTTPS do Asaas", () => {
  assert.equal(linkAsaasSeguro("https://sandbox.asaas.com/i/abc123"), "https://sandbox.asaas.com/i/abc123");
  assert.equal(linkAsaasSeguro("https://www.asaas.com/i/abc"), "https://www.asaas.com/i/abc");
  assert.equal(linkAsaasSeguro("http://www.asaas.com/i/abc"), null);
  assert.equal(linkAsaasSeguro("https://asaas.com.golpe.io/i/abc"), null);
  assert.equal(linkAsaasSeguro("https://golpeasaas.com/i/abc"), null);
  assert.equal(linkAsaasSeguro("javascript:alert(1)"), null);
  assert.equal(linkAsaasSeguro("https://user@www.asaas.com/"), null);
  assert.equal(linkAsaasSeguro(null), null);
});

test("XML com DOCTYPE/ENTITY (XML bomba, XXE) é recusado antes de ler", () => {
  const bomba = `<?xml version="1.0"?><!DOCTYPE lol [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">]><nfeProc>&b;</nfeProc>`;
  const xxe = `<?xml version="1.0"?><!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><NFe>&e;</NFe>`;
  assert.equal(xmlSuspeito(bomba), true);
  assert.equal(xmlSuspeito(xxe), true);
  const r = lerNota("bomba.xml", bomba);
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.motivo : "", /DOCTYPE/);
  assert.equal(xmlSuspeito("<nfeProc><NFe/></nfeProc>"), false);
});

test("zip: só abre .xml e recusa zip bomba pelo tamanho descompactado", () => {
  const zip = zipSync({ "a.xml": strToU8("<NFe/>"), "leia.txt": strToU8("oi") });
  assert.deepEqual(Object.keys(unzipSync(zip, { filter: filtroXmlDoZip() })), ["a.xml"]);

  const grande = zipSync({ "grande.xml": new Uint8Array(11 * 1024 * 1024) }); // zeros: comprime para quase nada
  assert.throws(() => unzipSync(grande, { filter: filtroXmlDoZip() }), ErroZip);

  const muitos = zipSync({ "1.xml": strToU8("<a/>"), "2.xml": strToU8("<a/>"), "3.xml": strToU8("<a/>") });
  assert.throws(() => unzipSync(muitos, { filter: filtroXmlDoZip(2) }), ErroZip);
});
