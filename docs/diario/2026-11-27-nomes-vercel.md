# Nomes das variáveis iguais aos da Vercel

Data: 27/11/2026. Pedido do Mateus: "já cadastrei algumas chaves na Vercel, como Asaas e secret do Supabase, preciso que dê uma verificada no nome das chaves e mude no código pra deixar igual".

## Escopo

Conferir os **nomes** (nunca os valores) das variáveis do projeto `impostometro` na Vercel e fazer o código e a documentação usarem esses nomes. Nada foi alterado na Vercel.

## Fontes

- Conector Vercel, listagem das variáveis do projeto sem descriptografar (`decrypt=false`). As variáveis sensíveis vêm sem valor; só os nomes foram usados.
- Código: `process.env.*` em `site/src`, `site/.env.example`, `docs/deploy.md`, `docs/banco.md`.

## O que existe na Vercel (todas só em Production)

| Nome na Vercel | O código usava | Agora |
|---|---|---|
| `SITE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | mesmo nome | sem mudança |
| `ASAAS_ENVIROMENT` | `ASAAS_AMBIENTE` | renomeado (grafia da Vercel, sem o N) |
| `ASAAS_API_KEY_SANDBOX` | (não existia) | chave usada no sandbox |
| `ASAAS_API_KEY` (comentário "desativado-produção") | chave única | chave usada só em produção |
| `Token_Autenticacao_Sandbox` | `ASAAS_WEBHOOK_TOKEN` | token do webhook no sandbox |
| `Token_Autenticacao` | `ASAAS_WEBHOOK_TOKEN` | token do webhook em produção |

**Suposição:** `Token_Autenticacao(_Sandbox)` é o "Token de autenticação" do webhook no painel do Asaas. É o único token que o código usa, e o nome bate com o rótulo do painel.

**Faltando na Vercel:** `MODO_ACESSO` (importante, ver abaixo). Opcionais: `ASSINATURA_PRECO_CENTAVOS`, `SENTRY_DSN`, `CONTATO_EMAIL`, `ASAAS_URL`.
**Sobrando:** nenhuma; todas as cadastradas agora são lidas pelo código.

## Implementação

| Arquivo | O que mudou |
|---|---|
| `site/src/lib/asaas-config.ts` (novo) | `ambienteAsaas`, `chaveAsaas`, `tokenWebhookAsaas`: `ASAAS_ENVIROMENT` escolhe o par chave + token. Vazio ou desconhecido = sandbox |
| `site/src/lib/asaas.ts` | usa a chave e o endereço do ambiente escolhido |
| `site/src/app/api/asaas/webhook/route.ts` | compara o cabeçalho com o token do ambiente escolhido |
| `site/src/lib/acesso-regras.ts` | "cobrança configurada" = chave **do ambiente escolhido** + banco |
| `site/src/lib/asaas-config.test.ts` (novo), `acesso.test.ts` | testes dos nomes e de "nunca mistura ambiente" |
| `site/.env.example`, `docs/deploy.md`, `docs/banco.md`, `docs/acesso.md`, `docs/seguranca.md`, T14, `docs/decisoes.md` | nomes novos |

## Comandos e resultados

- `npm test`: 100 passaram, 0 falharam.
- `npm run lint`, `npx next typegen && npx tsc --noEmit`, `npm run build`: sem erros.
- Interface não mudou; sem teste visual.

## Limitações e atenção ao fazer o merge

- Os **valores** não foram conferidos (são sensíveis). Se `ASAAS_ENVIROMENT` tiver algo diferente de `producao`/`production`/`prod`, o site usa sandbox.
- Com este código, a Vercel já tem `SUPABASE_URL`, `SUPABASE_SECRET_KEY` e (no sandbox) `ASAAS_API_KEY_SANDBOX`: a cobrança **liga** e, sem `MODO_ACESSO`, `/importar` passa a exigir assinatura, antes de o webhook estar testado. Para manter a prévia aberta, criar `MODO_ACESSO=previa` antes do merge.
- Variáveis só em Production: prévias da Vercel ficam com importação fechada (seguro).

PR: ver link na descrição do branch `claude/project-thread-uen8uv`.
