# Busca de atividades e tabelas oficiais (T10)

O campo “O que você vende?” começa pelo dicionário de 52 atividades, com nomes e sinônimos em linguagem comum. Essa etapa roda no navegador. Quando uma consulta de pelo menos dois caracteres não encontra atividade, o formulário consulta `/api/busca-oficial?q=...` após 250 ms sem digitação.

## Fonte e limites

A fonte da segunda busca é `site/src/motor/dados/tabelas.json`, exportação versionada do banco da calculadora oficial. A implementação fica fora do porte, em `site/src/lib/busca-oficial.ts`. Nenhuma tabela, regra ou arquivo em `src/motor/` foi alterado.

| Consulta | Fonte | Resultado |
|---|---|---|
| Texto, como `FGTS` | `CLASSIFICACAO_TRIBUTARIA` | cClassTrib, descrição oficial e nomenclatura |
| Código, como `200028` | `CLASSIFICACAO_TRIBUTARIA` | classificação correspondente |
| Número completo ou prefixo, como `6109.10.00` ou `6109` | `NCM` e `NBS` | códigos completos: NCM de oito dígitos e NBS de nove |

As tabelas NCM/NBS do banco exportado contêm código e vigência, sem descrição do produto ou serviço. Por isso a busca textual fora do dicionário usa descrições de cClassTrib. Ela não é um catálogo de nomes de todos os produtos. A versão consultada é exibida na lista; a data da consulta segue a mesma data usada pela simulação (`dataDoCalculo`), que antes de 2027 simula 01/01/2027.

Resultados vencidos ou ainda não vigentes são excluídos. A resposta tem até seis opções, sem duplicar o mesmo tipo e código. Códigos exatos aparecem antes dos prefixos. Texto é comparado sem diferença de acentos ou caixa, exigindo todas as palavras. Máscaras numéricas com pontos, barras, espaços ou hífens são removidas para procurar códigos.

## Escolha e cálculo

1. Uma atividade do dicionário mantém o atalho existente: código e cClassTrib cadastrados para simulação.
2. Uma classificação oficial preenche somente cClassTrib e pede o NCM ou NBS.
3. Um NCM/NBS oficial preenche somente o código e pede cClassTrib.
4. O foco vai ao campo restante. O formulário orienta a confirmar o enquadramento com o contador e valida os seis dígitos de cClassTrib antes de enviar.
5. O cálculo continua em `/api/calcular` → `lib/motor.ts`. A busca não aplica alíquota, redução nem escolhe um enquadramento tributário a partir de um código isolado.

O teclado usa as mesmas opções exibidas: setas mudam o destaque, Enter escolhe e Escape fecha. `aria-activedescendant` identifica a opção ativa. Durante a consulta há estado de carregamento; sem resultado, há mensagem e entrada manual; falha de rede tem mensagem própria. Requisições substituídas são abortadas e respostas antigas não substituem o resultado de uma consulta nova.

## API

`GET /api/busca-oficial?q=200028` responde com:

```json
{
  "resultados": [
    {
      "tipo": "classificacao",
      "codigo": "200028",
      "descricao": "Fornecimento dos serviços de educação (Anexo II)",
      "nomenclatura": "NBS"
    }
  ],
  "versaoTabela": "V0073",
  "data": "2027-01-01"
}
```

O exemplo usa a tabela e a data desta entrega. A resposta real informa a versão/data consultadas. Consultas fora do intervalo de 2 a 120 caracteres recebem HTTP 400. Nenhuma correspondência gera HTTP 200 com lista vazia. A API envia `Cache-Control: no-store`. O contrato de tipos fica separado em `busca-oficial-tipos.ts`; o navegador não importa o banco oficial.

## Testar e manter

`cd site && npm test` executa sete testes da busca e os 32 testes existentes do motor. Os testes cobrem o atalho de pizzaria, fallback de FGTS, acentos, palavras em ordem diferente, vigência, máscaras, códigos completos, limite, ausência e a separação entre código e classificação. Lint, tipos e build seguem `AGENTS.md`.

No navegador, testar busca por código, escolha por teclado, campo restante vazio, validação e cálculo. Testar também classificação por descrição, consulta sem resultado, celular e manutenção do atalho do dicionário. Ao atualizar a tabela pelo procedimento de `manutencao.md`, conferir nomes das colunas, vigências e os testes, sem corrigir os dados dentro do módulo de busca.

## O que falta no T10

O registro persistente de buscas sem resultado continua pendente do banco do T05. Migração e integração com Supabase foram preparadas, com inserção restrita, leitura administrativa e retenção de 30 dias; a criação do projeto está bloqueada pela quota Free da conta e pelo acesso MCP à organização escolhida. Sem configuração, o registro continua desativado. Estado em [`banco.md`](banco.md). Antes de ativar, conferir permissões, atualizar a política de privacidade junto da ativação e testar a gravação real; o terminal de desenvolvimento não equivale à persistência.
