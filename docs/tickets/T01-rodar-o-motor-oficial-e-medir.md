# T01 · Rodar o motor oficial e medir RAM e tempo

| Campo | Valor |
|---|---|
| Status | ✅ Feito |
| Épico | E0 Estudo e decisões |
| Sprint | S0 |
| Prioridade | P0 |
| Pontos | 3 |
| Depende de | nada |

## História

Como time, quero a calculadora oficial do regime regular rodando em Docker, para saber do que ela precisa e ter a referência dos cálculos.

## Critérios de aceite

- [x] Container com Java 25 e o banco SQLite gerado pelos scripts oficiais sobe com um comando (`docker compose up -d --build`).
- [x] O exemplo oficial (educação, R$ 1.200,00) devolve CBS de R$ 42,24 e IBS de R$ 0,48 (`scripts/validar-calculadora.sh`).
- [x] RAM em repouso e sob 50 cálculos seguidos anotada, e tempo médio por cálculo (~600 MB, 12 ms; `calculadora/README.md`).
- [x] Versão do motor testada anotada (1.7.2, tabelas V0073).

## Notas

Hoje a imagem oficial é só a **referência**: o site usa o porte em TypeScript (T08b).

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
