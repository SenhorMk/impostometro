import type { Metadata } from "next";
import Link from "next/link";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { SITE } from "@/lib/config";
import { VERSAO_TERMOS } from "@/lib/contas";
import { BASES_LEGAIS, DIREITOS, PRAZO_RESPOSTA_DIAS, TRATAMENTOS } from "@/lib/privacidade";

export const metadata: Metadata = {
  title: "Privacidade",
  description: `Quais dados o ${SITE.nome} trata, por quê, por quanto tempo e como exercer seus direitos pela LGPD.`,
  alternates: { canonical: "/privacidade" },
};

/**
 * Política de privacidade (T21 e T40). O inventário de dados vem de src/lib/privacidade.ts,
 * o mesmo usado no "Baixar meus dados" e em docs/lgpd.md.
 * O responsável e o e-mail vêm da Vercel (CONTROLADOR_NOME e CONTATO_EMAIL), para não
 * inventar identidade nem deixar dado pessoal no código. Sem eles, a página diz o que falta.
 * Ainda não revisada por advogado (pendência registrada no T21).
 */
export default function Privacidade() {
  const controlador = process.env.CONTROLADOR_NOME?.trim();
  const email = process.env.CONTATO_EMAIL?.trim();
  const contato = email ? (
    <a href={`mailto:${email}`} className="font-medium text-marca-700 underline">
      {email}
    </a>
  ) : (
    <Link href="/contato" className="font-medium text-marca-700 underline">
      página de contato
    </Link>
  );
  const semConta = TRATAMENTOS.filter((t) => !t.conta);
  const comConta = TRATAMENTOS.filter((t) => t.conta);

  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-3xl px-4 py-14 text-sm leading-relaxed text-suave [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-tinta [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-tinta">
        <h1 className="text-3xl font-bold text-tinta">Política de privacidade</h1>
        <p className="mt-2">
          Versão {VERSAO_TERMOS} (28 de novembro de 2026). Segue a Lei Geral de Proteção de Dados (Lei 13.709/2018, a LGPD).
        </p>

        <div className="mt-6 rounded-2xl border border-borda bg-white p-5 text-tinta">
          <p className="font-semibold">Resumo</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-suave">
            <li>A simulação grátis não pede nenhum dado pessoal.</li>
            <li>Os arquivos XML das notas são lidos no seu computador e nunca chegam até nós.</li>
            <li>Com conta, guardamos o mínimo para o serviço funcionar, no Brasil, e você baixa ou apaga tudo sozinho.</li>
            <li>Não vendemos dados, não mostramos anúncios e não usamos cookies de rastreamento.</li>
          </ul>
        </div>

        <h2>Quem cuida dos seus dados</h2>
        {controlador ? (
          <p>
            O responsável pelos seus dados (o &quot;controlador&quot;, na LGPD) é {controlador}, que mantém o {SITE.nome}.
          </p>
        ) : (
          <p>
            O {SITE.nome} é um projeto independente. A identificação completa do responsável pelos dados (o &quot;controlador&quot;, na
            LGPD) será publicada aqui antes da abertura das contas de assinante.
          </p>
        )}
        <p className="mt-2">
          O canal para qualquer assunto sobre seus dados (o papel do &quot;encarregado&quot;, art. 41) é o {contato}. Respondemos em até{" "}
          {PRAZO_RESPOSTA_DIAS} dias.
        </p>

        <h2>Que dados tratamos, para quê e por quanto tempo</h2>
        <h3>Para todos os visitantes</h3>
        <ListaTratamentos itens={semConta} />
        <h3>Para quem cria uma conta</h3>
        <ListaTratamentos itens={comConta} />

        <h2>O que não fazemos</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Não vendemos, alugamos nem compartilhamos dados para publicidade.</li>
          <li>Não usamos cookies de rastreamento, pixels de anúncio nem identificadores de visitante.</li>
          <li>Não tomamos decisões automáticas sobre você: o site só faz a conta que a calculadora oficial faria.</li>
          <li>Não guardamos dados de cartão nem os arquivos XML das notas.</li>
          <li>Não usamos os dados da sua conta para treinar inteligência artificial.</li>
        </ul>

        <h2>O que fica guardado no seu navegador</h2>
        <p>
          Não usamos cookies. O navegador guarda só o necessário para o site funcionar: a sessão de login (quando você entra), o estado e
          a cidade da última simulação, a versão dos termos aceita na tela de entrar e uma marca que dura só enquanto a aba estiver aberta,
          para não contar a mesma visita duas vezes. Você pode apagar tudo isso limpando os dados do site no navegador.
        </p>

        <h2>Com quem compartilhamos</h2>
        <p>Só com os serviços que fazem o site funcionar (os &quot;operadores&quot;), que tratam os dados seguindo as nossas instruções:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-tinta">Vercel</strong>: hospeda o site. As funções rodam em São Paulo.
          </li>
          <li>
            <strong className="text-tinta">Supabase</strong>: banco de dados e login, em São Paulo.
          </li>
          <li>
            <strong className="text-tinta">Asaas</strong>: cobrança da assinatura (instituição de pagamento brasileira).
          </li>
          <li>
            <strong className="text-tinta">Provedor de e-mail</strong> configurado no Supabase, que entrega o link de acesso.
          </li>
          <li>
            <strong className="text-tinta">Google</strong>: só se você escolher entrar com a conta Google.
          </li>
          <li>
            <strong className="text-tinta">Sentry</strong>: avisos de erro, sem dados pessoais (quando o monitoramento estiver ligado).
          </li>
        </ul>
        <p className="mt-2">
          Alguns desses serviços podem processar dados fora do Brasil (por exemplo, a entrega de e-mails e os avisos de erro). Nesses casos, a
          transferência segue o art. 33 da LGPD, com as garantias contratuais de proteção de dados oferecidas pelos fornecedores. Também
          podemos ter de entregar dados a autoridades quando a lei ou uma ordem judicial exigir.
        </p>

        <h2>Como protegemos</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Conexão sempre criptografada (HTTPS) e login sem senha (link por e-mail ou Google).</li>
          <li>Regras no banco de dados que deixam cada conta ver e mudar só as próprias informações.</li>
          <li>Chaves de acesso guardadas só no servidor, nunca no navegador nem no código.</li>
          <li>Leitura das notas no seu computador, descartando nome, CPF/CNPJ e endereço do cliente final.</li>
          <li>Limites contra robôs e abusos, e limpeza automática dos registros temporários.</li>
        </ul>
        <p className="mt-2">
          Se acontecer um incidente de segurança que possa causar risco ou dano relevante a você, avisaremos você e a Autoridade Nacional de
          Proteção de Dados (ANPD) no prazo da regulamentação (art. 48 da LGPD), explicando o que aconteceu e o que fazer.
        </p>

        <h2>Seus direitos</h2>
        <p>A LGPD (art. 18) garante os direitos abaixo, de graça. Quase todos você exerce sozinho, na hora:</p>
        <ul className="mt-2 space-y-2">
          {DIREITOS.map((d) => (
            <li key={d.direito}>
              <strong className="text-tinta">{d.direito}.</strong> {d.como}
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Pedidos pelo {contato} são respondidos em até {PRAZO_RESPOSTA_DIAS} dias. Para proteger você, podemos pedir que o pedido venha do
          e-mail da conta.
        </p>

        <h2>Idade</h2>
        <p>O serviço é feito para empresas e pessoas maiores de 18 anos. Não coletamos dados de crianças e adolescentes de propósito.</p>

        <h2>Mudanças nesta política</h2>
        <p>
          Quando esta política mudar de forma relevante, a data e a versão no topo mudam, e quem tem conta vê um aviso em Minha conta para
          ler e aceitar a nova versão. Guardamos a data de cada aceite.
        </p>
      </main>
      <Rodape />
    </>
  );
}

function ListaTratamentos({ itens }: { itens: typeof TRATAMENTOS }) {
  return (
    <div className="mt-3 space-y-3">
      {itens.map((t) => (
        <section key={t.id} className="rounded-2xl border border-borda bg-white p-4">
          <p className="font-semibold text-tinta">{t.nome}</p>
          <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[8rem_1fr]">
            <dt className="font-medium text-tinta">Dados</dt>
            <dd>{t.dados}</dd>
            <dt className="font-medium text-tinta">Para quê</dt>
            <dd>{t.finalidade}</dd>
            <dt className="font-medium text-tinta">Base legal</dt>
            <dd>{BASES_LEGAIS[t.base]}</dd>
            <dt className="font-medium text-tinta">Por quanto tempo</dt>
            <dd>{t.retencao}</dd>
            <dt className="font-medium text-tinta">Onde fica</dt>
            <dd>{t.onde}</dd>
          </dl>
        </section>
      ))}
    </div>
  );
}
