import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginaConteudo } from "@/components/Conteudo";
import { DadosEstruturados } from "@/components/DadosEstruturados";
import { ATIVIDADES, atividadePorId, calcularExemplo, EXEMPLO_PADRAO, explicarReducao } from "@/lib/exemplos";
import { dataBR, emPercentual, emReais } from "@/lib/formato";
import { URL_SITE } from "@/lib/seo";

/**
 * Páginas por setor ("imposto 2027 pizzaria", "CBS salão de beleza"...): uma por atividade
 * do dicionário "o que você vende?". O exemplo é calculado pelo porte no build.
 */
export function generateStaticParams() {
  return ATIVIDADES.map(({ id }) => ({ atividade: id }));
}

const nomeMinusculo = (nome: string) => nome.charAt(0).toLowerCase() + nome.slice(1);

export async function generateMetadata({ params }: PageProps<"/imposto-2027/[atividade]">): Promise<Metadata> {
  const atividade = atividadePorId((await params).atividade);
  if (!atividade) notFound();
  const resultado = await calcularExemplo(atividade.id);
  const resumo = resultado.ok
    ? `Numa venda de ${emReais(EXEMPLO_PADRAO.valor)}, CBS + IBS dão ${emReais(resultado.total)} (${emPercentual(resultado.percentualSobreVenda)}).`
    : "Veja por que a calculadora oficial não calcula este caso.";
  return {
    title: `Imposto de ${nomeMinusculo(atividade.nome)} em 2027: CBS e IBS`,
    description: `${resumo} Veja a alíquota, a redução do setor e a conta aberta, e simule com o seu valor. Grátis e sem cadastro.`,
    alternates: { canonical: `/imposto-2027/${atividade.id}` },
  };
}

export default async function ImpostoDoSetor({ params }: PageProps<"/imposto-2027/[atividade]">) {
  const atividade = atividadePorId((await params).atividade);
  if (!atividade) notFound();
  const resultado = await calcularExemplo(atividade.id);
  const nome = nomeMinusculo(atividade.nome);
  const parecidas = ATIVIDADES.filter((a) => a.cClassTrib === atividade.cClassTrib && a.id !== atividade.id).slice(0, 6);
  const codigo = atividade.tipo === "nbs" ? "NBS (código do serviço)" : "NCM (código do produto)";

  const perguntas = resultado.ok
    ? [
        {
          p: `Quanto ${nome} vai pagar de CBS e IBS em 2027?`,
          r: `Numa venda de ${emReais(resultado.base)} em ${EXEMPLO_PADRAO.cidade}, a calculadora dá ${emReais(resultado.cbs.valor)} de CBS e ${emReais(resultado.ibsTotal)} de IBS, total de ${emReais(resultado.total)} (${emPercentual(resultado.percentualSobreVenda)} do valor). ${explicarReducao(resultado.cbs.reducao, resultado.semAliquota)} A alíquota de 2027 ainda é ${resultado.periodoAliquotas.status === "provisorio" ? "provisória" : "a publicada"}, e o valor não desconta créditos de compras.`,
        },
        {
          p: `Qual código fiscal usar para ${nome}?`,
          r: `A simulação usa o ${codigo} ${atividade.codigo} e a classificação tributária (cClassTrib) ${atividade.cClassTrib}. Confirme com o seu contador se eles descrevem exatamente o que você vende.`,
        },
      ]
    : [];

  return (
    <PaginaConteudo
      titulo={`Imposto de ${nome} em 2027: quanto de CBS e IBS?`}
      descricao={`Exemplo calculado com a mesma conta da calculadora oficial da Receita Federal, com a alíquota usada, a redução do setor e a lei.`}
    >
      <nav aria-label="Você está em" className="mt-6 text-sm text-suave">
        <Link href="/" className="hover:text-tinta">Início</Link> ›{" "}
        <Link href="/imposto-2027" className="hover:text-tinta">Imposto 2027 por setor</Link> › <span className="text-tinta">{atividade.nome}</span>
      </nav>

      {resultado.ok ? (
        <section className="mt-8 overflow-hidden rounded-2xl border border-borda">
          <div className="bg-marca-900 p-6 text-white">
            <p className="text-sm text-marca-100">Venda de {emReais(resultado.base)} em {EXEMPLO_PADRAO.cidade}, em {dataBR(resultado.dataFatoGerador)}</p>
            <p className="mt-2 text-4xl font-bold">{emReais(resultado.total)}</p>
            <p className="text-sm text-marca-100">de CBS + IBS, ou {emPercentual(resultado.percentualSobreVenda)} do valor da venda</p>
          </div>
          <dl className="grid grid-cols-1 divide-y divide-borda text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-4"><dt className="text-suave">CBS (federal)</dt><dd className="mt-1 text-lg font-semibold">{emReais(resultado.cbs.valor)}</dd><dd className="text-xs text-suave">alíquota efetiva {emPercentual(resultado.cbs.aliquotaEfetiva)}</dd></div>
            <div className="p-4"><dt className="text-suave">IBS estadual (teste)</dt><dd className="mt-1 text-lg font-semibold">{emReais(resultado.ibsEstadual.valor)}</dd><dd className="text-xs text-suave">{emPercentual(resultado.ibsEstadual.aliquotaEfetiva)}</dd></div>
            <div className="p-4"><dt className="text-suave">IBS municipal (teste)</dt><dd className="mt-1 text-lg font-semibold">{emReais(resultado.ibsMunicipal.valor)}</dd><dd className="text-xs text-suave">{emPercentual(resultado.ibsMunicipal.aliquotaEfetiva)}</dd></div>
          </dl>
          <div className="border-t border-borda bg-fundo p-5 text-sm leading-relaxed">
            <p className="font-medium">{explicarReducao(resultado.cbs.reducao, resultado.semAliquota)}</p>
            <ul className="mt-3 space-y-1 text-suave">
              <li>Alíquota nominal da CBS: {emPercentual(resultado.cbs.aliquota)} ({resultado.periodoAliquotas.status === "provisorio" ? "provisória" : "publicada"}). {resultado.periodoAliquotas.explicacaoCbs}</li>
              {resultado.fundamentacao && <li>Fundamento legal: {resultado.fundamentacao} da Lei Complementar 214/2025.</li>}
              <li>Códigos usados: {codigo} {atividade.codigo} e cClassTrib {atividade.cClassTrib}.</li>
              <li>Calculadora oficial versão {resultado.versaoMotor}, tabela {resultado.versaoTabelaMotor}; nossa tabela de alíquotas {resultado.versaoTabelaAliquotas}.</li>
            </ul>
            {resultado.cbs.memoria && (
              <blockquote className="mt-4 border-l-2 border-marca-600 pl-3 text-xs italic text-suave">
                Memória de cálculo oficial: “{resultado.cbs.memoria}”
              </blockquote>
            )}
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-borda bg-fundo p-6">
          <p className="font-semibold">Não calculado</p>
          <p className="mt-2 text-suave">{resultado.mensagem}</p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight">O que muda para {nome} em 2027</h2>
        <p className="mt-4 leading-7 text-suave">
          A partir de janeiro de 2027, a CBS substitui o PIS e a Cofins. O IBS, que vai substituir o ICMS e o ISS, começa
          em teste com 0,1% e só cresce a partir de 2029. Por isso, em 2027 quase todo o imposto novo é CBS.
        </p>
        <p className="mt-4 leading-7 text-suave">
          O valor acima é o imposto destacado na venda. O que a empresa recolhe no mês pode ser menor, porque o novo
          sistema permite descontar créditos das compras (não cumulatividade). Empresas do Simples Nacional têm regras
          próprias, que esta simulação ainda não cobre.{" "}
          <Link href="/artigos/quanto-vou-pagar-em-2027" className="text-marca-800 underline underline-offset-4">Entenda a diferença</Link>.
        </p>
      </section>

      <section className="mt-10 rounded-2xl bg-marca-50 p-6">
        <h2 className="text-xl font-semibold">Calcule com o seu valor e a sua cidade</h2>
        <p className="mt-2 text-sm leading-relaxed text-suave">
          Digite “{atividade.sinonimos[0] ?? nome}” na calculadora, informe o valor da venda e a cidade. Grátis, sem
          cadastro e com a conta aberta.
        </p>
        <Link href="/#calculadora" className="botao-primario mt-4">Simular a minha venda</Link>
      </section>

      {parecidas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Atividades com o mesmo tratamento</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {parecidas.map((a) => (
              <li key={a.id}>
                <Link href={`/imposto-2027/${a.id}`} className="inline-block rounded-full border border-borda px-3 py-1.5 text-sm hover:border-marca-600">
                  {a.nome}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DadosEstruturados
        dados={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: new URL("/", URL_SITE).href },
              { "@type": "ListItem", position: 2, name: "Imposto 2027 por setor", item: new URL("/imposto-2027", URL_SITE).href },
              { "@type": "ListItem", position: 3, name: atividade.nome, item: new URL(`/imposto-2027/${atividade.id}`, URL_SITE).href },
            ],
          },
          ...(perguntas.length
            ? [{
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: perguntas.map(({ p, r }) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })),
              }]
            : []),
        ]}
      />
    </PaginaConteudo>
  );
}
