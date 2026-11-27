import { CorpoInvalido, lerJson, limitarPorIp } from "@/lib/limite";
import { calcular } from "@/lib/motor";
import type { PedidoCalculo } from "@/lib/tipos";

/**
 * POST /api/calcular
 * Recebe { tipo, codigo, cClassTrib, valor, municipio, uf, data? } e devolve o resultado traduzido.
 * Valida tudo antes de chamar a calculadora oficial.
 */
export async function POST(request: Request) {
  // Segurança: no máximo 60 simulações por minuto por IP (uma pessoa de verdade faz poucas).
  const limite = limitarPorIp(request, "calcular", 60);
  if (limite) return limite;
  let corpo: Partial<PedidoCalculo>;
  try {
    corpo = (await lerJson(request, 4_096)) as Partial<PedidoCalculo>; // o pedido real tem ~150 bytes
  } catch (e) {
    const status = e instanceof CorpoInvalido ? e.status : 400;
    return Response.json({ ok: false, estado: "ENTRADA_INVALIDA", mensagem: "Pedido inválido." }, { status });
  }
  if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) {
    return Response.json({ ok: false, estado: "ENTRADA_INVALIDA", mensagem: "Pedido inválido." }, { status: 400 });
  }

  const erro = validar(corpo);
  if (erro) {
    return Response.json({ ok: false, estado: "ENTRADA_INVALIDA", mensagem: erro }, { status: 400 });
  }

  const resultado = await calcular(corpo as PedidoCalculo);
  return Response.json(resultado, { status: resultado.ok || resultado.estado !== "FALHA_TECNICA" ? 200 : 500 });
}

function validar(p: Partial<PedidoCalculo>): string | null {
  if (p.tipo !== "ncm" && p.tipo !== "nbs") return "Escolha o que você vende.";
  const tamanho = p.tipo === "ncm" ? 8 : 9;
  if (typeof p.codigo !== "string" || !new RegExp(`^\\d{${tamanho}}$`).test(p.codigo))
    return `O código ${p.tipo.toUpperCase()} precisa ter ${tamanho} números.`;
  if (typeof p.cClassTrib !== "string" || !/^\d{6}$/.test(p.cClassTrib)) return "Classificação tributária inválida.";
  if (typeof p.valor !== "number" || !Number.isFinite(p.valor) || p.valor <= 0) return "Informe o valor da venda.";
  if (p.valor > 1_000_000_000) return "Valor muito alto para uma simulação.";
  if (typeof p.municipio !== "number" || !Number.isInteger(p.municipio) || p.municipio < 1000000 || p.municipio > 9999999) return "Escolha a cidade.";
  if (typeof p.uf !== "string" || !/^[A-Z]{2}$/.test(p.uf)) return "Escolha o estado.";
  if (p.data !== undefined && (typeof p.data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.data))) return "Data inválida.";
  return null;
}
