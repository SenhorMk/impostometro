# O porte: calculadora oficial da Receita em TypeScript

Esta pasta é a **calculadora oficial da Reforma Tributária** da Receita Federal
([calculadora-rtc-regime-regular](https://github.com/ReceitaFederal/calculadora-rtc-regime-regular),
versão **1.7.2**, commit `39363aa`, tabelas **V0073**) traduzida de Java para TypeScript, para rodar
dentro do site, sem servidor.

Licença: obra derivada da calculadora da Receita, **MIT**, Copyright (c) 2026 Receita Federal do Brasil
(texto em [`LICENSE-RECEITA-FEDERAL.txt`](LICENSE-RECEITA-FEDERAL.txt)).

## Como sabemos que dá o mesmo número

| Conferência | Comando | Resultado hoje |
|---|---|---|
| 1.519 pedidos mandados ao porte e à calculadora oficial (Docker); as respostas JSON precisam ser idênticas, campo a campo, na mesma ordem, inclusive mensagens de erro e memória de cálculo | `npm run porte:comparar` | 1.519 de 1.519 idênticos |
| exemplo oficial da Receita e 30 testes dourados, sem Docker | `npm test` | 32 de 32 |
| tabelas iguais às do banco oficial | `npm run porte:tabelas` + `git diff` | iguais |

Os pedidos da comparação (`scripts/porte/comparar.ts`): o exemplo oficial, os 30 dourados, as 52 atividades
do site, **todas** as classificações tributárias vigentes (com NCM/NBS do anexo de cada uma e de fora dele),
tributação regular, lotes de 15 itens, datas de 2026 e 2028, Imposto Seletivo, 30 erros de propósito e
300 pedidos aleatórios com valores difíceis de arredondar. A CI roda tudo a cada pull request.

## Mapa: arquivo Java da Receita → arquivo daqui

Caminhos Java a partir de `src/main/java/br/gov/serpro/rtc/`.

| Java (Receita) | TypeScript (aqui) | O que faz |
|---|---|---|
| `shared/util/ArredondamentoUtils.java` + serializadores `TDec*` | `decimal.ts` | números decimais exatos, arredondamento HALF_EVEN, formatos de saída e da memória |
| `domain/service/calculotributo/AvaliadorExpressaoAritmetica.java` (JEXL) | `expressao.ts` | avalia as fórmulas guardadas no banco (ex.: `baseCalculo * aliquota`) |
| `domain/repository/*Repository.java` (consultas JPQL) | `tabelas.ts` | consultas às tabelas oficiais, com as mesmas regras de vigência por data |
| `api/model/input/*Input.java` + anotações de validação | `entrada.ts` | lê e valida o pedido, com as mesmas mensagens |
| `api/exceptionhandler/enumeration/ProblemType.java`, `CodigoValidacao.java`, `domain/service/collector/ItemCollector.java` | `erros.ts` | códigos e textos de erro (REG-xxx, CAL-xxx) |
| `domain/service/ProcessamentoItemService.java` | `processamento-item.ts` | as checagens de cada item, na mesma ordem, e a escolha do tratamento tributário |
| `domain/service/calculotributo/CalculoCbsIbsService.java` | `calculo-cbs-ibs.ts` | a conta da CBS, do IBS estadual e do IBS municipal (alíquotas, redução, diferimento, tributação regular) |
| `domain/service/calculotributo/CalculoTributoService.java`, `CalculoImpostoSeletivoService.java` | `calculo-tributo.ts` | junta IS, CBS e IBS do item |
| `domain/service/MemoriaCalculoService.java`, `domain/service/token/*` | `memoria.ts` | o texto da memória de cálculo |
| `domain/service/ObservabilidadeService.java`, `api/model/roc/*`, `reduce/*Accumulator.java` | `observabilidade.ts` | o "cálculo com observabilidade" de ponta a ponta: validação, itens, totais e formato da resposta |
| banco SQLite gerado pelo Flyway (`src/main/resources/db/migration/`) | `dados/tabelas.json` | as tabelas oficiais (30 tabelas, 25 mil linhas), exportadas sem mudar valores |
| `GET /dados-abertos/versao` | `versao.ts` | versão da calculadora e das tabelas copiadas |

Entrada principal: `calcularOperacao(json)` em `observabilidade.ts`, igual a
`POST /api/calculadora/observabilidade/regime-geral` da oficial. Devolve `{ status: 200 | 422, corpo }`.

## O que não foi portado

O site não usa, e o porte recusa com erro (`ForaDoPorte`) em vez de calcular errado:
compra governamental (`gCompraGov`), documento de referência (`tpDoc`) e componentes da base
(`gComponentesBC`). Monofasia de combustíveis também não, mas a própria oficial 1.7.2 responde
"não implementado" para ela, e o porte responde igual.

## Regras para quem mexer aqui

1. Tradução **linha a linha**, mesma ordem de checagens, mesmos textos. Não "melhore" a lógica da Receita.
2. Toda conta com `Dec` (`decimal.js`), nunca com `number`.
3. Depois de qualquer mudança: `npm run porte:comparar` tem que dar 100% idêntico.
4. Versão nova da Receita: siga [`docs/manutencao.md`](../../../docs/manutencao.md).
