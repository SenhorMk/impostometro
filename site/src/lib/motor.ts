/**
 * Serviço de cálculo (T08): a ÚNICA parte do site que conversa com a calculadora oficial.
 *
 * O que ele faz, em ordem:
 *  1. escolhe as alíquotas de 2027 na nossa tabela (src/dados/aliquotas.json);
 *  2. monta o pedido no formato da Receita e chama "cálculo com observabilidade"
 *     (um item com erro não derruba os outros);
 *  3. traduz a resposta para um formato simples, com a memória de cálculo oficial;
 *  4. NUNCA inventa número: se o motor não calculou, devolvemos "não calculado" com o motivo.
 *
 * Roda só no servidor (a chave do motor nunca vai para o navegador).
 */
import { aliquotasPara, VERSAO_TABELA } from "./aliquotas";
import type { ParteTributo, PedidoCalculo, ResultadoCalculo } from "./tipos";

const MOTOR_URL = process.env.MOTOR_URL ?? "http://localhost:8080/api/calculadora";
const MOTOR_CHAVE = process.env.MOTOR_CHAVE; // exigida pelo proxy do motor em produção (T05)

/** Mensagens em português simples para os erros mais comuns do motor. */
const ERROS_AMIGAVEIS: Record<string, string> = {
  "REG-002": "Não encontramos esse código NCM na tabela oficial para esta data.",
  "REG-003": "Não encontramos esse código NBS na tabela oficial para esta data.",
  "REG-010": "Esse código de serviço não combina com a classificação escolhida.",
  "REG-011": "Esse código de produto não combina com a classificação escolhida.",
};

type Json = Record<string, unknown>;

function pegar(obj: unknown, ...caminho: string[]): unknown {
  let atual: unknown = obj;
  for (const chave of caminho) {
    if (!atual || typeof atual !== "object") return undefined;
    atual = (atual as Json)[chave];
  }
  return atual;
}

const num = (v: unknown) => (v === undefined || v === null ? 0 : Number(v));

function parte(grupo: unknown, campoAliquota: string, campoValor: string, memoria?: string): ParteTributo {
  return {
    aliquota: num(pegar(grupo, campoAliquota)),
    reducao: num(pegar(grupo, "gRed", "pRedAliq")),
    aliquotaEfetiva: num(pegar(grupo, "gRed", "pAliqEfet") ?? pegar(grupo, campoAliquota)),
    valor: num(pegar(grupo, campoValor)),
    memoria,
  };
}

/** Data usada no cálculo: a informada, ou hoje; antes de 2027 usamos 01/01/2027. */
export function dataDoCalculo(data?: string): string {
  const hoje = new Date().toISOString().slice(0, 10);
  const d = data ?? hoje;
  return d < "2027-01-01" ? "2027-01-01" : d;
}

let versaoEmCache: { app: string; db: string; quando: number } | null = null;

async function versaoMotor(): Promise<{ app: string; db: string }> {
  if (versaoEmCache && Date.now() - versaoEmCache.quando < 10 * 60_000) return versaoEmCache;
  const r = await chamarMotor("/dados-abertos/versao");
  const j = (await r.json()) as Json;
  versaoEmCache = { app: String(j.versaoApp), db: String(j.versaoDb), quando: Date.now() };
  return versaoEmCache;
}

async function chamarMotor(caminho: string, corpo?: unknown): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (MOTOR_CHAVE) headers.Authorization = `Bearer ${MOTOR_CHAVE}`;
  return fetch(`${MOTOR_URL}${caminho}`, {
    method: corpo ? "POST" : "GET",
    headers,
    body: corpo ? JSON.stringify(corpo) : undefined,
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
}

export async function calcular(pedido: PedidoCalculo): Promise<ResultadoCalculo> {
  const data = dataDoCalculo(pedido.data);
  const periodo = aliquotasPara(data);
  if (!periodo) {
    return {
      ok: false,
      estado: "SEM_ALIQUOTA",
      mensagem: `Ainda não temos alíquotas cadastradas para ${data}.`,
    };
  }

  const item: Json = {
    numero: 1,
    [pedido.tipo]: pedido.codigo,
    cst: pedido.cClassTrib.slice(0, 3), // o CST são os 3 primeiros dígitos do cClassTrib
    cClassTrib: pedido.cClassTrib,
    baseCalculo: pedido.valor,
    aliquotasNominais: {
      cbs: periodo.cbs,
      ibsEstadual: periodo.ibsEstadual,
      ibsMunicipal: periodo.ibsMunicipal,
    },
  };
  if (pedido.tipo === "ncm") Object.assign(item, { quantidade: 1, unidade: "UN" });

  const operacao = {
    id: crypto.randomUUID().replaceAll("-", ""),
    versao: "1.0.0",
    dhFatoGerador: `${data}T12:00:00-03:00`,
    municipio: pedido.municipio,
    uf: pedido.uf,
    itens: [item],
  };

  let resposta: Json;
  let versao: { app: string; db: string };
  try {
    const [r, v] = await Promise.all([chamarMotor("/observabilidade/regime-geral", operacao), versaoMotor()]);
    if (!r.ok) throw new Error(`motor respondeu HTTP ${r.status}`);
    resposta = (await r.json()) as Json;
    versao = v;
  } catch (erro) {
    console.error("[motor] falha ao calcular", erro);
    return {
      ok: false,
      estado: "FORA_DO_AR",
      mensagem: "A calculadora oficial não respondeu agora. Tente de novo em alguns segundos.",
    };
  }

  const objeto = (resposta.objetos as Json[] | undefined)?.[0];
  const estado = String(objeto?.estadoItem ?? "FALHA_TECNICA");

  if (estado !== "CALCULADO" && estado !== "CALCULO_SIMULADO") {
    const erro = (objeto?.erros as Json[] | undefined)?.[0];
    const codigo = erro?.code ? String(erro.code) : undefined;
    return {
      ok: false,
      estado,
      codigoErro: codigo,
      mensagem:
        (codigo && ERROS_AMIGAVEIS[codigo]) ??
        (erro?.detail ? String(erro.detail) : "A calculadora oficial não calculou este item."),
    };
  }

  const ibscbs = pegar(objeto, "tribCalc", "IBSCBS");
  const g = pegar(ibscbs, "gIBSCBS");
  const memoria = (pegar(ibscbs, "memoriaCalculo") ?? {}) as Record<string, string>;
  const fundamentacao = memoria.cbs?.match(/enquadramento legal em ([^,]+)/)?.[1];

  const cbs = parte(pegar(g, "gCBS"), "pCBS", "vCBS", memoria.cbs);
  const ibsEstadual = parte(pegar(g, "gIBSUF"), "pIBSUF", "vIBSUF", memoria.ibsUF);
  const ibsMunicipal = parte(pegar(g, "gIBSMun"), "pIBSMun", "vIBSMun", memoria.ibsMun);
  const ibsTotal = num(pegar(g, "vIBS"));
  const base = g ? num(pegar(g, "vBC")) : pedido.valor;
  const total = Math.round((cbs.valor + ibsTotal) * 100) / 100;

  return {
    ok: true,
    estado,
    base,
    cbs,
    ibsEstadual,
    ibsMunicipal,
    ibsTotal,
    total,
    percentualSobreVenda: base > 0 ? (total / base) * 100 : 0,
    fundamentacao,
    semAliquota: !g,
    dataFatoGerador: data,
    versaoMotor: versao.app,
    versaoTabelaMotor: versao.db,
    versaoTabelaAliquotas: VERSAO_TABELA,
    periodoAliquotas: {
      id: periodo.id,
      status: periodo.status,
      explicacaoCbs: periodo.explicacao.cbs,
      explicacaoIbs: periodo.explicacao.ibs,
      fontes: periodo.fontes,
    },
  };
}
