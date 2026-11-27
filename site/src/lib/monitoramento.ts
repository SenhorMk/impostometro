/**
 * Monitoramento de erros (T07) com o Sentry, só quando SENTRY_DSN estiver configurado.
 *
 * Privacidade: não manda IP, cookies nem cabeçalhos (sendDefaultPii: false) e apaga o
 * corpo dos pedidos antes de enviar (ali podem estar valores de venda e notas).
 * Sem rastreamento de desempenho nem gravação de tela: só erros.
 */
import type { ErrorEvent } from "@sentry/nextjs";

export const DSN_SENTRY = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || "";

export function limparEvento(evento: ErrorEvent): ErrorEvent {
  if (evento.request) {
    delete evento.request.data;
    delete evento.request.cookies;
    delete evento.request.headers;
    if (evento.request.query_string) evento.request.query_string = "[removido]";
  }
  delete evento.user;
  return evento;
}

export const opcoesSentry = {
  dsn: DSN_SENTRY,
  environment: process.env.NEXT_PUBLIC_AMBIENTE || "local",
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend: limparEvento,
};
