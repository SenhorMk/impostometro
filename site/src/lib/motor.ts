/**
 * Serviço de cálculo (T08): a ÚNICA parte do site que usa a calculadora.
 *
 * A calculadora é o PORTE em TypeScript da calculadora oficial da Receita
 * (pasta src/motor/), que roda aqui mesmo, dentro do site. Não há servidor
 * Java em produção. O porte é conferido contra a calculadora oficial em mais
 * de 1.500 pedidos a cada mudança (scripts/porte/comparar.ts, na CI).
 *
 * O que ele faz, em ordem:
 *  1. escolhe as alíquotas de 2027 na nossa tabela (src/dados/aliquotas.json);
 *  2. monta o pedido no formato da Receita e chama o "cálculo com observabilidade"
 *     (um item com erro não derruba os outros);
 *  3. traduz a resposta para um formato simples, com a memória de cálculo oficial;
 *  4. NUNCA inventa número: se a calculadora não calculou, devolvemos "não calculado" com o motivo.
 */
import { calcularOperacao } from "@/motor/observabilidade";
import { versao as versaoCalculadora } from "@/motor/versao";
import { aliquotasPara, VERSAO_TABELA } from "./aliquotas";
import type { ParteTributo, PedidoCalculo, ResultadoCalculo } from "./tipos";

/** Mensagens em português simples para os erros mais comuns do motor. */
export const ERROS_AMIGAVEIS: Record<string, string> = {
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
  try {
    const r = calcularOperacao(operacao);
    if (r.status !== 200) throw new Error(`calculadora recusou o pedido: ${JSON.stringify(r.corpo)}`);
    resposta = r.corpo as Json;
  } catch (erro) {
    console.error("[motor] falha ao calcular", erro);
    return {
      ok: false,
      estado: "FALHA_TECNICA",
      mensagem: "A calculadora não conseguiu calcular este item. Confira os dados e tente de novo.",
    };
  }
  const versao = versaoCalculadora();

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
    versaoMotor: versao.versaoApp,
    versaoTabelaMotor: versao.versaoDb,
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
