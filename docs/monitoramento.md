# Monitoramento e backup (T07)

Três coisas: saber quando o site **quebra** (Sentry), saber quando o site **cai** (alerta no `/api/saude`) e não **perder dados** (backup).

## 1. Erros no site: Sentry

O código já está pronto e fica desligado até existir a variável `SENTRY_DSN`.

- Servidor: `site/src/instrumentation.ts` liga o Sentry quando o site sobe e manda os erros de rotas e páginas (`onRequestError`).
- Navegador: `site/src/instrumentation-client.ts` carrega o Sentry à parte (não pesa a página de quem não tem DSN).
- Privacidade (`site/src/lib/monitoramento.ts`): `sendDefaultPii: false`, sem rastreamento de desempenho e, antes de enviar, apaga corpo do pedido, cookies, cabeçalhos, parâmetros da URL e usuário. Assim valores de venda e dados das notas não saem do site.

**Para ligar (Mateus, grátis):**
1. Criar conta em https://sentry.io (plano Developer, grátis) e um projeto **Next.js**.
2. Copiar o DSN (Settings → Projects → o projeto → Client Keys). O DSN não é segredo: só serve para enviar erros.
3. Na Vercel, Settings → Environment Variables: `SENTRY_DSN` = o DSN. Fazer um novo deploy.
4. No Sentry, em Alerts, deixar o alerta padrão de "novo problema" por e-mail.

Limitação: sem `withSentryConfig` e sem token de upload, os erros do navegador chegam com o código minificado (dá para ver a mensagem e a página, não a linha exata). Dá para ligar o envio de source maps depois, se precisar.

## 2. Site fora do ar: `/api/saude`

`GET /api/saude` faz um cálculo de verdade com a calculadora (camiseta de R$ 100 em São Paulo, caso 01 dos testes dourados) e responde:

- `200 {"ok": true, "calculadora": "1.7.2", "tabelas": "V0073", "aliquotas": "...", "ms": 3}` quando está tudo bem;
- `503` quando a calculadora não calcula.

Não usa banco nem serviços de fora, então pode ser chamado a cada poucos minutos sem custo.

**Para ligar (Mateus, grátis):** criar conta no UptimeRobot (https://uptimerobot.com) ou Better Stack, adicionar um monitor HTTP para `https://<endereço do site>/api/saude` a cada 5 minutos e escolher aviso por e-mail ou Telegram. Testar pausando: o aviso deve chegar.

## 3. Backup do banco

- **Plano Free (agora):** o Supabase não garante backup baixável. Uma vez por semana, exportar e guardar fora (Google Drive pessoal, por exemplo):
  - painel do Supabase → Database → Backups (se aparecer a opção de baixar), ou
  - no computador, com a CLI do Supabase: `supabase db dump --db-url "<connection string>" -f backup-AAAA-MM-DD.sql` e `supabase db dump --db-url "<connection string>" --data-only -f dados-AAAA-MM-DD.sql`. A connection string fica em Connect → Session pooler; **nunca** colocar no git nem no chat.
- **Plano Pro (no lançamento pago):** backup diário automático com 7 dias de retenção.
- **Por que não pelo GitHub Actions:** o repositório é público, e arquivos gerados pelas Actions podem ser baixados por qualquer pessoa logada no GitHub.

**Teste de restauração (critério do ticket):** criar um projeto Supabase temporário (Free), rodar `psql "<connection string do temporário>" -f backup.sql` e depois o arquivo de dados, conferir algumas linhas e apagar o projeto temporário. Anotar data e resultado no diário. Ainda não foi feito.
