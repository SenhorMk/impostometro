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
          <a href="#como-funciona" className="hover:text-tinta">Como funciona</a>
          <a href="#o-que-muda" className="hover:text-tinta">O que muda em 2027</a>
          <a href="#planos" className="hover:text-tinta">Planos</a>
          <a href="#perguntas" className="hover:text-tinta">Dúvidas</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/entrar" className="hidden px-3 py-2 text-sm font-medium text-suave hover:text-tinta sm:block">
            Entrar
          </Link>
          <a href="#calculadora" className="botao-primario px-4 py-2 text-sm">
            Calcular grátis
          </a>
        </div>
      </div>
    </header>
  );
}
