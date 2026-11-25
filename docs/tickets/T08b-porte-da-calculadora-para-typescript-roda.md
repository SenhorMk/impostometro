# T08b · Porte da calculadora para TypeScript (roda dentro do site)

| Campo | Valor |
|---|---|
| Status | ✅ Feito |
| Épico | E2 Motor de cálculo |
| Sprint | S1 |
| Prioridade | P0 |
| Pontos | 8 |
| Depende de | T01, T02 |

## História

Como dono, quero a calculadora rodando dentro do site, sem servidor Java, para não pagar nem cuidar de um servidor só para ela, sem perder a fidelidade à calculadora oficial.

## Critérios de aceite

- [x] Lógica de cálculo da 1.7.2 traduzida linha a linha em `site/src/motor/`, com mapa Java → TS no README da pasta.
- [x] Tabelas oficiais exportadas do banco da imagem, sem mudar valores (`npm run porte:tabelas`).
- [x] Comparação porte × oficial: 1.519 de 1.519 pedidos com resposta idêntica (`npm run porte:comparar`).
- [x] CI compara a cada PR; `npm test` roda sem Docker.
- [x] Passo a passo para um agente atualizar o porte a cada versão da Receita ([`manutencao.md`](../manutencao.md)).

## Notas

Pedido do Mateus em 25/11/2026. Decisão registrada em [`decisoes.md`](../decisoes.md). Fora do porte: `gCompraGov`, `tpDoc`, `gComponentesBC` (recusados com erro).

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
