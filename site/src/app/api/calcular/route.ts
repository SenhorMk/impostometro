import { calcular } from "@/lib/motor";
import type { PedidoCalculo } from "@/lib/tipos";

/**
 * POST /api/calcular
 * Recebe { tipo, codigo, cClassTrib, valor, municipio, uf, data? } e devolve o resultado traduzido.
 * Valida tudo antes de chamar a calculadora oficial.
 */
export async function POST(request: Request) {
  let corpo: Partial<PedidoCalculo>;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ ok: false, estado: "ENTRADA_INVALIDA", mensagem: "Pedido inválido." }, { status: 400 });
  }

  const erro = validar(corpo);
  if (erro) {
    return Response.json({ ok: false, estado: "ENTRADA_INVALIDA", mensagem: erro }, { status: 400 });
  }

  const resultado = await calcular(corpo as PedidoCalculo);
  return Response.json(resultado, { status: resultado.ok || resultado.estado !== "FORA_DO_AR" ? 200 : 503 });
}

function validar(p: Partial<PedidoCalculo>): string | null {
  if (p.tipo !== "ncm" && p.tipo !== "nbs") return "Escolha o que você vende.";
  const tamanho = p.tipo === "ncm" ? 8 : 9;
  if (typeof p.codigo !== "string" || !new RegExp(`^\\d{${tamanho}}$`).test(p.codigo))
    return `O código ${p.tipo.toUpperCase()} precisa ter ${tamanho} números.`;
  if (typeof p.cClassTrib !== "string" || !/^\d{6}$/.test(p.cClassTrib)) return "Classificação tributária inválida.";
  if (typeof p.valor !== "number" || !Number.isFinite(p.valor) || p.valor <= 0) return "Informe o valor da venda.";
  if (p.valor > 1_000_000_000) return "Valor muito alto para uma simulação.";
  if (typeof p.municipio !== "number" || !Number.isInteger(p.municipio)) return "Escolha a cidade.";
  if (typeof p.uf !== "string" || !/^[A-Z]{2}$/.test(p.uf)) return "Escolha o estado.";
  if (p.data !== undefined && (typeof p.data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.data))) return "Data inválida.";
  return null;
}
