import type { Metadata } from "next";
import { FontesConteudo, PaginaConteudo } from "@/components/Conteudo";
import { GLOSSARIO } from "@/dados/conteudo";

export const metadata: Metadata = {
  title: "Glossário de CBS, IBS e reforma tributária",
  description: "O significado de CBS, IBS, IS, crédito, não cumulatividade, split payment e alíquota de referência, com fontes oficiais.",
  alternates: { canonical: "/glossario" },
};

export default function Glossario() {
  return (
    <PaginaConteudo titulo="Glossário da reforma tributária" descricao="Os termos usados na simulação, em linguagem simples.">
      <nav aria-label="Termos do glossário" className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-marca-800">
        {GLOSSARIO.map(({ id, termo }) => <a key={id} href={`#${id}`} className="underline underline-offset-4">{termo}</a>)}
      </nav>
      <dl className="mt-10 space-y-8">
        {GLOSSARIO.map(({ id, termo, definicao, fontes }) => (
          <div key={id} id={id} className="scroll-mt-24 border-t border-borda pt-6">
            <dt className="text-2xl font-semibold">{termo}</dt>
            <dd className="mt-3 leading-7 text-suave">
              <p>{definicao}</p>
              <FontesConteudo fontes={fontes} />
            </dd>
          </div>
        ))}
      </dl>
    </PaginaConteudo>
  );
}
