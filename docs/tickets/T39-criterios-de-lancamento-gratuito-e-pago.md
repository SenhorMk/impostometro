# T39 · Registrar os critérios e evidências dos dois lançamentos

| Campo | Valor |
|---|---|
| Status | 🟡 Lista e primeira conferência feitas; lançamentos pendentes dos achados e merges |
| Marco | A |
| Prioridade | P0 por marco |
| Pontos | 3 |
| Depende de | T20, T33, T21, T38, T07 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/26 |

## História

Como dono, quero saber o que está pronto para divulgar e o que ainda falta para cobrar, sem depender de uma lista enorme de tarefas externas.

## Estado existente

Há código publicado e funcionalidades propostas em PR. A estratégia foi ajustada para lançamento orgânico sem orçamento; o piloto de dez empresas é hipótese futura, não bloqueio.

## Escopo

- Manter uma lista executável para lançamento gratuito e outra para assinatura, com evidências e versão publicada.
- Conferir promessas da página, caminhos principais e recuperação de falhas.
- Registrar pendências opcionais e riscos reais sem declarar teste ou revisão inexistente.

## Critérios de aceite

- [x] Marco gratuito exige domínio HTTPS, rastreamento correto, calculadora funcional, apresentação coerente, informações de uso/contato, navegação verificada e observação básica.
- [x] Marco assinatura acrescenta T13, T15, T14, T37, T34, T35, T18 e T27 validados no ambiente aplicável, com recuperação de dados verificada.
- [x] Google, cenários avançados T36, todos os setores T30, integração ERP e recrutamento de empresas não bloqueiam o marco gratuito.
- [x] Lista diferencia teste local/simulado, integração real, revisão de conteúdo e publicação; inclui commit e links de evidência.
- [x] Nenhum serviço pago é contratado por pressuposição. Registrar compatibilidade e limites dos serviços atuais e pedir decisão específica se houver custo indispensável.
- [x] Divulgação ou cobrança só anuncia as funções efetivamente disponíveis; pendências têm responsável pela próxima ação e critério verificável, sem inventar prazo.

## Entrega (28/11/2026)

Lista com evidências em [`docs/lancamento.md`](../lancamento.md), conferida no deploy `dpl_EU2WQFPbXxEc9QckaUBwpgPmfuzS` (commit `6a77373`). Os critérios acima tratam da **lista**; os dois lançamentos continuam pendentes, com responsável e forma de conferir em cada linha. Três achados bloqueiam a divulgação: assinatura do sandbox à venda em produção (variável `MODO_ACESSO` criada depois do deploy), SQL da revisão de segurança ausente no banco e contato sem e-mail. Diário: [2026-11-28-t39](../diario/2026-11-28-t39.md).

## Verificação

Executar a lista no deploy escolhido e manter evidências das jornadas; atualizar após cada publicação relevante.

## Fora do escopo

Marcar lançamento como concluído porque abriu uma página, exigir dez clientes antes de publicar ou realizar cobrança real sem autorização.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [T22](T22-funil-medido-e-checklist-de-lancamento.md), [T36](T36-cenarios-versionados-e-comparacao.md), [T30](T30-conteudo-util-e-divulgacao-organica.md).

Arquivos ou destinos previstos: `docs/lancamento.md`, `docs/deploy.md`, `docs/backlog.md`.

Skills: as pertinentes de [`docs/skills.md`](../skills.md), consultadas antes da execução.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
