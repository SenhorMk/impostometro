# Arquitetura

## Visão geral

São duas peças em produção, e uma terceira só para conferência:

```
                    ┌────────────────────────── Vercel (região gru1, São Paulo) ──────────────────────────┐
 Navegador  ──────▶ │  Next.js (site/)                                                                    │
 (empresário)       │   • página inicial = landing + calculadora grátis (Calculadora.tsx, Resultado.tsx)  │
                    │   • POST /api/calcular ──▶ lib/motor.ts                                             │
                    │        1. escolhe alíquotas em dados/aliquotas.json pela data                       │
                    │        2. monta o pedido no formato da Receita                                      │
                    │        3. chama o PORTE da calculadora oficial (src/motor/), aqui mesmo, sem rede   │
                    │        4. traduz a resposta (valores, redução, artigo, memória de cálculo, versões) │
                    │   • src/motor/  = calculadora da Receita traduzida de Java para TypeScript,         │
                    │                   com as tabelas oficiais em src/motor/dados/tabelas.json           │
                    └─────────────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────── Supabase (São Paulo) — ainda não usado no código ───────────────────┐
                    │  login (Google e link por e-mail), banco Postgres (empresas, cálculos, assinaturas),│
                    │  bucket privado para XMLs (apagados após a leitura)                                 │
                    └─────────────────────────────────────────────────────────────────────────────────────┘

 Só no seu computador e na CI (nunca em produção):
                    ┌─────────────────────────────────────────────────────────────────────────────────────┐
                    │  calculadora OFICIAL da Receita (Java 25) em Docker, sem alterações                 │
                    │   • é a referência: o porte precisa responder IGUAL a ela (npm run porte:comparar)  │
                    │   • é de onde saem as tabelas do porte (npm run porte:tabelas)                      │
                    └─────────────────────────────────────────────────────────────────────────────────────┘
```

Por que o porte: a Vercel não mantém um servidor Java ligado. Em vez de pagar um servidor só para a calculadora (Fly.io), traduzimos a parte de cálculo da calculadora oficial para TypeScript, e ela roda dentro do próprio site. Detalhes e o preço disso em [`decisoes.md`](decisoes.md).

## Artigos e glossário (T19)

O visitante encontra o índice em `/artigos`, lê uma página em `/artigos/[slug]`, consulta termos em `/glossario` e volta à calculadora pelo link final. O cadastro editorial fica em `site/src/dados/conteudo.ts`, com fontes, seções e data de revisão. As páginas são Server Components; `generateStaticParams` fornece os cinco slugs e `loading.tsx` delimita o carregamento da rota dinâmica. Não há API, CMS ou banco nesse fluxo.

O sitemap usa o mesmo cadastro para listar os artigos. `SITE_URL` e a política de indexação do T20 definem quando as URLs entram no sitemap e quando o site usa `noindex`. Slugs desconhecidos exibem a página de ausência; o comportamento HTTP de streaming está descrito em [`conteudo.md`](conteudo.md), junto com fontes e manutenção editorial.

## O porte da calculadora (`site/src/motor/`)

A calculadora da Receita tem cerca de 35 mil linhas de Java, mas a maior parte é servidor web, banco de dados e telas. O caminho do cálculo tem cerca de 3 mil linhas, e foi isso que traduzimos, arquivo por arquivo. O mapa "arquivo Java → arquivo TypeScript" está em [`site/src/motor/README.md`](../site/src/motor/README.md).

Três coisas fazem o porte dar o mesmo número, até o centavo:

1. **Mesma aritmética.** O Java usa `BigDecimal` (números decimais exatos, sem os erros do `0,1 + 0,2` do computador) com arredondamento "metade para o par" (HALF_EVEN). O porte usa a biblioteca `decimal.js` com as mesmas regras e a mesma precisão nas divisões (34 dígitos).
2. **Mesmas tabelas.** As fórmulas e alíquotas ficam em tabelas do banco da Receita. Exportamos essas tabelas, sem mexer em nenhum valor, para `src/motor/dados/tabelas.json` (30 tabelas, 25 mil linhas, 0,9 MB).
3. **Mesma resposta.** O porte devolve o mesmo JSON da calculadora oficial, campo por campo, na mesma ordem, inclusive as mensagens de erro e a memória de cálculo.

E uma coisa garante que continua assim: a CI manda os mesmos 1.519 pedidos para o porte e para a calculadora oficial, e reprova o pull request se qualquer resposta tiver uma diferença, mesmo de um centavo ou de uma vírgula num texto.

O que **não** foi portado (o site não usa; se alguém mandar, o porte recusa com erro em vez de calcular errado): compra governamental (`gCompraGov`), documento de referência (`tpDoc`), componentes da base (`gComponentesBC`) e monofasia de combustíveis (que a própria calculadora oficial 1.7.2 ainda não implementa).

## Fluxo de um cálculo grátis

1. A pessoa digita "pizzaria". A busca roda **no navegador**, no dicionário `site/src/dados/atividades.json` (sem chamar servidor).
2. Ela escolhe "Restaurante / pizzaria / lanchonete" → NBS `103011000`, cClassTrib `200047`.
3. O navegador manda `POST /api/calcular` com `{ tipo, codigo, cClassTrib, valor, municipio, uf }`.
4. `route.ts` valida tudo e chama `calcular()` em `lib/motor.ts`.
5. `motor.ts` pega as alíquotas vigentes (hoje CBS 11,2%, IBS 0,05% + 0,05%, provisórias), monta a operação no formato da Receita e chama `calcularOperacao()` do porte (o mesmo que `POST /api/calculadora/observabilidade/regime-geral` da oficial).
6. O porte devolve os grupos `gCBS`, `gIBSUF`, `gIBSMun` (com redução e alíquota efetiva) e a `memoriaCalculo` em texto.
7. `motor.ts` traduz para `ResultadoCalculo` (tipo em `lib/tipos.ts`), incluindo versões e fontes.
8. `Resultado.tsx` mostra o total e a "conta aberta".

Se o resultado for `INCONSISTENCIA_ENTRADA`, `NAO_IMPLEMENTADO` ou `FALHA_TECNICA`, o site mostra a mensagem e **nenhum valor**.

## Conceitos tributários que aparecem no código

| Termo | O que é |
|---|---|
| CBS | Contribuição sobre Bens e Serviços (federal). Substitui PIS e Cofins a partir de 2027 |
| IBS | Imposto sobre Bens e Serviços (estados e municípios). Teste de 0,1% em 2027 e 2028; substitui ICMS e ISS até 2033 |
| NCM | código de 8 dígitos de um **produto** |
| NBS | código de 9 dígitos de um **serviço** |
| CST | código de situação tributária (3 dígitos). Aqui é sempre os 3 primeiros dígitos do cClassTrib |
| cClassTrib | classificação tributária (6 dígitos). Define a redução: `000001` integral, `200028` educação (60%), `200003` cesta básica (100%)... |
| `aliquotasNominais` | a partir de 2027 a calculadora exige que quem chama informe as alíquotas; o resultado vem como `CALCULO_SIMULADO` |
| observabilidade | modo da calculadora que calcula item a item e não derruba a operação se um item tiver erro |

## Onde ficam os dados

| Dado | Onde | Quem muda |
|---|---|---|
| Alíquotas por período | `site/src/dados/aliquotas.json` | pull request ([`manutencao.md`](manutencao.md)) |
| Atividades do "o que você vende?" | `site/src/dados/atividades.json` | pull request |
| Lista de municípios (IBGE) | `site/src/dados/municipios.json` (gerada das tabelas oficiais) | regenerar se a Receita mudar |
| Tabelas oficiais (NCM, NBS, reduções, fórmulas) | `site/src/motor/dados/tabelas.json`, exportadas do banco da imagem oficial | `npm run porte:tabelas` ao atualizar a calculadora |
| Contas, empresas, histórico | Supabase (a fazer: T13, T15, T18) | o site |

## Testes e CI

| Teste | Precisa de Docker? | O que confere |
|---|---|---|
| `cd site && npm test` | não | o porte devolve a resposta oficial do exemplo da Receita e os valores dos 30 testes dourados |
| `cd site && npm run porte:comparar` | sim (calculadora oficial ligada) | 1.519 pedidos: respostas do porte e da oficial idênticas |
| `python3 testes-dourados/dourados.py` | sim | 30 operações com resultado conhecido na oficial |
| `python3 testes-dourados/atividades.py` | sim | cada atividade do dicionário calcula na oficial |

| Workflow | Quando roda | O que faz |
|---|---|---|
| `.github/workflows/calculadora.yml` | PR que mexe em `calculadora/`, `testes-dourados/`, `site/src/dados/`, `site/src/motor/`, `scripts/` | compila a imagem oficial (com cache), sobe, roda o exemplo oficial, os dourados e o dicionário; confere se as tabelas do porte são as do banco oficial; compara porte × oficial |
| `.github/workflows/site.yml` | PR que mexe em `site/` | `npm ci`, lint, testes do porte, tipos (`next typegen` + `tsc`), build |
