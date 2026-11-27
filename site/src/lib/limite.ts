/**
 * Proteções simples das rotas de API (revisão de segurança, nov/2026), só no SERVIDOR.
 *
 * 1. Limite de pedidos por minuto (rate limit) por IP ou por conta.
 *    Fica na memória de cada instância da Vercel: segura um robô insistente batendo
 *    na mesma instância, mas NÃO é uma barreira global. A barreira global é a regra de
 *    rate limit do Firewall da Vercel (passo a passo em docs/seguranca.md).
 * 2. Limite de tamanho do corpo do pedido, para ninguém mandar um JSON gigante
 *    e travar o servidor lendo.
 */

type Balde = { inicio: number; usados: number };
const baldes = new Map<string, Balde>();
const MAX_CHAVES = 10_000; // para a memória não crescer sem fim

/**
 * true = pode seguir. Janela fixa de `janelaMs` com até `maximo` pedidos por chave.
 * `agora` só existe para os testes.
 */
export function dentroDoLimite(chave: string, maximo: number, janelaMs = 60_000, agora = Date.now()): boolean {
  const balde = baldes.get(chave);
  if (!balde || agora - balde.inicio >= janelaMs) {
    if (baldes.size >= MAX_CHAVES) {
      for (const [k, b] of baldes) if (agora - b.inicio >= janelaMs) baldes.delete(k);
      if (baldes.size >= MAX_CHAVES) baldes.clear();
    }
    baldes.set(chave, { inicio: agora, usados: 1 });
    return true;
  }
  balde.usados++;
  return balde.usados <= maximo;
}

/** Só para os testes. */
export function zerarLimites(): void {
  baldes.clear();
}

/**
 * IP de quem pediu. Na Vercel, "x-real-ip" e o primeiro item de "x-forwarded-for" são
 * preenchidos pela própria Vercel (o visitante não consegue forjar). Fora dela, vale "local".
 */
export function ipDoPedido(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const encaminhado = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return encaminhado || "local";
}

export function muitosPedidos(): Response {
  return Response.json(
    { ok: false, erro: "Muitos pedidos seguidos. Espere um minuto e tente de novo.", mensagem: "Muitos pedidos seguidos. Espere um minuto e tente de novo." },
    { status: 429, headers: { "Retry-After": "60" } },
  );
}

/** Atalho: devolve a resposta 429 se passou do limite, ou null se pode seguir. */
export function limitarPorIp(request: Request, rota: string, maximoPorMinuto: number): Response | null {
  return dentroDoLimite(`${rota}:${ipDoPedido(request)}`, maximoPorMinuto) ? null : muitosPedidos();
}

export class CorpoInvalido extends Error {
  status: 400 | 413;
  constructor(status: 400 | 413, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

/**
 * Lê o corpo como JSON, recusando o que passar de `maxBytes` (conta os bytes de verdade,
 * não confia só no Content-Length). Lança CorpoInvalido.
 */
export async function lerJson(request: Request, maxBytes: number): Promise<unknown> {
  const declarado = Number(request.headers.get("content-length"));
  if (Number.isFinite(declarado) && declarado > maxBytes) throw new CorpoInvalido(413, "Pedido grande demais.");
  if (!request.body) throw new CorpoInvalido(400, "Pedido inválido.");

  const leitor = request.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await leitor.cancel().catch(() => {});
      throw new CorpoInvalido(413, "Pedido grande demais.");
    }
    partes.push(value);
  }
  const bytes = new Uint8Array(total);
  let pos = 0;
  for (const p of partes) {
    bytes.set(p, pos);
    pos += p.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new CorpoInvalido(400, "Pedido inválido.");
  }
}
