import type { Metadata } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import Link from "next/link";
import { VERSAO_TERMOS } from "@/lib/contas";
import { MESES_INATIVIDADE } from "@/lib/privacidade";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Termos de uso",
  alternates: { canonical: "/termos" },
};

// RASCUNHO (T21): revisar com advogado antes do lançamento.
export default function Termos() {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-2xl px-4 py-14 text-sm leading-relaxed text-suave [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-tinta">
        <h1 className="text-3xl font-bold text-tinta">Termos de uso</h1>
        <p className="mt-2">Versão {VERSAO_TERMOS} (28 de novembro de 2026). Ainda não revisada por advogado.</p>
        <h2>O que é o {SITE.nome}</h2>
        <p>
          Um site independente que simula a CBS e o IBS da reforma tributária usando a calculadora de tributos
          publicada pela Receita Federal do Brasil como software livre (licença MIT). Não somos um órgão público e não
          temos ligação com a Receita Federal.
        </p>
        <h2>Simulação, não orientação fiscal</h2>
        <p>
          Os resultados são estimativas feitas com as alíquotas e regras disponíveis na data do cálculo, que podem
          mudar. Eles não substituem a análise de um contador e não devem ser usados sozinhos para emitir documentos
          fiscais ou recolher tributos.
        </p>
        <h2>Transparência</h2>
        <p>
          Cada resultado mostra a alíquota usada, sua fonte, a redução aplicada, a fundamentação legal devolvida pela
          calculadora oficial e a versão da calculadora. Quando a calculadora oficial não calcula um item, informamos o
          motivo e não exibimos valor.
        </p>
        <h2>Sua conta e seus dados</h2>
        <p>
          Para usar a conta você aceita estes termos e a{" "}
          <Link href="/privacidade" className="text-marca-700 underline">
            política de privacidade
          </Link>
          , que explica cada dado guardado, por quê e por quanto tempo. Você pode baixar uma cópia dos seus dados e apagar a conta a
          qualquer momento em Minha conta. Contas sem nenhum acesso há {MESES_INATIVIDADE} meses e sem assinatura ativa são apagadas
          automaticamente. Use a importação só com notas da sua empresa ou de quem autorizou você.
        </p>
        <h2>Mudanças nos termos</h2>
        <p>
          Quando estes termos ou a política de privacidade mudarem de forma relevante, a versão acima muda e quem tem conta é avisado para
          ler e aceitar a nova versão.
        </p>
        <h2>Licença da calculadora oficial</h2>
        <p>
          Calculadora de tributos: Copyright © 2026 Receita Federal do Brasil, distribuída sob a licença MIT. Usamos a
          mesma lógica e as mesmas tabelas da versão oficial, traduzidas para a linguagem do site (TypeScript) sob a
          mesma licença. Antes de cada atualização, a tradução é conferida contra a calculadora oficial e precisa dar
          resultados idênticos.
        </p>
      </main>
      <Rodape />
    </>
  );
}
