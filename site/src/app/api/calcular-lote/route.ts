import { exigirAssinante } from "@/lib/acesso";
import { calcularLote, validarLote, type NotaParaCalcular } from "@/lib/lote";

/**
 * POST /api/calcular-lote  (T17)
 * Recebe { notas: [{ chave, data, municipio, uf, itens: [{ numero, ncm, baseCentavos, quantidade, unidade, cClassTrib }] }] }
 * — só os dados fiscais que o navegador tirou dos XMLs; o arquivo da nota não vem para cá.
 * Devolve cada item calculado (ou o motivo de não ter calculado) e os totais por nota.
 */
export async function POST(request: Request) {
  // T14: com a cobrança ligada, importar notas é só para assinantes.
  const { erro: semAcesso } = await exigirAssinante(request);
  if (semAcesso) return semAcesso;
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: "Pedido inválido." }, { status: 400 });
  }
  const erro = validarLote(corpo);
  if (erro) return Response.json({ erro }, { status: 400 });
  return Response.json(calcularLote((corpo as { notas: NotaParaCalcular[] }).notas));
}
