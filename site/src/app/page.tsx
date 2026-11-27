import type { Metadata } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { Calculadora } from "@/components/Calculadora";
import { Rodape } from "@/components/Rodape";
import { PLANOS } from "@/lib/config";
import Link from "next/link";
import { ContaAberta } from "@/components/inicio/ContaAberta";
import { calcularExemplo, EXEMPLO_PADRAO } from "@/lib/exemplos";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const PERGUNTAS = [
  {
    p: "Como calcular meu imposto em 2027?",
    r: "Escolha o que você vende, digite o valor da venda e a cidade. A calculadora aplica a alíquota de 2027, a redução do seu setor (se houver) e mostra a CBS e o IBS em reais, com a conta aberta.",
  },
  {
    p: "Os cálculos são oficiais?",
    r: "Usamos um porte para TypeScript da calculadora de código aberto da Receita Federal. O resultado mostra versões, alíquotas, fontes e memória de cálculo para conferência. Este site é independente e não é do governo. Confira a simulação com seu contador.",
  },
  {
    p: "Qual é a alíquota da CBS em 2027?",
    r: "A tabela usada hoje é provisória. Confira a alíquota, o status, a data e as fontes no resultado antes de usá-lo como referência. Uma mudança na tabela pode mudar a simulação.",
  },
  {
    p: "Este é o imposto total da minha empresa?",
    r: "Não. É uma simulação de CBS e IBS sobre uma venda no regime regular. Créditos de compras e tributos atuais não entram nesta conta. O resultado não é uma apuração fiscal nem uma guia de pagamento.",
  },
  {
    p: "Preciso de login gov.br?",
    r: "Não. A calculadora de uma venda é gratuita e não exige cadastro nem cartão. A assinatura está em preparação e ainda não é oferecida para compra nesta página.",
  },
  {
    p: "Serve para empresas do Simples Nacional?",
    r: "Por enquanto, esta ferramenta cobre o regime regular. Não calcula o Simples Nacional. A prévia do importador lê XML de NF-e e NFC-e de venda; não importa NFS-e. Os serviços disponíveis na busca manual não significam suporte a arquivos de NFS-e.",
  },
];

export default async function Inicio() {
  const exemplo = await calcularExemplo("ensino-fundamental", 1200);
  const dadosEstruturados = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PERGUNTAS.map(({ p, r }) => ({
      "@type": "Question",
      name: p,
      acceptedAnswer: { "@type": "Answer", text: r },
    })),
  };

  return (
    <>
      <Cabecalho />
      <main id="conteudo">
        {/* HERO: a página inicial já é a calculadora (T11) */}
        <section className="relative overflow-hidden border-b border-borda bg-gradient-to-b from-marca-50 to-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[1.05fr_1fr] md:items-start md:gap-10 md:py-16">
            <div className="md:pt-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-marca-200 bg-white px-3 py-1 text-xs font-medium text-marca-800">
                Simulação para 2027 · regime regular
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.12] tracking-tight text-tinta sm:text-5xl">
                Entenda a CBS e o IBS de uma venda.
              </h1>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-suave md:mt-4 md:text-lg">
                Calcule a <strong className="text-tinta">CBS</strong> e o <strong className="text-tinta">IBS</strong> de
                uma venda, com as alíquotas e as fontes para conferir. Grátis, sem cadastro e sem cartão.
              </p>
              <ul className="mt-6 hidden space-y-2.5 text-sm text-tinta md:block">
                {[
                  "Cálculo baseado no código aberto da Receita Federal",
                  "Classificação sugerida para você conferir",
                  "Alíquotas, reduções e versões junto ao resultado",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span aria-hidden className="mt-0.5 text-marca-600">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
              <a href="#calculadora" className="botao-primario mt-6">Simular minha venda</a>
              <div className="mt-6 rounded-2xl border border-marca-200 bg-white/80 p-4 text-sm leading-relaxed text-suave">
                <p className="font-semibold text-tinta">Uma estimativa com limites claros</p>
                <p className="mt-1">A tabela de alíquotas é provisória. Esta conta não representa todos os tributos da empresa e precisa ser conferida com seu contador.</p>
                <Link href="/sobre" className="mt-2 inline-block font-medium text-marca-800 underline underline-offset-4">Conheça o projeto e entre em contato</Link>
              </div>
            </div>
            <div id="calculadora" className="min-w-0 scroll-mt-32 rounded-3xl border border-borda bg-white p-4 shadow-xl shadow-marca-900/5 sm:p-7">
              <Calculadora />
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight">Da venda ao resultado</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ["1", "Escolha a atividade", "Busque o que você vende e confira a descrição e a classificação sugeridas."],
              ["2", "Informe o valor e a cidade", "Preencha os dados da venda. A data considerada aparece no resultado."],
              ["3", "Veja o imposto e a conta", "CBS, IBS e o total em reais, com a alíquota, a redução do seu setor, a lei e a fonte de cada número."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-2xl border border-borda p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marca-700 font-bold text-white">{n}</span>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-suave">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-marca-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-3xl font-bold tracking-tight">Saiba o que está entrando na conta.</h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-marca-100">O cálculo considera uma venda no regime regular. Ele não desconta créditos de compras, não soma os tributos atuais e não apura o valor a recolher. Confira a classificação sugerida e as premissas antes de usar a estimativa.</p>
          </div>
        </section>

        {/* TRANSPARÊNCIA */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">O número vem com a explicação</h2>
            <p className="mt-4 leading-relaxed text-suave">
              Em cada resultado você vê a alíquota usada e de onde ela veio, a
              redução do seu setor com o artigo da lei, a memória de cálculo oficial e a versão da calculadora da
              Receita. Dá para mostrar para o seu contador e conferir na calculadora.
            </p>
          </div>
          <div className="min-w-0">
            <ContaAberta resultado={exemplo} descricao="mensalidade escolar" />
            <p className="mt-3 text-xs leading-relaxed text-suave">Exemplo simulado em {EXEMPLO_PADRAO.cidade}. A data, as versões e o status das alíquotas estão na conta acima.</p>
          </div>
        </section>

        {/* PLANOS */}
        <section id="planos" className="scroll-mt-20 bg-fundo">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-3xl font-bold tracking-tight">O que você pode usar hoje</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-suave">A calculadora está disponível. Estamos preparando a análise das notas para uma futura assinatura.</p>
            <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-borda bg-white p-7">
                <p className="font-semibold">{PLANOS.gratis.nome}</p>
                <p className="mt-2 text-4xl font-bold">{PLANOS.gratis.preco}</p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {PLANOS.gratis.itens.map((i) => (
                    <li key={i} className="flex gap-2.5"><span className="text-marca-600">✓</span>{i}</li>
                  ))}
                </ul>
                <a href="#calculadora" className="botao-secundario mt-7 w-full">Calcular agora</a>
              </div>
              <div className="rounded-2xl border border-borda bg-white p-7">
                <p className="text-sm font-semibold text-suave">Em preparação · sem venda aberta</p>
                <h3 className="mt-3 text-2xl font-bold">Análise das notas</h3>
                <p className="mt-4 text-sm leading-relaxed text-suave">Existe uma prévia do importador de XML de NF-e e NFC-e. O acesso pode pedir uma conta conforme a configuração do ambiente.</p>
                <p className="mt-4 text-sm leading-relaxed text-suave">Histórico e relatório exportável estão planejados. Ainda estamos validando a cobrança e o acesso. O preço e a disponibilidade serão informados antes da abertura da assinatura.</p>
                <Link href="/importar" className="botao-secundario mt-7 w-full">Conhecer a prévia do importador</Link>
                <p className="mt-3 text-xs leading-relaxed text-suave">Regime regular. Sem importação de NFS-e, cálculo do Simples ou créditos de compras.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PERGUNTAS */}
        <section id="perguntas" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight">Dúvidas frequentes</h2>
          <div className="mt-8 divide-y divide-borda border-y border-borda">
            {PERGUNTAS.map(({ p, r }) => (
              <details key={p} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {p}
                  <span aria-hidden className="text-suave transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-suave">{r}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 rounded-2xl bg-marca-700 p-8 text-center text-white">
            <p className="text-2xl font-bold">Faça sua primeira simulação</p>
            <p className="mt-2 text-marca-100">Grátis, sem cadastro e com as premissas visíveis.</p>
            <a href="#calculadora" className="mt-5 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-marca-800 hover:bg-marca-50">
              Calcular grátis
            </a>
          </div>
        </section>
      </main>
      <Rodape />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
