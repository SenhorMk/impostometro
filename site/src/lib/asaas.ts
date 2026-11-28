/**
 * Conversa com o Asaas (T14), só no SERVIDOR. Documentação: https://docs.asaas.com
 *
 * Variáveis (na Vercel, nunca no git), com os nomes cadastrados lá (ver asaas-config.ts):
 *  - ASAAS_ENVIROMENT: "sandbox" (padrão) ou "producao"; escolhe qual chave vale;
 *  - ASAAS_API_KEY_SANDBOX: chave da API do sandbox;
 *  - ASAAS_API_KEY: chave da API de produção;
 *  - ASAAS_URL: opcional, para trocar o endereço da API.
 */
import { ambienteAsaas, chaveAsaas } from "./asaas-config.ts";

const ENDERECOS = { sandbox: "https://api-sandbox.asaas.com/v3", producao: "https://api.asaas.com/v3" };

export function asaasConfigurado(): boolean {
  return Boolean(chaveAsaas());
}

function base(): string {
  if (process.env.ASAAS_URL) return process.env.ASAAS_URL.replace(/\/$/, "");
  return ENDERECOS[ambienteAsaas()];
}

export class ErroAsaas extends Error {
  status: number;
  detalhe: string;
  constructor(status: number, detalhe: string) {
    super(`Asaas respondeu ${status}: ${detalhe}`);
    this.status = status;
    this.detalhe = detalhe;
  }
}

async function chamar<T>(metodo: "GET" | "POST" | "DELETE", caminho: string, corpo?: unknown): Promise<T> {
  const r = await fetch(`${base()}${caminho}`, {
    method: metodo,
    headers: {
      access_token: chaveAsaas(),
      "Content-Type": "application/json",
      "User-Agent": "CalculaReforma/1.0", // o Asaas exige User-Agent em contas novas
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const texto = await r.text();
  let json: Record<string, unknown> = {};
  try {
    json = texto ? JSON.parse(texto) : {};
  } catch {
    throw new ErroAsaas(r.status, "resposta que não é JSON");
  }
  if (!r.ok) {
    const detalhe = (json?.errors as { description?: string }[] | undefined)?.map((e) => e.description).join("; ") || r.statusText;
    throw new ErroAsaas(r.status, detalhe);
  }
  return json as T;
}

export function criarCliente(dados: { nome: string; cpfCnpj: string; email?: string; usuarioId: string }) {
  return chamar<{ id: string }>("POST", "/customers", {
    name: dados.nome,
    cpfCnpj: dados.cpfCnpj,
    email: dados.email,
    externalReference: dados.usuarioId,
    notificationDisabled: false,
  });
}

export function criarAssinatura(dados: { cliente: string; valorCentavos: number; vencimento: string; usuarioId: string; descricao: string }) {
  return chamar<{ id: string; paymentLink?: string | null }>("POST", "/subscriptions", {
    customer: dados.cliente,
    billingType: "UNDEFINED", // a pessoa escolhe na página do Asaas: Pix, cartão ou boleto
    value: dados.valorCentavos / 100,
    nextDueDate: dados.vencimento,
    cycle: "MONTHLY",
    description: dados.descricao,
    externalReference: dados.usuarioId,
  });
}

/** Link da primeira cobrança da assinatura (a página de pagamento do Asaas). */
export async function linkDaPrimeiraCobranca(assinaturaId: string): Promise<string | null> {
  const r = await chamar<{ data?: { invoiceUrl?: string; status?: string }[] }>("GET", `/subscriptions/${encodeURIComponent(assinaturaId)}/payments`);
  const pendente = r.data?.find((p) => p.status === "PENDING" || p.status === "OVERDUE") ?? r.data?.[0];
  return pendente?.invoiceUrl ?? null;
}

/** Uma cobrança, lida direto no Asaas (para conferir o que o webhook disse). */
export function buscarCobranca(cobrancaId: string) {
  return chamar<{ id: string; status?: string; subscription?: string | null; dueDate?: string; value?: number }>(
    "GET",
    `/payments/${encodeURIComponent(cobrancaId)}`,
  );
}

/** Status de cobrança que significam "dinheiro confirmado" no Asaas. */
export const COBRANCA_PAGA = new Set(["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"]);

/**
 * Segurança: o site só manda a pessoa para links HTTPS do próprio Asaas
 * (asaas.com e subdomínios, como sandbox.asaas.com). Qualquer outra coisa vira null.
 */
export function linkAsaasSeguro(link: unknown): string | null {
  if (typeof link !== "string" || link.length > 500) return null;
  try {
    const u = new URL(link);
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
    return host === "asaas.com" || host.endsWith(".asaas.com") ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Encerra a recorrência. Cobranças pendentes são apagadas; as pagas ficam. */
export function cancelarAssinatura(assinaturaId: string) {
  return chamar<{ deleted?: boolean }>("DELETE", `/subscriptions/${encodeURIComponent(assinaturaId)}`);
}
