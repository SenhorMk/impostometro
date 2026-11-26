# T17 · Calcular o lote item a item

| Campo | Valor |
|---|---|
| Status | 🟡 Pronto para revisão |
| Épico | E5 Importação de XML |
| Sprint | S5 |
| Prioridade | P0 |
| Pontos | 5 |
| Depende de | T08, T16 |

## História

Como assinante, quero ver o total de CBS e IBS das minhas vendas do mês e o detalhe de cada nota.

## Critérios de aceite

- [x] Total do lote e lista de notas e itens, cada um com “como chegamos nisso” (base e de onde veio, classificação, CBS, alíquota efetiva, redução, IBS e memória de cálculo oficial), com versões e alíquotas usadas.
- [x] Itens com erro aparecem marcados, com a mensagem em português, e ficam fora da soma.
- [x] Quando a nota não tem cClassTrib, o site sugere tributação integral (000001) por NCM, mostra os tratamentos especiais que a calculadora aceita para aquele NCM e só calcula depois da caixa “Conferi e confirmo”.
- [x] 500 notas calculadas em menos de 1 minuto: medido 1,7 s para 500 notas com 10 itens cada (5.000 itens), servidor local de produção.

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
