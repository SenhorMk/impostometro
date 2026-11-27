# Colocar no ar (T05 e T06)

O site roda na Vercel e usa o Supabase para contas e persistência. A calculadora roda dentro do site (porte em TypeScript, veja [`arquitetura.md`](arquitetura.md)).

## Ambiente publicado

Produção: <https://impostometro-opal.vercel.app>. Projeto Vercel `impostometro`, equipe Orbita (`orbita16`), raiz `site`. Supabase: `uivewvttfvaoqdzltrnc`, organização ReformaImposto, região São Paulo. Em 26/11/2026, o deploy `EwEji29SvDFSSd9xsFK5dfZtdTUy`, commit `8362086`, ficou Ready com a conexão do Supabase configurada em Production.

O cálculo e a gravação de uma busca sem resultado foram conferidos no ambiente publicado. O login reconhece a configuração, mas a entrega do link por e-mail e uma sessão completa ainda precisam ser testadas. Google e SMTP próprio estão pendentes. A cobrança não foi ativada nesta configuração. Evidências e pendências: [diário da configuração](diario/2026-11-26-configuracao-producao.md).

> Custos aproximados (novembro de 2026): Vercel Hobby grátis no desenvolvimento, mas **não permite uso comercial**, então o plano Pro (US$ 20/mês) entra quando a assinatura abrir; Supabase grátis no começo (pausa após 7 dias sem uso, sem backup), Pro US$ 25/mês depois. O servidor Java no Fly.io (~US$ 6,70/mês) **não é mais necessário**.

## 1. Site na Vercel

1. Em <https://vercel.com/new>, importe o repositório `SenhorMk/impostometro`.
2. **Root Directory: `site`**. O framework (Next.js) é detectado sozinho.
3. Não precisa de nenhuma variável de ambiente para calcular: a calculadora roda dentro do site.
4. Deploy. As funções rodam em São Paulo (`site/vercel.json` → `gru1`).
5. A partir daí, cada push na `main` publica sozinho, e cada pull request ganha um endereço de prévia.

## 2. Domínio

1. Compre o domínio no Registro.br (decisão do T04).
2. Na Vercel: Project → Settings → Domains → adicione `seudominio.com.br` e `www.seudominio.com.br` (redirecionando para o principal).
3. No Registro.br, aponte o DNS como a Vercel indicar. O HTTPS é automático.
4. Configure `SITE_URL=https://seudominio.com.br` nas variáveis do ambiente **Production** e faça um novo deploy. Use somente a raiz, sem caminho, parâmetros ou credenciais. Pode usar o endereço público `https://seuprojeto.vercel.app` enquanto o domínio não for decidido (T04).

### Indexação no Google (T20)

- Sem `SITE_URL`, o site calcula normalmente, mas envia `noindex`, bloqueia rastreamento no `robots.txt` e retorna sitemap vazio. HTTP também não habilita indexação.
- Em produção com `SITE_URL` HTTPS, `/sitemap.xml` lista a calculadora, termos e privacidade. Cada página tem sua URL canônica. `/entrar` permanece `noindex`; `/api/` fica bloqueada no robots.
- Prévias (`VERCEL_ENV=preview`) e desenvolvimento permanecem bloqueados, mesmo com `SITE_URL` preenchida. Robots orienta buscadores; não é controle de acesso.
- Após publicar, confira `/robots.txt`, `/sitemap.xml` e a URL canônica no HTML. No Search Console, verifique a propriedade do domínio por DNS e envie `sitemap.xml`. A verificação de propriedade e a escolha de medição (Plausible/GA) continuam pendentes.

## 3. Supabase e autenticação

1. Confira o projeto `uivewvttfvaoqdzltrnc` antes de aplicar mudanças. As migrações foram aplicadas pelo painel e ainda não têm histórico em `supabase_migrations`; veja [`banco.md`](banco.md) antes de usar `db push`.
2. Em Authentication → URL Configuration, o Site URL é `https://impostometro-opal.vercel.app` e o retorno permitido é `https://impostometro-opal.vercel.app/conta`. Ao trocar de domínio, atualize ambos. Adicione retornos de desenvolvimento apenas quando necessário; evite liberar todas as prévias da equipe no banco de produção.
3. Em Production na Vercel, configure `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. O `next.config.ts` repassa a URL e a chave publicável ao navegador. Chaves secretas ficam exclusivamente no servidor.
4. Publique novamente após mudar variáveis. A Vercel pode pedir verificação de identidade ao dono da conta.
5. Configure SMTP próprio e as credenciais OAuth do Google antes de testar esses fluxos para o público. Confirmação de e-mail permanece ligada e login anônimo permanece desligado.
6. Os XMLs são lidos no navegador; o fluxo atual não exige bucket de armazenamento.

Para cobrança, configure o ambiente do Asaas e o webhook antes de acrescentar `SUPABASE_SECRET_KEY`: com essa chave e `ASAAS_API_KEY`, o código ativa a cobrança. Veja o procedimento de sandbox em [`banco.md`](banco.md).

## Variáveis de ambiente (todas)

| Variável | Onde | Para quê |
|---|---|---|
| `SITE_URL` | site, ambiente Production | endereço HTTPS público para sitemap e canônicas; vazio desabilita indexação |
| `SUPABASE_URL` | servidor e configuração pública do login | URL do projeto Supabase; configurada em Production |
| `SUPABASE_PUBLISHABLE_KEY` | servidor e configuração pública do login | chave publicável, protegida pelas permissões e políticas do banco; configurada em Production |
| `SUPABASE_SECRET_KEY` | somente servidor | administração da assinatura; ainda não configurada nesta entrega |
| `ASAAS_API_KEY` | somente servidor | chave do Asaas; já cadastrada como Secret em Production; ambiente ainda precisa ser conferido |
| `ASAAS_AMBIENTE` | somente servidor | `sandbox` ou `producao`; conferir junto com a chave antes de ativar cobrança |
| `ASAAS_WEBHOOK_TOKEN` | somente servidor e configuração do webhook | autentica os avisos do Asaas; pendente |
| `ASSINATURA_PRECO_CENTAVOS` | somente servidor | preço opcional; não alterar para teste sem planejar a cobrança |
| `CALCULADORA_URL` | quem roda os testes | endereço da calculadora oficial em Docker para `npm run porte:comparar` e `testes-dourados/*.py` (padrão: `http://localhost:8080/api/calculadora`) |
| `MOTOR_CHAVE` | quem roda os testes (opcional) | só se a calculadora oficial estiver atrás de um porteiro com chave. Normalmente vazia |

`CALCULADORA_URL` e `MOTOR_CHAVE` pertencem aos testes da referência Java. O site em produção usa o porte local.
