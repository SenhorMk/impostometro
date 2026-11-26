# T13 · Login com link por e-mail e Google

| Campo | Valor |
|---|---|
| Status | 🟡 Pronto para revisão (falta ligar no painel do Supabase) |
| Épico | E4 Conta e assinatura |
| Sprint | S4 |
| Prioridade | P0 |
| Pontos | 3 |
| Depende de | T06 |

## História

Como visitante, quero criar conta em segundos, sem senha nova para lembrar.

## Critérios de aceite

- [x] Entrar com Google ou com link mágico por e-mail, usando o login do Supabase (`/entrar`, `src/components/Entrar.tsx`). O link por e-mail funciona assim que o banco for ligado; o Google precisa do cadastro do app no Google Cloud (passo a passo em `docs/banco.md`).
- [x] Aceite dos termos e da política de privacidade no cadastro: os botões só liberam com a caixa marcada, e o aceite fica gravado na tabela `perfis` com a versão dos termos.
- [x] Sair da conta e apagar a conta funcionam (`/conta`). Apagar pede para digitar APAGAR e remove a conta, a empresa e o aceite.

## Notas

Sem `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`, `/entrar` continua só explicando que as contas abrem em janeiro. O navegador usa a chave publicável; o que cada conta pode ver é decidido pelas regras do banco (RLS).

**Pendente (Mateus ou Codex, no painel do Supabase):** aplicar a migração `20261126120000_contas_perfis_e_empresas.sql`, configurar as URLs de retorno e, se quiser o Google, cadastrar o app no Google Cloud. Testado com o Supabase simulado no navegador e com as regras do banco num Postgres local; ainda não testado no projeto real.

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
