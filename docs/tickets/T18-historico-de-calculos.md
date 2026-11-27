# T18 · Histórico de cálculos

| Campo | Valor |
|---|---|
| Status | 🟡 Em revisão (PR) |
| Épico | E4 Conta e assinatura |
| Sprint | S6 |
| Prioridade | P1 |
| Pontos | 3 |
| Depende de | T17 |

## História

Como assinante, quero rever cálculos antigos, para comparar meses.

## Critérios de aceite

- [x] Lista de cálculos com data, origem (manual ou XML) e totais.
- [x] Reabrir um cálculo mostra a versão da calculadora e das alíquotas com que foi feito.

## Como ficou

- Tabela `calculos` (migração `supabase/migrations/20261126160000_historico_calculos.sql`): totais em colunas, versões usadas e o resultado completo em `detalhe` (até ~5 MB). Cada conta só lê, grava e apaga as próprias linhas (RLS); limite de 2.000 cálculos por conta (gatilho). Apagar a conta apaga o histórico.
- Quem está logado grava sozinho: a simulação manual (`Calculadora.tsx`) e o lote de XML (`Importador.tsx`). Funções puras em `site/src/lib/historico.ts` (testadas), banco em `historico-navegador.ts`.
- Página `/conta/historico` (link em "Minha conta"): data, origem, título, CBS, IBS, base e % da base. **Reabrir** mostra o resultado salvo (nada é recalculado) com a versão da calculadora, das tabelas e das alíquotas. **Apagar** remove na hora.
- Lote grande demais para o limite guarda só os totais e avisa ao reabrir.
- Pendente: o Mateus rodar o SQL no Supabase.

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
