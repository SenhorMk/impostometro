# T15 · Cadastro mínimo da empresa

| Campo | Valor |
|---|---|
| Status | 🟡 Pronto para revisão (falta aplicar a migração) |
| Épico | E4 Conta e assinatura |
| Sprint | S4 |
| Prioridade | P0 |
| Pontos | 2 |
| Depende de | T13 |

## História

Como assinante, quero informar minha empresa uma vez, para não repetir dados em cada cálculo.

## Critérios de aceite

- [x] Campos: município, UF, regime; CNPJ (com conferência dos dígitos) e razão social opcionais. Em `/conta`.
- [x] Uma empresa por conta no MVP (a chave da tabela `empresas` é a própria conta).

Suposição: regimes oferecidos são regime regular, Simples Nacional e MEI; quem escolhe Simples ou MEI vê o aviso de que os cálculos ainda seguem o regime regular.

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
