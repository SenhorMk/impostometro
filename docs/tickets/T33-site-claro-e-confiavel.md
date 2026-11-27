# T33 · Apresentar um site claro e confiável com oferta verdadeira

| Campo | Valor |
|---|---|
| Status | 🟡 Implementado e verificado localmente; revisão e publicação pendentes |
| Marco | A |
| Prioridade | P0 gratuito |
| Pontos | A estimar após revisar o código existente |
| Depende de | nenhum bloqueio técnico anterior |
| GitHub | https://github.com/SenhorMk/impostometro/issues/10 |

## História

Como pessoa que acabou de conhecer o site, quero entender o que ele faz, seus limites e quem responde por ele antes de fornecer dados ou pagar.

## Estado existente

O PR 7 propõe melhorias de design, demonstração e SEO. Revisar e reaproveitar seus componentes. A página atual ainda contém datas e promessas de assinatura que precisam corresponder ao estado publicado.

## Escopo

- Revisar a página inicial, navegação, chamadas para ação, planos, exemplos e mensagens de disponibilidade.
- Explicar o benefício gratuito, a entrega paga planejada, o público atendido e a diferença entre simulação e apuração.
- Usar identidade Calcula Reforma e indicar a relação do subdomínio com a MKAutobots de forma verdadeira, sem inventar empresa, CNPJ ou equipe.

## Critérios de aceite

- [x] A primeira tela explica a tarefa e oferece uma chamada principal para usar a ferramenta.
- [x] Exemplo de resultado usa o motor e mostra premissas, data e status simulado; não há valores tributários fixos digitados para a demonstração.
- [x] Texto e botões refletem o estado real: assinatura indisponível não leva a um checkout quebrado nem promete recurso ainda em PR.
- [x] Planos separam claramente o que está disponível, o que é prévia e o que será pago, sem depoimentos, contagens de clientes ou garantias inventados.
- [x] Escopo NF-e/NFC-e e regime regular fica claro no importador; serviços na calculadora manual não são apresentados como suporte à importação de NFS-e.
- [x] Navegação, rodapé e páginas principais incluem caminho para explicação, termos, privacidade e contato real do T21.
- [x] Revisar computador e celular e registrar capturas antes/depois, incluindo movimento reduzido quando houver animação.

## Verificação

Revisão visual e de conteúdo em 360, 390 e 1366 pixels; seguir a chamada principal até um resultado. Rodar checks do site se houver código alterado.

## Fora do escopo

Refazer o motor, criar marca oficial do governo, contratar design ou assumir que publicar todas as 52 páginas é requisito.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [PR #7](https://github.com/SenhorMk/impostometro/pull/7), [T12](T12-como-chegamos-nisso.md), [T21](T21-termos-privacidade-e-aviso-nao-oficial.md), [T38](T38-jornada-acessivel-e-sem-falhas.md).

Arquivos ou destinos previstos: `site/src/app/page.tsx`, `site/src/components/Calculadora.tsx`, `site/src/components/Resultado.tsx`, `site/src/lib/config.ts`.

Skills: `vercel:react-best-practices`, `vercel:verification` e `humanizer:humanizer` para textos.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)

## Evidências desta implementação

Implementação: [PR 27](https://github.com/SenhorMk/impostometro/pull/27), commit `d6fb203`. Base: planejamento no PR 9.

Verificação no build de produção local: 360, 390 e 1366 px, sem rolagem horizontal. Busca e simulação de pizzaria, R$ 1.000 em São Paulo, retornaram R$ 67,80. O exemplo escolar é calculado pelo serviço, com data, versões e fontes. Lint, tipos, 55 testes e build passaram. Capturas e limites estão no [diário](../diario/2026-11-26-t33.md) e em [evidências](../evidencias/t33/README.md).

Os checks acima registram a implementação local, sem marcar deploy público ou revisão jurídica como feitos. A issue permanece aberta até revisão e publicação.
