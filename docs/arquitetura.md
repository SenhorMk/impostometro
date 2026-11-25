# Arquitetura

## Visão geral

São três peças, cada uma num serviço feito para ela:

```
                    ┌────────────────────────────── Vercel (região gru1, São Paulo) ─────────────────────────────┐
 Navegador  ──────▶ │  Next.js (site/)                                                                           │
 (empresário)       │   • página inicial = landing + calculadora grátis (Calculadora.tsx, Resultado.tsx)         │
                    │   • POST /api/calcular ──▶ lib/motor.ts                                                    │
                    │        1. escolhe alíquotas em dados/aliquotas.json pela data                             │
                    │        2. monta o pedido no formato da Receita                                             │
                    │        3. chama a calculadora com  Authorization: Bearer MOTOR_CHAVE  ───────────────┐     │
                    │        4. traduz a resposta (valores, redução, artigo, memória de cálculo, versões)  │     │
                    └──────────────────────────────────────────────────────────────────────────────────────┼─────┘
                                                                                                           │ HTTPS
                    ┌──────────────────────── Fly.io (região gru, São Paulo, 1 GB) ─────────────────────────▼─────┐
                    │  container "producao" (calculadora/Dockerfile)                                             │
                    │   • Caddy :8000  → recusa sem a chave (401); /saude sem chave para o health check          │
                    │   • calculadora oficial da Receita (Java 25, Spring Boot) :8080, sem alterações            │
                    │   • banco SQLite somente leitura com as tabelas oficiais (gerado no build)                 │
                    └────────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────── Supabase (São Paulo) — ainda não usado no código ─────────────────┐
                    │  login (Google e link por e-mail), banco Postgres (empresas, cálculos, assinaturas),       │
                    │  bucket privado para XMLs (apagados após a leitura)                                        │
                    └────────────────────────────────────────────────────────────────────────────────────────────┘
```

Por que separado: a Vercel só roda funções curtas e não mantém um servidor Java ligado. O Fly.io roda o container 24 horas perto da Vercel. Detalhes em [`decisoes.md`](decisoes.md).

## Fluxo de um cálculo grátis

1. A pessoa digita "pizzaria". A busca roda **no navegador**, no dicionário `site/src/dados/atividades.json` (sem chamar servidor).
2. Ela escolhe "Restaurante / pizzaria / lanchonete" → NBS `103011000`, cClassTrib `200047`.
3. O navegador manda `POST /api/calcular` com `{ tipo, codigo, cClassTrib, valor, municipio, uf }`.
4. `route.ts` valida tudo e chama `calcular()` em `lib/motor.ts`.
5. `motor.ts` pega as alíquotas vigentes (hoje CBS 11,2%, IBS 0,05% + 0,05%, provisórias), monta a operação e chama `POST /api/calculadora/observabilidade/regime-geral` na calculadora oficial.
6. A calculadora devolve os grupos `gCBS`, `gIBSUF`, `gIBSMun` (com redução e alíquota efetiva) e a `memoriaCalculo` em texto.
7. `motor.ts` traduz para `ResultadoCalculo` (tipo em `lib/tipos.ts`), incluindo versões e fontes.
8. `Resultado.tsx` mostra o total e a "conta aberta".

Se a calculadora disser `INCONSISTENCIA_ENTRADA`, `NAO_IMPLEMENTADO` ou `FALHA_TECNICA`, o site mostra a mensagem e **nenhum valor**.

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
| Tabelas oficiais (NCM, NBS, reduções) | dentro da imagem da calculadora | atualizar a versão da calculadora |
| Contas, empresas, histórico | Supabase (a fazer: T13, T15, T18) | o site |

## Testes e CI

| Workflow | Quando roda | O que faz |
|---|---|---|
| `.github/workflows/calculadora.yml` | PR que mexe em `calculadora/`, `testes-dourados/`, `site/src/dados/` | compila a imagem (com cache), sobe, roda o exemplo oficial, os 30 testes dourados e o dicionário |
| `.github/workflows/site.yml` | PR que mexe em `site/` | `npm ci`, lint, tipos (`next typegen` + `tsc`), build |
