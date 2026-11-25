# Backlog e status

Fonte original (com histórias e critérios de aceite completos): [Backlog do MVP](https://claude.ai/artifact/Hr4U1WJddcMCdYTgVGzvJy). Este arquivo é o **status atual dentro do repositório**: atualize-o em cada pull request.

Legenda: ✅ feito · 🟡 em andamento ou parcial · ⏳ a fazer · 🧑 depende do Mateus

Lançamento 1 (calculadora grátis pública): meta 23/12/2026. Lançamento 2 (assinatura + XML): meta 25/01/2027.

## Sprint 0 · Estudo e decisões

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T01 | Rodar o motor oficial e medir RAM e tempo | ✅ | v1.7.2, 12 ms por cálculo, ~600 MB. `calculadora/` |
| T02 | 30 operações de referência (testes dourados) | ✅ | `testes-dourados/`. 6 conferidas à mão; falta revisão de contador |
| T03 | Tabela de alíquotas 2027 versionada | ✅ | `site/src/dados/aliquotas.json`. CBS 11,2% provisória até 15/12/2026 |
| T04 | Nome, domínio, preço, regime, quem programa | 🧑 | nome e preço provisórios em `site/src/lib/config.ts` |

## Sprint 1 · Infra e motor

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T05 | Vercel, Supabase e motor no Fly.io | 🟡 | `fly.toml`, imagem `producao` com chave e `site/vercel.json` prontos; falta criar os projetos nas contas ([`deploy.md`](deploy.md)) |
| T06 | Repositório, CI e deploy automático | 🟡 | CI pronto (`.github/workflows/`). Falta: deploy automático do motor no Fly.io e ligar a Vercel ao repositório |
| T08 | Serviço de cálculo que conversa com o motor | ✅ | `site/src/lib/motor.ts`. Falta gravar cada cálculo no banco (depende do Supabase) |

## Sprint 2 · Calculadora grátis

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T09 | Testes dourados no CI | ✅ | `calculadora.yml` |
| T10 | Busca "o que você vende?" | 🟡 | 52 atividades. Falta: busca nas tabelas oficiais quando não acha, e registrar buscas sem resultado (precisa do banco) |
| T11 | Simulação rápida sem cadastro | ✅ | página inicial. Medir tempo de carga em produção |

## Sprint 3 · Lançamento 1

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T12 | "Como chegamos nisso" | ✅ | `Resultado.tsx` |
| T19 | 5 artigos base e glossário | ⏳ | |
| T20 | SEO técnico, Search Console e medição | 🟡 | títulos, descrição e dados de FAQ feitos. Falta: sitemap, robots, Search Console, Plausible/GA |
| T21 | Termos, privacidade e aviso "não oficial" | 🟡 | rodapé feito; termos e privacidade são rascunhos para advogado revisar |
| T07 | Backup e monitoramento | ⏳ | Sentry + aviso se site ou motor caírem |

## Sprints 4 a 6 · Conta, assinatura e XML

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T13 | Login com link por e-mail e Google | ⏳ | Supabase Auth. `/entrar` hoje só explica que abre em janeiro |
| T15 | Cadastro mínimo da empresa | ⏳ | |
| T16 | Upload e leitura de XML de NF-e/NFC-e | ⏳ | |
| T14 | Assinatura recorrente (Pix e cartão) | ⏳ 🧑 | gateway a decidir (sugestão: Asaas) |
| T17 | Calcular o lote item a item | ⏳ | |
| T18 | Histórico de cálculos | ⏳ | |
| T22 | Funil medido e checklist de lançamento | ⏳ | |

## Depois do MVP (P2)

T23 atualização automática do motor · T24 Simples Nacional · T25 NFS-e · T26 créditos das compras · T27 PDF para o contador · T28 alertas · T29 painel de alíquotas · T30 páginas por setor/cidade · T31 comparar com o imposto atual · T32 painel do contador.

## Próximo passo recomendado

1. 🧑 Mateus: decidir nome, domínio e preço (T04) e criar a conta no Fly.io.
2. Subir o motor no Fly.io e o site na Vercel ([`deploy.md`](deploy.md)) → calculadora grátis no ar.
3. T20 (sitemap, Search Console, medição) e T19 (artigos) para o Google começar a indexar antes da virada do ano.
4. T13 + T15 (login e empresa) com Supabase.
