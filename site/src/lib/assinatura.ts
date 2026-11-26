/**
 * Regras da assinatura (T14) que não dependem do Asaas nem do banco, para poder testar.
 *
 * Como o acesso funciona:
 *  - cada pagamento confirmado libera até o vencimento da cobrança + 1 mês + TOLERANCIA_DIAS;
 *  - cobrança atrasada só muda o status (o acesso vai até o fim do que já foi pago);
 *  - cancelar não corta na hora: vale até o fim do mês pago;
 *  - estorno ou contestação do cartão suspende na hora.
 *
 * Quem chama confere antes se o aviso é da assinatura atual da pessoa (e não de uma antiga).
 */

export const TOLERANCIA_DIAS = 3;

export type StatusAssinatura = "pendente" | "ativa" | "atrasada" | "cancelada" | "suspensa";
export type Assinatura = { status: StatusAssinatura; valido_ate: string | null };

/** Preço do plano em centavos. ASSINATURA_PRECO_CENTAVOS permite o teste real de R$ 1 (T14). */
export function precoCentavos(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.ASSINATURA_PRECO_CENTAVOS);
  return Number.isInteger(n) && n >= 100 ? n : 2900; // Suposição: R$ 29/mês até a decisão do T04
}

/** Data de hoje no horário de Brasília (AAAA-MM-DD). */
export function hojeBrasil(agora = new Date()): string {
  return new Date(agora.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
}

/** "2027-01-31" + 1 mês = "2027-02-28" (sem pular para março). */
export function somarMes(data: string): string {
  const [a, m, d] = data.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(a, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(a, m, Math.min(d, ultimoDia))).toISOString().slice(0, 10);
}

export function somarDias(data: string, dias: number): string {
  const t = Date.parse(`${data}T00:00:00Z`) + dias * 86400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function temAcesso(a: Assinatura | null, hoje = hojeBrasil()): boolean {
  if (!a || !a.valido_ate || a.status === "suspensa" || a.status === "pendente") return false;
  return a.valido_ate >= hoje;
}

/** O que um aviso do Asaas muda na assinatura. null = aviso que não muda nada. */
export function aplicarEvento(
  atual: Assinatura,
  evento: string,
  pagamento?: { dueDate?: string },
): Assinatura | null {
  switch (evento) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED": {
      if (!pagamento?.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(pagamento.dueDate)) return null;
      const novo = somarDias(somarMes(pagamento.dueDate), TOLERANCIA_DIAS);
      const valido_ate = atual.valido_ate && atual.valido_ate > novo ? atual.valido_ate : novo;
      return { status: "ativa", valido_ate };
    }
    case "PAYMENT_OVERDUE":
      return atual.status === "cancelada" ? null : { ...atual, status: "atrasada" };
    case "PAYMENT_REFUNDED":
    case "PAYMENT_CHARGEBACK_REQUESTED":
      return { ...atual, status: "suspensa" };
    case "SUBSCRIPTION_DELETED":
    case "SUBSCRIPTION_INACTIVATED":
      return { ...atual, status: "cancelada" };
    default:
      return null;
  }
}
