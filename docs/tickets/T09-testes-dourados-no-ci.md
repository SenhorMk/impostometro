# T09 · Testes dourados no CI

| Campo | Valor |
|---|---|
| Status | ✅ Feito |
| Épico | E2 Motor de cálculo |
| Sprint | S2 |
| Prioridade | P0 |
| Pontos | 2 |
| Depende de | T02, T06, T08 |

## História

Como time, quero que as 30 operações rodem a cada mudança, para trocar a versão do motor com segurança.

## Critérios de aceite

- [x] O CI sobe a calculadora oficial e confere as 30 saídas esperadas (`calculadora.yml`).
- [x] Uma diferença, mesmo de centavos, falha o CI e mostra o item e o valor.
- [x] Os 30 dourados também rodam no porte, sem Docker (`npm test` em `site.yml`).
- [x] Passo a passo escrito para atualizar a calculadora e o porte ([`manutencao.md`](../manutencao.md)).

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
