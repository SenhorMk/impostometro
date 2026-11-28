/**
 * Preparar a análise das notas (T34): decidir o que entra na soma e mostrar o que ficou de fora.
 *
 * Roda no NAVEGADOR, sobre as notas que o leitor (nfe.ts) já abriu. Não calcula imposto
 * nem mexe no motor: só separa, conta e explica.
 *
 * Ordem das regras (cada nota fica de fora por UM motivo, o primeiro que valer):
 *  1. repetida: mesma chave de acesso de uma nota já aceita (inclusive de um envio anterior);
 *  2. cancelada ou denegada: pelo protocolo da própria nota ou por um XML de evento de cancelamento;
 *  3. outra empresa: CNPJ do emitente diferente da empresa escolhida;
 *  4. fora do período: mês da emissão diferente do mês escolhido;
 *  5. limite: passou do número de notas ou de itens permitido por lote.
 *
 * Pendências (a nota entra, mas a pessoa precisa saber): nota sem protocolo de autorização,
 * situação desconhecida, evento que não sabemos tratar, evento de nota que não foi enviada e
 * buracos na numeração (pode faltar nota). Nada disso é escondido.
 */
import type { EventoNota, NotaLida } from "./nfe.ts";

export type MotivoFora = "repetida" | "cancelada" | "denegada" | "outra_empresa" | "fora_do_periodo" | "limite";

export type NotaFora = { arquivo: string; chave: string; numero: string; motivo: MotivoFora; explicacao: string };
export type Pendencia = { arquivo: string; explicacao: string };
export type Lacuna = { modelo: string; serie: string; faltando: number; exemplos: string[] };

/** empresa: CNPJ/CPF do emitente; periodo: "AAAA-MM". null = escolher sozinho (o mais comum). "todos" = sem filtro. */
export type Escopo = { empresa: string | null | "todas"; periodo: string | null | "todos" };

export type Preparo = {
  aceitas: NotaLida[];
  fora: NotaFora[];
  pendencias: Pendencia[];
  lacunas: Lacuna[];
  /** Empresas e meses encontrados, para a pessoa escolher. */
  empresas: { doc: string; notas: number }[];
  periodos: { periodo: string; notas: number }[];
  /** O escopo que valeu de verdade (depois de escolher o mais comum). */
  escopo: { empresa: string | "todas"; periodo: string | "todos" };
  /** Datas de emissão das notas aceitas (primeira e última). */
  datas: { primeira: string; ultima: string } | null;
  itens: number;
  /** true quando há motivo para NÃO tratar a soma como o período inteiro. */
  parcial: boolean;
  motivosParcial: string[];
};

export const LIMITE_ITENS_POR_LOTE = 20_000;

const NOME_MOTIVO: Record<MotivoFora, [string, string]> = {
  repetida: ["repetida", "repetidas"],
  cancelada: ["cancelada", "canceladas"],
  denegada: ["denegada", "denegadas"],
  outra_empresa: ["de outra empresa", "de outra empresa"],
  fora_do_periodo: ["fora do período", "fora do período"],
  limite: ["acima do limite", "acima do limite"],
};
/** "2 repetidas", "1 cancelada" */
export const nomeDoMotivo = (m: MotivoFora, quantidade: number) => `${quantidade} ${NOME_MOTIVO[m][quantidade === 1 ? 0 : 1]}`;

/** "12345678000190" → "12.345.678/0001-90"; CPF fica mascarado no meio. */
export function documentoLegivel(doc: string): string {
  if (/^\d{14}$/.test(doc)) return `${doc.slice(0, 2)}.${doc.slice(2, 5)}.${doc.slice(5, 8)}/${doc.slice(8, 12)}-${doc.slice(12)}`;
  if (/^\d{11}$/.test(doc)) return `CPF ***.${doc.slice(3, 6)}.${doc.slice(6, 9)}-**`;
  return doc || "sem identificação";
}

/** "2027-03" → "março de 2027" */
export function mesLegivel(periodo: string): string {
  const [a, m] = periodo.split("-").map(Number);
  const nomes = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return nomes[m - 1] ? `${nomes[m - 1]} de ${a}` : periodo;
}

function contar<T>(lista: T[], chave: (x: T) => string): { valor: string; n: number }[] {
  const m = new Map<string, number>();
  for (const x of lista) m.set(chave(x), (m.get(chave(x)) ?? 0) + 1);
  // mais comum primeiro; empate: ordem alfabética (para o resultado não depender da ordem dos arquivos)
  return [...m].map(([valor, n]) => ({ valor, n })).sort((a, b) => b.n - a.n || a.valor.localeCompare(b.valor));
}

/** Buracos na numeração de cada modelo/série (ex.: 101, 102, 105 → faltam 103 e 104). */
export function lacunasNaNumeracao(notas: NotaLida[], maxExemplos = 5): Lacuna[] {
  const grupos = new Map<string, number[]>();
  for (const n of notas) {
    const num = Number(n.numero);
    if (!Number.isInteger(num) || num <= 0) continue;
    const k = `${n.modelo}|${n.serie}`;
    grupos.set(k, [...(grupos.get(k) ?? []), num]);
  }
  const lacunas: Lacuna[] = [];
  for (const [k, nums] of grupos) {
    const ord = [...new Set(nums)].sort((a, b) => a - b);
    const exemplos: string[] = [];
    let faltando = 0;
    for (let i = 1; i < ord.length; i++) {
      const buraco = ord[i] - ord[i - 1] - 1;
      if (buraco <= 0) continue;
      faltando += buraco;
      for (let x = ord[i - 1] + 1; x < ord[i] && exemplos.length < maxExemplos; x++) exemplos.push(String(x));
    }
    if (faltando > 0) {
      const [modelo, serie] = k.split("|");
      lacunas.push({ modelo, serie, faltando, exemplos });
    }
  }
  return lacunas.sort((a, b) => b.faltando - a.faltando);
}

export function prepararAnalise(entrada: {
  lidas: NotaLida[];
  eventos?: EventoNota[];
  escopo?: Escopo;
  limiteNotas: number;
  limiteItens?: number;
  /** arquivos que nem viraram nota (XML inválido, NFS-e, entrada...), só para a mensagem de cobertura */
  arquivosNaoLidos?: number;
}): Preparo {
  const { lidas, eventos = [], limiteNotas, limiteItens = LIMITE_ITENS_POR_LOTE } = entrada;
  const escopoPedido = entrada.escopo ?? { empresa: null, periodo: null };
  const fora: NotaFora[] = [];
  const pendencias: Pendencia[] = [];
  const sair = (n: NotaLida, motivo: MotivoFora, explicacao: string) =>
    fora.push({ arquivo: n.arquivo, chave: n.chave, numero: n.numero, motivo, explicacao });

  // 1. Repetidas. Nota sem chave não tem como ser conferida: entra, mas vira pendência.
  const unicas: NotaLida[] = [];
  const vistas = new Map<string, string>();
  for (const n of lidas) {
    if (!n.chave) {
      pendencias.push({ arquivo: n.arquivo, explicacao: "A nota não tem chave de acesso: não dá para conferir se ela se repete." });
      unicas.push(n);
      continue;
    }
    const primeira = vistas.get(n.chave);
    if (primeira !== undefined) sair(n, "repetida", `Mesma chave de acesso do arquivo ${primeira}. Entra na soma uma vez só.`);
    else {
      vistas.set(n.chave, n.arquivo);
      unicas.push(n);
    }
  }

  // 2. Canceladas e denegadas (protocolo da nota ou evento de cancelamento enviado junto).
  const canceladasPorEvento = new Map<string, EventoNota>();
  const chavesEnviadas = new Set(unicas.map((n) => n.chave));
  for (const e of eventos) {
    if (!chavesEnviadas.has(e.chave)) {
      pendencias.push({ arquivo: e.arquivo, explicacao: `${e.descricao} de uma nota que não está entre os arquivos enviados.` });
    } else if (e.cancelamento) canceladasPorEvento.set(e.chave, e);
    else pendencias.push({ arquivo: e.arquivo, explicacao: `${e.descricao}: este tipo de evento ainda não é tratado e não muda a soma. Confira com o seu contador.` });
  }
  const validas: NotaLida[] = [];
  for (const n of unicas) {
    const a = n.autorizacao;
    const evento = canceladasPorEvento.get(n.chave);
    if (evento) sair(n, "cancelada", `Cancelada (evento no arquivo ${evento.arquivo}).`);
    else if (a.situacao === "cancelada") sair(n, "cancelada", `Cancelada segundo o protocolo da própria nota (código ${a.codigo}).`);
    else if (a.situacao === "denegada") sair(n, "denegada", `Uso denegado pela SEFAZ (código ${a.codigo}): a nota não vale.`);
    else {
      if (a.situacao === "sem_protocolo")
        pendencias.push({ arquivo: n.arquivo, explicacao: "Sem o protocolo de autorização da SEFAZ no arquivo: não dá para saber se a nota foi autorizada ou cancelada depois." });
      else if (a.situacao === "outra") pendencias.push({ arquivo: n.arquivo, explicacao: `Situação da nota não reconhecida (código ${a.codigo}: ${a.descricao}).` });
      validas.push(n);
    }
  }

  // 3. Empresa: a escolhida, ou a que mais aparece.
  const empresas = contar(validas, (n) => n.emitente).map(({ valor, n }) => ({ doc: valor, notas: n }));
  let empresa = escopoPedido.empresa;
  if (empresa === null || (empresa !== "todas" && !empresas.some((e) => e.doc === empresa))) empresa = empresas[0]?.doc ?? "todas";
  const daEmpresa = validas.filter((n) => {
    if (empresa === "todas" || n.emitente === empresa) return true;
    sair(n, "outra_empresa", `Emitida por ${documentoLegivel(n.emitente)}, não por ${documentoLegivel(empresa!)}.`);
    return false;
  });

  // 4. Período (mês da emissão).
  const periodos = contar(daEmpresa, (n) => n.data.slice(0, 7)).map(({ valor, n }) => ({ periodo: valor, notas: n }));
  let periodo = escopoPedido.periodo;
  if (periodo === null || (periodo !== "todos" && !periodos.some((p) => p.periodo === periodo))) periodo = periodos[0]?.periodo ?? "todos";
  const doPeriodo = daEmpresa.filter((n) => {
    if (periodo === "todos" || n.data.startsWith(periodo!)) return true;
    sair(n, "fora_do_periodo", `Emitida em ${n.data.split("-").reverse().join("/")}, fora de ${mesLegivel(periodo!)}.`);
    return false;
  });

  // 5. Limites do lote.
  const aceitas: NotaLida[] = [];
  let itens = 0;
  for (const n of doPeriodo) {
    if (aceitas.length >= limiteNotas) sair(n, "limite", `Passou do limite de ${limiteNotas} notas por lote.`);
    else if (itens + n.itens.length > limiteItens) sair(n, "limite", `Passou do limite de ${limiteItens.toLocaleString("pt-BR")} itens por lote.`);
    else {
      aceitas.push(n);
      itens += n.itens.length;
    }
  }

  const lacunas = lacunasNaNumeracao(aceitas);
  const datas = aceitas.length === 0 ? null : { primeira: aceitas.map((n) => n.data).sort()[0], ultima: aceitas.map((n) => n.data).sort().at(-1)! };

  const motivosParcial: string[] = [];
  const faltando = lacunas.reduce((s, l) => s + l.faltando, 0);
  if (faltando > 0) motivosParcial.push(`há ${faltando} ${faltando === 1 ? "número de nota faltando" : "números de nota faltando"} na sequência`);
  const semProtocolo = pendencias.filter((p) => p.explicacao.startsWith("Sem o protocolo")).length;
  if (semProtocolo > 0) motivosParcial.push(`${semProtocolo} ${semProtocolo === 1 ? "nota não tem" : "notas não têm"} protocolo de autorização`);
  const noLimite = fora.filter((f) => f.motivo === "limite").length;
  if (noLimite > 0) motivosParcial.push(`${noLimite} ${noLimite === 1 ? "nota ficou" : "notas ficaram"} de fora pelo limite do lote`);
  if ((entrada.arquivosNaoLidos ?? 0) > 0)
    motivosParcial.push(`${entrada.arquivosNaoLidos} ${entrada.arquivosNaoLidos === 1 ? "arquivo não foi lido" : "arquivos não foram lidos"}`);
  if (periodo === "todos" && periodos.length > 1) motivosParcial.push("as notas são de meses diferentes");

  return {
    aceitas,
    fora,
    pendencias,
    lacunas,
    empresas,
    periodos,
    escopo: { empresa, periodo },
    datas,
    itens,
    // Nunca dá para provar que o mês está completo só com os arquivos enviados; "parcial" é quando há sinal concreto de falta.
    parcial: motivosParcial.length > 0,
    motivosParcial,
  };
}

/** Itens que não foram calculados, agrupados pelo motivo, para mostrar quantos e por quê. */
export function motivosNaoCalculados(itens: { ok: boolean; mensagem?: string }[]): { motivo: string; quantidade: number }[] {
  return contar(
    itens.filter((i) => !i.ok),
    (i) => i.mensagem || "Motivo não informado.",
  ).map(({ valor, n }) => ({ motivo: valor, quantidade: n }));
}
