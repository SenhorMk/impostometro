import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Calculadora } from "@/components/Calculadora";
import { DadosEstruturados } from "@/components/DadosEstruturados";
import { LinhaDoTempo } from "@/components/inicio/LinhaDoTempo";
import { Recibo } from "@/components/inicio/Recibo";
import { Setores } from "@/components/inicio/Setores";
import { Rodape } from "@/components/Rodape";
import { ARTIGOS } from "@/dados/conteudo";
import { PLANOS, PRECO_ASSINATURA_NUMERO, SITE } from "@/lib/config";
import { ATIVIDADES, atividadePorId, calcularExemplo, EXEMPLO_PADRAO } from "@/lib/exemplos";
import { dataBR } from "@/lib/formato";
import { URL_SITE } from "@/lib/seo";

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

/** Cabeçalho de seção: rótulo na margem (como num documento) e título em serifa. */
function Secao({ id, rotulo, titulo, children, className = "" }: {
  id?: string;
  rotulo: string;
  titulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 border-t border-tinta ${className}`}>
      <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-6 px-4 py-14 md:grid-cols-[11rem_minmax(0,1fr)] md:py-20">
        <p className="rotulo-secao md:pt-3">{rotulo}</p>
        <div>
          <h2 className="titulo-secao max-w-3xl">{titulo}</h2>
          {children}
        </div>
      </div>
    </section>
  );
}

export default async function Inicio() {
  const restaurante = atividadePorId("restaurante")!;
  const exemplo = await calcularExemplo(restaurante.id);
  const guias = [...ARTIGOS].sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));

  const dadosEstruturados = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PERGUNTAS.map(({ p, r }) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })),
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
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE.nome, url: URL_SITE.href, inLanguage: "pt-BR" },
  ];

  return (
    <>
      <Cabecalho />
      <main>
        {/* 1. Calculadora em primeiro lugar: quem chega pelo Google quer o número. */}
        <section id="calculadora" className="scroll-mt-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-8 md:grid-cols-[minmax(0,1fr)_27rem] md:gap-14 md:pb-20 md:pt-16">
            <div>
              <p className="rotulo-secao">Lei Complementar 214/2025 · vale a partir de 01/01/2027</p>
              <h1 className="mt-4 font-serif text-[2.35rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Quanto de imposto a sua empresa paga <span className="marcatexto">a partir de 2027</span>.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-suave">
                A CBS substitui o PIS e a Cofins em janeiro. Diga o que você vende, o valor e a cidade: a calculadora
                mostra o imposto em reais e a conta inteira, linha por linha.
              </p>
              <dl className="mt-8 hidden max-w-xl border-t border-tinta text-sm md:block">
                {[
                  ["Base do cálculo", "Calculadora da Receita Federal, código aberto"],
                  ["Conferência", "1.519 casos com resposta idêntica à oficial"],
                  ["Para usar", "Grátis, sem cadastro e sem login gov.br"],
                ].map(([t, d]) => (
                  <div key={t} className="grid grid-cols-[9rem_1fr] gap-4 border-b border-borda py-2.5">
                    <dt className="text-suave">{t}</dt>
                    <dd>{d}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="border border-tinta bg-white">
              <p className="flex items-center justify-between border-b border-tinta px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em]">
                <span>Simulação de CBS e IBS</span>
                <span className="text-suave">2027</span>
              </p>
              <div className="p-4 sm:p-6">
                <Calculadora />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Um exemplo completo, no formato de recibo. */}
        <Secao id="como-funciona" rotulo="Exemplo" titulo="Uma pizzaria vende R$ 1.000. Esta é a conta.">
          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_25rem]">
            <div className="max-w-xl space-y-5 leading-relaxed text-suave">
              <p>
                Você digita <b className="font-semibold text-tinta">“pizzaria”</b>. O site encontra os códigos fiscais (NBS{" "}
                {restaurante.codigo} e classificação {restaurante.cClassTrib}) e manda para a mesma conta da calculadora
                oficial, com a alíquota de 2027.
              </p>
              <p>
                Restaurantes têm redução de alíquota na lei. Por isso a CBS não sai pela alíquota cheia: a calculadora
                aplica a redução, mostra o artigo e cita a memória de cálculo oficial. Cada número ao lado vem dela,
                nenhum foi digitado à mão.
              </p>
              <p>
                O IBS, que vai substituir o ICMS e o ISS, ainda é um teste em 2027: 0,1% dividido entre estado e município.
              </p>
              <a href="#calculadora" className="botao-primario">Fazer a conta da minha venda</a>
            </div>
            <Recibo resultado={exemplo} atividade={restaurante} cidade={EXEMPLO_PADRAO.cidade} />
          </div>
        </Secao>

        {/* 3. Setores em tabela (SEO: cada linha tem página própria). */}
        <Secao id="setores" rotulo="Por setor" titulo="O imposto de uma venda de R$ 1.000, setor por setor" className="bg-fundo">
          <p className="mt-4 max-w-2xl text-suave">
            Mesma venda, em {EXEMPLO_PADRAO.cidade}, em {dataBR(EXEMPLO_PADRAO.data)}. Saúde, educação, restaurantes e
            profissões regulamentadas pagam menos porque a lei dá redução. Clique para ver a conta completa.
          </p>
          <div className="mt-8">
            <Setores />
          </div>
          <p className="mt-4 text-sm text-suave">
            Valores antes dos créditos de compras, com a alíquota provisória de 2027.{" "}
            <Link href="/imposto-2027" className="font-medium text-tinta underline underline-offset-4">
              Ver as {ATIVIDADES.length} atividades
            </Link>
          </p>
        </Secao>

        {/* 4. Calendário: explicação visual da transição. */}
        <Secao id="o-que-muda" rotulo="Calendário" titulo="A troca dos impostos leva sete anos">
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="max-w-md space-y-5 leading-relaxed text-suave">
              <p>
                <b className="font-semibold text-tinta">CBS no lugar de PIS e Cofins.</b> É federal e entra inteira em 2027.
                A alíquota prevista é 11,2%, mas o Senado ainda pode mudar até 15/12/2026.
              </p>
              <p>
                <b className="font-semibold text-tinta">IBS no lugar de ICMS e ISS.</b> É de estados e municípios. Começa em
                0,1% e cresce enquanto o ICMS e o ISS diminuem, de 2029 a 2032.
              </p>
              <Link href="/artigos/linha-do-tempo-2026-a-2033" className="inline-block font-medium text-tinta underline underline-offset-4">
                O que acontece em cada ano
              </Link>
            </div>
            <LinhaDoTempo />
          </div>
        </Secao>

        {/* 5. Preço */}
        <Secao id="planos" rotulo="Preço" titulo={`Uma venda por vez é grátis. O mês inteiro custa ${PLANOS.assinante.preco}.`} className="bg-fundo">
          <div className="mt-10 grid border-t border-tinta md:grid-cols-2">
            <div className="border-b border-borda py-8 md:border-b-0 md:border-r md:pr-10">
              <p className="rotulo-secao">{PLANOS.gratis.nome}</p>
              <p className="mt-3 font-serif text-5xl font-semibold">{PLANOS.gratis.preco}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {PLANOS.gratis.itens.map((i) => <li key={i} className="border-b border-borda pb-2">{i}</li>)}
              </ul>
              <a href="#calculadora" className="botao-secundario mt-8">Calcular agora</a>
            </div>
            <div className="py-8 md:pl-10">
              <p className="rotulo-secao">{PLANOS.assinante.nome} · abre em janeiro de 2027</p>
              <p className="mt-3 font-serif text-5xl font-semibold">
                {PLANOS.assinante.preco}<span className="font-sans text-base font-normal text-suave">{PLANOS.assinante.periodo}</span>
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {PLANOS.assinante.itens.map((i) => <li key={i} className="border-b border-borda pb-2">{i}</li>)}
              </ul>
              <Link href="/entrar" className="botao-primario mt-8">Quero ser avisado</Link>
              <p className="mt-3 text-xs text-suave">Cancele quando quiser, pelo próprio site.</p>
            </div>
          </div>
        </Secao>

        {/* 6. Guias: índice editorial */}
        <Secao rotulo="Guias" titulo="Para entender antes de calcular">
          <ul className="mt-8 border-t border-tinta">
            {guias.map((a) => (
              <li key={a.slug} className="border-b border-borda">
                <Link href={`/artigos/${a.slug}`} className="group grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
                  <span>
                    <span className="font-serif text-xl font-semibold group-hover:underline group-hover:underline-offset-4">{a.titulo}</span>
                    <span className="mt-1 block text-sm text-suave">{a.descricao}</span>
                  </span>
                  <span className="font-mono text-xs text-suave sm:pt-1.5">revisto em {dataBR(a.atualizadoEm)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Secao>

        {/* 7. Dúvidas */}
        <Secao id="perguntas" rotulo="Dúvidas" titulo="Perguntas frequentes" className="bg-fundo">
          <div className="mt-8 border-t border-tinta">
            {PERGUNTAS.map(({ p, r }) => (
              <details key={p} className="group border-b border-borda py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-medium">
                  {p}
                  <span aria-hidden className="font-mono text-suave transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-suave">{r}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border border-tinta bg-white p-6">
            <p className="font-serif text-2xl font-semibold">Faça a conta de uma venda sua.</p>
            <a href="#calculadora" className="botao-primario">Calcular grátis</a>
          </div>
        </Secao>
      </main>
      <Rodape />
      <DadosEstruturados dados={dadosEstruturados} />
    </>
  );
}
