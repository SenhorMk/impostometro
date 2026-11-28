/**
 * Funil medido (T22): soma 1 num contador do dia para cada etapa.
 *
 * Sem dado pessoal nenhum: não manda IP próprio, cookie, e-mail nem identificador.
 * O banco só guarda "dia · etapa · total" (tabela public.funil_diario). Sem as
 * variáveis do Supabase, não faz nada. Nunca atrapalha a tela: erros são ignorados.
 */
export type EventoFunil =
  | "visita"
  | "calculo_gratis"
  | "cadastro"
  | "assinatura"
  | "cancelamento"
  | "importacao_inicio"
  | "importacao_resultado"
  | "relatorio";

/** Do navegador (visita, cálculo grátis, cadastro, importação, relatório). Precisa do SQL 20261128150000 para as etapas novas. */
export function contarEvento(evento: EventoFunil): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave || typeof fetch === "undefined") return;
  fetch(`${url}/rest/v1/rpc/contar_evento`, {
    method: "POST",
    headers: { apikey: chave, "Content-Type": "application/json" },
    body: JSON.stringify({ evento }),
    keepalive: true, // conta mesmo se a pessoa sair da página em seguida
    credentials: "omit",
  }).catch(() => {});
}

/** Uma visita por aba do navegador (não conta cada página nem cada recarga). */
export function contarVisita(): void {
  try {
    if (sessionStorage.getItem("funil:visita")) return;
    sessionStorage.setItem("funil:visita", "1");
  } catch {
    return; // sem sessionStorage não dá para evitar contar em dobro: melhor não contar
  }
  contarEvento("visita");
}
