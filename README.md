# impostometro (nome do produto provisório: Calcula Reforma)

Site para empresários descobrirem quanto vão pagar de **CBS e IBS em 2027**, a reforma tributária do consumo. É grátis para simular uma venda, com assinatura barata para importar as notas do mês. Todo número vem da **calculadora oficial que a Receita Federal publicou como código aberto**, traduzida fielmente para TypeScript para rodar dentro do próprio site, e o site mostra a conta inteira.

> **Para agentes e novas pessoas no projeto: comece por [`AGENTS.md`](AGENTS.md).** Ele tem as regras, os comandos e o mapa do repositório.

## Status (25/11/2026)

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
| [`AGENTS.md`](AGENTS.md) | regras do projeto, comandos, convenções (o `CLAUDE.md` aponta para ele) |
| [`docs/arquitetura.md`](docs/arquitetura.md) | como as peças conversam, fluxo de um cálculo, glossário tributário |
| [`docs/deploy.md`](docs/deploy.md) | colocar no ar: Vercel, domínio, Supabase, variáveis de ambiente |
| [`docs/manutencao.md`](docs/manutencao.md) | atualizar alíquota, atualizar a calculadora e o porte, adicionar atividade |
| [`docs/backlog.md`](docs/backlog.md) | status de cada ticket e próximo passo |
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
