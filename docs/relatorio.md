# Relatório revisável do período (T27)

O que o assinante leva ao contador depois de importar as notas: um **PDF** (pela janela de impressão do navegador, "Salvar como PDF") e uma **planilha CSV** que abre no Excel. Os dois saem do botão "Relatório para o contador", embaixo do resultado do lote, também ao reabrir um lote do histórico.

## Como funciona (e por que dá para confiar nos centavos)

1. A calculadora (porte da Receita) calcula cada item uma vez, no `/api/calcular-lote`. O resultado vem em centavos inteiros.
2. `site/src/lib/relatorio.ts` só **reorganiza** esse resultado: linhas por item, totais (soma dos itens calculados), avisos e cobertura. Não chama o motor e não arredonda nada de novo.
3. A tela, o PDF, a planilha e o histórico usam o mesmo resultado. `conferirTotais()` confere que o total de cada nota é a soma dos itens; os testes conferem tela = relatório = planilha num lote de 500 notas e 20.000 itens.
4. Item que a calculadora não calculou aparece com o motivo e **sem valor**, fora da soma (regra 3 do AGENTS.md).

## Privacidade (LGPD) e segurança

- Os arquivos são montados no **navegador**, com os dados que já estão na tela. Nada vai para o servidor, nada fica guardado conosco e não existe link público.
- Nenhum nome de arquivo entra no relatório nem no histórico (o nome pode trazer qualquer coisa que a pessoa digitou). Do cliente final nada é lido (o leitor de XML já descarta).
- A empresa aparece como CNPJ formatado; se for CPF, mascarado no meio (`documentoLegivel`).
- Ao reabrir do histórico, a cobertura guardada é só contagem, números das notas e explicações (`DetalheXml.cobertura`). Lotes antigos não têm cobertura: o relatório avisa.
- Texto que começa com `=`, `+`, `-`, `@` ou tab ganha um `'` na frente para o Excel não rodar como fórmula (`celula()` em `planilha.ts`).

## PDF: o que tem

1. Cabeçalho: empresa, período, cenário (revisão, rascunho ou data da confirmação) e data de geração. Rascunho ganha selo "RASCUNHO, NÃO REVISADO".
2. Resumo: base, CBS, IBS, CBS + IBS, itens calculados e não calculados, e os **avisos junto do total**: rascunho, cobertura parcial, itens fora da soma, base estimada, alíquota provisória e "não é o imposto definitivo".
3. Documentos: notas incluídas e datas, notas fora da soma por motivo (com os números), buracos na numeração, pendências e itens não calculados por motivo.
4. Premissas e versões: origem das classificações, alíquotas nominais, versões da calculadora, das tabelas e da nossa tabela de alíquotas.
5. Detalhe por nota e item: nota, item, NCM e CFOP, cClassTrib e origem, base (marcada "estimada" quando for), CBS com alíquota efetiva, IBS. O cabeçalho da tabela se repete em cada página; o total aparece só no fim.
6. Rodapé: site independente, não é do governo; simulação.

A memória de cálculo oficial de cada item fica na planilha (no PDF ocuparia páginas demais).

## Planilha CSV: campos e formatos

Formato do Excel brasileiro: separador `;`, vírgula decimal, sem separador de milhar, marca UTF-8 no começo, quebra de linha `CRLF`. Datas `DD/MM/AAAA`. Percentuais sem o `%`. Códigos só com números (chave de acesso, NCM, cClassTrib) vão como `="..."` para o Excel não estragar (zeros à esquerda, notação científica).

| Coluna | O que é |
|---|---|
| Modelo, Número, Série, Data, UF, Chave de acesso | dados da nota |
| Item, Descrição, NCM, CFOP | dados do item, como vieram na nota |
| cClassTrib | classificação usada no cálculo |
| Origem da classificação | `da nota`, `confirmada pelo usuário` ou `sugestão NÃO confirmada` |
| Origem da base | `informada na nota` (base da CBS/IBS da nota) ou `estimada` (produto − desconto + frete + seguro + outras) |
| Base, CBS, IBS, CBS + IBS (R$) | valores da calculadora; vazios se não calculado |
| Redução CBS (%), Alíquota efetiva CBS (%) | como a calculadora devolveu |
| Situação | `calculado` ou `não calculado: motivo` |
| Memória de cálculo oficial (CBS) | texto da calculadora da Receita |

Depois das linhas: o total dos itens calculados, a revisão (ou rascunho), as versões e o bloco **Resumo do período** em duas colunas (rótulo; valor): empresa, período, cenário, data de geração (UTC), notas incluídas, notas fora da soma por motivo, pendências, itens não calculados, avisos e "Como ler".

## Limitações

- O PDF depende da janela de impressão do navegador (no celular: Compartilhar → Imprimir → Salvar como PDF). Escolha deliberada para não colocar biblioteca nova nem servidor de PDF.
- Sem XLSX: o CSV abre direto no Excel e no Google Planilhas.
- Lotes muito grandes (milhares de itens) geram PDFs de dezenas de páginas; a planilha é o formato indicado para eles.
