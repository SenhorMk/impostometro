# Banco Supabase: criação e registro de buscas

## Estado atual

Projeto `impostometro` criado pelo Mateus na organização separada ReformaImposto (`gevsvuvsekoxuwskixrg`), plano Free, região São Paulo (`sa-east-1`). ID: `uivewvttfvaoqdzltrnc`. URL: `https://uivewvttfvaoqdzltrnc.supabase.co`. O painel confirmou estado Healthy.

A ORBITA ficou somente com `Orbita_Staging` (`etqjqeqqbjrzyyxodntv`), ativo e saudável, após exclusão permanente dos outros dois projetos expressamente confirmada pelo Mateus. Nenhuma configuração do staging foi modificada. Histórico em [preparação](diario/2026-11-25-preparacao-supabase.md).

A conexão MCP continua limitada à ORBITA. Por isso a estrutura foi aplicada pelo editor SQL autenticado do painel, após inspecionar o banco vazio. A aplicação manual **não criou histórico em `supabase_migrations`**. Antes de usar `db push` ou reaplicar migrações, reconciliar o histórico com as duas versões abaixo mediante a CLI oficial e conferir os objetos existentes. Não executar novamente a primeira migração sobre esta tabela.

- `20261125234712_criar_registro_buscas_sem_resultado.sql`: aplicada pelo painel, em transação.
- `20261126010900_restringir_execucao_rls_automatica.sql`: aplicada pelo painel. Revoga execução pública da função administrativa criada pelo Supabase ao habilitar RLS automática. A função retorna `event_trigger`; a revogação preserva a automação administrativa e impede chamadas pelas roles da API.

URL e chave publicável estão configuradas no `.env.local`, ignorado pelo Git, e no ambiente Production da Vercel. A coleta foi validada no site local e no site publicado; a configuração de produção está registrada no [diário de 26/11](diario/2026-11-26-configuracao-producao.md). Nenhuma chave secreta foi versionada.

## Esquema aplicado para o T10

Migração: `supabase/migrations/20261125234712_criar_registro_buscas_sem_resultado.sql`, gerada pela CLI oficial 3.4.0 após consultar seu `--help` e o changelog. Aplicada e verificada no projeto acima.

| Coluna | Uso |
|---|---|
| `id` | Identificador interno da linha, sem vínculo com visitante |
| `termo` | Consulta normalizada, entre 2 e 120 caracteres |
| `versao_tabela` | Versão do banco oficial consultado, como V0073 |
| `data_simulacao` | Data usada na consulta da tabela |
| `criado_em` | Momento da inserção, preenchido pelo banco |

Não há coluna para IP, usuário, e-mail, cookie ou identificador de sessão. O filtro da aplicação descarta contatos explícitos, termos com CPF/CNPJ e sequências longas de números. Ele é preventivo e não reconhece todos os dados pessoais, como nomes próprios; não deve ser descrito como garantia de anonimização.

## Permissões

- RLS habilitada na tabela exposta `public.buscas_sem_resultado`.
- `anon` pode inserir somente termo, versão e data, com limites e vigência da simulação conferidos na política. Não pode escolher ID ou data de criação, ler, alterar ou apagar linhas.
- `authenticated` não recebe permissões na tabela nesta etapa. O registro é feito pelo servidor com a chave publicável, sem encaminhar JWT do visitante.
- Administração e `service_role` podem consultar e manter os registros. A aplicação não usa chave secreta nem chave de serviço para a coleta.
- Um índice em `criado_em` apoia a limpeza. O job `remover_buscas_sem_resultado_antigas` apaga diariamente linhas com mais de 30 dias, por `pg_cron`.

O acesso de inserção sem login é intencional para a calculadora gratuita. RLS e grants impedem leitura pública; a coleta não é uma fonte autenticada nem uma garantia contra spam. Antes de ampliar a coleta, revisar limites de volume e proteção do endpoint conforme o tráfego real.

## Integração no site

Configurar no servidor:

```dotenv
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

As duas variáveis ficam em `site/.env.local` no computador e nas variáveis de ambiente do deploy. Só os nomes vazios entram em `.env.example`. A chave publicável tem permissão restrita pelo banco; não substituí-la por uma chave de serviço no navegador.

Quando dicionário e busca oficial não encontram resultado, o Route Handler agenda a inserção com `after`, sem atrasar a resposta da busca. O módulo `site/src/lib/registro-buscas.ts` normaliza e filtra o termo, envia somente as três colunas permitidas e limita a chamada a dois segundos. Falha de gravação não interrompe a calculadora; o aviso técnico não inclui consulta, chave ou corpo de resposta.

Sem as variáveis, a coleta permanece desativada. Criar o banco não significa que a produção esteja conectada; o estado de configuração e o teste de gravação precisam ser registrados separadamente.

## Verificações executadas e reprodução

1. Criar o projeto na organização confirmada e região São Paulo; aguardar `ACTIVE_HEALTHY`.
2. Inspecionar tabelas, extensões e migrações existentes. Aplicar somente a migração deste projeto pelo MCP; não redefinir nem apagar projetos existentes.
3. Conferir RLS, grants de coluna, política de inserção e job de retenção. Executar teste transacional com `anon`: inserção permitida; leitura, alteração e exclusão negadas. Desfazer os dados de teste.
4. Obter URL e chave publicável do projeto, configurar localmente e executar uma busca inexistente pelo site. Confirmar a linha no banco por acesso administrativo e remover somente essa linha de teste.
5. Conferir que buscas encontradas e termos filtrados não geram linha. Executar advisors de segurança e desempenho e registrar os resultados, corrigindo achados aplicáveis.
6. Registrar o ID do projeto, região, migração, versão, checks e link do PR no diário. Atualizar T05/T10 somente pelos critérios efetivamente atendidos.

## Fontes consultadas

- [Changelog do Supabase](https://supabase.com/changelog.md) e [migração para CLI v3](https://supabase.com/changelog/supabase-cli-v3): a CLI nova usa destino local por padrão; mudanças hospedadas exigem destino e consentimento explícitos.
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [chaves da API](https://supabase.com/docs/guides/getting-started/api-keys): permissões e política são verificadas separadamente; chave publicável não dá autorização de leitura por si só.
- [Next.js after](https://nextjs.org/docs/app/api-reference/functions/after): trabalho de registro após a resposta, conforme a documentação local do Next.js 16.4.6.

Resultados reais: inserção com `anon` aprovada; leitura, alteração, exclusão, data fora da simulação e preenchimento de `criado_em` negados. Inserção com `authenticated` negada. RLS ativa e um job de retenção ativo. Teste de retenção transacional removeu o registro de 31 dias e preservou o recente; rollback desfez o teste. Uma consulta fictícia pelo endpoint local gerou uma linha real confirmada por SQL. O filtro e a exclusão de atividades já encontradas também foram exercitados. O registro técnico de integração permanece identificado como teste e será removido pela retenção automática.

Advisor Center foi consultado com severidades Critical, Warning e Info, sem filtro de categoria. Os avisos de execução pública desapareceram após a revogação; permaneceu somente a mensagem operacional “Grace period started”. A conexão MCP sem acesso ao projeto impede obter relatórios pelo `get_advisors`; não confundir a consulta visual com execução dessa ferramenta.

Skills aplicadas: `supabase:supabase` (0.1.2) e `supabase:supabase-postgres-best-practices` (1.1.1), incluindo referências de RLS e menor privilégio. Os 41 testes locais, lint e build passaram na validação final. Provisionamento, aplicação manual e testes remotos concluídos. Faltam reconciliar o histórico de migrações quando o acesso de administração estiver conectado e configurar o deploy.

## Estado em 26/11/2026 (contas e assinatura)

| Item | Estado |
|---|---|
| Tabelas `perfis`, `empresas`, `assinaturas`, `asaas_eventos` e função `apagar_minha_conta` | ✅ criadas, com RLS (conferido pelo conector) |
| Limpeza diária de `asaas_eventos` (`pg_cron`) | ✅ job 2 |
| Site URL e Redirect URLs do login (Authentication → URL Configuration) | ✅ endereço público e retorno exato `/conta` salvos no painel em 26/11/2026 |
| `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` na Vercel | ✅ configuradas em Production; novo deploy Ready e coleta testada |
| `SUPABASE_SECRET_KEY`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` na Vercel e webhook no Asaas | ⏳ falta (ligam a assinatura) |
| Código das contas e da assinatura em produção | ✅ commit `8362086` publicado; login real e cobrança ainda não validados |
| Tabela `calculos` (histórico, T18) | ✅ existe no banco (conferido pelo conector em 27/11/2026) |
| Tabela `funil_diario`, função `contar_evento` e visão `funil_semanal` (T22) | ✅ existem no banco (conferido pelo conector em 27/11/2026) |

## Contas: login, aceite dos termos e empresa (T13 e T15)

Migração: `supabase/migrations/20261126120000_contas_perfis_e_empresas.sql`. **Aplicada em 26/11/2026** pelo Mateus no SQL Editor do projeto `uivewvttfvaoqdzltrnc`; conferido pelo conector que `perfis` e `empresas` existem com RLS ligada. Como as anteriores, não entrou no histórico de `supabase_migrations`.

| Tabela | O que guarda | Quem acessa |
|---|---|---|
| `perfis` | versão dos termos aceita e quando | só o dono da conta (ler e criar) |
| `empresas` | UF, município (IBGE), regime, CNPJ e razão social opcionais. Uma por conta | só o dono da conta (ler, criar, alterar, apagar) |

- As duas tabelas apontam para `auth.users` com `on delete cascade`: apagar a conta apaga tudo.
- `apagar_minha_conta()` roda como dono da função (`security definer`), mas só apaga a linha de quem chamou (`auth.uid()`). `anon` não pode chamar.
- Conferido num Postgres 17 local com um `auth` simulado: a conta A grava e lê a sua empresa; a conta B não vê nem altera a de A, nem grava em nome de A; `anon` não lê nada; apagar a conta remove perfil e empresa.

### Passo a passo para ligar (no painel do Supabase, sem custo)

1. ~~**SQL Editor:** colar e rodar a migração acima (uma vez).~~ Feito em 26/11/2026. Depois, conferir em Table Editor que `perfis` e `empresas` aparecem com RLS ligada. Como as anteriores, ela não entra no histórico de `supabase_migrations` (ver o aviso no começo deste arquivo).
2. **Authentication → URL Configuration:**
   - Site URL configurado: `https://impostometro-opal.vercel.app`.
   - Redirect URL configurado: `https://impostometro-opal.vercel.app/conta`. Nenhum retorno genérico de prévias da equipe foi liberado no banco de produção.
3. **Authentication → Sign In / Providers → Email:** deixar ligado. O e-mail padrão do Supabase tem limite baixo de envios por hora; para o lançamento, configurar um SMTP próprio (por exemplo, Resend) em Authentication → Emails.
4. **Google (opcional, pode ficar para depois):** criar um cliente OAuth "Aplicativo da Web" no Google Cloud Console, com a URL de retorno que o painel do Supabase mostra em Providers → Google, e colar o Client ID e o Secret ali. Sem isso, o botão do Google mostra erro e o link por e-mail continua funcionando.
5. **Vercel:** as variáveis `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` (as mesmas do T10) ligam o login. O `next.config.ts` repassa as duas para o navegador; a chave publicável pode ficar visível, porque só dá o que as regras acima permitem. **Nunca** colocar a chave secreta (`service_role`) nessas variáveis.
6. Testar: entrar com o próprio e-mail, salvar a empresa, sair, entrar de novo e apagar a conta.

## Assinatura pelo Asaas (T14)

Migração: `supabase/migrations/20261126140000_assinaturas_asaas.sql`. **Aplicada em 26/11/2026** no SQL Editor; `assinaturas` e `asaas_eventos` com RLS ligada e a limpeza diária criada no `pg_cron` (job 2). Ela usa `pg_cron`, que a primeira migração do T10 já ligou.

| Tabela | O que guarda | Quem acessa |
|---|---|---|
| `assinaturas` | ids do cliente e da assinatura no Asaas, status (`pendente`, `ativa`, `atrasada`, `cancelada`, `suspensa`), `valido_ate`, valor e link de pagamento | dono da conta só **lê**; só o servidor (chave secreta) escreve |
| `asaas_eventos` | ids dos avisos do Asaas já processados (para ignorar repetidos), apagados após 60 dias | só o servidor |

Conferido num Postgres 17 local: a pessoa lê a própria assinatura, não consegue se dar acesso (update negado) e não vê a de outra conta.

### Como o dinheiro vira acesso

1. Em `/conta`, a pessoa informa nome e CPF/CNPJ e clica em "Assinar". O site (`POST /api/assinatura`) cria o cliente e a assinatura mensal no Asaas (`billingType: UNDEFINED`, a pessoa escolhe Pix, cartão ou boleto) e manda a pessoa para a página de pagamento do Asaas.
2. O Asaas avisa o site em `POST /api/asaas/webhook`. Regras em `site/src/lib/assinatura.ts`: pagamento confirmado libera até o vencimento + 1 mês + 3 dias; atraso só muda o status; cancelamento vale até o fim do mês pago; estorno ou contestação suspende na hora.
3. `/api/calcular-lote` só calcula para quem tem acesso. A simulação de uma venda continua grátis para todos.
4. Cancelar em `/conta` (`DELETE /api/assinatura`) encerra a recorrência no Asaas. Apagar a conta cancela a assinatura antes.

### Passo a passo para ligar (sandbox primeiro)

1. ~~Rodar a migração acima no SQL Editor do Supabase.~~ Feito em 26/11/2026.
2. Criar uma conta no **sandbox** do Asaas (https://sandbox.asaas.com), gerar a chave da API em Integrações.
3. Ainda no Asaas, em Integrações → Webhooks, criar um webhook:
   - URL: `https://<endereço do site>/api/asaas/webhook`;
   - token de autenticação: uma senha longa inventada (a mesma vai para `ASAAS_WEBHOOK_TOKEN`);
   - eventos: cobranças (`PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`) e assinaturas (`SUBSCRIPTION_DELETED`, `SUBSCRIPTION_INACTIVATED`).
4. Na Vercel (Settings → Environment Variables), sem colocar nada no git:
   - `SUPABASE_SECRET_KEY`: chave secreta do Supabase (Settings → API Keys, `sb_secret_...`);
   - `ASAAS_API_KEY`, `ASAAS_AMBIENTE=sandbox`, `ASAAS_WEBHOOK_TOKEN`.
   Com `ASAAS_API_KEY`, `SUPABASE_URL` e `SUPABASE_SECRET_KEY` presentes e `MODO_ACESSO` vazio ou `assinatura`, a cobrança liga e `/importar` passa a exigir assinatura. Se faltar alguma chave, a importação fica **fechada** (nunca aberta). Para a prévia gratuita, escreva `MODO_ACESSO=previa`. Matriz completa em [`acesso.md`](acesso.md) (T37).
5. Testar no sandbox: assinar, pagar a cobrança pelo painel do sandbox (o Asaas simula o pagamento), conferir que `/importar` libera; cancelar e conferir.
6. **Teste real de R$ 1:** trocar para a chave de produção e `ASAAS_AMBIENTE=producao`, colocar `ASSINATURA_PRECO_CENTAVOS=100`, assinar com o próprio CPF, pagar com Pix, conferir, cancelar e **apagar** `ASSINATURA_PRECO_CENTAVOS` (volta a R$ 29).

**Suposições a confirmar no sandbox** (a rede deste ambiente não alcança o Asaas): endereço do sandbox (`https://api-sandbox.asaas.com/v3`; se mudar, use `ASAAS_URL`), formato da data `AAAA-MM-DD`, e que o link de pagamento vem em `invoiceUrl` da primeira cobrança.

## Histórico de cálculos (T18)

Migração: `supabase/migrations/20261126160000_historico_calculos.sql`. **Ainda não aplicada**: rodar no SQL Editor (não usa `pg_cron` nem extensão nova).

- Tabela `calculos`: origem (`manual` ou `xml`), título, totais em centavos, itens calculados e com erro, as três versões (calculadora, tabelas da calculadora, nossa tabela de alíquotas) e `detalhe` (jsonb, resultado completo, até 5.000.000 bytes).
- Quem grava é o navegador da pessoa logada, com a chave publicável. RLS: cada conta lê, grava e apaga só as próprias linhas; não há update (um cálculo guardado não muda). `usuario_id` é preenchido pelo banco (`auth.uid()`).
- Gatilho `limitar_calculos_por_conta`: no máximo 2.000 cálculos por conta. (Primeiro tentei pôr o limite na própria regra de RLS e o Postgres recusou com "infinite recursion": regra não pode consultar a própria tabela. Por isso o gatilho.)
- Apagar a conta apaga o histórico (`on delete cascade`).

Conferido num Postgres 17 local: grava e lê o próprio; gravar em nome de outra conta é negado; outra conta não vê nem apaga; update negado; `detalhe` acima do limite e origem inválida são recusados; o 2.001º cálculo é recusado com mensagem; `anon` não lê; apagar a conta apaga tudo.

## Funil sem dados pessoais (T22)

Migração: `supabase/migrations/20261126170000_funil_diario.sql`. **Ainda não aplicada**.

- Tabela `funil_diario (dia, evento, total)`: só um contador por dia (horário de Brasília) e etapa. Etapas aceitas: `visita`, `calculo_gratis`, `cadastro`, `assinatura`, `cancelamento`.
- Função `contar_evento(evento)`: soma 1 no contador do dia. `anon` e `authenticated` só podem chamar a função; ninguém da API lê a tabela.
- Para ver: no SQL Editor, `select * from funil_semanal;` (uma linha por semana, etapas lado a lado) ou `select * from funil_diario order by dia desc;`.
- Limitação: como qualquer contador sem login, alguém pode chamar a função à toa e inflar números. Serve para tendência e taxas de conversão, não como número exato.

Conferido num Postgres 17 local: soma por dia, recusa etapa desconhecida (ex.: um e-mail), `anon` e `authenticated` não leem a tabela nem a visão.
