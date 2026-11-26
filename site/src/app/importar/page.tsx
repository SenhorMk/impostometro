import type { Metadata } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { Importador } from "@/components/Importador";
import { Rodape } from "@/components/Rodape";

// Prévia da área de assinante (T16/T17). Fica fora do Google até o login e a assinatura (T13/T14) existirem.
export const metadata: Metadata = {
  title: "Importar notas (XML)",
  robots: { index: false },
};

export default function Importar() {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-sm font-medium text-marca-700">Prévia da área de assinante</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">CBS e IBS das notas do mês</h1>
        <p className="mt-2 text-suave">
          Envie os XMLs das suas notas de venda (NF-e e NFC-e) e veja o imposto da reforma em cada item, calculado pela
          calculadora oficial da Receita.
        </p>
        <p className="mt-3 rounded-xl bg-marca-50 p-3 text-sm text-marca-900">
          O arquivo da nota é lido aqui no seu navegador e não é enviado para nós. Para a conta, usamos só NCM, valor,
          quantidade, classificação, data e cidade de cada item. Nome, CPF e endereço do seu cliente são ignorados.
        </p>
        <div className="mt-8">
          <Importador />
        </div>
      </main>
      <Rodape />
    </>
  );
}
