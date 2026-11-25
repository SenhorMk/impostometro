import type { Metadata } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";

export const metadata: Metadata = {
  title: "Privacidade",
  alternates: { canonical: "/privacidade" },
};

// RASCUNHO (T21): revisar com advogado antes do lançamento e atualizar quando as contas abrirem.
export default function Privacidade() {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-2xl px-4 py-14 text-sm leading-relaxed text-suave [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-tinta">
        <h1 className="text-3xl font-bold text-tinta">Política de privacidade</h1>
        <p className="mt-2">Versão preliminar de novembro de 2026.</p>
        <h2>Simulação grátis</h2>
        <p>
          A simulação não pede nome, e-mail, CPF nem CNPJ. O que você digita (atividade, valor e cidade) é enviado para
          a calculadora só para fazer a conta e não é guardado com nenhum dado que identifique você. O estado e a
          cidade escolhidos ficam salvos apenas no seu navegador, para facilitar a próxima simulação.
        </p>
        <h2>Contas de assinante (a partir de 2027)</h2>
        <p>
          Quando as contas abrirem, guardaremos o mínimo necessário: e-mail, dados da empresa que você informar e o
          histórico de cálculos. Os XMLs das notas serão lidos e apagados logo em seguida, e dados de consumidores
          finais (como CPF e nome) serão ignorados, conforme a LGPD.
        </p>
        <h2>Seus direitos</h2>
        <p>Você poderá pedir acesso, correção ou exclusão dos seus dados a qualquer momento, inclusive apagando a conta.</p>
      </main>
      <Rodape />
    </>
  );
}
