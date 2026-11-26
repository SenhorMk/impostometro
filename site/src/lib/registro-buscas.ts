/** Escrita de telemetria no servidor com chave publicável e permissão só de INSERT. */
import { normalizar } from "./busca.ts";

export function termoParaRegistro(consulta: string): string | null {
  const termo = normalizar(consulta).replace(/\s+/g, " ");
  const numeros = termo.replace(/\D/g, "");
  // Filtro preventivo; não classifica nomes próprios nem garante anonimização.
  if (termo.length < 2 || termo.length > 120 || /[@:/\\]|\b(?:cpf|cnpj)\b/.test(termo) || numeros.length >= 10) return null;
  return termo;
}

export async function registrarBuscaSemResultado(
  consulta: string,
  versaoTabela: string,
  dataSimulacao: string,
): Promise<"gravado" | "ignorado" | "desativado" | "falha"> {
  const termo = termoParaRegistro(consulta);
  if (!termo) return "ignorado";
  const endereco = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!endereco || !chave) return "desativado";

  try {
    const resposta = await fetch(new URL("/rest/v1/buscas_sem_resultado", endereco), {
      method: "POST",
      headers: { apikey: chave, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ termo, versao_tabela: versaoTabela, data_simulacao: dataSimulacao }),
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (resposta.ok) return "gravado";
    console.warn("Registro de busca indisponível", { status: resposta.status });
  } catch {
    console.warn("Registro de busca indisponível: conexão ou configuração.");
  }
  return "falha";
}
