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
        <h2 id="sugestao" className="scroll-mt-24">Sugestões e problemas</h2>
        <p>
          Achou um resultado estranho, uma tela confusa ou sentiu falta de alguma coisa? Conte pra gente: cada mensagem é lida e ajuda a
          decidir o que melhorar primeiro. Nada é enviado sozinho: você escreve e manda do seu e-mail, quando quiser.
        </p>
        {email ? (
          <p className="mt-3">
            <a href={linkSugestao(email)} className="botao-secundario">
              Escrever uma sugestão
            </a>
          </p>
        ) : (
          <p className="mt-3">O canal de sugestões abre junto com o e-mail de atendimento.</p>
        )}
        <p className="mt-3 text-xs">
          Usamos a mensagem só para responder e melhorar o site, como explicado na{" "}
          <Link href="/privacidade" className="underline">
            política de privacidade
          </Link>
          . Para mostrar um caso, basta a atividade (ou NCM), o valor, a cidade e a versão da calculadora que aparece no resultado. Não mande
          XML, CPF nem dados de clientes.
        </p>
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

/** mailto com assunto e um roteiro curto. Sem nenhum dado preenchido automaticamente. */
function linkSugestao(email: string): string {
  const assunto = `Sugestão ou problema no ${SITE.nome}`;
  const corpo = [
    "O que aconteceu ou o que você sugere:",
    "",
    "",
    "Em qual página (se souber):",
    "",
    "Se for um resultado: atividade ou NCM, valor, cidade e versão da calculadora (aparece no fim do resultado):",
    "",
  ].join("\n");
  return `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}
