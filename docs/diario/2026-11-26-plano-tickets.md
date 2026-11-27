# 26/11/2026 · Tickets para o site e a assinatura

## Pedido e escopo

Mateus pediu a conversão do relatório comercial em tickets, começando por um site bom e confiável. O planejamento considera aquisição orgânica sem verba, contatos prévios ou parceiro para recrutar empresas. Esta entrega organiza o trabalho; não implementa funcionalidades nem publica mudanças no site.

## Resultado

Foram detalhados 17 tickets: oito existentes revisados (T07, T13, T14, T15, T18, T20, T21 e T22) e nove novos arquivos (T27, T30 e T33 a T39). T27 e T30 aproveitam identificadores já reservados no roteiro. Cada especificação traz estado existente, escopo, critérios de aceite, dependências, verificação, exclusões e skills aplicáveis.

O [plano de implementação](../plano-implementacao.md) separa lançamento gratuito e abertura da assinatura. T33 inicia a revisão da apresentação, aproveitando o PR 7; T20 e T21 cobrem domínio, indexação, identidade e informações de uso. O código dos PRs 6 e 7 será reaproveitado e validado antes de ser considerado entregue. O marco pago inclui conta, isolamento, cobrança, conferência das notas, premissas, histórico e relatório exportável. Conteúdo orgânico pode começar antes da assinatura; cenários avançados ficam para depois.

## Fontes e skills

Base: [estratégia e ajuste orgânico](../estrategia-assinatura.md), tickets anteriores, AGENTS.md e estado dos PRs. A skill `humanizer:humanizer`, consultada nesta sequência de trabalho, orientou a redação. As skills técnicas indicadas nos tickets serão consultadas na implementação correspondente; não representam verificações já executadas. A busca local não encontrou uma skill chamada `to-tickets`; a decomposição segue o formato versionado do repositório.

## Verificação

Conferidos IDs únicos, ausência de ciclos entre os tickets desta revisão, destinos dos links locais, critérios ainda desmarcados, integridade da tabela do catálogo e links absolutos para os corpos das issues. `git diff --check` executado. Aplicação e motor não foram alterados; não foi necessário executar build ou testes de cálculo nesta entrega documental.

## Publicação e pendências

As especificações e os vínculos com as issues estão no catálogo e no plano. A revisão integra o [PR 9](https://github.com/SenhorMk/impostometro/pull/9), sem merge automático. O próximo trabalho é implementar T33, sem declarar a assinatura ou os fluxos de produção prontos. Não foram contratados serviços, enviadas mensagens a terceiros nem realizadas cobranças.
