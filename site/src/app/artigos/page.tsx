import type { Metadata } from "next";
import Link from "next/link";
import { PaginaConteudo } from "@/components/Conteudo";
import { ARTIGOS } from "@/dados/conteudo";

export const metadata: Metadata = {
  title: "Guias da reforma tributária",
  description: "Cinco guias sobre CBS, IBS, Simples Nacional, cClassTrib e a transição de 2026 a 2033, com fontes oficiais.",
  alternates: { canonical: "/artigos" },
};

export default function Artigos() {
  return (
    <PaginaConteudo titulo="Guias da reforma tributária" descricao="Entenda os termos e confira o que considerar antes de simular uma venda.">
      <ul className="mt-10 grid gap-5">
        {ARTIGOS.map((artigo) => (
          <li key={artigo.slug} className="rounded-2xl border border-borda p-6">
            <h2 className="font-serif text-2xl font-semibold"><Link href={`/artigos/${artigo.slug}`} className="underline decoration-borda underline-offset-4 hover:decoration-tinta">{artigo.titulo}</Link></h2>
            <p className="mt-3 leading-relaxed text-suave">{artigo.descricao}</p>
          </li>
        ))}
      </ul>
    </PaginaConteudo>
  );
}
