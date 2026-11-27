import type { Metadata } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { Historico } from "@/components/Historico";
import { Rodape } from "@/components/Rodape";

export const metadata: Metadata = { title: "Histórico de cálculos", robots: { index: false } };

/** Histórico de cálculos da conta (T18): simulações e lotes de XML, com as versões usadas. */
export default function PaginaHistorico() {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <Historico />
      </main>
      <Rodape />
    </>
  );
}
