# T37 · Separar acesso gratuito prévia e assinatura no servidor

| Campo | Valor |
|---|---|
| Status | 🟡 Em revisão (PR) |
| Marco | B |
| Prioridade | P0 assinatura |
| Pontos | 3 |
| Depende de | T13 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/18 |

## História

Como dono e usuário, quero que o site ofereça exatamente o acesso anunciado mesmo quando a configuração da cobrança estiver incompleta.

## Estado anterior

`acesso.ts` liberava a importação quando a cobrança não estava completamente configurada. Essa prévia precisava ser uma escolha explícita de operação; segredo ausente não deve liberar silenciosamente um recurso anunciado como pago.

## Escopo

- Definir uma matriz de acesso para visitante, conta gratuita, assinante e estados de cobrança.
- Distinguir prévia gratuita deliberada de assinatura ativada, centralizando a regra no servidor.
- Alinhar página, botões e APIs ao modo real, sem expor variáveis técnicas ao usuário.

## Critérios de aceite

- [x] Documentar a matriz de acesso, incluindo simulação gratuita, prévia, importação detalhada, relatório e histórico. ([`docs/acesso.md`](../acesso.md))
- [x] Requisições diretas aos recursos pagos exigem identidade e direito de acesso quando a assinatura estiver ativa. (testado com Supabase simulado: visitante 401, token falso 401, conta grátis 402, assinante liberado)
- [x] Configuração ausente ou falha na leitura da assinatura não concede acesso pago e não derruba a calculadora gratuita. (sem chaves: 503 fechado; banco fora: 503)
- [x] Prévia é ativada deliberadamente (`MODO_ACESSO=previa`) e informa seus limites; ela não depende de esconder botões para proteger APIs. (20 notas por pedido e 6 lotes a cada 10 min por IP, no servidor)
- [x] Interface apresenta motivo e próximo passo para acesso negado, sem termos de infraestrutura. (teste confere que as mensagens não citam variáveis)
- [x] Limites de volume e permissões são aplicados no servidor, com testes dos estados relevantes.

Verificado em: testes automáticos e site local (`next start`) nos modos fechado e prévia, no celular e no computador. **Não** verificado em produção nem com o Asaas sandbox real (isso é do T14).

## Verificação

Testes de comportamento da matriz e requisições diretas com diferentes sessões e configurações; não espelhar apenas a implementação em testes.

## Fora do escopo

Inventar preço final, criar múltiplos planos ou tornar todo o site dependente do gateway.

## Referências e implementação

- Regras: `site/src/lib/acesso-regras.ts` (testes em `acesso.test.ts`); aplicação: `site/src/lib/acesso.ts`.
- Rotas: `/api/calcular-lote` (barra e limita), `/api/acesso` (diz à tela), `/api/assinatura` (assinar só no modo assinatura; cancelar em qualquer modo).
- Tela: `PortaoAssinante.tsx`, `AssinaturaConta.tsx`, `Conta.tsx` (apagar conta), `Importador.tsx` (limite de notas vindo do servidor).
- Removido: `NEXT_PUBLIC_ASSINATURA_ATIVA` (a tela decidia por conta própria).
- Diário: [`2026-11-27-t37.md`](../diario/2026-11-27-t37.md).

Relacionados: [T14](T14-assinatura-recorrente-e-limite-do-plano.md), [T27](T27-relatorio-revisavel-do-periodo.md), [T34](T34-periodo-e-integridade-das-notas.md).

---
[← Todos os tickets](README.md)
