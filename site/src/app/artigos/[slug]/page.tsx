import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FontesConteudo, PaginaConteudo } from "@/components/Conteudo";
import { DadosEstruturados } from "@/components/DadosEstruturados";
import { ARTIGOS, artigoPorSlug } from "@/dados/conteudo";
import { SITE } from "@/lib/config";
import { URL_SITE } from "@/lib/seo";

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
    openGraph: { type: "article", title: artigo.titulo, description: artigo.descricao, modifiedTime: artigo.atualizadoEm, locale: "pt_BR", siteName: SITE.nome },
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
            <h2 className="font-serif text-3xl font-semibold tracking-tight">{secao.titulo}</h2>
            {secao.paragrafos.map((paragrafo) => <p key={paragrafo} className="mt-4 leading-7 text-suave">{paragrafo}</p>)}
            {secao.fontes && <FontesConteudo fontes={secao.fontes} />}
          </section>
        ))}
      </article>
      <DadosEstruturados
        dados={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: artigo.titulo,
            description: artigo.descricao,
            dateModified: artigo.atualizadoEm,
            inLanguage: "pt-BR",
            mainEntityOfPage: new URL(`/artigos/${artigo.slug}`, URL_SITE).href,
            publisher: { "@type": "Organization", name: SITE.nome },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: new URL("/", URL_SITE).href },
              { "@type": "ListItem", position: 2, name: "Guias da reforma", item: new URL("/artigos", URL_SITE).href },
              { "@type": "ListItem", position: 3, name: artigo.titulo, item: new URL(`/artigos/${artigo.slug}`, URL_SITE).href },
            ],
          },
        ]}
      />
    </PaginaConteudo>
  );
}
