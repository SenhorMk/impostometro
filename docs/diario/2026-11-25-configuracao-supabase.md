# Banco criado, protegido e conectado ao site local

Data: 25/11/2026, horário de São Paulo. PR: [#4](https://github.com/SenhorMk/impostometro/pull/4).

## Provisionamento e acesso

Mateus concluiu a definição da senha e criação pelo painel. Projeto `impostometro`, ID `uivewvttfvaoqdzltrnc`, organização ReformaImposto, Free, São Paulo. Painel confirmou Healthy. Nenhuma senha foi lida pelo agente.

MCP segue limitado à ORBITA. Foi usado o editor SQL do painel autenticado. Inspeção inicial: zero tabelas em public, extensões padrão e nenhum schema de migrações. A migração `20261125234712_criar_registro_buscas_sem_resultado.sql` foi aplicada em transação. Como foi aplicação manual, o histórico remoto da CLI não foi preenchido: reconciliar antes de usar `db push`, sem reaplicar DDL existente.

O editor usa Monaco: substituir o texto com preenchimento simples pode deixar o restante da consulta anterior. Um teste recebeu erro de sintaxe, sem alteração de dados; a substituição completa por selecionar tudo e colar resolveu. A migração foi conferida pelo resultado e pelos objetos reais, não por uma tentativa de execução.

## Segurança e retenção

- RLS habilitada; anon insere somente três colunas. Teste real inseriu e desfez a linha por rollback.
- SELECT, UPDATE, DELETE, preenchimento de criado_em e data fora da simulação negados a anon. Inserção negada a authenticated.
- Job `remover_buscas_sem_resultado_antigas` ativo, execução diária às 03:17 UTC. O predicado remove linhas com mais de 30 dias; a permanência efetiva pode incluir o intervalo até a próxima execução.
- Teste transacional inseriu linha de 31 dias e linha recente, executou o predicado do job e confirmou 0 antigas e 1 recente; rollback desfez o teste.
- Advisor Center identificou execução pública da função `public.rls_auto_enable()`, criada pelo Supabase ao habilitar RLS automática. A migração `20261126010900_restringir_execucao_rls_automatica.sql`, gerada pela CLI 3.4.0, revogou EXECUTE de public/anon/authenticated. Consulta confirmou função de evento e permissões false/false para roles da API.
- Nova consulta ao Advisor Center com Critical, Warning e Info e todas as categorias: somente mensagem operacional “Grace period started”. Os avisos da função desapareceram. Não foi executado get_advisors, pois o MCP não tem acesso.

## Integração e transparência

URL e chave publicável existentes salvas apenas no site/.env.local ignorado pelo Git. Nenhuma chave secreta usada. Endpoint local consultado com termo fictício: resposta 200, lista vazia, V0073, data 2027-01-01. Consulta administrativa confirmou uma linha real. Atividade encontrada e contato fictício filtrado foram exercitados sem gravar linha. Um registro técnico identificável de integração permanece e será removido pela retenção.

Política de privacidade atualizada com finalidade, campos, retenção e limites do filtro preventivo, sem promessa de anonimização total. Conferida no navegador em desktop e 390 × 844; texto legível sem rolagem horizontal.

## Validação e pendências

41 testes aprovados; lint e build aprovados, incluindo TypeScript. Nenhuma mudança no motor ou nos valores dourados. Build do novo commit será conferido também pela CI.

O registro do T10 está implementado e validado contra banco real pelo site local. Vercel, domínio, login Google, integração de e-mail do produto e bucket XML pertencem às próximas etapas do T05. Nenhuma configuração de produção foi presumida. Reconciliar o histórico de migrações e permitir ReformaImposto na conexão antes de automatizar atualizações do banco.

Skills e fontes: Supabase 0.1.2, Supabase Postgres Best Practices 1.1.1 e verificação do fluxo completo; fontes e esquema em [banco.md](../banco.md). Evidências visuais salvas nos outputs desta conversa. Configuração e limites foram registrados também nos tickets, backlog, decisões e índice.
