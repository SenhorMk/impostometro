import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FontesConteudo, PaginaConteudo } from "@/components/Conteudo";
import { ARTIGOS, artigoPorSlug } from "@/dados/conteudo";

export function generateStaticParams() {
  return ARTIGOS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/artigos/[slug]">): Promise<Metadata> {
  const artigo = artigoPorSlug((await params).slug);
  if (!artigo) notFound();
  return {
    title: artigo.titulo,
    description: artigo.descricao,
    alternates: { canonical: `/artigos/${artigo.slug}` },
  };
}

export default async function Artigo({ params }: PageProps<"/artigos/[slug]">) {
  const artigo = artigoPorSlug((await params).slug);
  if (!artigo) notFound();

  return (
    <PaginaConteudo titulo={artigo.titulo} descricao={artigo.descricao}>
      <article className="mt-8">
        <p className="text-sm text-suave">Revisão editorial: <time dateTime={artigo.atualizadoEm}>{artigo.atualizadoEm.split("-").reverse().join("/")}</time></p>
        {artigo.secoes.map((secao) => (
          <section key={secao.titulo} className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight">{secao.titulo}</h2>
            {secao.paragrafos.map((paragrafo) => <p key={paragrafo} className="mt-4 leading-7 text-suave">{paragrafo}</p>)}
            {secao.fontes && <FontesConteudo fontes={secao.fontes} />}
          </section>
        ))}
      </article>
    </PaginaConteudo>
  );
}
