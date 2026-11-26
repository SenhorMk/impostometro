import { buscarCodigos, especiaisPorCodigo } from "@/lib/codigos";

/**
 * GET /api/codigos?q=pao de queijo  →  [{ tipo, codigo, descricao, especiais }]
 * Busca nas tabelas oficiais de NCM e NBS (T10). Também aceita o código: ?q=6109
 *
 * GET /api/codigos?codigos=61091000,10063011  →  { "61091000": { descricao, especiais }, ... }
 * Classificações especiais possíveis de cada código exato (importação de XML, T17).
 * Código que não existe nas tabelas oficiais volta como null.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lista = params.get("codigos");
  if (lista !== null) {
    const codigos = [...new Set(lista.split(",").filter((c) => /^\d{8,9}$/.test(c)))].slice(0, 500);
    return Response.json(especiaisPorCodigo(codigos), { headers: { "Cache-Control": "public, max-age=3600" } });
  }
  const q = (params.get("q") ?? "").slice(0, 80);
  if (q.trim().length < 2) return Response.json([]);
  return Response.json(buscarCodigos(q), { headers: { "Cache-Control": "public, max-age=3600" } });
}
