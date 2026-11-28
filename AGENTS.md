# Guia para agentes e pessoas que vão mexer neste projeto

Leia este arquivo inteiro antes de mudar qualquer coisa. Ele vale para qualquer agente (Claude, Codex, Cursor...) e para pessoas.

## O que é o projeto

Site por assinatura barata para empresários calcularem a **CBS e o IBS da reforma tributária (2027)**, usando a **calculadora oficial que a Receita Federal publicou no GitHub** (licença MIT), traduzida fielmente para TypeScript para rodar dentro do próprio site (o "porte", em `site/src/motor/`). Diferenciais: mais simples que o simulador do governo (sem login gov.br), encontrável no Google, importação de XML de notas (assinantes) e **transparência total nos cálculos**.

- Dono do produto: Mateus (GitHub `SenhorMk`). Mora no Brasil, fala português.
- Estado atual e próximos passos: [`docs/backlog.md`](docs/backlog.md). Cada ticket (história, critérios de aceite, dependências) tem um arquivo em [`docs/tickets/`](docs/tickets/README.md).
- Decisões já tomadas e por quê: [`docs/decisoes.md`](docs/decisoes.md).
- Índice da documentação: [`docs/README.md`](docs/README.md). Skills pesquisadas e uso por ticket: [`docs/skills.md`](docs/skills.md). Evidências de cada entrega: [`docs/diario/`](docs/diario/README.md).

## Regras que não se quebram

1. **Nunca alterar o código da calculadora da Receita.** A versão oficial (Java) é baixada numa versão fixa pelo `calculadora/Dockerfile` e usada como está, só como **referência** (no seu computador e na CI).
2. **O porte tem que responder IGUAL à oficial, sempre.** `site/src/motor/` é uma tradução linha a linha da lógica da Receita: não "melhore" nem "corrija" regras ali (se a oficial errar, o porte erra igual). `npm run porte:comparar` precisa dar 100% idêntico; nunca mude a comparação para aceitar uma diferença. Se precisar de algo diferente, faça fora de `src/motor/` (em `src/lib/`). Para atualizar quando a Receita lançar versão nova: [`docs/manutencao.md`](docs/manutencao.md).
3. **Nunca inventar número.** Se a calculadora não calculou um item, o site mostra "não calculado" com o motivo. Todo valor exibido vem do porte, conferido contra a calculadora oficial.
4. **Transparência em todo resultado:** alíquota usada e fonte, redução e artigo da lei, memória de cálculo oficial, versão da calculadora e da tabela de alíquotas.
5. **Manter a atribuição MIT da Receita** (README, rodapé do site, termos, `calculadora/LICENSE-RECEITA-FEDERAL.txt`, licença dentro da imagem e cabeçalho de `site/src/motor/`). O porte é obra derivada e segue sob a mesma licença.
6. **O site não é do governo** e isso aparece no rodapé de todas as páginas. Não usar "Receita", "gov" nem "Impostômetro" (marca da ACSP) no nome do produto.
7. **Segredos nunca no git.** Chaves ficam na Vercel e no Supabase. Só `.env.example` (sem valores) é versionado.
8. **Testes dourados não se "consertam" regravando.** Se um valor mudou, descubra por quê (CHANGELOG da Receita) antes de rodar `--gerar`, e explique no pull request.
9. **LGPD e segurança mínima em todo o trabalho.** Colete só o necessário, com finalidade e prazo; dado de conta tem RLS, `on delete cascade` e entra no "Baixar meus dados"; nada de dado pessoal em logs, Sentry ou link público. Mudou um fluxo de dados? Atualize `site/src/lib/privacidade.ts`, [`docs/lgpd.md`](docs/lgpd.md) e suba `VERSAO_TERMOS`. Regras completas na seção 7 de [`docs/lgpd.md`](docs/lgpd.md) e em [`docs/seguranca.md`](docs/seguranca.md).

## Idioma e estilo

- Interface, documentação, mensagens de commit e nomes no código: **português do Brasil**, linguagem simples (o público é empresário, não contador).
- Explique de forma didática: o Mateus quer entender como tudo funciona.
- Marque suposições como **"Suposição:"** e decisões pendentes do Mateus como **"Decisão do T04"** (ou o ticket certo).

## Mapa do repositório

| Caminho | O que é |
|---|---|
| `calculadora/` | Dockerfile que empacota a calculadora oficial (Java 25), usada só como referência; exemplo oficial e resposta oficial |
| `site/` | Next.js 16 + TypeScript + Tailwind 4: landing page, calculadora grátis e API (`/api/calcular`) |
| `site/src/motor/` | o **porte**: calculadora da Receita traduzida para TypeScript + tabelas oficiais (`dados/tabelas.json`). Mapa Java → TS no `README.md` da pasta |
| `site/src/lib/motor.ts` | o **único** ponto do site que chama o porte |
| `site/scripts/porte/` | `comparar.ts` (porte × oficial, 1.519 pedidos) e `exportar-tabelas.mjs` |
| `site/src/dados/aliquotas.json` | alíquotas de 2027 com fonte e status |
| `site/src/dados/atividades.json` | dicionário "o que você vende?" (atividade → NCM/NBS + cClassTrib) |
| `testes-dourados/` | 30 operações com resultado conhecido + checagem do dicionário |
| `scripts/validar-calculadora.sh` | confere o exemplo oficial da Receita (CBS de R$ 42,24) |
| `docs/` | arquitetura, deploy, manutenção, backlog, decisões, segurança e LGPD (`lgpd.md`) |
| `docs/tickets/` | um arquivo por ticket do MVP, com critérios de aceite e status |
| `.github/workflows/` | CI: `calculadora.yml` (oficial + testes + porte × oficial) e `site.yml` (lint, testes do porte, tipos, build) |

Arquitetura detalhada: [`docs/arquitetura.md`](docs/arquitetura.md).

## Comandos

Pré-requisitos: Docker, Node 22, Python 3 (só biblioteca padrão), `curl` e `jq`.

```bash
# Site (porta 3000). Já calcula sozinho, sem Docker.
cd site
npm install
npm test                                      # porte: exemplo oficial + 30 dourados (sem Docker)
npm run dev
npm run lint && npx next typegen && npx tsc --noEmit && npm run build   # o que o CI roda

# Calculadora oficial em Docker (porta 8080), a referência. Primeira vez ~5 min.
docker compose up -d --build
./scripts/validar-calculadora.sh              # exemplo oficial
python3 testes-dourados/dourados.py           # 30 operações de referência
python3 testes-dourados/atividades.py         # dicionário do site
cd site && npm run porte:comparar             # porte × oficial: tem que dar 100% idêntico
npm run porte:tabelas                         # exporta as tabelas do banco oficial para o porte
```

**Next.js 16 tem mudanças grandes** em relação ao que modelos costumam saber (por exemplo, `cacheComponents` ligado e tipos globais como `LayoutProps`). Antes de escrever código do site, leia `site/AGENTS.md` e a documentação em `site/node_modules/next/dist/docs/`.

## Antes de abrir um pull request

- Rode o que você mudou: `npm run porte:comparar` (se mexeu em `src/motor/` ou na versão da calculadora), testes dourados e dicionário (se mexeu em calculadora, alíquotas ou atividades) e lint, testes, tipos e build (se mexeu no site).
- Mudou a interface? Teste no navegador, no celular e no computador.
- Atualize o arquivo do ticket em [`docs/tickets/`](docs/tickets/README.md) (marque os critérios cumpridos) e o [`docs/backlog.md`](docs/backlog.md) (status) e, se tomou uma decisão, registre em [`docs/decisoes.md`](docs/decisoes.md).
- Mantenha também o índice de tickets e o diário da entrega: escopo, fontes/skills usadas, implementação, comandos e resultados, limitações e link do PR. Não marque revisão contábil, build, teste visual ou deploy como concluído sem evidência. O fluxo completo está em [`docs/README.md`](docs/README.md).
- Não faça merge sozinho: o Mateus revisa e aprova.

## Tarefas comuns

Passo a passo em [`docs/manutencao.md`](docs/manutencao.md):
- atualizar a alíquota (por exemplo, quando o Senado fixar a CBS de 2027);
- atualizar a versão da calculadora da Receita **e o porte** (passo a passo para agentes);
- adicionar uma atividade ao "o que você vende?";
- colocar no ar e mudar segredos ([`docs/deploy.md`](docs/deploy.md)).

## Ambiente de nuvem com proxy (só se o build falhar com erro de certificado)

Em máquinas atrás de proxy corporativo, o Docker pode falhar com `PKIX path building failed` ou limite de downloads (429) do Docker Hub. Veja a seção 8 de [`calculadora/README.md`](calculadora/README.md): certificados em `calculadora/certs/*.crt` (ignorados pelo git), `MAVEN_OPTS` com o proxy e imagens base de espelho (`mirror.gcr.io/library/...`).
