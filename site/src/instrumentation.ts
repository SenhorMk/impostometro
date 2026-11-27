/**
 * Roda uma vez quando o servidor do site sobe (T07).
 * Liga o Sentry no servidor se SENTRY_DSN existir e manda para lá os erros das rotas e páginas.
 */
import type { Instrumentation } from "next";
import { DSN_SENTRY, opcoesSentry } from "@/lib/monitoramento";

export async function register() {
  if (!DSN_SENTRY) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init(opcoesSentry);
}

export const onRequestError: Instrumentation.onRequestError = async (erro, pedido, contexto) => {
  if (!DSN_SENTRY) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(erro, pedido, contexto);
  await Sentry.flush(2000); // na Vercel a função pode parar logo depois da resposta
};
