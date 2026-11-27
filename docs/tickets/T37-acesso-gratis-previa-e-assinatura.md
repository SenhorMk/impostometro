# T37 · Separar acesso gratuito prévia e assinatura no servidor

| Campo | Valor |
|---|---|
| Status | ⏳ A fazer |
| Marco | B |
| Prioridade | P0 assinatura |
| Pontos | A estimar após revisar o código existente |
| Depende de | T13 |
| GitHub | A criar |

## História

Como dono e usuário, quero que o site ofereça exatamente o acesso anunciado mesmo quando a configuração da cobrança estiver incompleta.

## Estado existente

acesso.ts atualmente libera a importação quando a cobrança não está completamente configurada. Essa prévia precisa ser uma escolha explícita de operação; segredo ausente não deve liberar silenciosamente um recurso anunciado como pago.

## Escopo

- Definir uma matriz de acesso para visitante, conta gratuita, assinante e estados de cobrança.
- Distinguir prévia gratuita deliberada de assinatura ativada, centralizando a regra no servidor.
- Alinhar página, botões e APIs ao modo real, sem expor variáveis técnicas ao usuário.

## Critérios de aceite

- [ ] Documentar a matriz de acesso, incluindo simulação gratuita, prévia, importação detalhada, relatório e histórico.
- [ ] Requisições diretas aos recursos pagos exigem identidade e direito de acesso quando a assinatura estiver ativa.
- [ ] Configuração ausente ou falha na leitura da assinatura não concede acesso pago e não derruba a calculadora gratuita.
- [ ] Prévia é ativada deliberadamente e informa seus limites; ela não depende de esconder botões para proteger APIs.
- [ ] Interface apresenta motivo e próximo passo para acesso negado, sem termos de infraestrutura.
- [ ] Limites de volume e permissões são aplicados no servidor, com testes dos estados relevantes.

## Verificação

Testes de comportamento da matriz e requisições diretas com diferentes sessões e configurações; não espelhar apenas a implementação em testes.

## Fora do escopo

Inventar preço final, criar múltiplos planos ou tornar todo o site dependente do gateway.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [T14](T14-assinatura-recorrente-e-limite-do-plano.md), [T27](T27-relatorio-revisavel-do-periodo.md), [T34](T34-periodo-e-integridade-das-notas.md).

Arquivos ou destinos previstos: `site/src/lib/acesso.ts`, `site/src/lib/supabase-servidor.ts`, `site/src/components/PortaoAssinante.tsx`.

Skills: `supabase:supabase`, `vercel:verification` e, para segredos, `vercel:env-vars`.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
