import { after } from "next/server";
import { buscarOficiais, VERSAO_TABELA_OFICIAL } from "@/lib/busca-oficial";
import { buscarAtividades } from "@/lib/busca";
import { buscarCodigos } from "@/lib/codigos";
import { registrarBuscaSemResultado } from "@/lib/registro-buscas";
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
  // Só registra quando nada achou nada: dicionário, nomes de NCM/NBS (T10, PR #5) e classificações.
  if (resposta.resultados.length === 0 && buscarAtividades(q).length === 0 && buscarCodigos(q, 1).length === 0) {
    after(async () => {
      await registrarBuscaSemResultado(q, VERSAO_TABELA_OFICIAL, data);
    });
  }
  return Response.json(resposta, { headers: { "Cache-Control": "no-store" } });
}
