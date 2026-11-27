# impostometro (nome do produto provisório: Calcula Reforma)

Site para empresários simularem a **CBS e o IBS de uma venda em 2027**, no regime regular, com premissas e fontes visíveis. A calculadora é gratuita; a importação de notas existe como prévia e a assinatura ainda está em preparação. Os valores vêm de um porte para TypeScript da **calculadora de código aberto da Receita Federal**, executado dentro do site. O resultado não representa a apuração de todos os tributos da empresa.

> **Para agentes e novas pessoas no projeto: comece por [`AGENTS.md`](AGENTS.md).** Ele tem as regras, os comandos e o mapa do repositório.

## Tickets e implementação

Os tickets estão nas [issues do repositório](https://github.com/SenhorMk/impostometro/issues) e têm especificações versionadas no [catálogo](docs/tickets/README.md). O [plano de implementação](docs/plano-implementacao.md) define ordem, dependências e os marcos gratuito e pago. O [diário](docs/diario/README.md) registra entregas e evidências. Começamos pelo [T33: site claro e confiável](https://github.com/SenhorMk/impostometro/issues/10).

## Status de referência (25/11/2026)

O quadro abaixo é histórico. Consulte o [backlog atualizado](docs/backlog.md) para distinguir código publicado, propostas em PR e validações pendentes.

- ✅ Calculadora oficial empacotada em Docker, validada com o exemplo da Receita (CBS de R$ 42,24) e com 30 testes de referência.
- ✅ Site com a calculadora grátis na página inicial, "como chegamos nesse número" e landing page.
- ✅ Calculadora traduzida para TypeScript (o "porte", `site/src/motor/`): roda dentro do site, sem servidor Java. Conferida contra a oficial em 1.519 pedidos, todos idênticos.
- 🟡 Pronto para colocar no ar (só Vercel), aguardando a criação do projeto.
- ⏳ Login, cadastro da empresa, assinatura e importação de XML.

Detalhes ticket por ticket: [`docs/backlog.md`](docs/backlog.md).

## Rodar no seu computador

Para o site, só Node 22:

```bash
cd site
npm install
npm test                                  # confere o porte (sem Docker)
npm run dev                               # abra http://localhost:3000
```

Para conferir o porte contra a calculadora oficial (Docker, Python 3, `curl` e `jq`):

```bash
docker compose up -d --build              # a primeira vez leva uns 5 minutos
./scripts/validar-calculadora.sh          # deve terminar com ✅
cd site && npm run porte:comparar         # 1.519 pedidos, todos idênticos
```

## Como está organizado

```
calculadora/        calculadora oficial da Receita em Docker (Java 25), só como referência
site/               Next.js 16 + TypeScript + Tailwind: landing, calculadora grátis e API
  src/motor/          o porte: calculadora da Receita em TypeScript + tabelas oficiais
  src/lib/motor.ts    único ponto que chama o porte
  src/dados/          alíquotas 2027, atividades do "o que você vende?" e municípios
testes-dourados/    30 operações com resultado conhecido + checagem do dicionário
scripts/            validação do exemplo oficial e exportação das tabelas para o porte
docs/               arquitetura, deploy, manutenção, backlog e decisões
.github/workflows/  CI da calculadora e do site
```

| Documento | Para quê |
|---|---|
| [`docs/README.md`](docs/README.md) | índice e fluxo de documentação de cada entrega |
| [`docs/skills.md`](docs/skills.md) | skills disponíveis e pesquisadas, aplicação e fontes |
| [`docs/conteudo.md`](docs/conteudo.md) | artigos, glossário, fontes oficiais e manutenção editorial |
| [`docs/busca.md`](docs/busca.md) | dicionário e busca oficial de classificações e códigos |
| [`docs/banco.md`](docs/banco.md) | migração Supabase, coleta de buscas e estado do provisionamento |
| [`docs/diario/README.md`](docs/diario/README.md) | histórico de entregas com verificações e pendências |
| [`AGENTS.md`](AGENTS.md) | regras do projeto, comandos, convenções (o `CLAUDE.md` aponta para ele) |
| [`docs/arquitetura.md`](docs/arquitetura.md) | como as peças conversam, fluxo de um cálculo, glossário tributário |
| [`docs/deploy.md`](docs/deploy.md) | colocar no ar: Vercel, domínio, Supabase, variáveis de ambiente |
| [`docs/manutencao.md`](docs/manutencao.md) | atualizar alíquota, atualizar a calculadora e o porte, adicionar atividade |
| [`docs/backlog.md`](docs/backlog.md) | status de cada ticket e próximo passo |
| [`docs/tickets/`](docs/tickets/README.md) | cada ticket com história, critérios de aceite e dependências |
| [`docs/decisoes.md`](docs/decisoes.md) | o que foi decidido e por quê |
| [`calculadora/README.md`](calculadora/README.md) | como a calculadora oficial funciona, explicado passo a passo |
| [`site/src/motor/README.md`](site/src/motor/README.md) | o porte: mapa Java → TypeScript e como ele garante o mesmo número |
| [`testes-dourados/README.md`](testes-dourados/README.md) | o que os testes de referência cobrem |
| [`site/README.md`](site/README.md) | peças do site e suposições a revisar |

## Onde roda

| Parte | Serviço | Custo aproximado |
|---|---|---|
| Site, API e calculadora (porte) | Vercel (São Paulo) | grátis no desenvolvimento; US$ 20/mês (Pro) quando cobrar assinatura |
| Login, banco e arquivos | Supabase (São Paulo) | grátis no começo; US$ 25/mês (Pro) depois |

## Créditos e licença de terceiros

A calculadora de tributos é obra da **Receita Federal do Brasil**, distribuída sob a licença MIT
(<https://github.com/ReceitaFederal/calculadora-rtc-regime-regular>). Copyright (c) 2026 Receita Federal do Brasil.
O texto da licença está em [`calculadora/LICENSE-RECEITA-FEDERAL.txt`](calculadora/LICENSE-RECEITA-FEDERAL.txt).
Este projeto traduz a lógica de cálculo e exporta as tabelas oficiais sem mudar regras nem valores (`site/src/motor/`, sob a mesma licença MIT), e confere a tradução contra a versão oficial em cada mudança. Este site não é do governo.
