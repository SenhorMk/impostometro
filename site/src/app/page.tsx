import { Cabecalho } from "@/components/Cabecalho";
import { Calculadora } from "@/components/Calculadora";
import { Rodape } from "@/components/Rodape";
import { PLANOS } from "@/lib/config";

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

export default function Inicio() {
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
      <main>
        {/* HERO: a página inicial já é a calculadora (T11) */}
        <section id="calculadora" className="relative overflow-hidden bg-gradient-to-b from-marca-50 to-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[1.05fr_1fr] md:items-start md:gap-10 md:py-16">
            <div className="md:pt-6">
              <p className="hidden items-center gap-2 rounded-full border border-marca-200 bg-white px-3 py-1 text-xs font-medium text-marca-800 md:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-marca-600" /> Reforma tributária · começa em janeiro de 2027
              </p>
              <h1 className="text-[1.75rem] font-bold leading-[1.15] tracking-tight text-tinta sm:text-5xl md:mt-4">
                Quanto sua empresa vai pagar de imposto em 2027?
              </h1>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-suave md:mt-4 md:text-lg">
                Calcule a <strong className="text-tinta">CBS</strong> e o <strong className="text-tinta">IBS</strong> de
                qualquer venda em 2 minutos. Grátis, sem cadastro e com a conta aberta
                <span className="hidden md:inline">, para você conferir cada centavo</span>.
              </p>
              <ul className="mt-6 hidden space-y-2.5 text-sm text-tinta md:block">
                {[
                  "Usa a calculadora oficial da Receita Federal, sem alterações",
                  "Sem login gov.br e sem códigos complicados: é só dizer o que você vende",
                  "Mostra a redução do seu setor e o artigo da lei",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span aria-hidden className="mt-0.5 text-marca-600">✓</span>
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

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight">Três passos, sem enrolação</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ["1", "Diga o que você vende", "Digite “pizzaria”, “corte de cabelo” ou “roupas”. A gente acha os códigos (NCM, NBS e cClassTrib) por você."],
              ["2", "Informe o valor e a cidade", "O imposto novo depende do valor da venda e de onde ela acontece. Só isso."],
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

        {/* O QUE MUDA */}
        <section id="o-que-muda" className="scroll-mt-20 bg-marca-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-bold tracking-tight">O que muda em 2027, em uma tela</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                ["CBS substitui PIS e Cofins", "Um imposto federal só, cobrado sobre o valor da venda. Alíquota prevista de 11,2% em 2027 (ainda provisória)."],
                ["IBS começa em teste", "O imposto de estados e municípios entra com 0,1% em 2027 e 2028. Ele vai substituir ICMS e ISS até 2033."],
                ["Setores têm redução", "Saúde e educação pagam 40% da alíquota. Cesta básica é zero. Hotéis e restaurantes têm 40% de desconto. Profissões intelectuais, 30%."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                  <h3 className="text-lg font-semibold">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-marca-100">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRANSPARÊNCIA */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">A conta aberta, sempre</h2>
            <p className="mt-4 leading-relaxed text-suave">
              Imposto não é lugar para caixa-preta. Em cada resultado você vê a alíquota usada e de onde ela veio, a
              redução do seu setor com o artigo da lei, a memória de cálculo oficial e a versão da calculadora da
              Receita. Dá para mostrar para o seu contador e conferir na calculadora.
            </p>
          </div>
          <div className="rounded-2xl border border-borda bg-fundo p-6 font-mono text-sm leading-7">
            <p className="text-suave">Exemplo: mensalidade escolar de R$ 1.200</p>
            <p>Alíquota da CBS ........ 11,20%</p>
            <p>Redução educação ....... 60% (Art. 129)</p>
            <p>Alíquota efetiva ....... 4,48%</p>
            <p>CBS .................... R$ 53,76</p>
            <p>IBS (teste) ............ R$ 0,48</p>
            <p className="font-bold">Total .................. R$ 54,24</p>
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
              <div className="relative rounded-2xl border-2 border-marca-700 bg-white p-7 shadow-lg">
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados) }}
      />
    </>
  );
}
