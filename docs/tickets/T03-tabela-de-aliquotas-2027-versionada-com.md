# T03 · Tabela de alíquotas 2027 versionada, com fonte oficial

| Campo | Valor |
|---|---|
| Status | ✅ Feito (valor provisório) |
| Épico | E0 Estudo e decisões |
| Sprint | S0 |
| Prioridade | P0 |
| Pontos | 2 |
| Depende de | nada |

## História

Como empresário, quero que cada resultado use alíquotas com fonte oficial, para confiar no número.

## Critérios de aceite

- [x] Arquivo versionado com CBS, IBS estadual e IBS municipal de 2027, início de vigência e link da fonte (`site/src/dados/aliquotas.json`).
- [x] Valores de partida pesquisados: CBS 11,2% provisória (TCU 11,3% − 0,1 p.p.), IBS 0,05% + 0,05%. (O backlog original dizia 8,8%.)
- [ ] Confirmar a CBS na resolução do Senado (prazo 15/12/2026) e marcar como oficial.
- [x] Painel de administração fica para depois (T29); mudar alíquota = editar o arquivo ([`manutencao.md`](../manutencao.md)).

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
