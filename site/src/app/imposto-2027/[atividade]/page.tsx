import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginaConteudo } from "@/components/Conteudo";
import { DadosEstruturados } from "@/components/DadosEstruturados";
import { Recibo } from "@/components/inicio/Recibo";
import { ATIVIDADES, atividadePorId, calcularExemplo, EXEMPLO_PADRAO, explicarReducao } from "@/lib/exemplos";
import { emPercentual, emReais } from "@/lib/formato";
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

      <div className="mt-10">
        <Recibo resultado={resultado} atividade={atividade} cidade={EXEMPLO_PADRAO.cidade} />
      </div>

      {resultado.ok && (
        <section className="mt-10 border-t border-tinta pt-6">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">De onde vem cada número</h2>
          <dl className="mt-4 text-sm leading-relaxed">
            {[
              ["Redução", explicarReducao(resultado.cbs.reducao, resultado.semAliquota)],
              ["Alíquota da CBS", `${emPercentual(resultado.cbs.aliquota)} (${resultado.periodoAliquotas.status === "provisorio" ? "provisória" : "publicada"}). ${resultado.periodoAliquotas.explicacaoCbs}`],
              ...(resultado.fundamentacao ? [["Fundamento legal", `${resultado.fundamentacao} da Lei Complementar 214/2025.`]] : []),
              ["Códigos", `${codigo} ${atividade.codigo} e classificação tributária (cClassTrib) ${atividade.cClassTrib}.`],
              ["Versões", `Calculadora oficial ${resultado.versaoMotor}, tabela ${resultado.versaoTabelaMotor}; nossa tabela de alíquotas de ${resultado.versaoTabelaAliquotas}.`],
            ].map(([t, d]) => (
              <div key={t} className="grid gap-1 border-b border-borda py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <dt className="font-mono text-xs uppercase tracking-[0.1em] text-suave sm:pt-0.5">{t}</dt>
                <dd className="text-suave">{d}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">O que muda para {nome} em 2027</h2>
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

      <section className="mt-10 border border-tinta bg-white p-6">
        <h2 className="font-serif text-2xl font-semibold">Calcule com o seu valor e a sua cidade</h2>
        <p className="mt-2 text-sm leading-relaxed text-suave">
          Digite “{atividade.sinonimos[0] ?? nome}” na calculadora, informe o valor da venda e a cidade. Grátis, sem
          cadastro e com a conta aberta.
        </p>
        <Link href="/#calculadora" className="botao-primario mt-4">Simular a minha venda</Link>
      </section>

      {parecidas.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold">Atividades com o mesmo tratamento</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {parecidas.map((a) => (
              <li key={a.id}>
                <Link href={`/imposto-2027/${a.id}`} className="inline-block border border-tinta/30 px-3 py-1.5 text-sm hover:border-tinta">
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
