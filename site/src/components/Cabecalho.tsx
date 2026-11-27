import Link from "next/link";
import { SITE } from "@/lib/config";

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-30 border-b border-tinta bg-papel/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="whitespace-nowrap font-serif text-xl font-semibold tracking-tight">{SITE.nome}</span>
          <span aria-hidden className="hidden border border-tinta px-1 font-mono text-[10px] leading-4 sm:inline">2027</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link href="/#como-funciona" className="text-suave hover:text-tinta">Como funciona</Link>
          <Link href="/imposto-2027" className="text-suave hover:text-tinta">Por setor</Link>
          <Link href="/artigos" className="text-suave hover:text-tinta">Guias</Link>
          <Link href="/glossario" className="text-suave hover:text-tinta">Glossário</Link>
          <Link href="/#perguntas" className="text-suave hover:text-tinta">Dúvidas</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/artigos" className="px-2 py-2 text-sm font-medium text-suave hover:text-tinta md:hidden">
            Guias
          </Link>
          <Link href="/entrar" className="hidden px-3 py-2 text-sm font-medium text-suave hover:text-tinta sm:block">
            Entrar
          </Link>
          <Link href="/#calculadora" className="botao-primario whitespace-nowrap px-3.5 py-2 text-sm">
            Calcular<span className="hidden sm:inline">&nbsp;grátis</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
