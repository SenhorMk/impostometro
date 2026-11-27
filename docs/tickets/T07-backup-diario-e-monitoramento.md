# T07 · Backup diário e monitoramento

| Campo | Valor |
|---|---|
| Status | 🟡 Código pronto; falta o Mateus criar contas |
| Épico | E1 Infraestrutura |
| Sprint | S3 |
| Prioridade | P0 |
| Pontos | 2 |
| Depende de | T05 |

## História

Como dono, quero não perder dados de clientes e saber quando algo quebra.

## Critérios de aceite

- [ ] Backup diário do banco ligado (vem no Supabase Pro; até lá, uma exportação semanal guardada fora).
- [ ] Uma restauração de teste feita e anotada.
- [ ] Sentry recebendo erros do site; aviso por e-mail ou Telegram se o site sair do ar. (Código pronto: falta criar o projeto no Sentry, pôr `SENTRY_DSN` na Vercel e cadastrar `/api/saude` num serviço de alerta. Passo a passo em [`monitoramento.md`](../monitoramento.md).)

## Como ficou

- Sentry no servidor (`site/src/instrumentation.ts`, erros de rotas e páginas) e no navegador (`site/src/instrumentation-client.ts`, carregado à parte só quando `SENTRY_DSN` existe). Sem IP, cookies, cabeçalhos nem corpo dos pedidos (`site/src/lib/monitoramento.ts`). Sem DSN, nada muda.
- `/api/saude`: faz um cálculo de verdade (caso 01 dos dourados) e responde 200 com as versões, ou 503. É o endereço para o UptimeRobot ou Better Stack (grátis) avisarem por e-mail ou Telegram.
- Backup: o repositório é público, então **não** fazemos backup por GitHub Actions (os arquivos ficariam baixáveis). Plano Free: exportação semanal manual guardada fora; no Pro, backup diário automático. Passo a passo e teste de restauração em [`monitoramento.md`](../monitoramento.md).

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
