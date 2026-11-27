import type { Metadata } from "next";
import Link from "next/link";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contato",
  description: `Fale com o ${SITE.nome}: dúvidas sobre a assinatura, a conta ou os cálculos.`,
  alternates: { canonical: "/contato" },
};

/**
 * Contato (checklist de lançamento, T22). O e-mail vem de CONTATO_EMAIL (Vercel), para
 * não deixar o e-mail pessoal de ninguém no código. Sem a variável, a página diz que o
 * canal abre junto com as contas.
 */
export default function Contato() {
  const email = process.env.CONTATO_EMAIL?.trim();
  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-2xl px-4 py-14 text-sm leading-relaxed text-suave [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-tinta">
        <h1 className="text-3xl font-bold text-tinta">Contato</h1>
        {email ? (
          <p className="mt-4 text-base">
            Escreva para{" "}
            <a href={`mailto:${email}`} className="font-medium text-marca-700 underline">
              {email}
            </a>
            . Respondemos em até 2 dias úteis.
          </p>
        ) : (
          <p className="mt-4 text-base">O e-mail de atendimento abre junto com as contas de assinante, em janeiro de 2027.</p>
        )}
        <h2>Antes de escrever</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-tinta">Dúvida sobre um valor?</strong> Abra &quot;como chegamos nisso&quot; no resultado: ali estão a
            alíquota, a redução, o artigo da lei e a memória de cálculo oficial. Se puder, mande junto a versão da calculadora que
            aparece no fim do resultado.
          </li>
          <li>
            <strong className="text-tinta">Cancelar a assinatura ou apagar a conta</strong> dá para fazer sozinho, em{" "}
            <Link href="/conta" className="text-marca-700 underline">
              Minha conta
            </Link>
            .
          </li>
          <li>
            <strong className="text-tinta">Não mande XML, CPF nem dados de clientes</strong> por e-mail. Para mostrar um caso, basta o NCM,
            a classificação (cClassTrib), o valor e a cidade.
          </li>
        </ul>
        <h2>O que não fazemos</h2>
        <p>
          Não somos escritório de contabilidade nem órgão do governo: não fazemos apuração, não emitimos guias e não damos parecer
          sobre o enquadramento da sua empresa. Para isso, fale com o seu contador.
        </p>
      </main>
      <Rodape />
    </>
  );
}
