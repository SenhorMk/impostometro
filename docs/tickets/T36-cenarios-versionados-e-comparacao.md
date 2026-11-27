# T36 · Comparar cenários da mesma análise preservando premissas

| Campo | Valor |
|---|---|
| Status | ⏳ A fazer |
| Marco | C |
| Prioridade | P1 após primeira entrega paga |
| Pontos | A estimar após revisar o código existente |
| Depende de | T18, T35, T27 |
| GitHub | A criar |

## História

Como usuário, quero entender quanto o resultado muda quando altero uma premissa ou uso outra versão, mantendo a mesma base de comparação.

## Estado existente

Há motor versionado e proposta de histórico. Este ticket não implementa os tributos atuais do T31 nem créditos de compras do T26.

## Escopo

- Criar cenário original e cenário alternativo com origem e alterações explícitas.
- Apresentar diferenças absolutas e relativas quando matematicamente definidas.
- Separar variação das vendas, das premissas e das regras, sem sugerir causalidade fiscal indevida.

## Critérios de aceite

- [ ] Cenários comparáveis usam o mesmo conjunto de notas ou explicam quais documentos e itens mudaram.
- [ ] Resultado original permanece imutável; o novo cenário registra versões, autor e alterações.
- [ ] Diferenças em reais e percentuais reconciliam com os cenários; base zero ou cálculo incompleto tem tratamento explícito.
- [ ] Comparação identifica mudanças de data, alíquotas e classificação; não rotula duas vendas distintas como efeito da reforma.
- [ ] Se entrar valor de referência externo, sua origem é informada pelo usuário e não é inventada pelo sistema.
- [ ] Relatório exportado preserva as mesmas diferenças e limitações exibidas na tela.

## Verificação

Cenários iguais, uma premissa alterada, versão distinta, cobertura diferente e base zero; reabertura e exportação.

## Fora do escopo

Apurar PIS/Cofins/ICMS/ISS automaticamente, estimar créditos ou recomendar preço ideal e economia tributária garantida.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: T31, T26.

Arquivos ou destinos previstos: `site/src/lib/motor.ts`, `site/src/lib/lote.ts`, `docs/estrategia-assinatura.md`.

Skills: as pertinentes de [`docs/skills.md`](../skills.md), consultadas antes da execução.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
