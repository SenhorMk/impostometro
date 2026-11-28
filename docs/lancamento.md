# Critérios dos dois lançamentos (T39)

Este arquivo responde a duas perguntas: **o que já dá para divulgar** (calculadora grátis) e **o que falta para cobrar** (assinatura). Cada linha tem uma evidência e o próximo passo, com o responsável. Atualize depois de cada publicação relevante, com a data e o commit conferidos.

## Como ler

Tipo de evidência (o mesmo item pode precisar de mais de um):

| Sigla | Significa | Exemplo |
|---|---|---|
| **L** | teste local ou simulado (no computador, CI, banco de teste) | `npm test`, Playwright em `localhost`, PGlite |
| **I** | integração real, com o serviço de verdade | login com e-mail chegando, pagamento confirmado pelo Asaas |
| **C** | revisão de conteúdo por pessoa (advogado, contador, Mateus) | termos revisados, valores conferidos por contador |
| **P** | conferido no site publicado, no endereço de produção | `/robots.txt` em produção, cabeçalhos HTTPS |

Situação: ✅ verificado · 🟡 parcial (o que falta está escrito) · ❌ falta · ⏸️ depende de PR ainda não aprovado.

Regras: código em PR, teste simulado ou variável salva **não** contam como validação em produção. Nada é marcado sem evidência. Nenhum serviço pago é contratado por suposição. Sem prazos inventados: cada pendência diz quem age e como conferir.

## Versão conferida

| Campo | Valor |
|---|---|
| Data | 28/11/2026, 11h56 (horário de Brasília) |
| Endereço | <https://calculareforma.mkautobots.site> (domínio verificado na Vercel; `impostometro-opal.vercel.app` continua respondendo, com canônica apontando para o domínio) |
| Deploy de produção | `dpl_EU2WQFPbXxEc9QckaUBwpgPmfuzS`, Ready |
| Commit publicado | `6a77373` (merge do PR #31) |
| Calculadora / tabelas / alíquotas | 1.7.2 / V0073 / 2026-11-25 (resposta de `/api/saude`) |
| PRs abertos que mudam esta lista | #32 (T34/T35), #36 (LGPD), #37 (T27), #38 (T38), #39 (T22) |

Como foi conferido: páginas e APIs públicas lidas pela ferramenta da Vercel (a rede do agente não acessa o site direto); variáveis de ambiente listadas **só pelo nome** (valores não foram abertos); banco consultado em leitura (tabelas, funções e contagem do funil, nenhum dado pessoal).

## ⚠️ Achados desta conferência (resolver antes de divulgar)

1. **A produção está vendendo assinatura no sandbox.** `/api/acesso` responde `"vendeAssinatura": true`. A variável `MODO_ACESSO` foi criada na Vercel **depois** do último deploy, então ainda não vale: sem ela, com a chave do sandbox e a chave secreta do banco, o código entra no modo "assinatura" ([`acesso.md`](acesso.md)). Resultado: quem entrar na conta vê o botão de assinar, e o pagamento vai para o Asaas de teste (não cobra nada e pode liberar a importação). Isso também contradiz a página inicial, que diz "abre em janeiro de 2027". **Próximo passo (Mateus):** conferir que o valor de `MODO_ACESSO` é `previa` e fazer um **Redeploy** do último deploy de produção (Vercel → Deployments → ⋯ → Redeploy). Qualquer merge na `main` também resolve. Conferir: `/api/acesso` deve responder `"vendeAssinatura": false`.
2. **O SQL da revisão de segurança não está no banco.** A função `limitar_buscas_sem_resultado` (criada por `20261127210000_revisao_seguranca.sql`) não existe. Sem ele, `apagar_minha_conta` não confere a assinatura antes de apagar, e o contador do funil aceita "assinatura" e "cancelamento" vindos do navegador. **Próximo passo (Mateus):** colar o arquivo no SQL Editor (cópia em `supabase-contas/` na pasta do projeto). Conferir: `select proname from pg_proc where proname = 'limitar_buscas_sem_resultado';` devolve uma linha.
3. **Contato sem e-mail.** `/contato` diz que o e-mail "abre junto com as contas"; `CONTATO_EMAIL` não existe na Vercel. Para divulgar, o visitante precisa de um canal. **Próximo passo (Mateus):** criar um e-mail do produto e cadastrar `CONTATO_EMAIL` (e `CONTROLADOR_NOME`, que vem com o PR #36). Conferir: o e-mail aparece em `/contato` e em `/privacidade`.

## Marco A · Divulgar a calculadora grátis

Bloqueia só a divulgação. Não depende da assinatura.

| # | Critério | Situação | Tipo | Evidência | Próximo passo (quem) |
|---|---|---|---|---|---|
| A1 | Domínio próprio com HTTPS | ✅ | P | `calculareforma.mkautobots.site` verificado na Vercel; `strict-transport-security: max-age=63072000; includeSubDomains` | Se o nome final mudar (T04), repetir esta linha (Mateus) |
| A2 | Rastreamento correto | ✅ | P | `/robots.txt` libera o site e bloqueia `/api/`; `/sitemap.xml` com 64 endereços no domínio; `/contato` com canônica no domínio; `/importar` com `noindex` | — |
| A3 | Search Console | ❌ | I | Não há registro de verificação da propriedade | Verificar o domínio por DNS e enviar o sitemap (Mateus). **Não bloqueia** a divulgação |
| A4 | Calculadora funcional | 🟡 | L, P | CI verde no `main` (porte × oficial 100% idêntico e dourados); `/api/saude` ok em 52 ms; funil de produção registrou 1 `calculo_gratis` em 27/11; `/api/municipios` responde. Jornada completa testada localmente no T38 (PR #38) | Fazer **um cálculo no celular** no endereço de produção e anotar aqui (Mateus ou agente com navegador) |
| A5 | Apresentação coerente com o que existe | 🟡 | P | Página inicial promete grátis sem cadastro (verdade) e mostra a assinatura como "abre em janeiro de 2027", com botão "Quero ser avisado" | Corrigir o achado 1 (assinatura à venda no sandbox) (Mateus) |
| A6 | Informações de uso e privacidade | 🟡 | P, C | `/termos` e `/privacidade` no ar; aviso "não é do governo" e licença MIT no rodapé de todas as páginas | Merge do PR #36 (política completa); revisão por advogado (T21) é recomendada, **não** bloqueia o grátis (Mateus) |
| A7 | Contato | ❌ | P | `/contato` sem e-mail; `CONTATO_EMAIL` ausente na Vercel | Achado 3 (Mateus). PR #39 acrescenta o botão de sugestão, que usa o mesmo e-mail |
| A8 | Navegação verificada no celular e computador | ⏸️ | L | PR #38: erros ligados ao campo, erro do servidor claro, axe sem violações graves, prints em `telas-site/t38/` | Merge do PR #38 e repetir no endereço de produção (agente) |
| A9 | Segurança básica do site | 🟡 | P, L | Produção envia CSP, `x-frame-options: DENY`, `nosniff`, `referrer-policy`, `permissions-policy`; RLS ligada nas 7 tabelas | Achado 2 (SQL da revisão de segurança) (Mateus) |
| A10 | Observação básica | 🟡 | P | `/api/saude` responde; funil diário contando visitas e cálculos no banco de produção | Opcional para o grátis: `SENTRY_DSN` (grátis) e monitor do UptimeRobot em `/api/saude` ([`monitoramento.md`](monitoramento.md)) (Mateus) |

**Pode divulgar quando:** achados 1, 2 e 3 resolvidos e A4 com um cálculo anotado no celular. A3, A10 e a revisão jurídica melhoram, mas não bloqueiam.

## Marco B · Abrir a assinatura

Bloqueia a cobrança, não a calculadora grátis. Cada item precisa ser validado **no ambiente de produção** com contas de teste.

| # | Ticket | Critério para este marco | Situação | Tipo | Evidência hoje | Próximo passo (quem) |
|---|---|---|---|---|---|---|
| B1 | T13 | Link de login chega por e-mail no domínio de produção e abre a sessão | 🟡 | L | Código na `main`; diário de 26/11 diz que a entrega do link ainda não foi testada; Site URL do Supabase documentado com o endereço antigo (`impostometro-opal`) | Atualizar Site URL e retorno `/conta` no Supabase para o domínio; entrar uma vez e anotar (Mateus) |
| B2 | T15 | Empresa salva e isolada entre duas contas reais | 🟡 | L | RLS ativa em `empresas`; 0 linhas no banco (nenhum teste real) | Criar duas contas de teste e conferir que uma não vê a outra (agente + Mateus) |
| B3 | T37 | Acesso decidido no servidor conforme `MODO_ACESSO` | 🟡 | L, P | PR #30 na `main`; produção ainda no modo "assinatura" (achado 1) | Redeploy e conferir `/api/acesso` (Mateus) |
| B4 | T14 | Pagamento, liberação e cancelamento confirmados pelo Asaas e iguais no banco | ❌ | — | `assinaturas` e `asaas_eventos` vazias; nenhum pagamento de teste registrado | Teste no sandbox (passos no [`banco.md`](banco.md)), depois o teste real de R$ 1 em produção (Mateus) |
| B5 | T34 | Período e cobertura real das notas | ⏸️ | L | PR #32 | Merge do #32 (Mateus) |
| B6 | T35 | Premissas e classificações confirmadas | ⏸️ | L | PR #32 | Merge do #32 (Mateus) |
| B7 | T18 | Histórico reabre igual e é isolado | 🟡 | L | Tabela `calculos` com RLS e limite por conta no banco; 0 linhas (sem teste real) | Importar notas com uma conta de teste, reabrir e apagar (agente + Mateus) |
| B8 | T27 | Relatório PDF e planilha com os mesmos centavos | ⏸️ | L | PR #37 (depende do #32); exemplos em `relatorio-t27/` | Merge do #32 e do #37; abrir a planilha no Excel uma vez (Mateus) |
| B9 | T07 | Recuperação de dados verificada | ❌ | — | Supabase no plano **Free** (sem backup diário e pausa após 7 dias sem uso) | Backup manual + uma restauração anotada, ou decidir o plano Pro (Mateus, ver custos abaixo) |
| B10 | LGPD | Política completa, baixar meus dados, aceites por versão, contas inativas | ⏸️ | L | PR #36; SQL `20261128120000_lgpd.sql` não aplicado (tabela `aceites_termos` não existe) | Merge do #36 e rodar o SQL (Mateus) |
| B11 | T21 | Termos e privacidade revisados por advogado | ❌ | C | Textos marcados como rascunho | Revisão jurídica (Mateus) |
| B12 | T04 | Nome e preço finais | ❌ | C | "Calcula Reforma" e R$ 29 são provisórios em `site/src/lib/config.ts` | Decisão (Mateus) |
| B13 | Alíquota | CBS de 2027 conferida depois de 15/12/2026 | ❌ | C | 11,2% provisória em `aliquotas.json` | Atualizar após o Senado ([`manutencao.md`](manutencao.md)) (agente) |

**Pode cobrar quando:** B1 a B13 verdes, com a evidência anotada, e os planos pagos decididos (abaixo).

## Não bloqueiam nenhum dos dois

Google (login e Search Console), cenários avançados (T36), todos os setores no dicionário (T30), integração com ERP, recrutar empresas ou um número mínimo de visitas. A leitura do funil só vale com 100+ visitas por semana ([`funil.md`](funil.md), PR #39).

## Serviços atuais, limites e custos

Nenhum serviço pago foi contratado. Os limites abaixo foram conferidos em 28/11/2026; os preços são aproximados e devem ser conferidos na hora de decidir.

| Serviço | Plano hoje | Limite que importa | Quando muda | Custo aproximado |
|---|---|---|---|---|
| Vercel | **Hobby** (confirmado: a Vercel recusou logs com mais de 1 hora) | O Hobby é só para uso **não comercial**; guarda logs por 1 hora | Antes da primeira cobrança | Pro, US$ 20/mês |
| Supabase | **Free** (organização ReformaImposto) | Pausa após 7 dias sem uso; sem backup diário | Antes de guardar dados de assinantes | Pro, US$ 25/mês |
| Asaas | Sandbox (chave de produção marcada "desativado-produção") | Cobrança real só com a chave de produção | No teste de R$ 1 | Taxa por cobrança, sem mensalidade |
| Sentry | Não ligado | Grátis até um volume pequeno de erros | Quando quiser | Grátis |
| UptimeRobot | Não ligado | Grátis, aviso a cada 5 minutos | Quando quiser | Grátis |

**Decisão pedida (Mateus), antes do Marco B:** contratar Vercel Pro e Supabase Pro. O grátis pode continuar nos planos atuais.

## Como reconferir (para qualquer agente)

1. `mcp__Vercel__list_deployments` (projeto `impostometro`, equipe `orbita16`, target `production`): anote id e commit.
2. Leia em produção: `/api/saude`, `/api/acesso`, `/robots.txt`, `/sitemap.xml`, `/contato`. Confira cabeçalhos de segurança.
3. Liste as variáveis **só pelos nomes** (`filter_project_envs`, sem `decrypt`). Compare a data de criação com a do deploy: variável criada depois do deploy ainda não vale.
4. No banco, só leitura: `list_tables` e `select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public';` para saber quais SQLs foram aplicados. Funil: `select * from funil_diario order by dia desc limit 10;`.
5. Atualize as tabelas acima e o diário. Não marque nada sem evidência.

## Histórico das conferências

| Data | Commit | Quem | Resultado |
|---|---|---|---|
| 28/11/2026 | `6a77373` | agente (T39, PR deste ticket) | Marco A: HTTPS, rastreamento e segurança de cabeçalhos ok; 3 achados (assinatura sandbox à venda, SQL de segurança ausente, contato sem e-mail). Marco B: nada validado em produção ainda |
