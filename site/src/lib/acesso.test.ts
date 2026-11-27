/**
 * T37: quem pode importar notas. Testa a matriz (acesso-regras.ts) e, com o Supabase simulado,
 * o que o servidor responde a pedidos diretos com sessões e configurações diferentes (acesso.ts).
 *   npm test
 */
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  decidirImportacao,
  LIMITE_NOTAS_ASSINANTE,
  LIMITE_NOTAS_PREVIA,
  modoDeAcesso,
  vendeAssinatura,
  type ModoAcesso,
} from "./acesso-regras.ts";

// ---------- Modo (configuração) ----------

const COMPLETO = { ASAAS_API_KEY: "x", SUPABASE_URL: "https://exemplo.supabase.co", SUPABASE_SECRET_KEY: "y" };

test("sem MODO_ACESSO e sem chaves: importação fechada, nunca aberta", () => {
  assert.equal(modoDeAcesso({}).modo, "fechado");
  assert.equal(modoDeAcesso({ ASAAS_API_KEY: "x" }).modo, "fechado"); // falta a chave secreta do banco
  assert.equal(modoDeAcesso({ SUPABASE_URL: "u", SUPABASE_SECRET_KEY: "y" }).modo, "fechado"); // falta o Asaas
});

test("sem MODO_ACESSO e com a cobrança configurada: exige assinatura", () => {
  const m = modoDeAcesso(COMPLETO);
  assert.equal(m.modo, "assinatura");
  assert.equal(vendeAssinatura(m), true);
});

test("MODO_ACESSO=assinatura sem chaves cai para fechado, com aviso no log", () => {
  const m = modoDeAcesso({ MODO_ACESSO: "assinatura" });
  assert.equal(m.modo, "fechado");
  assert.match(m.aviso ?? "", /não está configurada/);
});

test("prévia só existe quando escrita de propósito, e não vende assinatura", () => {
  for (const v of ["previa", "PREVIA", " prévia "]) assert.equal(modoDeAcesso({ MODO_ACESSO: v }).modo, "previa");
  assert.equal(vendeAssinatura(modoDeAcesso({ ...COMPLETO, MODO_ACESSO: "previa" })), false);
});

test("MODO_ACESSO=fechado fecha mesmo com tudo configurado; valor desconhecido também fecha", () => {
  assert.equal(modoDeAcesso({ ...COMPLETO, MODO_ACESSO: "fechado" }).modo, "fechado");
  const m = modoDeAcesso({ ...COMPLETO, MODO_ACESSO: "aberto" });
  assert.equal(m.modo, "fechado");
  assert.ok(m.aviso);
});

// ---------- Matriz (pessoa × modo) ----------

const HOJE = "2027-02-10";
const EM_DIA = { status: "ativa" as const, valido_ate: "2027-03-01" };
const VENCIDA = { status: "atrasada" as const, valido_ate: "2027-02-01" };
const CANCELADA_COM_DIAS = { status: "cancelada" as const, valido_ate: "2027-02-20" };
const PENDENTE = { status: "pendente" as const, valido_ate: null };
const SUSPENSA = { status: "suspensa" as const, valido_ate: "2027-03-01" };

const casos: [ModoAcesso, string, { logado: boolean; assinatura: Parameters<typeof decidirImportacao>[1]["assinatura"] }, string, number, number][] = [
  // modo, quem, pessoa, situação esperada, HTTP, limite
  ["fechado", "visitante", { logado: false, assinatura: null }, "indisponivel", 503, 0],
  ["fechado", "assinante em dia", { logado: true, assinatura: EM_DIA }, "indisponivel", 503, 0],
  ["previa", "visitante", { logado: false, assinatura: null }, "previa", 200, LIMITE_NOTAS_PREVIA],
  ["previa", "conta grátis", { logado: true, assinatura: null }, "previa", 200, LIMITE_NOTAS_PREVIA],
  ["previa", "assinante em dia", { logado: true, assinatura: EM_DIA }, "liberado", 200, LIMITE_NOTAS_ASSINANTE],
  ["previa", "banco fora do ar", { logado: true, assinatura: "erro" }, "previa", 200, LIMITE_NOTAS_PREVIA],
  ["assinatura", "visitante", { logado: false, assinatura: null }, "entrar", 401, 0],
  ["assinatura", "conta grátis", { logado: true, assinatura: null }, "assinar", 402, 0],
  ["assinatura", "esperando 1º pagamento", { logado: true, assinatura: PENDENTE }, "assinar", 402, 0],
  ["assinatura", "pagamento vencido", { logado: true, assinatura: VENCIDA }, "assinar", 402, 0],
  ["assinatura", "estornou", { logado: true, assinatura: SUSPENSA }, "assinar", 402, 0],
  ["assinatura", "cancelou, ainda com dias pagos", { logado: true, assinatura: CANCELADA_COM_DIAS }, "liberado", 200, LIMITE_NOTAS_ASSINANTE],
  ["assinatura", "assinante em dia", { logado: true, assinatura: EM_DIA }, "liberado", 200, LIMITE_NOTAS_ASSINANTE],
  ["assinatura", "banco fora do ar", { logado: true, assinatura: "erro" }, "indisponivel", 503, 0],
];

for (const [modo, quem, pessoa, situacao, status, limite] of casos) {
  test(`matriz: ${modo} × ${quem} → ${situacao}`, () => {
    const d = decidirImportacao(modo, pessoa, HOJE);
    assert.equal(d.situacao, situacao);
    assert.equal(d.status, status);
    assert.equal(d.limiteNotas, limite);
    if (status !== 200) assert.ok(d.mensagem.length > 0, "acesso negado sempre explica o motivo");
  });
}

test("mensagens para a pessoa não citam variáveis nem infraestrutura", () => {
  for (const [modo, , pessoa] of casos) {
    const d = decidirImportacao(modo, pessoa, HOJE);
    assert.doesNotMatch(d.mensagem, /ASAAS|SUPABASE|MODO_ACESSO|variáve|chave|servidor|503|402/i);
  }
});

// ---------- Pedidos diretos ao servidor (Supabase simulado) ----------

// O cliente do Supabase é criado uma vez por processo, então o endereço fica fixo para todos os testes.
process.env.SUPABASE_URL = "https://exemplo.supabase.co";
process.env.SUPABASE_SECRET_KEY = "segredo-de-teste";

const fetchOriginal = globalThis.fetch;
type Banco = { usuarios: Record<string, string>; assinaturas: Record<string, unknown>; bancoFora?: boolean };

/** Simula as duas chamadas que o servidor faz: conferir o token e ler a assinatura. */
function simularSupabase(banco: Banco) {
  globalThis.fetch = (async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : entrada.url);
    const cabecalhos = new Headers(init?.headers ?? (entrada instanceof Request ? entrada.headers : undefined));
    if (url.pathname === "/auth/v1/user") {
      const token = cabecalhos.get("authorization")?.replace(/^Bearer /, "") ?? "";
      const id = banco.usuarios[token];
      if (!id) return Response.json({ code: 401, msg: "invalid JWT" }, { status: 401 });
      return Response.json({ id, aud: "authenticated", role: "authenticated", email: `${id}@teste`, app_metadata: {}, user_metadata: {}, created_at: "" });
    }
    if (url.pathname === "/rest/v1/assinaturas") {
      if (banco.bancoFora) return Response.json({ message: "fora do ar" }, { status: 500 });
      const id = url.searchParams.get("usuario_id")?.replace(/^eq\./, "") ?? "";
      const linha = banco.assinaturas[id];
      // O cliente pode pedir um objeto só (Accept vnd.pgrst.object) ou uma lista; atende os dois.
      if (cabecalhos.get("accept")?.includes("vnd.pgrst.object"))
        return linha ? Response.json(linha) : Response.json({ code: "PGRST116", message: "0 rows" }, { status: 406 });
      return Response.json(linha ? [linha] : []);
    }
    throw new Error(`pedido inesperado: ${url.href}`);
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = fetchOriginal;
  delete process.env.ASAAS_API_KEY;
  delete process.env.MODO_ACESSO;
});

const { acessoImportacao, respostaNegada } = await import("./acesso.ts");

const pedido = (token?: string) => new Request("https://site/api/calcular-lote", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {} });
const silenciar = <T>(f: () => Promise<T>) => {
  const [e, w] = [console.error, console.warn];
  console.error = console.warn = () => {};
  return f().finally(() => ([console.error, console.warn] = [e, w]));
};
const futuro = "2999-01-01";
const banco: Banco = {
  usuarios: { "token-assinante": "u-assinante", "token-gratis": "u-gratis" },
  assinaturas: { "u-assinante": { status: "ativa", valido_ate: futuro, usuario_id: "u-assinante" } },
};

test("pedido direto sem chave do Asaas: fechado (503), mesmo com token de assinante", async () => {
  simularSupabase(banco);
  const { decisao } = await silenciar(() => acessoImportacao(pedido("token-assinante")));
  assert.equal(decisao.status, 503);
  const r = respostaNegada(decisao);
  assert.equal(r.status, 503);
  const corpo = await r.json();
  assert.equal(corpo.situacao, "indisponivel");
  assert.equal(corpo.proximoPasso.href, "/");
});

test("pedido direto com cobrança ligada: visitante 401, conta grátis 402, token falso 401, assinante liberado", async () => {
  process.env.ASAAS_API_KEY = "teste";
  simularSupabase(banco);
  assert.equal((await acessoImportacao(pedido())).decisao.status, 401);
  assert.equal((await acessoImportacao(pedido("token-gratis"))).decisao.status, 402);
  assert.equal((await acessoImportacao(pedido("token-inventado"))).decisao.status, 401);
  const assinante = await acessoImportacao(pedido("token-assinante"));
  assert.equal(assinante.decisao.situacao, "liberado");
  assert.equal(assinante.usuario?.id, "u-assinante");
});

test("falha ao ler a assinatura não libera (503)", async () => {
  process.env.ASAAS_API_KEY = "teste";
  simularSupabase({ ...banco, bancoFora: true });
  const { decisao } = await silenciar(() => acessoImportacao(pedido("token-assinante")));
  assert.equal(decisao.status, 503);
  assert.equal(decisao.situacao, "indisponivel");
});

test("prévia deliberada: visitante entra com limite pequeno, sem precisar do Asaas", async () => {
  process.env.MODO_ACESSO = "previa";
  simularSupabase(banco);
  const { decisao } = await acessoImportacao(pedido());
  assert.equal(decisao.situacao, "previa");
  assert.equal(decisao.limiteNotas, LIMITE_NOTAS_PREVIA);
});
