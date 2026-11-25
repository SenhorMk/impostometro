# T08 · Serviço de cálculo

| Campo | Valor |
|---|---|
| Status | ✅ Feito (falta gravar no banco) |
| Épico | E2 Motor de cálculo |
| Sprint | S1 |
| Prioridade | P0 |
| Pontos | 5 |
| Depende de | T01, T03 |

## História

Como site, quero uma única função “calcular” que monta o pedido, chama a calculadora e devolve o resultado traduzido.

## Critérios de aceite

- [x] Usa o “cálculo com observabilidade”, para um item com erro não travar os outros (`site/src/lib/motor.ts`).
- [x] Injeta as alíquotas do T03 conforme a data.
- [x] Devolve, por item: base, alíquota, redução, valor de CBS e IBS, status e memória de cálculo.
- [ ] Grava em cada cálculo a versão do motor e da tabela de alíquotas (já devolve as duas; falta gravar no banco, depende do Supabase).
- [x] Itens que a calculadora não trata aparecem como “não calculado”, nunca com valor inventado.

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
