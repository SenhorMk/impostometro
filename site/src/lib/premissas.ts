/**
 * Premissas e classificações (T35): o que veio da nota, o que é sugestão nossa e o que a pessoa confirmou.
 *
 * Regras:
 *  - "000001" (tributação integral) é só uma SUGESTÃO até a pessoa confirmar. Nunca aparece como validado.
 *  - A escolha vale para um CONTEXTO: NCM + CFOP (o mesmo produto pode ter tratamento diferente
 *    numa venda normal e numa remessa, por exemplo). Não existe "este NCM é sempre X".
 *  - Escolhas confirmadas podem ser reaproveitadas na próxima vez, mas só para a MESMA empresa,
 *    e voltam como "usada antes": a pessoa confere e confirma de novo.
 *  - Itens com classificação não confirmada deixam o resultado como RASCUNHO.
 *  - Mudar uma classificação gera uma nova revisão; a anterior não é apagada.
 *
 * Só funções puras (testadas em premissas.test.ts). Nada aqui muda o motor.
 */
import type { ItemNota, NotaLida } from "./nfe.ts";

export type OrigemClassificacao = "nota" | "confirmada" | "sugerida";

export const SUGESTAO_PADRAO = "000001";

/** Contexto em que uma classificação vale: NCM + CFOP. */
export const contextoDoItem = (i: Pick<ItemNota, "ncm" | "cfop">) => `${i.ncm}|${i.cfop || "sem CFOP"}`;

export const ncmValido = (ncm: string) => /^\d{8}$/.test(ncm);
export const precisaClassificar = (i: ItemNota) => !i.cClassTrib && ncmValido(i.ncm);

/** Origem de cada linha na tela de conferência, antes de calcular. */
export type OrigemSugestao = "escolhida" | "usada_antes" | "sugestao";

export function valorDoContexto(
  contexto: string,
  escolhas: Record<string, string>,
  memoria: Record<string, string>,
): { codigo: string; origem: OrigemSugestao } {
  if (escolhas[contexto]) return { codigo: escolhas[contexto], origem: "escolhida" };
  if (memoria[contexto]) return { codigo: memoria[contexto], origem: "usada_antes" };
  return { codigo: SUGESTAO_PADRAO, origem: "sugestao" };
}

/**
 * Carimba em cada item a classificação usada e de onde ela veio.
 * confirmado = a pessoa marcou "conferi e confirmo"; sem isso, o que não veio da nota fica "sugerida".
 */
export function aplicarClassificacoes(
  notas: NotaLida[],
  codigoDe: (contexto: string) => string,
  confirmado: boolean,
): NotaLida[] {
  return notas.map((n) => ({
    ...n,
    itens: n.itens.map((i) => {
      if (i.cClassTrib) return { ...i, classificacaoUsada: i.cClassTrib, origemClassificacao: "nota" as const };
      if (!ncmValido(i.ncm)) return i; // não vai para o cálculo (sem NCM válido)
      return { ...i, classificacaoUsada: codigoDe(contextoDoItem(i)), origemClassificacao: confirmado ? ("confirmada" as const) : ("sugerida" as const) };
    }),
  }));
}

export type Premissas = {
  revisao: number;
  /** quando a pessoa confirmou as classificações; null = rascunho */
  confirmadoEm: string | null;
  itensDaNota: number;
  itensConfirmados: number;
  itensSugeridos: number;
  itensBaseEstimada: number;
  /** escolhas por contexto (NCM|CFOP → cClassTrib), para conferir e para comparar revisões */
  classificacoes: Record<string, { codigo: string; origem: OrigemClassificacao }>;
};

export function resumirPremissas(notas: NotaLida[], revisao: number, confirmadoEm: string | null): Premissas {
  const p: Premissas = { revisao, confirmadoEm, itensDaNota: 0, itensConfirmados: 0, itensSugeridos: 0, itensBaseEstimada: 0, classificacoes: {} };
  for (const n of notas)
    for (const i of n.itens) {
      if (i.origemBase === "estimada") p.itensBaseEstimada++;
      if (!i.origemClassificacao || !i.classificacaoUsada) continue;
      if (i.origemClassificacao === "nota") p.itensDaNota++;
      else {
        if (i.origemClassificacao === "confirmada") p.itensConfirmados++;
        else p.itensSugeridos++;
        p.classificacoes[contextoDoItem(i)] = { codigo: i.classificacaoUsada, origem: i.origemClassificacao };
      }
    }
  return p;
}

/** Rascunho: há item com classificação só sugerida. O total não pode aparecer como revisado. */
export const ehRascunho = (p: Premissas | undefined) => Boolean(p && p.itensSugeridos > 0);

/** O que mudou de uma revisão para a outra (contextos com classificação diferente). */
export function mudancasEntre(antes: Premissas, depois: Premissas): { contexto: string; de: string; para: string }[] {
  const contextos = new Set([...Object.keys(antes.classificacoes), ...Object.keys(depois.classificacoes)]);
  const r: { contexto: string; de: string; para: string }[] = [];
  for (const c of [...contextos].sort()) {
    const de = antes.classificacoes[c]?.codigo ?? "—";
    const para = depois.classificacoes[c]?.codigo ?? "—";
    if (de !== para) r.push({ contexto: c, de, para });
  }
  return r;
}

/** "61091000|5102" → "NCM 61091000 · CFOP 5102" */
export function contextoLegivel(contexto: string): string {
  const [ncm, cfop] = contexto.split("|");
  return `NCM ${ncm} · ${cfop === "sem CFOP" ? "sem CFOP" : `CFOP ${cfop}`}`;
}

// ---------- Memória de escolhas confirmadas, por empresa (no navegador) ----------

type Armazenamento = Pick<Storage, "getItem" | "setItem">;
const chaveMemoria = (empresa: string) => `calcula-reforma:classificacoes:${empresa}`;
const CODIGO = /^\d{6}$/;

/** Escolhas confirmadas antes para ESTA empresa. Sem empresa identificada, nada é reaproveitado. */
export function lerMemoria(empresa: string, armazenamento?: Armazenamento | null): Record<string, string> {
  if (!/^\d{11,14}$/.test(empresa) || !armazenamento) return {};
  try {
    const bruto = JSON.parse(armazenamento.getItem(chaveMemoria(empresa)) ?? "{}");
    if (!bruto || typeof bruto !== "object") return {};
    return Object.fromEntries(Object.entries(bruto).filter(([k, v]) => /^\d{8}\|/.test(k) && typeof v === "string" && CODIGO.test(v))) as Record<string, string>;
  } catch {
    return {};
  }
}

/** Guarda só o que foi CONFIRMADO, só para esta empresa. Sugestão nunca vira memória. */
export function guardarMemoria(empresa: string, premissas: Premissas, armazenamento?: Armazenamento | null): void {
  if (!/^\d{11,14}$/.test(empresa) || !armazenamento || !premissas.confirmadoEm) return;
  const atual = lerMemoria(empresa, armazenamento);
  for (const [contexto, c] of Object.entries(premissas.classificacoes)) if (c.origem === "confirmada") atual[contexto] = c.codigo;
  try {
    armazenamento.setItem(chaveMemoria(empresa), JSON.stringify(atual));
  } catch {
    // navegador sem espaço ou em modo privado: só não lembra da próxima vez
  }
}
