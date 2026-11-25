import type { Metadata } from "next";
import Link from "next/link";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

/**
 * Porta de entrada das contas (T13). Por enquanto só explica que as contas abrem em janeiro:
 * o login com Google e link por e-mail (Supabase) entra quando o projeto Supabase existir.
 */
export default function Entrar() {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-md px-4 py-16">
        <div className="rounded-3xl border border-borda p-7 text-center">
          <p className="text-sm font-medium text-marca-700">Contas de assinante</p>
          <h1 className="mt-2 text-2xl font-bold">As contas abrem em janeiro de 2027</h1>
          <p className="mt-3 text-sm leading-relaxed text-suave">
            Com a conta você vai poder enviar o XML das notas do mês e ver a CBS e o IBS de todas as vendas, com
            histórico. Vai ser só entrar com o Google ou com um link enviado para o seu e-mail, sem senha nova.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-suave">Enquanto isso, a simulação continua grátis e sem cadastro.</p>
          <Link href="/#calculadora" className="botao-primario mt-6 w-full">
            Fazer uma simulação grátis
          </Link>
        </div>
      </main>
      <Rodape />
    </>
  );
}
