# T30 · Publicar conteúdo útil e preparar divulgação orgânica sustentável

| Campo | Valor |
|---|---|
| Status | 🟡 Páginas propostas no PR 7; revisão pendente |
| Marco | C |
| Prioridade | P1 gratuito |
| Pontos | A estimar após revisar o código existente |
| Depende de | T20, T33 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/25 |

## História

Como pessoa pesquisando uma dúvida específica, quero uma explicação com exemplo e acesso à ferramenta, para resolver minha dúvida e conhecer o produto.

## Estado existente

O PR 7 propõe 52 páginas por atividade, exemplos calculados e melhorias de apresentação. O projeto já tem artigos e glossário. Começar por poucas páginas úteis revisadas e aproveitar o trabalho existente.

## Escopo

- Escolher três a cinco dúvidas iniciais compatíveis com o público e os recursos entregues.
- Revisar o conteúdo e exemplos do PR 7 antes de integrar; distinguir exemplos manuais de tipos aceitos no importador.
- Preparar uma demonstração curta e um texto de divulgação reutilizável, com esforço ajustável à disponibilidade do dono.

## Critérios de aceite

- [ ] Cada página responde a uma dúvida concreta, usa exemplo identificado como simulado, premissas, data, versões e fontes verificáveis.
- [ ] Valores dos exemplos vêm do motor; falha do cálculo não vira número inventado.
- [ ] Conteúdo apresenta limitações e uma chamada coerente para usar a ferramenta; não promete atender modelo ou regime não suportado.
- [ ] Revisar duplicação, links, canônicas, compartilhamento e indexação das páginas efetivamente publicadas.
- [ ] Preparar um exemplo de publicação curta por semana como opção de ritmo, sem obrigação diária ou meta garantida de audiência.
- [ ] Entregar rascunhos para o dono publicar; nenhuma postagem ou mensagem a terceiros é enviada automaticamente.
- [ ] Registrar páginas e dúvidas observadas no Search Console quando houver dados, sem afirmar demanda ou volume de buscas não medido.

## Verificação

Navegar da busca/página específica até a ferramenta e conferir fontes, resultados e metadados no deploy. Checks e revisão visual quando houver código.

## Fora do escopo

Publicar em massa páginas quase iguais, contratar anúncios, comprar listas ou prometer posição no Google.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [PR #7](https://github.com/SenhorMk/impostometro/pull/7), [T19](T19-5-artigos-base-e-glossario.md), [T22](T22-funil-medido-e-checklist-de-lancamento.md).

Arquivos ou destinos previstos: `site/src/dados/conteudo.ts`, `site/src/app/artigos`, `site/src/app/imposto-2027`, `docs/conteudo.md`.

Skills: `vercel:react-best-practices`, `vercel:verification` e `humanizer:humanizer` para textos.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
