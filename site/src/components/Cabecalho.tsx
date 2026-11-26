import Link from "next/link";
import { SITE } from "@/lib/config";

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-30 border-b border-borda/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-marca-700 text-sm text-white">
            %
          </span>
          {SITE.nome}
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-suave md:flex">
          <Link href="/#como-funciona" className="hover:text-tinta">Como funciona</Link>
          <Link href="/imposto-2027" className="hover:text-tinta">Por setor</Link>
          <Link href="/artigos" className="hover:text-tinta">Guias</Link>
          <Link href="/glossario" className="hover:text-tinta">Glossário</Link>
          <Link href="/#perguntas" className="hover:text-tinta">Dúvidas</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/artigos" className="px-2 py-2 text-sm font-medium text-suave hover:text-tinta md:hidden">
            Guias
          </Link>
          <Link href="/entrar" className="hidden px-3 py-2 text-sm font-medium text-suave hover:text-tinta sm:block">
            Entrar
          </Link>
          <Link href="/#calculadora" className="botao-primario px-4 py-2 text-sm">
            Calcular grátis
          </Link>
        </div>
      </div>
    </header>
  );
}
