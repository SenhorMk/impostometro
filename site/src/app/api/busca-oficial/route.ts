import { buscarOficiais, VERSAO_TABELA_OFICIAL } from "@/lib/busca-oficial";
import { dataDoCalculo } from "@/lib/motor";
import type { RespostaBuscaOficial } from "@/lib/busca-oficial-tipos";

/** Busca somente no servidor; o banco oficial não entra no JavaScript do formulário. */
export function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 120) {
    return Response.json({ mensagem: "Digite de 2 a 120 caracteres para buscar." }, { status: 400 });
  }
  const data = dataDoCalculo();
  const resposta: RespostaBuscaOficial = {
    resultados: buscarOficiais(q, data),
    data,
    versaoTabela: VERSAO_TABELA_OFICIAL,
  };
  return Response.json(resposta, { headers: { "Cache-Control": "no-store" } });
}
