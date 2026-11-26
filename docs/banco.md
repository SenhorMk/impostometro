# Banco Supabase: criação e registro de buscas

## Estado da preparação

O Mateus autorizou criar o banco e escolheu uma organização diferente de ORBITA, sugerindo um nome como “impostoreceita”. O painel autenticado já apresenta a organização separada `ReformaImposto` (`gevsvuvsekoxuwskixrg`), Free, sem projetos. Ela foi escolhida como destino técnico. Nenhum projeto novo foi criado nesta preparação. A limpeza da ORBITA, autorizada separadamente, está registrada abaixo.

O limite Free impedia a criação inicialmente. Após confirmação explícita do Mateus, foram excluídos permanentemente `orbita-banca-2026-disposable` (`nbjrvxbjfgkneebmpsmw`) e `Orbita_Production` (`akudhaziungumdowzdkq`), incluindo seus bancos. O painel e a API confirmaram que somente `Orbita_Staging` (`etqjqeqqbjrzyyxodntv`) permaneceu na ORBITA; a API retornou `ACTIVE_HEALTHY`. Nenhuma configuração do staging foi modificada.

A criação em ReformaImposto agora está disponível no plano Free. O formulário foi preparado com nome `impostometro`, São Paulo, Data API habilitada, grants automáticos desabilitados e RLS automática habilitada. Falta o Mateus definir a senha diretamente no painel e enviar o formulário: a política do controle do navegador exige intervenção do usuário para entrada de credenciais novas. Nenhuma senha foi gerada, lida ou registrada pelo agente.

A conexão MCP continua limitada à ORBITA e recusou a consulta de custo para ReformaImposto por falta de permissão. Será necessário autorizar essa organização na conexão para aplicar e verificar o SQL pelo MCP.

Região planejada: São Paulo (`sa-east-1`). Nome técnico do projeto: `impostometro`, que acompanha o repositório e não decide o nome público do produto (T04). Conferir custo informado pelo Supabase e obter concordância para qualquer valor não zero antes de criar. Não pausar projetos ORBITA sem autorização específica do Mateus.

## Esquema preparado para o T10

Migração: `supabase/migrations/20261125234712_criar_registro_buscas_sem_resultado.sql`, gerada pela CLI oficial 3.4.0 após consultar seu `--help` e o changelog. A migração ainda não foi aplicada a um banco remoto.

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

## Aplicar e verificar no destino escolhido

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

Skills aplicadas: `supabase:supabase` (0.1.2) e `supabase:supabase-postgres-best-practices` (1.1.1), incluindo referências de RLS e menor privilégio. Os 41 testes locais, lint e build passaram nesta preparação. Provisionamento, aplicação do SQL e testes remotos continuam pendentes da criação com credencial pelo titular e do acesso à organização; o esquema não está validado em banco real.
