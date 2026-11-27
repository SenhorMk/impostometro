# Backlog e status

**Cada ticket tem um arquivo em [`docs/tickets/`](tickets/README.md)**, com história, critérios de aceite (marcados quando prontos), prioridade, pontos e dependências. Este arquivo é o **resumo do status**: atualize-o junto com o arquivo do ticket em cada pull request. (Fonte original: [Backlog do MVP](https://claude.ai/artifact/Hr4U1WJddcMCdYTgVGzvJy).)

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
| T05 | Vercel e Supabase | 🟡 | site no ar na Vercel (projeto `impostometro`, deploy automático da `main`). Supabase criado e registro do T10 validado no site local; login pendente ([`banco.md`](banco.md)). Domínio depende do T04 |
| T06 | Repositório, CI e deploy automático | ✅ | CI (`.github/workflows/`) com comparação porte × oficial; a Vercel publica a `main` e gera prévia de cada PR (comentário do bot da Vercel no PR #6) |
| T08b | Porte da calculadora para TypeScript (roda dentro do site) | ✅ | `site/src/motor/`. 1.519 de 1.519 pedidos idênticos à oficial 1.7.2. Atualização em [`manutencao.md`](manutencao.md) |
| T08 | Serviço de cálculo | ✅ | `site/src/lib/motor.ts`, agora chamando o porte. Quem está logado tem cada cálculo guardado no histórico (T18) |

## Sprint 2 · Calculadora grátis

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T09 | Testes dourados no CI | ✅ | `calculadora.yml` |
| T10 | Busca "o que você vende?" | ✅ | 52 atividades + busca nas 11 mil NCM/NBS oficiais com descrição e tratamento especial + busca de classificações (cClassTrib) + registro das buscas sem resultado no Supabase (RLS, retenção de 30 dias). Detalhes em `docs/busca.md` |
| T11 | Simulação rápida sem cadastro | ✅ | página inicial. Medir tempo de carga em produção |

## Sprint 3 · Lançamento 1

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T12 | "Como chegamos nisso" | ✅ | `Resultado.tsx` |
| T19 | 5 artigos base e glossário | 🟡 | cinco artigos, glossário, fontes oficiais, links e metadados implementados; revisão contábil pendente. Fontes em `docs/conteudo.md`; evidências no diário |
| T20 | SEO técnico, Search Console e medição | 🟡 | títulos, descrição, FAQ, sitemap, robots e canônicas feitos. `SITE_URL` configura o endereço; prévias e ambientes sem URL ficam fora da indexação. Falta: configurar URL de produção, Search Console e Plausible/GA |
| T21 | Termos, privacidade e aviso "não oficial" | 🟡 | rodapé feito; termos e privacidade são rascunhos para advogado revisar |
| T07 | Backup e monitoramento | 🟡🧑 | Sentry e `/api/saude` prontos no código; falta criar Sentry e alerta, e o backup ([`monitoramento.md`](monitoramento.md)) |

## Sprints 4 a 6 · Conta, assinatura e XML

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T13 | Login com link por e-mail e Google | 🟡 | `/entrar` e `/conta` prontos (aceite dos termos, sair, apagar conta). Tabelas criadas no Supabase; faltam as URLs de login no painel ([`banco.md`](banco.md)) |
| T15 | Cadastro mínimo da empresa | 🟡 | formulário em `/conta`, tabela `empresas` com RLS criada no Supabase |
| T16 | Upload e leitura de XML de NF-e/NFC-e | ✅ | XML lido no navegador (não sai do computador). Com a cobrança ligada, só assinante importa (T14); sem ela, `/importar` é prévia aberta |
| T14 | Assinatura recorrente (Pix e cartão) | 🟡 | Asaas (decisão do Mateus). Assinar, avisos, cancelar e XML só para assinante prontos; tabelas criadas no Supabase; falta ligar o Asaas, testar no sandbox e com R$ 1 ([`banco.md`](banco.md)) |
| T17 | Calcular o lote item a item | ✅ | Total, detalhe por item e confirmação da classificação. 500 notas em 1,7 s. Planilha CSV para o contador |
| T18 | Histórico de cálculos | 🟡 | `/conta/historico`: lista, reabrir com as versões e apagar. Falta rodar o SQL no Supabase |
| T22 | Funil medido e checklist de lançamento | 🟡 | contadores por dia sem dado pessoal; checklist em [`lancamento.md`](lancamento.md); página `/contato` (e-mail em `CONTATO_EMAIL`). Falta rodar o SQL e os itens do Mateus no checklist |
| SEG | Revisão de segurança severa | 🟡 | correções no código e SQL novo em revisão; Mateus roda o SQL e faz as tarefas de conta ([`seguranca.md`](seguranca.md)) |

## Depois do MVP (P2)

T23 aviso automático de versão nova da Receita (abre tarefa para um agente atualizar o porte) · T24 Simples Nacional · T25 NFS-e · T26 créditos das compras · T27 PDF para o contador · T28 alertas · T29 painel de alíquotas · T30 páginas por setor/cidade · T31 comparar com o imposto atual · T32 painel do contador.

## Próximo passo recomendado

Todo o código do MVP existe. O que falta é configuração e revisão, quase tudo do Mateus (lista viva em `PARA-FAZER-MATEUS.txt` nos arquivos do projeto; checklist em [`lancamento.md`](lancamento.md)):

1. 🧑 Rodar as migrações pendentes ([`banco.md`](banco.md)) e ligar o login (URLs no Supabase, variáveis na Vercel).
2. 🧑 Asaas: sandbox, webhook e teste real de R$ 1 (T14).
3. 🧑 Sentry, alerta do `/api/saude` e backup com teste de restauração (T07, [`monitoramento.md`](monitoramento.md)).
4. 🧑 Nome, domínio e preço (T04); depois Search Console e medição (T20).
5. 🧑 Revisão de advogado (T21) e de contador (T02, T19).
6. Conferir a alíquota da CBS depois de 15/12/2026 ([`manutencao.md`](manutencao.md)).
