# T42 · Retenção: apagar contas inativas automaticamente

| Campo | Valor |
|---|---|
| Status | 🟡 SQL em PR; prazo a confirmar |
| Marco | B |
| Prioridade | P1 |
| Pontos | 1 |
| Depende de | T13, T14 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/35 |

## História

Como responsável pelos dados, quero que contas abandonadas não fiquem guardadas para sempre, para cumprir a necessidade e o fim do tratamento (LGPD, art. 15 e 16).

## Escopo

- `apagar_contas_inativas()`: apaga contas sem acesso há 24 meses (ou nunca usadas desde a criação) e sem assinatura viva ou com acesso válido. Agendada no `pg_cron` todo dia 1º.
- Mesmo prazo em `MESES_INATIVIDADE`, na política e nos termos.

## Critérios de aceite

- [x] Conta com assinatura ativa nunca é apagada por inatividade; conta com acesso recente também não (testado em PGlite).
- [x] Só o banco executa a função (sem permissão para visitante nem conta logada).
- [x] Cada limpeza soma em `lgpd_registro`.
- [ ] 🧑 Decisão do T42: confirmar 24 meses.
- [ ] Futuro: avisar por e-mail 30 dias antes (precisa de e-mail transacional).

---
[← Todos os tickets](README.md) · [LGPD](../lgpd.md)
