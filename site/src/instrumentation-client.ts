/**
 * Roda no navegador antes da página ficar interativa.
 * - T22: conta uma visita por aba (contador do dia, sem dado pessoal).
 * - T07: liga o Sentry para erros no navegador, só se SENTRY_DSN existir. O Sentry é
 *   carregado à parte, para não pesar a página de quem não usa.
 */
import { contarVisita } from "@/lib/funil";
import { DSN_SENTRY, opcoesSentry } from "@/lib/monitoramento";

try {
  contarVisita();
} catch {
  /* nunca atrapalhar a página */
}

if (DSN_SENTRY) {
  import("@sentry/nextjs")
    .then((Sentry) => Sentry.init(opcoesSentry))
    .catch(() => {});
}
