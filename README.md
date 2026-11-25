# impostometro (nome do produto provisório: Calcula Reforma)

Site para empresários descobrirem quanto vão pagar de **CBS e IBS em 2027**, a reforma tributária do consumo. É grátis para simular uma venda, com assinatura barata para importar as notas do mês. Todo número vem da **calculadora oficial que a Receita Federal publicou como código aberto**, e o site mostra a conta inteira.

> **Para agentes e novas pessoas no projeto: comece por [`AGENTS.md`](AGENTS.md).** Ele tem as regras, os comandos e o mapa do repositório.

## Status (25/11/2026)

- ✅ Calculadora oficial empacotada em Docker, validada com o exemplo da Receita (CBS de R$ 42,24) e com 30 testes de referência.
- ✅ Site com a calculadora grátis na página inicial, "como chegamos nesse número" e landing page.
- 🟡 Pronto para colocar no ar (Fly.io + Vercel), aguardando a criação das contas e projetos.
- ⏳ Login, cadastro da empresa, assinatura e importação de XML.

Detalhes ticket por ticket: [`docs/backlog.md`](docs/backlog.md).

## Rodar no seu computador

Precisa de Docker, Node 22, Python 3, `curl` e `jq`.

```bash
# 1. Calculadora oficial (porta 8080). A primeira vez leva uns 5 minutos.
docker compose up -d --build
./scripts/validar-calculadora.sh          # deve terminar com ✅

# 2. Site (porta 3000)
cd site
cp .env.example .env.local
npm install
npm run dev                               # abra http://localhost:3000
```

## Como está organizado

```
calculadora/        calculadora oficial da Receita em Docker (Java 25) + fly.toml + porteiro de produção
site/               Next.js 16 + TypeScript + Tailwind: landing, calculadora grátis e API
  src/lib/motor.ts    único ponto que conversa com a calculadora oficial
  src/dados/          alíquotas 2027, atividades do "o que você vende?" e municípios
testes-dourados/    30 operações com resultado conhecido + checagem do dicionário
scripts/            validação do exemplo oficial
docs/               arquitetura, deploy, manutenção, backlog e decisões
.github/workflows/  CI da calculadora e do site
```

| Documento | Para quê |
|---|---|
| [`AGENTS.md`](AGENTS.md) | regras do projeto, comandos, convenções (o `CLAUDE.md` aponta para ele) |
| [`docs/arquitetura.md`](docs/arquitetura.md) | como as peças conversam, fluxo de um cálculo, glossário tributário |
| [`docs/deploy.md`](docs/deploy.md) | colocar no ar: Fly.io, Vercel, domínio, Supabase, variáveis de ambiente |
| [`docs/manutencao.md`](docs/manutencao.md) | atualizar alíquota, atualizar a calculadora, adicionar atividade |
| [`docs/backlog.md`](docs/backlog.md) | status de cada ticket e próximo passo |
| [`docs/decisoes.md`](docs/decisoes.md) | o que foi decidido e por quê |
| [`calculadora/README.md`](calculadora/README.md) | como a calculadora oficial funciona, explicado passo a passo |
| [`testes-dourados/README.md`](testes-dourados/README.md) | o que os testes de referência cobrem |
| [`site/README.md`](site/README.md) | peças do site e suposições a revisar |

## Onde roda

| Parte | Serviço | Custo aproximado |
|---|---|---|
| Site e API | Vercel (São Paulo) | grátis no desenvolvimento; US$ 20/mês (Pro) quando cobrar assinatura |
| Calculadora oficial | Fly.io (São Paulo, 1 GB, sempre ligada) | ~US$ 6,70/mês |
| Login, banco e arquivos | Supabase (São Paulo) | grátis no começo; US$ 25/mês (Pro) depois |

## Créditos e licença de terceiros

A calculadora de tributos é obra da **Receita Federal do Brasil**, distribuída sob a licença MIT
(<https://github.com/ReceitaFederal/calculadora-rtc-regime-regular>). Copyright (c) 2026 Receita Federal do Brasil.
O texto da licença está em [`calculadora/LICENSE-RECEITA-FEDERAL.txt`](calculadora/LICENSE-RECEITA-FEDERAL.txt).
Este projeto usa a calculadora sem modificações. Este site não é do governo.
