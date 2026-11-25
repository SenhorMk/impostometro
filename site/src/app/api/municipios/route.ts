import municipios from "@/dados/municipios.json";

/**
 * GET /api/municipios?uf=SP  →  [[codigoIBGE, "Nome"], ...]
 * A lista vem das tabelas oficiais da calculadora (gerada uma vez e guardada no site),
 * então não depende do motor estar no ar.
 */
export async function GET(request: Request) {
  const uf = new URL(request.url).searchParams.get("uf")?.toUpperCase() ?? "";
  const lista = (municipios as unknown as Record<string, [number, string][]>)[uf];
  if (!lista) return Response.json({ erro: "UF inválida" }, { status: 400 });
  return Response.json(lista, { headers: { "Cache-Control": "public, max-age=86400, immutable" } });
}
