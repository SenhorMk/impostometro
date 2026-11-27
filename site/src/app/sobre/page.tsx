import type { Metadata } from "next";
import Link from "next/link";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Sobre o projeto e contato",
  alternates: { canonical: "/sobre" },
};

export default function Sobre() {
  return (
    <>
      <Cabecalho />
      <main id="conteudo" className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
        <p className="text-sm font-semibold text-marca-700">Sobre o projeto</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Quem está por trás do {SITE.nome}</h1>
        <p className="mt-5 leading-relaxed text-suave">O projeto é mantido por Mateus, identificado no GitHub como SenhorMk. O site funciona em um subdomínio de mkautobots.site e é independente da Receita Federal e do governo.</p>
        <h2 className="mt-9 text-xl font-semibold">Como os resultados são produzidos</h2>
        <p className="mt-3 leading-relaxed text-suave">Usamos um porte para TypeScript da calculadora de tributos publicada pela Receita Federal como código aberto, sob licença MIT. As versões e as fontes das alíquotas acompanham cada resultado. A tabela de alíquotas usada nesta versão é provisória.</p>
        <p className="mt-3 leading-relaxed text-suave">A ferramenta simula CBS e IBS de vendas no regime regular. Não substitui a orientação de um contador, não emite guias e não faz a apuração fiscal da empresa.</p>
        <section id="contato" className="mt-9 scroll-mt-32 rounded-2xl border border-borda bg-fundo p-6">
          <h2 className="text-xl font-semibold">Contato e sugestões</h2>
          <p className="mt-3 text-sm leading-relaxed text-suave">Você pode enviar dúvidas sobre a ferramenta e relatar problemas nas issues do repositório. É necessário ter uma conta no GitHub. Esse canal é público: descreva o problema sem incluir XMLs, dados de clientes, documentos fiscais ou senhas.</p>
          <a href={SITE.contatoUrl} className="botao-primario mt-5">Abrir uma dúvida no GitHub</a>
          <p className="mt-4 text-sm text-suave"><a href="https://github.com/SenhorMk/impostometro" className="underline underline-offset-4">Consultar o código e os tickets do projeto</a></p>
        </section>
        <div className="mt-8 flex flex-wrap gap-5 text-sm font-medium text-marca-800">
          <Link href="/termos" className="underline underline-offset-4">Termos de uso</Link>
          <Link href="/privacidade" className="underline underline-offset-4">Privacidade</Link>
          <Link href="/#calculadora" className="underline underline-offset-4">Voltar à calculadora</Link>
        </div>
      </main>
      <Rodape />
    </>
  );
}
