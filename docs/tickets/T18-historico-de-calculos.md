# T18 · Integrar histórico com reabertura fiel e isolamento

| Campo | Valor |
|---|---|
| Status | 🟡 Código no main (PR 6); tabela aplicada; validação com contas reais pendente |
| Marco | B |
| Prioridade | P0 assinatura |
| Pontos | A estimar após revisar o código existente |
| Depende de | T13, T15 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/21 |

## História

Como usuário, quero rever a análise original com suas versões e premissas sem que uma atualização mude os resultados antigos.

## Estado existente

O PR 6 implementa histórico, reabertura e exclusão e descreve testes simulados/local. A tabela calculos já foi observada no Supabase com RLS; inspecionar objetos e histórico antes de reaplicar migrações.

## Escopo

- Revisar e integrar a parte de histórico do PR 6.
- Validar persistência e isolamento no banco real e adaptar à análise por período e premissas.
- Separar reabrir resultado original de recalcular em um novo cenário.

## Critérios de aceite

- [ ] Histórico lista data, origem, período quando disponível, totais, cobertura e status da análise.
- [ ] Reabrir preserva números, premissas e versões originais sem recalcular silenciosamente.
- [ ] Recalcular cria uma versão identificada, mantendo comparação e origem.
- [ ] Uma conta não lê, grava ou exclui o histórico de outra por interface ou requisição direta.
- [ ] Exclusão de histórico e conta segue as confirmações e retenção publicadas.
- [ ] Limites de volume e tamanho têm erro compreensível e não causam perda silenciosa de dados.

## Verificação

Integrar código existente e testar duas contas, reabertura após mudança de versão e limites. Conferir migrações existentes antes de executar DDL.

## Fora do escopo

Implementar outro histórico paralelo ou marcar o PR como publicado sem verificar o deploy.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [PR #6](https://github.com/SenhorMk/impostometro/pull/6), [T35](T35-premissas-e-classificacoes-confirmadas.md), [T36](T36-cenarios-versionados-e-comparacao.md).

Arquivos ou destinos previstos: `site/src/app/conta/historico/page.tsx`, `supabase/migrations/20261126160000_historico_calculos.sql`.

Skills: `supabase:supabase`, `vercel:verification` e, para segredos, `vercel:env-vars`.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

## Já feito (registro anterior à revisão dos critérios)

- [x] Lista de cálculos com data, origem (manual ou XML) e totais.
- [x] Reabrir um cálculo mostra a versão da calculadora e das alíquotas com que foi feito.

## Como ficou

- Tabela `calculos` (migração `supabase/migrations/20261126160000_historico_calculos.sql`): totais em colunas, versões usadas e o resultado completo em `detalhe` (até ~5 MB). Cada conta só lê, grava e apaga as próprias linhas (RLS); limite de 2.000 cálculos por conta (gatilho). Apagar a conta apaga o histórico.
- Quem está logado grava sozinho: a simulação manual (`Calculadora.tsx`) e o lote de XML (`Importador.tsx`). Funções puras em `site/src/lib/historico.ts` (testadas), banco em `historico-navegador.ts`.
- Página `/conta/historico` (link em "Minha conta"): data, origem, título, CBS, IBS, base e % da base. **Reabrir** mostra o resultado salvo (nada é recalculado) com a versão da calculadora, das tabelas e das alíquotas. **Apagar** remove na hora.
- Lote grande demais para o limite guarda só os totais e avisa ao reabrir.
- Pendente: o Mateus rodar o SQL no Supabase.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
