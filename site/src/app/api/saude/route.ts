import { connection } from "next/server";
import { calcular } from "@/lib/motor";

/**
 * GET /api/saude   (T07)
 * Endereço para o serviço de alerta (UptimeRobot, Better Stack...) bater a cada poucos minutos.
 * Não basta a página abrir: faz um cálculo de verdade com a calculadora (camiseta de R$ 100
 * em São Paulo, o caso 01 dos testes dourados) e só responde 200 se ela calcular.
 * Não toca no banco nem em serviços de fora, para não gastar nada.
 */
export async function GET() {
  await connection(); // sempre na hora, nunca uma resposta guardada do build
  const inicio = performance.now();
  try {
    const r = await calcular({ tipo: "ncm", codigo: "61091000", cClassTrib: "000001", valor: 100, municipio: 3550308, uf: "SP" });
    const ms = Math.round(performance.now() - inicio);
    if (!r.ok || r.base !== 100) {
      return Response.json({ ok: false, problema: r.ok ? "resultado inesperado" : r.estado, ms }, { status: 503, headers: semCache });
    }
    return Response.json(
      { ok: true, calculadora: r.versaoMotor, tabelas: r.versaoTabelaMotor, aliquotas: r.versaoTabelaAliquotas, ms },
      { headers: semCache },
    );
  } catch {
    return Response.json({ ok: false, problema: "falha técnica" }, { status: 503, headers: semCache });
  }
}

const semCache = { "Cache-Control": "no-store" };
