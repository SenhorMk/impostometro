# Segurança do site

Revisão "severa" feita em 27/11/2026, antes de abrir a assinatura. Cobre o código da `main`, o PR #6 (histórico e funil, cujas tabelas já estão no banco) e a configuração real do Supabase (lida sem alterar nada). Este arquivo explica **o que foi olhado, o que foi corrigido, o que o Mateus precisa fazer nas contas e o que ficou para depois**.

Como ler as gravidades: **Alta** = alguém consegue tirar dinheiro, acesso ou dados de outra pessoa; **Média** = dá prejuízo ou abuso, mas sem dados de terceiros; **Baixa** = endurecimento, boa prática.

## 1. O que estava bom (não mudou)

- **RLS em todas as tabelas.** Conferido no banco de produção: `perfis`, `empresas`, `assinaturas`, `calculos`, `asaas_eventos`, `funil_diario` e `buscas_sem_resultado` têm RLS ligada e permissões mínimas. Cada conta só lê as próprias linhas; ninguém de fora lê `asaas_eventos`, `funil_diario` ou `buscas_sem_resultado`. A pessoa logada só **lê** a própria assinatura (quem grava é o servidor).
- **Chave secreta só no servidor.** `SUPABASE_SECRET_KEY`, `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` só aparecem em rotas de API. O `next.config.ts` só repassa ao navegador a URL e a chave **publicável** do Supabase. Nenhum segredo no histórico do git (procurado em todos os commits).
- **Login sem senha** (link por e-mail ou Google, com PKCE). As rotas conferem o token com o Supabase (`auth.getUser`), não confiam no que o navegador diz.
- **Webhook com token** comparado em tempo constante.
- **XML lido no navegador**: o arquivo da nota nunca chega ao servidor. O leitor (`fast-xml-parser`) não busca arquivos nem endereços externos, então XXE "clássico" não acontece.
- **Sem CSRF**: as rotas usam `Authorization: Bearer`, não cookie, então outro site não consegue fazer pedidos em nome da pessoa.
- **Dependências**: `npm audit` sem nenhuma vulnerabilidade conhecida (27/11/2026).

## 2. O que foi corrigido neste PR

| # | Gravidade | Problema | Correção |
|---|---|---|---|
| 1 | Alta | **Webhook confiava só no token.** Se o token vazasse (log, print, ex-funcionário), qualquer um mandaria "pagamento confirmado" e liberaria acesso grátis. | Aviso de pagamento confirmado agora é **conferido no próprio Asaas** com a chave da API (`GET /payments/{id}`): a cobrança tem que estar paga e ser daquela assinatura. A data usada é a do Asaas. `site/src/app/api/asaas/webhook/route.ts` |
| 2 | Alta | **Cobrança dupla.** Dois cliques em "Assinar" ao mesmo tempo, ou assinar de novo com uma assinatura atrasada/pendente sem link, criavam uma segunda assinatura no Asaas e a primeira continuava cobrando sem o site saber. | Antes de criar, encerra no Asaas a assinatura antiga que ainda está viva. A gravação só vale se a linha não mudou desde a leitura; quem perde a corrida cancela no Asaas o que acabou de criar. `site/src/app/api/assinatura/route.ts` |
| 3 | Alta | **Apagar a conta sem cancelar a assinatura.** O cancelamento era feito pela tela; chamando o banco direto (ou numa falha no meio) a conta sumia e o Asaas continuava cobrando, sem o site conseguir mais cancelar. | O banco agora **recusa** apagar a conta enquanto a assinatura estiver viva (SQL novo). O cancelamento também cobre o caso "voltou a assinar e a cobrança nova ainda está aberta". |
| 4 | Média | **Aviso repetido ao mesmo tempo** podia ser processado duas vezes (conferia e só depois gravava). | Primeiro **reserva** o id do aviso; só quem reservou processa. Se der erro no meio, solta a reserva para o Asaas reenviar. |
| 5 | Média | **Sem limite de pedidos (rate limit).** Um robô podia martelar `/api/calcular`, a busca, o lote e a assinatura (cada assinatura cria coisas no Asaas). | Limite por minuto por IP (e por conta nas rotas logadas): calcular 60, busca 120, códigos 120, lote 60 por IP e 30 por conta, assinatura 10 por IP e 5 por conta. Responde 429 "espere um minuto". `site/src/lib/limite.ts`. Ver limitação na seção 4. |
| 6 | Média | **Corpo do pedido sem limite de tamanho.** | Cada rota lê no máximo o necessário (calcular 4 KB, assinatura 2 KB, webhook 64 KB, lote 4 MB) contando os bytes de verdade. Responde 413. |
| 7 | Média | **Funil falsificável.** Qualquer visitante podia chamar `contar_evento('assinatura')` com a chave publicável e inflar as vendas no relatório. | No SQL novo, "assinatura" e "cancelamento" só o servidor soma. |
| 8 | Média | **Histórico enchendo o banco.** Até 2.000 cálculos de 5 MB por conta = 10 GB por conta, gravados pelo navegador. | Teto de 100 MB por conta e 30 gravações por minuto, com trava para pedidos simultâneos (SQL novo). |
| 9 | Média | **Tabela de buscas sem resultado aberta para inserir** com a chave publicável (que é pública): dava para encher sem limite. | Teto de 2.000 registros por dia no banco (SQL novo) e no máximo 20 por IP por hora no site. |
| 10 | Média | **"XML bomba" e "zip bomba"** travando o navegador de quem importa (ex.: um .zip de 1 KB que vira 10 GB). | XML com `DOCTYPE`/`ENTITY` é recusado antes de ler (nota fiscal nunca tem). O .zip é conferido pelo índice antes de descompactar: até 10 MB por XML, 2.000 XMLs e 300 MB no total. `site/src/lib/nfe.ts` |
| 11 | Baixa | **Sem cabeçalhos de segurança.** | CSP, HSTS, `X-Frame-Options: DENY` (ninguém põe o site num iframe para enganar cliques), `nosniff`, `Referrer-Policy`, `Permissions-Policy` e sem `X-Powered-By`. `site/next.config.ts` |
| 12 | Baixa | Link de pagamento aceito de qualquer endereço. | Só aceita `https://` do Asaas (`asaas.com` e subdomínios). |
| 13 | Baixa | Validação de entrada: município, número do item, quantidade e unidade sem faixa. | Faixas conferidas em `/api/calcular` e no lote. |
| 14 | Baixa | CI com permissões padrão do GitHub e `.env` fora do `.gitignore` da raiz. | `permissions: contents: read` nos dois workflows; `.env` e `.env.*` ignorados na raiz. |

Testes novos em `site/src/lib/seguranca.test.ts` (limite, corpo grande, link do Asaas, XML bomba, XXE e zip bomba). O SQL novo foi testado num Postgres local (PGlite) com as migrações reais, simulando visitante, conta logada e servidor.

### O que cada cabeçalho faz (resumo)

- **Content-Security-Policy**: lista de onde a página pode carregar scripts e falar com servidores. Se alguém conseguir injetar um `<script src="site-malicioso">`, o navegador bloqueia. Liberados: o próprio site, o Supabase do projeto e o Sentry (PR #6). Nas prévias da Vercel também a barra de comentários (`vercel.live`).
- **Strict-Transport-Security**: o navegador passa a usar só HTTPS no domínio por 2 anos.
- **X-Frame-Options / frame-ancestors**: proíbe colocar o site dentro de outro site.
- **Referrer-Policy**: outros sites só veem o domínio de onde a pessoa veio, não o endereço completo.
- **Permissions-Policy**: câmera, microfone, localização etc. desligados.

## 3. O que o Mateus precisa fazer (também em `PARA-FAZER-MATEUS.txt`)

1. **Rodar o SQL** `supabase/migrations/20261127210000_revisao_seguranca.sql` no SQL Editor do Supabase (pode rodar de novo sem problema). Sem ele, os itens 3, 7, 8 e 9 não valem.
2. **Token do webhook forte**: pelo menos 32 caracteres aleatórios (por exemplo, gerado por um gerenciador de senhas). Nunca colar no chat.
3. **Supabase > Authentication > URL Configuration**: deixar em "Redirect URLs" só os endereços usados (o do site, as prévias do seu time na Vercel e `localhost`). Nada de `*` sozinho.
4. **Supabase > Authentication > Rate Limits**: conferir que o envio de e-mails está limitado (o padrão é baixo; manter).
5. **Verificação em duas etapas (2FA)** nas contas do GitHub, Vercel, Supabase e Asaas. Quem entrar numa delas tem a chave do cofre.
6. **Vercel > projeto > Firewall > Rate Limiting** (se o plano permitir): uma regra para `/api/` com uns 100 pedidos por minuto por IP. É a barreira **global**; a do código vale só por instância.
7. **GitHub > Settings > Branches**: proteger a `main` exigindo a CI verde antes do merge.

## 4. Limitações conhecidas e próximos passos

- **Rate limit na memória.** Cada instância da Vercel conta separado, então um ataque distribuído passa. Resolve com a regra do Firewall (item 6) ou, no futuro, um contador no Upstash/Redis.
- **CSP com `'unsafe-inline'` nos scripts.** O Next precisa de scripts inline; a alternativa com "nonce" obriga todas as páginas a serem geradas a cada visita (mais lento e mais caro). Ainda assim a CSP bloqueia scripts de outros domínios. Futuro: testar o SRI experimental do Next.
- **CAPTCHA no login.** Hoje alguém pode pedir links de acesso para e-mails de terceiros (o Supabase limita a quantidade). Próximo passo sugerido: Cloudflare Turnstile no Supabase (precisa de conta e de uma mudança pequena na tela de entrar).
- **Funil**: um visitante ainda consegue inflar "visita", "cálculo grátis" e "cadastro". Não há dado pessoal envolvido; aceito para manter o funil sem cookies.
- **Histórico gravado pelo navegador**: a pessoa consegue alterar os números do **próprio** histórico. Não afeta ninguém nem a cobrança, mas o histórico não serve como prova.
- **Lote pesado**: um assinante pode mandar 50 notas de 990 itens por pedido. O limite por conta e o tempo máximo da Vercel seguram; se virar problema, limitar o total de itens por pedido (exige mudar o importador).
- **Conflito com o PR #6**: os dois mexem em `site/src/app/api/asaas/webhook/route.ts`. Quem for juntado por último precisa recolocar as 4 linhas do funil (dentro do `if (novo)`, depois do `update`).
