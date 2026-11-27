# Configuração de produção: Vercel e Supabase

Data: 26/11/2026. Pedido: configurar o Calcula Reforma na Vercel e no Supabase.

## Alterações aplicadas

O projeto Vercel `impostometro` pertence à equipe Orbita (`orbita16`, `team_BMzyyPUeOvod4KqRTvEgAovH`). ID do projeto: `prj_j8LZNLgUGOgeuN0ZPa2ITPIgr9Qj`. Produção: <https://impostometro-opal.vercel.app>. A origem aponta para `SenhorMk/impostometro`, raiz `site`.

Foram adicionadas `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` em Production, como Config. A chave é publicável. `ASAAS_API_KEY` já existia como Secret e foi preservada. Nenhuma chave secreta foi exposta ou incluída nesta entrega.

No Supabase `uivewvttfvaoqdzltrnc`, organização ReformaImposto, o Site URL foi definido como `https://impostometro-opal.vercel.app` e a lista de retornos recebeu somente `https://impostometro-opal.vercel.app/conta`.

O [deploy de produção](https://vercel.com/orbita16/impostometro/EwEji29SvDFSSd9xsFK5dfZtdTUy), commit `8362086`, ficou Ready. A Vercel exigiu código por e-mail antes da publicação; o Mateus concluiu a verificação diretamente no painel.

## Verificação

| Verificação | Resultado |
|---|---|
| Página inicial, `/entrar`, `/conta`, `/robots.txt`, `/sitemap.xml` | HTTP 200 |
| Configuração reconhecida em `/entrar` | formulário de login exibido |
| Cálculo de exemplo por `POST /api/calcular` | HTTP 200, `ok: true`, `CALCULO_SIMULADO` |
| Busca fictícia por `/api/busca-oficial` | HTTP 200, nenhum resultado; uma gravação confirmada por SQL no banco |
| Leitura da tabela de buscas com chave publicável, sem sessão | HTTP 401, negada |
| Sete tabelas públicas | RLS habilitada em todas; isso não substitui testar cada política |
| Jobs de retenção de buscas e eventos Asaas | ambos ativos |
| Provedores de login | e-mail habilitado, Google desabilitado |
| Confirmação de e-mail / login anônimo | confirmação habilitada / anônimo desabilitado |

O termo fictício `teste tecnico deploy codex novembro` foi gravado em 26/11/2026 às 20:06:51 UTC. Ele permanece sujeito à retenção de 30 dias. Não contém contato nem identificador de usuário. Nenhuma conta foi criada e nenhum e-mail de login do produto foi disparado.

## Pendências

- Configurar SMTP próprio. O painel informa uso dos modelos padrão e exige SMTP próprio para editar os modelos de e-mail.
- Configurar credenciais OAuth do Google, se esse método entrar no lançamento.
- Completar Asaas: confirmar ambiente, configurar webhook e token e testar em sandbox antes de acrescentar a chave secreta do Supabase. A cobrança não foi ativada nesta entrega.
- Validar login real, gravação da empresa, saída e retorno com o e-mail do dono após preparar o serviço de envio.
- Decidir o domínio do produto. `SITE_URL` continua ausente; `robots.txt` bloqueia indexação, conforme o comportamento previsto para o endereço provisório.
- Reconciliar o histórico de migrações antes de automatizar mudanças do banco. A tabela `supabase_migrations.schema_migrations` não existe.

## Acesso e fontes

O conector Supabase lista somente ORBITA; este projeto foi inspecionado pelo painel autenticado. A conexão Vercel retornou 403, inicialmente na equipe `kakau0301-3406` e depois na equipe correta `orbita16`. Os links de autorização retornaram expiração antes do prazo informado. A configuração foi concluída no painel para as etapas acima, sem ampliar permissões do conector.

Skills: `supabase:supabase`, `vercel:vercel-cli`, `vercel:env-vars`, `computer-use:computer-use` e `humanizer:humanizer`. Referência oficial: [retornos do Supabase Auth](https://supabase.com/docs/guides/auth/redirect-urls). Não houve mudança de código da aplicação ou do motor; a verificação foi feita contra o deploy real, sem repetir os testes do porte.
