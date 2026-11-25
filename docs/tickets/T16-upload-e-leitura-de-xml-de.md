# T16 · Upload e leitura de XML de NF-e/NFC-e

| Campo | Valor |
|---|---|
| Status | ⏳ A fazer |
| Épico | E5 Importação de XML |
| Sprint | S4 |
| Prioridade | P0 |
| Pontos | 5 |
| Depende de | T15 |

## História

Como assinante, quero enviar as notas do mês de uma vez, em vez de digitar item por item.

## Critérios de aceite

- [ ] Aceita vários XMLs ou um .zip, até 500 notas por lote (suposição de limite).
- [ ] Lê de cada item: NCM, valor, quantidade, frete, desconto, município, UF e, se houver, CST e cClassTrib.
- [ ] O arquivo vai direto do navegador para um bucket privado do Supabase (a Vercel limita envios a ~4,5 MB) e é apagado logo após a leitura; CPF e nome do cliente final são ignorados (LGPD).
- [ ] Nota inválida ou de outro tipo é apontada, sem travar o lote.
- [ ] NFS-e fica para depois do MVP (T25).

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
