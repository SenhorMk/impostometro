# T14 · Assinatura recorrente e limite do plano grátis

| Campo | Valor |
|---|---|
| Status | 🟡 Pronto para revisão (falta ligar o Asaas e testar no sandbox e com R$ 1) |
| Épico | E4 Conta e assinatura |
| Sprint | S5 |
| Prioridade | P0 |
| Pontos | 5 |
| Depende de | T13, T04 |

## História

Como dono, quero cobrar todo mês de forma automática, para validar se as pessoas pagam.

## Critérios de aceite

- [x] Gateway brasileiro com Pix e cartão: **Asaas**, escolhido pelo Mateus em 26/11/2026. A pessoa escolhe Pix, cartão ou boleto na página do Asaas (`billingType: UNDEFINED`).
- [x] Aviso do gateway ativa, atrasa ou cancela a assinatura no site sozinho (`/api/asaas/webhook`, regras testadas em `assinatura.test.ts`; avisos repetidos são ignorados).
- [x] Plano grátis limitado: simulações manuais ilimitadas; importar XML só para assinante (trava no servidor em `/api/calcular-lote` e aviso na tela).
- [x] Assinante cancela sozinho em `/conta`; o acesso vale até o fim do mês pago. Apagar a conta também cancela.
- [ ] Pagamento testado no ambiente de testes do gateway e com uma cobrança real de R$ 1. **Pendente:** testado só com o Asaas e o Supabase simulados (a rede deste ambiente não alcança o Asaas). Passo a passo em `docs/banco.md`; o R$ 1 usa `ASSINATURA_PRECO_CENTAVOS=100`.

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
