import atividades from "../dados/atividades.json" with { type: "json" };

export type Atividade = (typeof atividades)[number];

/** Tira acentos e deixa minúsculo: "Pré-Escola" -> "pre-escola". */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

const indice = atividades.map((a) => ({
  atividade: a,
  nome: normalizar(a.nome),
  sinonimos: a.sinonimos.map(normalizar),
}));

/**
 * Busca "o que você vende?" (T10) no dicionário de atividades.
 * Pontua: começo do nome > palavra no nome > sinônimo. Todas as palavras digitadas precisam aparecer.
 */
export function buscarAtividades(consulta: string, limite = 6): Atividade[] {
  const q = normalizar(consulta);
  if (q.length < 2) return [];
  const palavras = q.split(/\s+/).filter(Boolean);

  return indice
    .map(({ atividade, nome, sinonimos }) => {
      const tudo = [nome, ...sinonimos].join(" | ");
      if (!palavras.every((p) => tudo.includes(p))) return null;
      let pontos = 0;
      if (nome.startsWith(q)) pontos += 100;
      else if (nome.includes(q)) pontos += 60;
      if (sinonimos.some((s) => s.startsWith(q))) pontos += 40;
      else if (sinonimos.some((s) => s.includes(q))) pontos += 20;
      return { atividade, pontos: pontos || 10 };
    })
    .filter((x): x is { atividade: Atividade; pontos: number } => x !== null)
    .sort((a, b) => b.pontos - a.pontos || a.atividade.nome.localeCompare(b.atividade.nome))
    .slice(0, limite)
    .map((x) => x.atividade);
}

export const SUGESTOES_INICIAIS = ["restaurante", "cabeleireiro", "contador", "pre-escola", "roupas", "dentista"]
  .map((id) => atividades.find((a) => a.id === id))
  .filter((a): a is Atividade => Boolean(a));
