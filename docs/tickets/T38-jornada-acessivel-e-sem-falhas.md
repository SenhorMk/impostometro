# T38 · Validar navegação cálculo e importação no celular e computador

| Campo | Valor |
|---|---|
| Status | ⏳ A fazer |
| Marco | A |
| Prioridade | P0 gratuito e assinatura |
| Pontos | A estimar após revisar o código existente |
| Depende de | T33 |
| GitHub | A criar |

## História

Como visitante ou assinante, quero completar uma tarefa pelo celular ou computador sem me perder, enfrentar erros silenciosos ou ficar preso em um formulário.

## Estado existente

Existem verificações descritas nos PRs 6 e 7, mas elas não substituem validar a versão integrada e publicada.

## Escopo

- Conferir a jornada gratuita e, quando disponível, a jornada de conta, importação, relatório e compra.
- Corrigir foco, rótulos, teclado, estados de carregamento/erro/vazio e comportamento responsivo.
- Medir carregamento e registrar ambiente e limitações; usar ferramentas gratuitas disponíveis.

## Critérios de aceite

- [ ] Concluir uma simulação em 360, 390 e 1366 pixels sem rolagem horizontal, conteúdo cortado ou botão inacessível.
- [ ] Inputs possuem rótulos e erros associados; o foco é visível e a jornada principal funciona por teclado.
- [ ] Carregamento evita envio duplicado e erros de API aparecem com possibilidade de tentar novamente.
- [ ] Animações respeitam movimento reduzido; exemplos e fontes continuam legíveis.
- [ ] Não há erro inesperado no console durante as jornadas verificadas.
- [ ] Registrar medidas de carregamento e os principais recursos que pesam; não tratar um resultado isolado de auditoria como garantia de desempenho.
- [ ] Repetir os trechos aplicáveis após integrar conta, cobrança e relatório, registrando a versão testada.

## Verificação

Navegação real, capturas de computador/celular e evidências dos erros exercitados. Checks do site quando houver mudança de código.

## Fora do escopo

Certificação de acessibilidade, redesign sem necessidade, compra de ferramenta ou mudança de regras tributárias.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [T11](T11-simulacao-rapida-sem-cadastro.md), [T13](T13-login-com-link-por-e-mail.md), [T14](T14-assinatura-recorrente-e-limite-do-plano.md), [T16](T16-upload-e-leitura-de-xml-de.md), [T27](T27-relatorio-revisavel-do-periodo.md).

Arquivos ou destinos previstos: `site/src/components/Calculadora.tsx`, `site/src/components/Entrar.tsx`, `site/src/components/Importador.tsx`.

Skills: `vercel:react-best-practices`, `vercel:verification` e `humanizer:humanizer` para textos.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
