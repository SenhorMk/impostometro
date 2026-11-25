# Ponto de partida e SEO

Registro retrospectivo elaborado em 25/11/2026. As verificações herdadas são identificadas para não confundir histórico com reexecução.

## Trabalho anterior no repositório

O PR [#1](https://github.com/SenhorMk/impostometro/pull/1), branch `claude/project-thread-pyhm3s`, contém o MVP de calculadora, motor TypeScript, CI e documentação. O commit `ffaf59e` documenta o porte. O README e o PR relatam comparação de 1.519 pedidos com a calculadora oficial, todos idênticos; essa comparação completa não foi reexecutada no trabalho editorial do T19.

Na primeira inspeção, a `main` continha apenas o README inicial. O código estava na branch do PR #1. Por isso a continuação usou a branch de trabalho como base e preservou a revisão do Mateus antes do merge.

## T20, PR #2

O [PR #2](https://github.com/SenhorMk/impostometro/pull/2), branch `codex/seo-tecnico`, adicionou sitemap, robots, URLs canônicas e `SITE_URL`. O domínio provisório deixou de ser usado como endereço oficial. Desenvolvimento, prévias e ambientes sem URL HTTPS configurada não pedem indexação.

Verificado naquela entrega: 32 testes do motor, lint, geração de tipos, TypeScript e nove cenários de configuração SEO passaram. O build local falhou: primeiro no download das fontes, depois em erro interno do processo de CSS do Turbopack. O PR foi aberto como rascunho com essas limitações, sem merge.

## Tickets adicionados pelo Mateus

O commit `6976675` adicionou `docs/tickets/` e atualizou as instruções para manter ticket, índice e backlog sincronizados. Essa atualização foi incorporada à continuação do SEO antes de iniciar o T19. Não houve merge na branch do PR #1 nem na `main`.

Próxima entrega: [T19](2026-11-25-t19.md), com fontes, skills e evidências próprias.
