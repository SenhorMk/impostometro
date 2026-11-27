# Revisão de segurança severa

Data: 27/11/2026. Pedido do Mateus (ordem de 26/11): depois do MVP e da UI/UX, uma revisão de segurança severa. Entrega para revisão em PR, sem merge. Relatório completo: [`docs/seguranca.md`](../seguranca.md).

## Escopo

Código da `main` (rotas de API, login, assinatura, webhook do Asaas, importação de XML), PR #6 (histórico e funil, tabelas já aplicadas no banco), configuração real do Supabase (só leitura: RLS, permissões, funções e avisos do "Security Advisor"), segredos no histórico do git, cabeçalhos HTTP, CI e dependências. Visual não foi tocado (redesign em outra frente).

## Fontes

- Guia de CSP do Next 16 em `site/node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` (versão "sem nonce", para manter as páginas estáticas).
- Security Advisor do Supabase (conector, só leitura): avisou `contar_evento` executável por visitante e `apagar_minha_conta` por conta logada; os dois foram endurecidos.
- Documentação do Asaas já registrada no diário do T14 (`GET /payments/{id}`, status `CONFIRMED`/`RECEIVED`).

## Implementação

| Arquivo | O que faz |
|---|---|
| `site/src/lib/limite.ts` | limite de pedidos por minuto e leitura de JSON com teto de bytes |
| `site/src/app/api/asaas/webhook/route.ts` | reserva do aviso antes de processar; pagamento conferido no Asaas |
| `site/src/app/api/assinatura/route.ts` | sem cobrança dupla; link só do Asaas; limites |
| `site/src/app/api/calcular*`, `busca-oficial`, `codigos` | limites e validação de faixa |
| `site/src/lib/nfe.ts` + `Importador.tsx` | recusa DOCTYPE/ENTITY; filtro contra zip bomba |
| `site/next.config.ts` | CSP, HSTS, X-Frame-Options e outros cabeçalhos |
| `supabase/migrations/20261127210000_revisao_seguranca.sql` | apagar conta só sem assinatura viva; funil; tetos do histórico e das buscas |
| `.github/workflows/*.yml`, `.gitignore` | CI só com leitura; `.env` ignorado |

## Comandos e resultados

- `npm test`: 61 de 61 (6 testes novos em `seguranca.test.ts`).
- `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`: sem erros.
- `npm audit`: 0 vulnerabilidades.
- `next start` + `curl`: cabeçalhos presentes; corpo de 6 KB em `/api/calcular` → 413; 60 pedidos/minuto → 429 a partir do 61º; webhook sem token → 401; lote válido calcula.
- Playwright (Chromium) em `/`, `/importar`, `/entrar`, `/conta`, um artigo e `/glossario`: nenhum erro de console nem bloqueio da CSP; importação de um .zip com as notas de exemplo funcionou.
- SQL: rodado num Postgres local (PGlite) depois de todas as migrações (incluindo as do PR #6), duas vezes seguidas. Conferido: visitante soma "visita" mas não "assinatura"; servidor soma "assinatura"; apagar conta com assinatura viva é recusado e com cancelada funciona; 31ª gravação no mesmo minuto é recusada; outra conta não lê o histórico; visitante não lê assinaturas.

## Pendências

- SQL a rodar pelo Mateus no SQL Editor; tarefas de conta (2FA, firewall, redirect URLs, proteção da `main`) em `PARA-FAZER-MATEUS.txt`.
- Não testado contra o Asaas de verdade (sandbox ainda não configurado): a conferência do pagamento no webhook precisa do teste do passo "pagar a cobrança de teste".
- Limitações em `docs/seguranca.md`, seção 4 (rate limit por instância, CSP com `unsafe-inline`, CAPTCHA no login).
