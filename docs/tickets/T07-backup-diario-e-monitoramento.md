# T07 · Operar com verificação de saúde e recuperação dos dados

| Campo | Valor |
|---|---|
| Status | 🟡 Implementação proposta no PR 6 |
| Marco | A |
| Prioridade | P0 gratuito básico; P0 assinatura recuperação |
| Pontos | A estimar após revisar o código existente |
| Depende de | T05 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/14 |

## História

Como dono, quero descobrir falhas e recuperar os dados necessários sem depender de um cliente avisar que perdeu o acesso ou o histórico.

## Estado existente

O PR 6 propõe /api/saude, Sentry opcional e plano de backup. Conferir os objetos e as migrações já existentes antes de aplicar qualquer arquivo no Supabase.

## Escopo

- Revisar a parte de saúde e observação do PR 6 e integrar o que for aprovado.
- Definir observação básica com recursos gratuitos disponíveis e um procedimento de falha.
- Antes de armazenar entregas pagas, definir backup protegido, retenção e restauração verificável.

## Critérios de aceite

- [ ] Endpoint de saúde executa um cálculo de referência e diferencia sucesso de falha sem expor segredos ou dados de clientes.
- [ ] Registrar como o dono será avisado e como consultar falhas; Sentry ou serviço pago não é obrigatório.
- [ ] Não enviar XML, tokens, documentos ou corpos de pedidos para logs de erro.
- [ ] Documentar o que pode ser recuperado, frequência e local protegido do backup; nunca usar artefato público de GitHub para dados reais.
- [ ] Antes da abertura da assinatura, demonstrar restauração em ambiente separado e registrar o resultado sem tocar na produção.
- [ ] Não modificar plano, conta de serviço ou custo recorrente sem autorização específica.

## Verificação

Testar resposta de saúde e um cenário controlado de erro. Exercitar a restauração com dados de teste no ambiente apropriado.

## Fora do escopo

Alta disponibilidade empresarial ou contratação de Sentry, monitoramento ou plano Supabase como condição automática.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [PR #6](https://github.com/SenhorMk/impostometro/pull/6), [T39](T39-criterios-de-lancamento-gratuito-e-pago.md).

Arquivos ou destinos previstos: `site/src/app/api/saude/route.ts`, `docs/monitoramento.md`, `docs/deploy.md`.

Skills: as pertinentes de [`docs/skills.md`](../skills.md), consultadas antes da execução.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
