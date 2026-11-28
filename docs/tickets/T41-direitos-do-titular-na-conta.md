# T41 · Direitos do titular em Minha conta: baixar meus dados e aceite de cada versão

| Campo | Valor |
|---|---|
| Status | 🟡 Código em PR; SQL e teste com conta real pendentes |
| Marco | B |
| Prioridade | P0 assinatura |
| Pontos | 3 |
| Depende de | T13, T15, T18 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/34 |

## História

Como cliente, quero baixar uma cópia de todos os meus dados e saber quando a política mudou, para exercer acesso e portabilidade sem depender de ninguém.

## Escopo

- "Baixar meus dados" em Minha conta: JSON com conta, aceites, empresa, assinatura, histórico completo e o que fica no navegador, mais a explicação de cada parte e o que fica com terceiros (Asaas). Montado no navegador com o login; sem servidor e sem link público.
- `aceites_termos` (histórico) e `aceitar_termos(versao)`; aviso em Minha conta quando `VERSAO_TERMOS` muda.
- `lgpd_registro`: totais por dia de contas apagadas e dados baixados, sem identificar ninguém.
- Funciona antes do SQL rodar: o aceite cai no jeito antigo e o arquivo usa o aceite do perfil.

## Critérios de aceite

- [x] O arquivo traz todos os dados pessoais das tabelas da conta (teste em `privacidade.test.ts`).
- [x] Gravar aceite só pela função; a pessoa não grava aceite de outra nem lê o registro (testado em PGlite).
- [x] Quem tem aceite antigo vê o aviso da versão nova e continua usando a conta.
- [ ] 🧑 Rodar `20261128120000_lgpd.sql` no Supabase.
- [ ] Testar com conta real: baixar, conferir o JSON, aceitar a versão nova e apagar a conta.

## Verificação

`npm test`, lint, tipos e build; SQL testado em PGlite com as migrações do repositório (rodado duas vezes).

---
[← Todos os tickets](README.md) · [LGPD](../lgpd.md)
