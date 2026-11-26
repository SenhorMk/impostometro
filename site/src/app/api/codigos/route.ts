import { buscarCodigos } from "@/lib/codigos";

/**
 * GET /api/codigos?q=pao de queijo  →  [{ tipo, codigo, descricao, especiais }]
 * Busca nas tabelas oficiais de NCM e NBS (T10). Também aceita o código: ?q=6109
 */
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  if (q.trim().length < 2) return Response.json([]);
  return Response.json(buscarCodigos(q), { headers: { "Cache-Control": "public, max-age=3600" } });
}
