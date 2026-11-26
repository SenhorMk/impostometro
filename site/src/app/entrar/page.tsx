import type { Metadata } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { Entrar } from "@/components/Entrar";
import { Rodape } from "@/components/Rodape";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

/**
 * Entrar ou criar conta (T13): Google ou link por e-mail, pelo login do Supabase.
 * Sem SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY configuradas, a página só explica que as contas abrem em janeiro.
 */
export default function PaginaEntrar() {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-md px-4 py-16">
        <Entrar />
      </main>
      <Rodape />
    </>
  );
}
