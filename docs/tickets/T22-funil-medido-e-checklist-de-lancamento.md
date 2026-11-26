# T22 · Funil medido e checklist de lançamento

| Campo | Valor |
|---|---|
| Status | 🟡 Em revisão (PR) |
| Épico | E7 Lançamento |
| Sprint | S6 |
| Prioridade | P1 |
| Pontos | 2 |
| Depende de | T14, T17 |

## História

Como dono, quero saber em que etapa as pessoas desistem, para ajustar preço e marketing.

## Critérios de aceite

- [x] Eventos contados: visita, cálculo grátis, cadastro, assinatura, cancelamento.
- [ ] Checklist final (lista pronta em [`lancamento.md`](../lancamento.md); itens dependem do Mateus): planos pagos da Vercel e do Supabase ativos, HTTPS, backup testado, pagamento real testado, testes dourados e porte × oficial verdes, página de contato.

## Como ficou

- Tabela `funil_diario` (dia, etapa, total) e função `contar_evento()` (migração `supabase/migrations/20261126170000_funil_diario.sql`). Sem IP, cookie, conta ou identificador: só um contador por dia. Ninguém de fora lê a tabela; o Mateus vê com `select * from funil_semanal;` no SQL Editor.
- Visita: uma por aba (`instrumentation-client.ts`, marca no `sessionStorage`). Cálculo grátis: cada resultado calculado. Cadastro: quando o aceite dos termos é gravado. Assinatura e cancelamento: no webhook do Asaas (primeiro pagamento confirmado; cancelamento da assinatura).
- Limitação: qualquer um pode somar contadores chamando a função (como qualquer contador sem login). Serve para ver tendência, não como número exato.
- Checklist de lançamento em [`docs/lancamento.md`](../lancamento.md).

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
