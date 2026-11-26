import type { Metadata } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { Conta } from "@/components/Conta";
import { Rodape } from "@/components/Rodape";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };

/** Minha conta (T13 e T15): aceite dos termos, empresa, sair e apagar a conta. */
export default function PaginaConta() {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <Conta />
      </main>
      <Rodape />
    </>
  );
}
