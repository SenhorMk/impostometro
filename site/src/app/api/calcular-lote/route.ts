import { acessoImportacao, respostaNegada } from "@/lib/acesso";
import { CorpoInvalido, dentroDoLimite, ipDoPedido, lerJson, muitosPedidos } from "@/lib/limite";
import { calcularLote, LIMITE_NOTAS_POR_PEDIDO, validarLote, type NotaParaCalcular } from "@/lib/lote";

/**
 * POST /api/calcular-lote  (T17)
 * Recebe { notas: [{ chave, data, municipio, uf, itens: [{ numero, ncm, baseCentavos, quantidade, unidade, cClassTrib }] }] }
 * — só os dados fiscais que o navegador tirou dos XMLs; o arquivo da nota não vem para cá.
 * Devolve cada item calculado (ou o motivo de não ter calculado) e os totais por nota.
 */
export async function POST(request: Request) {
  // T37: quem pode importar é decidido aqui, no servidor (matriz em docs/acesso.md).
  // Segurança: primeiro um limite por IP (antes de gastar uma consulta ao login), depois por conta.
  const ip = ipDoPedido(request);
  if (!dentroDoLimite(`lote:ip:${ip}`, 60)) return muitosPedidos();
  const { usuario, decisao } = await acessoImportacao(request);
  if (decisao.status !== 200) return respostaNegada(decisao);
  if (usuario && !dentroDoLimite(`lote:conta:${usuario.id}`, 30)) return muitosPedidos();
  // Prévia: aberta a todos, então segura mais o volume por IP (6 lotes a cada 10 minutos).
  if (decisao.situacao === "previa" && !dentroDoLimite(`lote:previa:${ip}`, 6, 600_000)) return muitosPedidos();
  let corpo: unknown;
  try {
    corpo = await lerJson(request, 4_000_000); // 50 notas grandes cabem com folga; a Vercel corta em 4,5 MB
  } catch (e) {
    return Response.json({ erro: e instanceof CorpoInvalido && e.status === 413 ? "Lote grande demais. Mande menos notas por vez." : "Pedido inválido." }, { status: e instanceof CorpoInvalido ? e.status : 400 });
  }
  const erro = validarLote(corpo);
  if (erro) return Response.json({ erro }, { status: 400 });
  const maximo = Math.min(LIMITE_NOTAS_POR_PEDIDO, decisao.limiteNotas);
  if ((corpo as { notas: unknown[] }).notas.length > maximo)
    return Response.json({ erro: `Na prévia gratuita, mande no máximo ${maximo} notas por vez.`, situacao: decisao.situacao }, { status: 413 });
  return Response.json(calcularLote((corpo as { notas: NotaParaCalcular[] }).notas));
}
