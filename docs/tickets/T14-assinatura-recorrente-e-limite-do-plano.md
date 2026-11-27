# T14 · Concluir Asaas com pagamento acesso e cancelamento verificáveis

| Campo | Valor |
|---|---|
| Status | 🟡 Código existente; Asaas completo não validado |
| Marco | B |
| Prioridade | P0 assinatura |
| Pontos | A estimar após revisar o código existente |
| Depende de | T13, T15, T37 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/17 |

## História

Como usuário, quero pagar pelo plano anunciado, receber acesso e cancelar sem precisar de intervenção manual.

## Estado existente

Há rotas de assinatura/webhook, regras e testes simulados. ASAAS_API_KEY foi encontrada na Vercel, mas ambiente, webhook, token e chave secreta do Supabase não foram validados de ponta a ponta. Não criar outra integração do zero.

## Escopo

- Conferir separação de sandbox e produção e os segredos somente nos destinos corretos.
- Validar o percurso completo de compra, atualização de assinatura e cancelamento.
- Manter cobrança indisponível na interface enquanto o ambiente publicado não estiver validado.

## Critérios de aceite

- [ ] Chave, ambiente, URL do webhook e token correspondem ao mesmo ambiente e ficam fora do Git e do navegador.
- [ ] No sandbox, criar assinatura e comprovar liberação após confirmação de pagamento, sem tratar clique no checkout como pagamento.
- [ ] Webhook autenticado recusa token inválido e eventos repetidos não duplicam efeitos.
- [ ] Exercitar pendência, atraso, cancelamento, estorno e falha de comunicação; o acesso segue regras documentadas.
- [ ] Usuário cancela e vê status e vigência coerentes; não há nova recorrência indevida após o cancelamento confirmado.
- [ ] Preço e periodicidade exibidos correspondem ao que o servidor envia ao gateway.
- [ ] Validação de produção é registrada; uma transação real exige autorização específica do dono e não é disparada por este ticket automaticamente.

## Verificação

Cenários no sandbox e reconciliação de estados no banco. Confirmar rotas, eventos e regras com documentação vigente durante a implementação.

## Fora do escopo

Cobrança real sem autorização, alteração de preço por suposição ou substituição do Asaas.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [T37](T37-acesso-gratis-previa-e-assinatura.md), [T39](T39-criterios-de-lancamento-gratuito-e-pago.md).

Arquivos ou destinos previstos: `site/src/lib/asaas.ts`, `site/src/lib/assinatura.ts`, `site/src/app/api/asaas/webhook/route.ts`, `site/src/app/api/assinatura/route.ts`.

Skills: `supabase:supabase`, `vercel:verification` e, para segredos, `vercel:env-vars`.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
