import type { Metadata } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { Calculadora } from "@/components/Calculadora";
import { Rodape } from "@/components/Rodape";
import { DadosEstruturados } from "@/components/DadosEstruturados";
import { ContaAberta } from "@/components/inicio/ContaAberta";
import { DemoAnimada } from "@/components/inicio/DemoAnimada";
import { LinhaDoTempo } from "@/components/inicio/LinhaDoTempo";
import { Setores } from "@/components/inicio/Setores";
import { PLANOS, PRECO_ASSINATURA_NUMERO, SITE } from "@/lib/config";
import { ATIVIDADES, calcularExemplo, EXEMPLO_PADRAO } from "@/lib/exemplos";
import { ARTIGOS } from "@/dados/conteudo";
import { URL_SITE } from "@/lib/seo";
import Link from "next/link";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const PERGUNTAS = [
  {
    p: "Como calcular meu imposto em 2027?",
    r: "Escolha o que você vende, digite o valor da venda e a cidade. A calculadora aplica a alíquota de 2027, a redução do seu setor (se houver) e mostra a CBS e o IBS em reais, com a conta aberta.",
  },
  {
    p: "Os cálculos são oficiais?",
    r: "Usamos a calculadora que a própria Receita Federal publicou como código aberto, sem nenhuma alteração. O site não é do governo e o resultado é uma simulação: confirme com o seu contador antes de emitir notas.",
  },
  {
    p: "Qual é a alíquota da CBS em 2027?",
    r: "O TCU calculou a alíquota de referência em 11,3%. Em 2027 a CBS é cobrada com 0,1 ponto a menos, ou seja, 11,2%, porque o IBS entra em teste com 0,1%. O Senado pode alterar esse número até 15/12/2026. Assim que sair o valor final, atualizamos e mostramos a data da atualização em cada resultado.",
  },
  {
    p: "O que acontece com PIS e Cofins?",
    r: "A CBS substitui o PIS e a Cofins a partir de 2027. O IBS vai substituir o ICMS e o ISS aos poucos, entre 2029 e 2033. Em 2027 e 2028 o IBS existe só em caráter de teste, com 0,1%.",
  },
  {
    p: "Preciso de login gov.br?",
    r: "Não. A simulação é grátis e não pede cadastro. A conta só é necessária para quem assina e quer importar as notas fiscais do mês.",
  },
  {
    p: "Serve para empresas do Simples Nacional?",
    r: "Por enquanto a calculadora cobre o regime regular (lucro presumido e lucro real). O Simples Nacional vem logo depois, quando a Receita completar a versão oficial do cálculo para o Simples.",
  },
];

const PROVAS = [
  { numero: "1.519", texto: "casos conferidos com a calculadora oficial, todos com resposta idêntica" },
  { numero: String(ATIVIDADES.length), texto: "atividades prontas: você diz o que vende, a gente acha os códigos" },
  { numero: "0", texto: "cadastros ou login gov.br para simular" },
  { numero: "100%", texto: "da conta aberta: alíquota, redução, lei e versão" },
];

export default async function Inicio() {
  const [demo, escola] = await Promise.all([
    calcularExemplo("restaurante"),
    calcularExemplo("ensino-fundamental", 1200),
  ]);

  const dadosEstruturados = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PERGUNTAS.map(({ p, r }) => ({
        "@type": "Question",
        name: p,
        acceptedAnswer: { "@type": "Answer", text: r },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE.nome,
      url: URL_SITE.href,
      description: SITE.descricao,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Qualquer navegador",
      inLanguage: "pt-BR",
      isAccessibleForFree: true,
      offers: [
        { "@type": "Offer", name: PLANOS.gratis.nome, price: "0", priceCurrency: "BRL" },
        { "@type": "Offer", name: PLANOS.assinante.nome, price: PRECO_ASSINATURA_NUMERO, priceCurrency: "BRL" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.nome,
      url: URL_SITE.href,
      inLanguage: "pt-BR",
    },
  ];

  return (
    <>
      <Cabecalho />
      <main>
        {/* HERO: a página inicial já é a calculadora (T11). O produto é o herói. */}
        <section id="calculadora" className="relative overflow-hidden bg-gradient-to-b from-marca-50 to-white">
          <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-marca-200/40 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-40 top-64 h-80 w-80 rounded-full bg-destaque/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[1.05fr_1fr] md:items-start md:gap-10 md:py-16">
            <div className="md:pt-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-marca-200 bg-white px-3 py-1 text-xs font-medium text-marca-800">
                <span className="pulsar h-1.5 w-1.5 rounded-full bg-marca-600" /> Reforma tributária · começa em janeiro de 2027
              </p>
              <h1 className="mt-3 text-[1.75rem] font-bold leading-[1.15] tracking-tight text-tinta sm:text-5xl md:mt-4">
                Quanto sua empresa vai pagar de imposto em <span className="text-marca-700">2027</span>?
              </h1>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-suave md:mt-4 md:text-lg">
                Calcule a <strong className="text-tinta">CBS</strong> e o <strong className="text-tinta">IBS</strong> de
                qualquer venda em 2 minutos. Grátis, sem cadastro e com a conta aberta
                <span className="hidden md:inline">, para você conferir cada centavo</span>.
              </p>
              <ul className="mt-6 hidden space-y-2.5 text-sm text-tinta md:block">
                {[
                  "Mesma conta da calculadora oficial da Receita Federal, conferida em 1.519 casos",
                  "Sem login gov.br e sem códigos complicados: é só dizer o que você vende",
                  "Mostra a redução do seu setor e o artigo da lei",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span aria-hidden className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-marca-100 text-xs text-marca-700">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-borda bg-white p-4 shadow-xl shadow-marca-900/5 sm:p-7">
              <Calculadora />
            </div>
          </div>
        </section>

        {/* PROVA: logo abaixo da dobra, números verificáveis (nada de depoimento inventado) */}
        <section aria-label="Por que confiar" className="border-y border-borda bg-white">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-6 px-4 py-8 md:grid-cols-4">
            {PROVAS.map(({ numero, texto }) => (
              <div key={texto} className="revelar">
                <dt className="text-3xl font-bold tracking-tight text-marca-800">{numero}</dt>
                <dd className="mt-1 text-sm leading-snug text-suave">{texto}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* COMO FUNCIONA: passos + demonstração animada */}
        <section id="como-funciona" className="mx-auto grid max-w-6xl scroll-mt-20 items-center gap-10 px-4 py-16 md:grid-cols-[1fr_minmax(0,24rem)] md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-marca-700">Como funciona</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Três passos, sem enrolação</h2>
            <ol className="mt-8 space-y-6">
              {[
                ["Diga o que você vende", "Digite “pizzaria”, “corte de cabelo” ou “roupas”. A gente acha os códigos (NCM, NBS e cClassTrib) por você."],
                ["Informe o valor e a cidade", "O imposto novo depende do valor da venda e de onde ela acontece. Só isso."],
                ["Veja o imposto e a conta", "CBS, IBS e o total em reais, com a alíquota, a redução do seu setor, a lei e a fonte de cada número."],
              ].map(([t, d], i) => (
                <li key={t} className="revelar flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marca-700 font-bold text-white">{i + 1}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-suave">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <a href="#calculadora" className="botao-primario mt-8">Fazer a minha simulação</a>
          </div>
          <DemoAnimada resultado={demo} valor={EXEMPLO_PADRAO.valor} cidade={EXEMPLO_PADRAO.cidade} />
        </section>

        {/* SETORES: cada cartão é uma página própria (SEO: "imposto 2027 + setor") */}
        <section id="setores" className="scroll-mt-20 bg-fundo">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-bold tracking-tight">Quanto o seu setor vai pagar</h2>
            <p className="mt-3 max-w-2xl text-suave">
              Saúde, educação, restaurantes e profissões regulamentadas têm redução. Veja um exemplo calculado para cada setor.
            </p>
            <div className="mt-8">
              <Setores />
            </div>
          </div>
        </section>

        {/* O QUE MUDA: explicação visual da transição */}
        <section id="o-que-muda" className="scroll-mt-20 bg-marca-900 text-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1fr_1.3fr] md:py-24">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-destaque">O que muda</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">De 5 impostos para 2, em 7 anos</h2>
              <div className="mt-8 space-y-5">
                {[
                  ["CBS substitui PIS e Cofins", "Um imposto federal só, cobrado sobre o valor da venda, já em 2027. Alíquota prevista de 11,2% (ainda provisória)."],
                  ["IBS substitui ICMS e ISS", "O imposto de estados e municípios começa em teste com 0,1% e cresce aos poucos até 2033."],
                  ["Setores têm redução", "Saúde e educação pagam 40% da alíquota. Cesta básica é zero. Restaurantes e hotéis têm 40% de desconto; profissões intelectuais, 30%."],
                ].map(([t, d]) => (
                  <div key={t} className="revelar">
                    <h3 className="font-semibold">{t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-marca-100">{d}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 sm:p-7">
              <LinhaDoTempo />
            </div>
          </div>
        </section>

        {/* TRANSPARÊNCIA: a conta em blocos, calculada pelo porte */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-marca-700">Transparência</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">A conta aberta, sempre</h2>
            <p className="mt-4 leading-relaxed text-suave">
              Imposto não é lugar para caixa-preta. Em cada resultado você vê a alíquota usada e de onde ela veio, a
              redução do seu setor com o artigo da lei, a memória de cálculo oficial e a versão da calculadora da
              Receita. Dá para mostrar para o seu contador e conferir.
            </p>
            <a
              href="https://github.com/ReceitaFederal/calculadora-rtc-regime-regular"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-marca-800 underline underline-offset-4"
            >
              Ver o código aberto da calculadora oficial
            </a>
          </div>
          <div className="revelar">
            <ContaAberta resultado={escola} descricao="mensalidade escolar" />
          </div>
        </section>

        {/* PLANOS */}
        <section id="planos" className="scroll-mt-20 bg-fundo">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-3xl font-bold tracking-tight">Comece grátis. Assine quando precisar do mês inteiro.</h2>
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
              <div className="revelar relative rounded-2xl border-2 border-marca-700 bg-white p-7 shadow-lg">
                <span className="absolute -top-3 left-7 rounded-full bg-destaque px-3 py-0.5 text-xs font-bold text-tinta">
                  Abre em janeiro de 2027
                </span>
                <p className="font-semibold">{PLANOS.assinante.nome}</p>
                <p className="mt-2 text-4xl font-bold">
                  {PLANOS.assinante.preco}
                  <span className="text-base font-normal text-suave">{PLANOS.assinante.periodo}</span>
                </p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {PLANOS.assinante.itens.map((i) => (
                    <li key={i} className="flex gap-2.5"><span className="text-marca-600">✓</span>{i}</li>
                  ))}
                </ul>
                <a href="/entrar" className="botao-primario mt-7 w-full">Quero ser avisado</a>
                <p className="mt-3 text-center text-xs text-suave">Cancele quando quiser, sem falar com ninguém.</p>
              </div>
            </div>
          </div>
        </section>

        {/* GUIAS: conteúdo educativo e links internos */}
        <section className="mx-auto max-w-6xl px-4 pt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Entenda a reforma sem juridiquês</h2>
            <Link href="/artigos" className="text-sm font-semibold text-marca-800 underline underline-offset-4">Todos os guias</Link>
          </div>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {ARTIGOS.slice(0, 3).map((a) => (
              <li key={a.slug} className="revelar">
                <Link href={`/artigos/${a.slug}`} className="group block h-full rounded-2xl border border-borda p-6 transition hover:border-marca-600 hover:shadow-lg hover:shadow-marca-900/5">
                  <h3 className="font-semibold leading-snug group-hover:text-marca-800">{a.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-suave">{a.descricao}</p>
                  <span aria-hidden className="mt-4 inline-block text-marca-600 transition group-hover:translate-x-1">Ler guia →</span>
                </Link>
              </li>
            ))}
          </ul>
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
            <p className="text-2xl font-bold">Descubra seu imposto de 2027 agora</p>
            <p className="mt-2 text-marca-100">Grátis, sem cadastro, em menos de 2 minutos.</p>
            <a href="#calculadora" className="mt-5 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-marca-800 hover:bg-marca-50">
              Calcular grátis
            </a>
          </div>
        </section>
      </main>
      <Rodape />
      <DadosEstruturados dados={dadosEstruturados} />
    </>
  );
}
