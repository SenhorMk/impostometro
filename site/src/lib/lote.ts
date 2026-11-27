/**
 * Cálculo de um lote de notas, item a item (T17).
 *
 * Cada nota vira UMA operação no formato da Receita, com todos os seus itens, e
 * vai para o "cálculo com observabilidade" do porte: um item com erro não trava
 * os outros. Nunca inventa número: item que a calculadora não calculou volta com
 * o motivo e fica fora dos totais.
 */
import { calcularOperacao } from "@/motor/observabilidade";
import { versao as versaoCalculadora } from "@/motor/versao";
import { aliquotasPara, VERSAO_TABELA } from "./aliquotas";
import { ERROS_AMIGAVEIS, dataDoCalculo } from "./motor";

export const LIMITE_NOTAS_POR_PEDIDO = 50;
export const LIMITE_ITENS_POR_NOTA = 990; // a NF-e aceita até 990 itens

export type ItemParaCalcular = {
  numero: number;
  ncm: string;
  baseCentavos: number;
  quantidade: string;
  unidade: string;
  cClassTrib: string; // confirmado pela pessoa (ou vindo da própria nota)
};
export type NotaParaCalcular = { chave: string; data: string; municipio: number; uf: string; itens: ItemParaCalcular[] };

export type ItemCalculado = {
  numero: number;
  estado: string; // CALCULADO, CALCULO_SIMULADO ou o erro
  ok: boolean;
  /** valores em centavos (texto da calculadora convertido sem arredondar) */
  baseCentavos?: number;
  cbsCentavos?: number;
  ibsCentavos?: number;
  reducaoCbs?: string; // % de redução, como a calculadora devolveu
  aliquotaEfetivaCbs?: string;
  memoria?: string; // memória de cálculo oficial da CBS
  mensagem?: string; // quando não calculou
};
export type NotaCalculada = {
  chave: string;
  dataCalculo: string;
  /** alíquotas nominais usadas (da nossa tabela), para mostrar na tela */
  aliquotas?: { cbs: number; ibsEstadual: number; ibsMunicipal: number; status: string };
  itens: ItemCalculado[];
  totais: { baseCentavos: number; cbsCentavos: number; ibsCentavos: number; itensCalculados: number; itensComErro: number };
};
export type RespostaLote = {
  notas: NotaCalculada[];
  versaoMotor: string;
  versaoTabelaMotor: string;
  versaoTabelaAliquotas: string;
};

type Json = Record<string, unknown>;
const pegar = (o: unknown, ...c: string[]): unknown =>
  c.reduce<unknown>((x, k) => (x && typeof x === "object" ? (x as Json)[k] : undefined), o);

/** "12.34" (como a calculadora devolve) → 1234 */
function centavosDe(v: unknown): number {
  if (v === undefined || v === null) return 0;
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(v));
  if (!m) throw new Error(`valor inesperado da calculadora: ${String(v)}`);
  const n = Number(m[2]) * 100 + Number((m[3] ?? "").padEnd(2, "0"));
  return m[1] ? -n : n;
}

/** Quantidade com no máximo 4 casas, como a calculadora aceita. */
function quantidade(q: string): number {
  const n = Number(q.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 10000) / 10000 : 1;
}

export function calcularNota(nota: NotaParaCalcular): NotaCalculada {
  const data = dataDoCalculo(nota.data);
  const periodo = aliquotasPara(data);
  const totais = { baseCentavos: 0, cbsCentavos: 0, ibsCentavos: 0, itensCalculados: 0, itensComErro: 0 };
  const erroEmTodos = (mensagem: string, estado = "NAO_CALCULADO"): NotaCalculada => ({
    chave: nota.chave,
    dataCalculo: data,
    itens: nota.itens.map((i) => ({ numero: i.numero, estado, ok: false, mensagem })),
    totais: { ...totais, itensComErro: nota.itens.length },
  });
  if (!periodo) return erroEmTodos(`Ainda não temos alíquotas cadastradas para ${data}.`, "SEM_ALIQUOTA");

  const operacao = {
    id: nota.chave.slice(0, 44) || "lote",
    versao: "1.0.0",
    dhFatoGerador: `${data}T12:00:00-03:00`,
    municipio: nota.municipio,
    uf: nota.uf,
    itens: nota.itens.map((i) => ({
      numero: i.numero,
      ncm: i.ncm,
      cst: i.cClassTrib.slice(0, 3), // o CST são os 3 primeiros dígitos do cClassTrib
      cClassTrib: i.cClassTrib,
      baseCalculo: i.baseCentavos / 100,
      quantidade: quantidade(i.quantidade),
      unidade: i.unidade || "UN",
      aliquotasNominais: { cbs: periodo.cbs, ibsEstadual: periodo.ibsEstadual, ibsMunicipal: periodo.ibsMunicipal },
    })),
  };

  let resposta: Json;
  try {
    const r = calcularOperacao(operacao);
    if (r.status !== 200) {
      const erro = (pegar(r.corpo, "errors") as Json[] | undefined)?.[0];
      return erroEmTodos(erro?.detail ? `A calculadora recusou a nota: ${String(erro.detail)}` : "A calculadora recusou a nota.", "INCONSISTENCIA_ENTRADA");
    }
    resposta = r.corpo as Json;
  } catch (e) {
    console.error("[lote] falha ao calcular nota", nota.chave, e);
    return erroEmTodos("A calculadora não conseguiu calcular esta nota.", "FALHA_TECNICA");
  }

  const porNumero = new Map(((resposta.objetos as Json[]) ?? []).map((o) => [Number(o.nObj), o]));
  const itens: ItemCalculado[] = nota.itens.map((i) => {
    const o = porNumero.get(i.numero);
    const estado = String(o?.estadoItem ?? "FALHA_TECNICA");
    if (estado !== "CALCULADO" && estado !== "CALCULO_SIMULADO") {
      const erro = (o?.erros as Json[] | undefined)?.[0];
      const codigo = erro?.code ? String(erro.code) : undefined;
      totais.itensComErro++;
      return {
        numero: i.numero,
        estado,
        ok: false,
        mensagem: (codigo && ERROS_AMIGAVEIS[codigo]) ?? (erro?.detail ? String(erro.detail) : "A calculadora não calculou este item."),
      };
    }
    const g = pegar(o, "tribCalc", "IBSCBS", "gIBSCBS");
    const base = g ? centavosDe(pegar(g, "vBC")) : i.baseCentavos;
    const cbs = centavosDe(pegar(g, "gCBS", "vCBS"));
    const ibs = centavosDe(pegar(g, "vIBS"));
    totais.baseCentavos += base;
    totais.cbsCentavos += cbs;
    totais.ibsCentavos += ibs;
    totais.itensCalculados++;
    return {
      numero: i.numero,
      estado,
      ok: true,
      baseCentavos: base,
      cbsCentavos: cbs,
      ibsCentavos: ibs,
      reducaoCbs: pegar(g, "gCBS", "gRed", "pRedAliq") as string | undefined,
      aliquotaEfetivaCbs: (pegar(g, "gCBS", "gRed", "pAliqEfet") ?? pegar(g, "gCBS", "pCBS")) as string | undefined,
      memoria: pegar(o, "tribCalc", "IBSCBS", "memoriaCalculo", "cbs") as string | undefined,
    };
  });

  return {
    chave: nota.chave,
    dataCalculo: data,
    aliquotas: { cbs: periodo.cbs, ibsEstadual: periodo.ibsEstadual, ibsMunicipal: periodo.ibsMunicipal, status: periodo.status },
    itens,
    totais,
  };
}

export function calcularLote(notas: NotaParaCalcular[]): RespostaLote {
  const v = versaoCalculadora();
  return {
    notas: notas.map(calcularNota),
    versaoMotor: v.versaoApp,
    versaoTabelaMotor: v.versaoDb,
    versaoTabelaAliquotas: VERSAO_TABELA,
  };
}

/** Confere o formato do pedido antes de calcular. Devolve a mensagem de erro, ou null. */
export function validarLote(corpo: unknown): string | null {
  const notas = (corpo as { notas?: unknown })?.notas;
  if (!Array.isArray(notas) || notas.length === 0) return "Nenhuma nota para calcular.";
  if (notas.length > LIMITE_NOTAS_POR_PEDIDO) return `Mande no máximo ${LIMITE_NOTAS_POR_PEDIDO} notas por vez.`;
  for (const n of notas as NotaParaCalcular[]) {
    if (typeof n?.chave !== "string" || n.chave.length > 60) return "Nota sem identificação.";
    if (typeof n.data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(n.data)) return "Data da nota inválida.";
    if (!Number.isInteger(n.municipio) || n.municipio < 1000000 || n.municipio > 9999999) return "Município da nota inválido.";
    if (typeof n.uf !== "string" || !/^[A-Z]{2}$/.test(n.uf)) return "UF da nota inválida.";
    if (!Array.isArray(n.itens) || n.itens.length === 0 || n.itens.length > LIMITE_ITENS_POR_NOTA) return "Itens da nota inválidos.";
    for (const i of n.itens) {
      if (!Number.isInteger(i?.numero) || i.numero < 1 || i.numero > 9999) return "Item sem número.";
      if (typeof i.ncm !== "string" || !/^\d{8}$/.test(i.ncm)) return `Item ${i.numero}: NCM precisa ter 8 números.`;
      if (typeof i.cClassTrib !== "string" || !/^\d{6}$/.test(i.cClassTrib)) return `Item ${i.numero}: classificação tributária inválida.`;
      if (!Number.isInteger(i.baseCentavos) || i.baseCentavos < 0 || i.baseCentavos > 1e13) return `Item ${i.numero}: valor inválido.`;
      if (typeof i.quantidade !== "string" || i.quantidade.length > 30 || typeof i.unidade !== "string" || i.unidade.length > 10)
        return `Item ${i.numero}: quantidade inválida.`;
    }
  }
  return null;
}
