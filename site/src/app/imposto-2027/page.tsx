import type { Metadata } from "next";
import Link from "next/link";
import { PaginaConteudo } from "@/components/Conteudo";
import { ATIVIDADES, calcularExemplo, EXEMPLO_PADRAO } from "@/lib/exemplos";
import { emPercentual, emReais } from "@/lib/formato";

export const metadata: Metadata = {
  title: "Imposto em 2027 por setor: CBS e IBS de cada atividade",
  description:
    "Veja quanto restaurantes, salões, clínicas, escolas, lojas e prestadores de serviço vão pagar de CBS e IBS em 2027, com a conta aberta.",
  alternates: { canonical: "/imposto-2027" },
};

/** Agrupa pelo que a calculadora devolveu (redução da CBS), nunca por um número escrito à mão. */
function grupo(reducao: number, semAliquota: boolean, ok: boolean): string {
  if (!ok) return "Não calculado pela calculadora oficial";
  if (semAliquota) return "Sem CBS e IBS";
  if (reducao >= 100) return "Alíquota zero";
  if (reducao > 0) return `Redução de ${reducao.toLocaleString("pt-BR")}% na alíquota`;
  return "Alíquota cheia";
}

export default async function ImpostoPorSetor() {
  const linhas = await Promise.all(ATIVIDADES.map(async (a) => ({ atividade: a, resultado: await calcularExemplo(a.id) })));
  // Ordem: alíquota cheia primeiro, depois as reduções em ordem crescente, alíquota zero e sem imposto.
  const ordem = (r: (typeof linhas)[number]["resultado"]) =>
    !r.ok ? 999 : r.semAliquota ? 500 : r.cbs.reducao;
  linhas.sort((a, b) => ordem(a.resultado) - ordem(b.resultado));
  const grupos = new Map<string, typeof linhas>();
  for (const linha of linhas) {
    const r = linha.resultado;
    const chave = r.ok ? grupo(r.cbs.reducao, r.semAliquota, true) : grupo(0, false, false);
    grupos.set(chave, [...(grupos.get(chave) ?? []), linha]);
  }

  return (
    <PaginaConteudo
      titulo="Imposto em 2027 por setor"
      descricao={`CBS + IBS sobre uma venda de ${emReais(EXEMPLO_PADRAO.valor)} em ${EXEMPLO_PADRAO.cidade}, calculados com a mesma conta da calculadora oficial. Escolha o seu setor para ver a conta completa.`}
    >
      {[...grupos].map(([titulo, itens]) => (
        <section key={titulo} className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">{titulo}</h2>
          <ul className="mt-4 divide-y divide-borda rounded-2xl border border-borda">
            {itens.map(({ atividade, resultado }) => (
              <li key={atividade.id}>
                <Link href={`/imposto-2027/${atividade.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-fundo">
                  <span>{atividade.nome}</span>
                  <span className="shrink-0 text-right text-sm">
                    {resultado.ok ? (
                      <>
                        <b>{emReais(resultado.total)}</b>{" "}
                        <span className="text-suave">({emPercentual(resultado.percentualSobreVenda)})</span>
                      </>
                    ) : (
                      <span className="text-suave">não calculado</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-6 text-sm text-suave">
        Valores antes de créditos de compras, com a alíquota de 2027 cadastrada na nossa tabela. Não vale para o Simples Nacional.
      </p>
    </PaginaConteudo>
  );
}
