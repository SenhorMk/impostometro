# T35 · Registrar premissas e confirmação das classificações

| Campo | Valor |
|---|---|
| Status | 🟡 Em revisão (PR) |
| Marco | B |
| Prioridade | P0 assinatura |
| Pontos | 5 |
| Depende de | T34 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/20 |

## História

Como usuário, quero distinguir o que veio da nota, o que foi estimado e o que confirmei, para revisar os resultados com o contador.

## Estado existente

Itens sem cClassTrib recebem sugestão inicial 000001 no importador. O leitor distingue base da nota e estimada. A conta aberta e as versões do motor já existem.

## Escopo

- Expor origem da base e da classificação e exigir confirmação apropriada das pendências.
- Guardar premissas aceitas junto do resultado e do usuário que confirmou, com data e versões.
- Permitir reaproveitamento consciente de decisões sem classificar operações apenas pelo NCM de forma universal.

## Critérios de aceite

- [x] 000001 sugerido não aparece como enquadramento fiscal validado automaticamente. (cada linha diz "sugestão, ainda não confirmada"; no resultado, "sugestão nossa, NÃO confirmada")
- [x] Tela e relatório distinguem classificação da nota, sugestão e confirmação do usuário; base estimada permanece identificada. (tela, planilha CSV com a coluna "Origem da classificação" e histórico)
- [x] Itens pendentes não produzem um total apresentado como revisado ou completo. (dá para ver um rascunho sem confirmar, marcado "Rascunho, não revisado" na tela, na planilha e no título do histórico)
- [x] Mudança de classificação ou premissa produz uma nova revisão/cenário, preservando a origem do resultado anterior. (revisão 2, 3...; a anterior fica no histórico e a tela mostra o que mudou)
- [x] Reaproveitamento de escolhas é restrito à empresa e ao contexto aplicável, com possibilidade de revisar. (por CNPJ e por NCM + CFOP; só o que foi confirmado; volta como "usada antes" e pede nova confirmação; fica no navegador)
- [x] Guardar versão do motor, tabela, alíquota, data do cenário e confirmação sem persistir XML ou dados pessoais desnecessários. (o histórico guarda as premissas junto das versões que já guardava; CNPJ e protocolo não vão)

Verificado em: testes automáticos e site local no celular e no computador. Não verificado em produção. **Suposição:** "contexto" = NCM + CFOP; outros fatores (destinatário, regime especial) ficam para quando houver caso real.

## Verificação

Casos com classificação presente, ausente, sugerida, alterada e contextos distintos para mesmo NCM; conferir rastreabilidade após reabrir.

## Fora do escopo

IA decidindo enquadramento sem confirmação, aconselhamento tributário automático ou mudanças na lógica do porte.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [T12](T12-como-chegamos-nisso.md), [T18](T18-historico-de-calculos.md), [T27](T27-relatorio-revisavel-do-periodo.md), [T36](T36-cenarios-versionados-e-comparacao.md).

Arquivos ou destinos previstos: `site/src/components/Importador.tsx`, `site/src/lib/nfe.ts`, `site/src/lib/lote.ts`.

Skills: `supabase:supabase`, `vercel:verification` e, para segredos, `vercel:env-vars`.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
