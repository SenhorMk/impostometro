import Link from "next/link";
import type { ReactNode } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { FONTES, type Fonte } from "@/dados/conteudo";

export function FontesConteudo({ fontes }: { fontes: Fonte[] }) {
  return (
    <ul className="mt-4 space-y-2 text-sm text-suave" aria-label="Fontes oficiais">
      {fontes.map((fonte) => (
        <li key={fonte}>
          Fonte: <a href={FONTES[fonte].url} className="underline underline-offset-4 hover:text-marca-700">{FONTES[fonte].titulo}</a>
        </li>
      ))}
    </ul>
  );
}

export function PaginaConteudo({ titulo, descricao, children }: {
  titulo: string;
  descricao: string;
  children: ReactNode;
}) {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
        <nav aria-label="Navegação do conteúdo" className="mb-8 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-[0.1em] text-suave">
          <Link href="/artigos" className="underline underline-offset-4">Guias da reforma</Link>
          <Link href="/imposto-2027" className="underline underline-offset-4">Imposto 2027 por setor</Link>
          <Link href="/glossario" className="underline underline-offset-4">Glossário</Link>
        </nav>
        <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">{titulo}</h1>
        <p className="mt-4 text-lg leading-relaxed text-suave">{descricao}</p>
        {children}
        <aside className="mt-10 border-l-2 border-tinta pl-4 text-sm leading-relaxed text-suave">
          Conteúdo educativo. A revisão por contador está pendente. Confirme o enquadramento e as regras vigentes antes de emitir notas ou tomar decisões tributárias. Este site não é do governo.
        </aside>
        <div className="mt-8 border-t border-borda pt-8">
          <p className="mb-4 text-suave">Veja as premissas e a memória de cálculo de uma venda.</p>
          <Link href="/#calculadora" className="botao-primario">Simular CBS e IBS grátis</Link>
        </div>
      </main>
      <Rodape />
    </>
  );
}
