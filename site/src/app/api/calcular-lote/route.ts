import { exigirAssinante } from "@/lib/acesso";
import { CorpoInvalido, dentroDoLimite, ipDoPedido, lerJson, muitosPedidos } from "@/lib/limite";
import { calcularLote, validarLote, type NotaParaCalcular } from "@/lib/lote";

/**
 * POST /api/calcular-lote  (T17)
 * Recebe { notas: [{ chave, data, municipio, uf, itens: [{ numero, ncm, baseCentavos, quantidade, unidade, cClassTrib }] }] }
 * — só os dados fiscais que o navegador tirou dos XMLs; o arquivo da nota não vem para cá.
 * Devolve cada item calculado (ou o motivo de não ter calculado) e os totais por nota.
 */
export async function POST(request: Request) {
  // T14: com a cobrança ligada, importar notas é só para assinantes.
  // Segurança: primeiro um limite por IP (antes de gastar uma consulta ao login), depois por conta.
  if (!dentroDoLimite(`lote:ip:${ipDoPedido(request)}`, 60)) return muitosPedidos();
  const { usuario, erro: semAcesso } = await exigirAssinante(request);
  if (semAcesso) return semAcesso;
  if (usuario && !dentroDoLimite(`lote:conta:${usuario.id}`, 30)) return muitosPedidos();
  let corpo: unknown;
  try {
    corpo = await lerJson(request, 4_000_000); // 50 notas grandes cabem com folga; a Vercel corta em 4,5 MB
  } catch (e) {
    return Response.json({ erro: e instanceof CorpoInvalido && e.status === 413 ? "Lote grande demais. Mande menos notas por vez." : "Pedido inválido." }, { status: e instanceof CorpoInvalido ? e.status : 400 });
  }
  const erro = validarLote(corpo);
  if (erro) return Response.json({ erro }, { status: 400 });
  return Response.json(calcularLote((corpo as { notas: NotaParaCalcular[] }).notas));
}
