# T16 · Upload e leitura de XML de NF-e/NFC-e

| Campo | Valor |
|---|---|
| Status | 🟡 Pronto para revisão (falta só restringir a assinantes, T13/T14) |
| Épico | E5 Importação de XML |
| Sprint | S4 |
| Prioridade | P0 |
| Pontos | 5 |
| Depende de | T15 |

## História

Como assinante, quero enviar as notas do mês de uma vez, em vez de digitar item por item.

## Critérios de aceite

- [x] Aceita vários XMLs ou um .zip, até 500 notas por lote (suposição de limite). Notas repetidas (mesma chave) são apontadas.
- [x] Lê de cada item: NCM, valor, quantidade, frete, desconto, município, UF e, se houver, CST e cClassTrib (`site/src/lib/nfe.ts`).
- [x] ~~O arquivo vai direto do navegador para um bucket privado do Supabase (a Vercel limita envios a ~4,5 MB) e é apagado logo após a leitura~~. **Mudou:** o XML é lido no próprio navegador e nunca sai do computador da pessoa; só os dados fiscais de cada item vão para o cálculo, em pedidos de 50 notas. Não precisa de bucket nem esbarra no limite da Vercel. CPF e nome do cliente final são ignorados (LGPD). Ver `docs/decisoes.md`.
- [x] Nota inválida ou de outro tipo é apontada, sem travar o lote (NFS-e, CT-e, nota de entrada, devolução, sem município/data/itens).
- [x] NFS-e fica para depois do MVP (T25): é reconhecida e recusada com explicação.

**Suposições:** sem a base da reforma na nota (`vBC` do grupo IBSCBS), a base é estimada como vProd − vDesc + vFrete + vSeg + vOutro; o local do fato gerador é `cMunFGIBS` ou, se não houver, `cMunFG`.

**Pendente:** a página `/importar` está aberta como prévia (fora do Google). Restringir a assinantes depende do login (T13) e da assinatura (T14).

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
