# Guia para agentes e pessoas que vão mexer neste projeto

Leia este arquivo inteiro antes de mudar qualquer coisa. Ele vale para qualquer agente (Claude, Codex, Cursor...) e para pessoas.

## O que é o projeto

Site por assinatura barata para empresários calcularem a **CBS e o IBS da reforma tributária (2027)**, usando a **calculadora oficial que a Receita Federal publicou no GitHub** (licença MIT). Diferenciais: mais simples que o simulador do governo (sem login gov.br), encontrável no Google, importação de XML de notas (assinantes) e **transparência total nos cálculos**.

- Dono do produto: Mateus (GitHub `SenhorMk`). Mora no Brasil, fala português.
- Estado atual, tickets e próximos passos: [`docs/backlog.md`](docs/backlog.md).
- Decisões já tomadas e por quê: [`docs/decisoes.md`](docs/decisoes.md).

## Regras que não se quebram

1. **Nunca alterar o código da calculadora da Receita.** Ela é baixada numa versão fixa pelo `calculadora/Dockerfile` e usada como está. Se precisar de algo diferente, faça no nosso código (site), nunca num fork dela.
2. **Nunca inventar número.** Se a calculadora oficial não calculou um item, o site mostra "não calculado" com o motivo. Todo valor exibido vem da calculadora oficial.
3. **Transparência em todo resultado:** alíquota usada e fonte, redução e artigo da lei, memória de cálculo oficial, versão da calculadora e da tabela de alíquotas.
4. **Manter a atribuição MIT da Receita** (README, rodapé do site, `calculadora/LICENSE-RECEITA-FEDERAL.txt`, licença dentro da imagem).
5. **O site não é do governo** e isso aparece no rodapé de todas as páginas. Não usar "Receita", "gov" nem "Impostômetro" (marca da ACSP) no nome do produto.
6. **Segredos nunca no git.** Chaves ficam na Vercel, no Fly.io e no Supabase. Só `.env.example` (sem valores) é versionado.
7. **Testes dourados não se "consertam" regravando.** Se um valor mudou, descubra por quê (CHANGELOG da Receita) antes de rodar `--gerar`, e explique no pull request.

## Idioma e estilo

- Interface, documentação, mensagens de commit e nomes no código: **português do Brasil**, linguagem simples (o público é empresário, não contador).
- Explique de forma didática: o Mateus quer entender como tudo funciona.
- Marque suposições como **"Suposição:"** e decisões pendentes do Mateus como **"Decisão do T04"** (ou o ticket certo).

## Mapa do repositório

| Caminho | O que é |
|---|---|
| `calculadora/` | Dockerfile que empacota a calculadora oficial (Java 25), `fly.toml`, porteiro de produção (`producao/`), exemplo oficial |
| `site/` | Next.js 16 + TypeScript + Tailwind 4: landing page, calculadora grátis e API (`/api/calcular`) |
| `site/src/lib/motor.ts` | o **único** ponto do site que fala com a calculadora oficial |
| `site/src/dados/aliquotas.json` | alíquotas de 2027 com fonte e status |
| `site/src/dados/atividades.json` | dicionário "o que você vende?" (atividade → NCM/NBS + cClassTrib) |
| `testes-dourados/` | 30 operações com resultado conhecido + checagem do dicionário |
| `scripts/validar-calculadora.sh` | confere o exemplo oficial da Receita (CBS de R$ 42,24) |
| `docs/` | arquitetura, deploy, manutenção, backlog, decisões |
| `.github/workflows/` | CI: `calculadora.yml` (motor + testes) e `site.yml` (lint, tipos, build) |

Arquitetura detalhada: [`docs/arquitetura.md`](docs/arquitetura.md).

## Comandos

Pré-requisitos: Docker, Node 22, Python 3 (só biblioteca padrão), `curl` e `jq`.

```bash
# Calculadora oficial (porta 8080). Primeira vez ~5 min.
docker compose up -d --build
./scripts/validar-calculadora.sh              # exemplo oficial
python3 testes-dourados/dourados.py           # 30 operações de referência
python3 testes-dourados/atividades.py         # dicionário do site

# Site (porta 3000)
cd site
cp .env.example .env.local
npm install
npm run dev
npm run lint && npx next typegen && npx tsc --noEmit && npm run build   # o que o CI roda
```

**Next.js 16 tem mudanças grandes** em relação ao que modelos costumam saber (por exemplo, `cacheComponents` ligado e tipos globais como `LayoutProps`). Antes de escrever código do site, leia `site/AGENTS.md` e a documentação em `site/node_modules/next/dist/docs/`.

## Antes de abrir um pull request

- Rode o que você mudou: testes dourados e dicionário (se mexeu em calculadora, alíquotas ou atividades) e lint, tipos e build (se mexeu no site).
- Mudou a interface? Teste no navegador, no celular e no computador.
- Atualize o [`docs/backlog.md`](docs/backlog.md) (status do ticket) e, se tomou uma decisão, registre em [`docs/decisoes.md`](docs/decisoes.md).
- Não faça merge sozinho: o Mateus revisa e aprova.

## Tarefas comuns

Passo a passo em [`docs/manutencao.md`](docs/manutencao.md):
- atualizar a alíquota (por exemplo, quando o Senado fixar a CBS de 2027);
- atualizar a versão da calculadora da Receita;
- adicionar uma atividade ao "o que você vende?";
- colocar no ar e mudar segredos ([`docs/deploy.md`](docs/deploy.md)).

## Ambiente de nuvem com proxy (só se o build falhar com erro de certificado)

Em máquinas atrás de proxy corporativo, o Docker pode falhar com `PKIX path building failed` ou limite de downloads (429) do Docker Hub. Veja a seção 8 de [`calculadora/README.md`](calculadora/README.md): certificados em `calculadora/certs/*.crt` (ignorados pelo git), `MAVEN_OPTS` com o proxy e imagens base de espelho (`mirror.gcr.io/library/...`).
