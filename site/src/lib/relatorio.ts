/**
 * Relatório revisável do período (T27): o que vai para o contador, em PDF e planilha.
 *
 * Regra de ouro: o relatório NÃO calcula nada. Ele só reorganiza o resultado que a
 * calculadora já deu (o mesmo que aparece na tela e que fica no histórico), em centavos
 * inteiros. Os totais do relatório são a soma dos itens calculados e precisam bater, ao
 * centavo, com os totais de cada nota (conferido em conferirTotais e nos testes).
 *
 * Só funções puras (testadas em relatorio.test.ts). Nada aqui chama o motor.
 */
import type { NotaCalculada } from "./lote.ts";
import type { ItemNota, NotaLida } from "./nfe.ts";
import { documentoLegivel, mesLegivel, motivosNaoCalculados, nomeDoMotivo, type MotivoFora, type Preparo } from "./preparo.ts";
import { ehRascunho, type Premissas } from "./premissas.ts";

export type NotaDoRelatorio = Pick<NotaLida, "chave" | "modelo" | "numero" | "serie" | "data" | "uf" | "itens">;

export type LoteDoRelatorio = {
  notas: NotaCalculada[];
  versaoMotor: string;
  versaoTabelaMotor: string;
  versaoTabelaAliquotas: string;
  premissas?: Premissas;
};

/**
 * O que a soma representa (T34), no formato que pode ser guardado no histórico:
 * só contagens, números das notas e explicações. Sem nome de arquivo, sem cliente final.
 * Os campos opcionais faltam em lotes antigos do histórico.
 */
export type Cobertura = {
  resumo: string;
  parcial: boolean;
  motivos: string[];
  empresa?: string;
  periodo?: string;
  incluidas?: number;
  fora?: { motivo: MotivoFora; nome: string; quantidade: number; numeros: string[] }[];
  pendencias?: { explicacao: string; quantidade: number }[];
  lacunas?: { modelo: string; serie: string; faltando: number; exemplos: string[] }[];
  datas?: { primeira: string; ultima: string } | null;
};

const MAX_NUMEROS = 20;

/** Tira do "preparo" o que o relatório precisa, sem nomes de arquivo. */
export function resumirCobertura(p: Preparo): Cobertura {
  const empresa = p.escopo.empresa === "todas" ? "todas as empresas" : documentoLegivel(p.escopo.empresa);
  const periodo = p.escopo.periodo === "todos" ? "todos os meses enviados" : mesLegivel(p.escopo.periodo);

  const porMotivo = new Map<MotivoFora, string[]>();
  for (const f of p.fora) porMotivo.set(f.motivo, [...(porMotivo.get(f.motivo) ?? []), f.numero || "sem número"]);
  const fora = [...porMotivo].map(([motivo, numeros]) => ({
    motivo,
    nome: nomeDoMotivo(motivo, numeros.length),
    quantidade: numeros.length,
    numeros: numeros.slice(0, MAX_NUMEROS),
  }));

  // Explicações sem o nome do arquivo (que pode trazer qualquer coisa que a pessoa digitou).
  const pend = new Map<string, number>();
  for (const x of p.pendencias) pend.set(x.explicacao, (pend.get(x.explicacao) ?? 0) + 1);

  return {
    resumo: `${empresa} · ${periodo}`,
    parcial: p.parcial,
    motivos: p.motivosParcial,
    empresa,
    periodo,
    incluidas: p.aceitas.length,
    fora,
    pendencias: [...pend].map(([explicacao, quantidade]) => ({ explicacao, quantidade })),
    lacunas: p.lacunas,
    datas: p.datas,
  };
}

export type OrigemClassificacaoLegivel = "da nota" | "confirmada pelo usuário" | "sugestão NÃO confirmada" | "não informada";

export type LinhaRelatorio = {
  nota: { modelo: string; numero: string; serie: string; data: string; uf: string; chave: string };
  item: number;
  descricao: string;
  ncm: string;
  cfop: string;
  cClassTrib: string;
  origemClassificacao: OrigemClassificacaoLegivel;
  baseEstimada: boolean;
  calculado: boolean;
  baseCentavos?: number;
  cbsCentavos?: number;
  ibsCentavos?: number;
  reducaoCbs?: string;
  aliquotaEfetivaCbs?: string;
  memoria?: string;
  motivo?: string;
};

export type Relatorio = {
  empresa: string;
  periodo: string;
  geradoEm: string;
  cenario: string;
  rascunho: boolean;
  totais: { baseCentavos: number; cbsCentavos: number; ibsCentavos: number; totalCentavos: number; itensCalculados: number; itensNaoCalculados: number };
  notasIncluidas: number;
  cobertura: Cobertura | null;
  naoCalculados: { motivo: string; quantidade: number }[];
  premissas: Premissas | null;
  aliquotas: { cbs: number; ibsEstadual: number; ibsMunicipal: number; provisoria: boolean } | null;
  versoes: { motor: string; tabelaMotor: string; tabelaAliquotas: string };
  /** avisos que precisam aparecer junto do total (base estimada, alíquota provisória, rascunho, cobertura parcial) */
  avisos: string[];
  linhas: LinhaRelatorio[];
};

const ORIGEM: Record<string, OrigemClassificacaoLegivel> = { nota: "da nota", confirmada: "confirmada pelo usuário", sugerida: "sugestão NÃO confirmada" };

function origemDe(i: ItemNota): OrigemClassificacaoLegivel {
  return ORIGEM[i.origemClassificacao ?? (i.cClassTrib ? "nota" : "")] ?? "não informada";
}

/** Os totais de cada nota batem com a soma dos itens? (Se não, algo mudou o resultado no caminho.) */
export function conferirTotais(notas: NotaCalculada[]): boolean {
  return notas.every((n) => {
    const ok = n.itens.filter((i) => i.ok);
    const soma = (k: "baseCentavos" | "cbsCentavos" | "ibsCentavos") => ok.reduce((s, i) => s + (i[k] ?? 0), 0);
    return (
      soma("baseCentavos") === n.totais.baseCentavos &&
      soma("cbsCentavos") === n.totais.cbsCentavos &&
      soma("ibsCentavos") === n.totais.ibsCentavos &&
      ok.length === n.totais.itensCalculados
    );
  });
}

export function montarRelatorio(lote: LoteDoRelatorio, notas: NotaDoRelatorio[], cobertura: Cobertura | null, geradoEm: Date): Relatorio {
  const linhas: LinhaRelatorio[] = [];
  lote.notas.forEach((n, k) => {
    const lida = notas[k];
    if (!lida) return;
    for (const item of lida.itens) {
      const c = n.itens.find((x) => x.numero === item.numero);
      if (!c) continue;
      linhas.push({
        nota: { modelo: lida.modelo, numero: lida.numero, serie: lida.serie, data: lida.data, uf: lida.uf, chave: lida.chave },
        item: item.numero,
        descricao: item.descricao,
        ncm: item.ncm,
        cfop: item.cfop,
        cClassTrib: item.classificacaoUsada ?? item.cClassTrib ?? "",
        origemClassificacao: origemDe(item),
        baseEstimada: item.origemBase !== "nota",
        calculado: c.ok,
        ...(c.ok
          ? { baseCentavos: c.baseCentavos ?? 0, cbsCentavos: c.cbsCentavos ?? 0, ibsCentavos: c.ibsCentavos ?? 0, reducaoCbs: c.reducaoCbs, aliquotaEfetivaCbs: c.aliquotaEfetivaCbs, memoria: c.memoria }
          : { motivo: c.mensagem ?? c.estado }),
      });
    }
  });

  const calculadas = linhas.filter((l) => l.calculado);
  const soma = (k: "baseCentavos" | "cbsCentavos" | "ibsCentavos") => calculadas.reduce((s, l) => s + (l[k] ?? 0), 0);
  const totais = {
    baseCentavos: soma("baseCentavos"),
    cbsCentavos: soma("cbsCentavos"),
    ibsCentavos: soma("ibsCentavos"),
    totalCentavos: soma("cbsCentavos") + soma("ibsCentavos"),
    itensCalculados: calculadas.length,
    itensNaoCalculados: linhas.length - calculadas.length,
  };

  const p = lote.premissas ?? null;
  const rascunho = ehRascunho(p ?? undefined);
  const a = lote.notas.find((n) => n.aliquotas)?.aliquotas;
  const aliquotas = a ? { cbs: a.cbs, ibsEstadual: a.ibsEstadual, ibsMunicipal: a.ibsMunicipal, provisoria: a.status === "provisorio" } : null;
  const estimadas = linhas.filter((l) => l.baseEstimada && l.calculado).length;

  const avisos: string[] = [];
  if (rascunho) avisos.push(`RASCUNHO: ${p!.itensSugeridos} ${p!.itensSugeridos === 1 ? "item usou" : "itens usaram"} classificação sugerida e não confirmada.`);
  if (cobertura?.parcial) avisos.push(`Cobertura parcial: ${cobertura.motivos.join("; ")}.`);
  if (!cobertura) avisos.push("Cobertura do período não registrada neste cálculo (feito antes do relatório existir): confira se todas as notas do mês foram enviadas.");
  if (totais.itensNaoCalculados > 0)
    avisos.push(`${totais.itensNaoCalculados} ${totais.itensNaoCalculados === 1 ? "item não foi calculado e está" : "itens não foram calculados e estão"} fora da soma.`);
  if (estimadas > 0)
    avisos.push(`Base estimada em ${estimadas} ${estimadas === 1 ? "item" : "itens"}: a nota não trazia a base da CBS/IBS; usamos valor do produto − desconto + frete + seguro + outras despesas.`);
  if (aliquotas?.provisoria) avisos.push("Alíquotas provisórias: o Senado pode mudar a CBS de 2027 até 15/12/2026.");
  avisos.push("Simulação com a calculadora oficial da Receita Federal. Não é o imposto definitivo a recolher nem substitui a apuração do seu contador.");

  return {
    empresa: cobertura?.empresa ?? "não registrada",
    periodo: cobertura?.periodo ?? periodoDasNotas(notas),
    geradoEm: geradoEm.toISOString(),
    cenario: p ? `Revisão ${p.revisao}${rascunho ? " (rascunho)" : p.confirmadoEm ? `, classificações confirmadas em ${p.confirmadoEm.slice(0, 10).split("-").reverse().join("/")}` : ""}` : "Revisão única",
    rascunho,
    totais,
    notasIncluidas: lote.notas.length,
    cobertura,
    naoCalculados: motivosNaoCalculados(lote.notas.flatMap((n) => n.itens)),
    premissas: p,
    aliquotas,
    versoes: { motor: lote.versaoMotor, tabelaMotor: lote.versaoTabelaMotor, tabelaAliquotas: lote.versaoTabelaAliquotas },
    avisos,
    linhas,
  };
}

function periodoDasNotas(notas: Pick<NotaLida, "data">[]): string {
  const d = notas.map((n) => n.data).filter(Boolean).sort();
  if (!d.length) return "não registrado";
  const br = (x: string) => x.split("-").reverse().join("/");
  return d[0] === d.at(-1) ? br(d[0]) : `${br(d[0])} a ${br(d.at(-1)!)}`;
}
