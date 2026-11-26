/**
 * Conversa com o Asaas (T14), só no SERVIDOR. Documentação: https://docs.asaas.com
 *
 * Variáveis (na Vercel, nunca no git):
 *  - ASAAS_API_KEY: chave da API (a do sandbox é diferente da de produção);
 *  - ASAAS_AMBIENTE: "sandbox" (padrão) ou "producao";
 *  - ASAAS_URL: opcional, para trocar o endereço da API.
 */

const ENDERECOS = { sandbox: "https://api-sandbox.asaas.com/v3", producao: "https://api.asaas.com/v3" };

export function asaasConfigurado(): boolean {
  return Boolean(process.env.ASAAS_API_KEY);
}

function base(): string {
  if (process.env.ASAAS_URL) return process.env.ASAAS_URL.replace(/\/$/, "");
  return process.env.ASAAS_AMBIENTE === "producao" ? ENDERECOS.producao : ENDERECOS.sandbox;
}

export class ErroAsaas extends Error {
  constructor(public status: number, public detalhe: string) {
    super(`Asaas respondeu ${status}: ${detalhe}`);
  }
}

async function chamar<T>(metodo: "GET" | "POST" | "DELETE", caminho: string, corpo?: unknown): Promise<T> {
  const r = await fetch(`${base()}${caminho}`, {
    method: metodo,
    headers: {
      access_token: process.env.ASAAS_API_KEY ?? "",
      "Content-Type": "application/json",
      "User-Agent": "CalculaReforma/1.0", // o Asaas exige User-Agent em contas novas
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const texto = await r.text();
  const json = texto ? JSON.parse(texto) : {};
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

/** Encerra a recorrência. Cobranças pendentes são apagadas; as pagas ficam. */
export function cancelarAssinatura(assinaturaId: string) {
  return chamar<{ deleted?: boolean }>("DELETE", `/subscriptions/${encodeURIComponent(assinaturaId)}`);
}
