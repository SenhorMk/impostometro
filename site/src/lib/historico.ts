/**
 * Histórico de cálculos (T18): o que guardamos de cada cálculo de quem está logado.
 *
 * Só funções puras aqui (testadas em historico.test.ts). Quem grava e lê do banco é
 * historico-navegador.ts. Nada é recalculado ao reabrir: mostramos exatamente o
 * resultado que a calculadora deu na hora, com as versões usadas.
 */
import type { NotaCalculada } from "./lote.ts";
import type { NotaLida } from "./nfe.ts";
import type { ResultadoCalculo } from "./tipos.ts";

export type Origem = "manual" | "xml";

export type DetalheManual = { tipo: "manual"; resultado: Extract<ResultadoCalculo, { ok: true }>; descricao: string; cidade: string };
export type DetalheXml = {
  tipo: "xml";
  notas: NotaCalculada[];
  /** dados fiscais das notas (sem cliente final: o importador já descartou nome, CPF e endereço) */
  lidas: Omit<NotaLida, "arquivo" | "avisos" | "emitente" | "autorizacao">[];
};
export type Detalhe = DetalheManual | DetalheXml;

/** Uma linha da tabela public.calculos, como vai para o banco (sem id, dono e data, que o banco preenche). */
export type NovoCalculo = {
  origem: Origem;
  titulo: string;
  base_centavos: number;
  cbs_centavos: number;
  ibs_centavos: number;
  itens_calculados: number;
  itens_com_erro: number;
  versao_motor: string;
  versao_tabela_motor: string;
  versao_tabela_aliquotas: string;
  detalhe: Detalhe | null;
};

export type CalculoSalvo = Omit<NovoCalculo, "detalhe"> & { id: string; criado_em: string };

/** Limite do banco para o resultado completo (a coluna aceita até 5.000.000 bytes do texto do jsonb). */
export const LIMITE_DETALHE_BYTES = 4_000_000; // folga: o texto do jsonb no banco tem espaços a mais

/** R$ da calculadora (número com 2 casas) → centavos inteiros. */
export const paraCentavos = (reais: number) => Math.round(reais * 100);

const cortar = (s: string, n = 200) => (s.length > n ? `${s.slice(0, n - 1)}…` : s) || "Cálculo";

export function calculoManual(resultado: ResultadoCalculo, descricao: string, cidade: string): NovoCalculo | null {
  if (!resultado.ok) return null; // erro não vai para o histórico
  return {
    origem: "manual",
    titulo: cortar(descricao ? `${descricao} · ${cidade}` : cidade),
    base_centavos: paraCentavos(resultado.base),
    cbs_centavos: paraCentavos(resultado.cbs.valor),
    ibs_centavos: paraCentavos(resultado.ibsTotal),
    itens_calculados: 1,
    itens_com_erro: 0,
    versao_motor: resultado.versaoMotor,
    versao_tabela_motor: resultado.versaoTabelaMotor,
    versao_tabela_aliquotas: resultado.versaoTabelaAliquotas,
    detalhe: { tipo: "manual", resultado, descricao, cidade },
  };
}

export type LoteParaSalvar = {
  notas: NotaCalculada[];
  lidas: NotaLida[];
  versaoMotor: string;
  versaoTabelaMotor: string;
  versaoTabelaAliquotas: string;
};

export function calculoLote(lote: LoteParaSalvar): NovoCalculo | null {
  if (lote.notas.length === 0 || !lote.versaoMotor) return null;
  const t = lote.notas.reduce(
    (s, n) => ({
      base: s.base + n.totais.baseCentavos,
      cbs: s.cbs + n.totais.cbsCentavos,
      ibs: s.ibs + n.totais.ibsCentavos,
      ok: s.ok + n.totais.itensCalculados,
      erros: s.erros + n.totais.itensComErro,
    }),
    { base: 0, cbs: 0, ibs: 0, ok: 0, erros: 0 },
  );
  const datas = lote.lidas.map((n) => n.data).filter(Boolean).sort();
  const periodo = datas.length === 0 ? "" : datas[0] === datas.at(-1) ? ` · ${dataCurta(datas[0])}` : ` · ${dataCurta(datas[0])} a ${dataCurta(datas.at(-1)!)}`;
  const qtd = lote.notas.length;
  const detalhe: DetalheXml = {
    tipo: "xml",
    notas: lote.notas,
    lidas: lote.lidas.map((n) => ({
      chave: n.chave,
      modelo: n.modelo,
      numero: n.numero,
      serie: n.serie,
      data: n.data,
      municipio: n.municipio,
      uf: n.uf,
      itens: n.itens,
    })),
  };
  return {
    origem: "xml",
    titulo: cortar(`${qtd} ${qtd === 1 ? "nota" : "notas"} de XML${periodo}`),
    base_centavos: t.base,
    cbs_centavos: t.cbs,
    ibs_centavos: t.ibs,
    itens_calculados: t.ok,
    itens_com_erro: t.erros,
    versao_motor: lote.versaoMotor,
    versao_tabela_motor: lote.versaoTabelaMotor,
    versao_tabela_aliquotas: lote.versaoTabelaAliquotas,
    // Lote grande demais: guarda só os totais (a lista continua certa; reabrir mostra o aviso).
    detalhe: tamanhoJson(detalhe) <= LIMITE_DETALHE_BYTES ? detalhe : null,
  };
}

function dataCurta(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** Tamanho em bytes do JSON (como o banco mede). */
export function tamanhoJson(v: unknown): number {
  return new TextEncoder().encode(JSON.stringify(v)).length;
}
