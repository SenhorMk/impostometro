# Preparação do banco e persistência do T10

Data: 25/11/2026. Mateus pediu criar o banco pelo Supabase conectado. Confirmou que quer uma organização diferente de ORBITA e sugeriu nome como “impostoreceita”.

## Inspeção e bloqueios reais

- MCP: listagem retorna apenas ORBITA, com dois projetos ativos e um inativo de outro produto. Não foram alterados.
- Painel autenticado: organização `ReformaImposto` (`gevsvuvsekoxuwskixrg`), Free e sem projetos, já existente ao abrir o painel. Não foi criada pelo agente.
- Formulário de projeto em ReformaImposto: criação desabilitada pelo limite de dois projetos Free ativos da conta, compartilhado entre organizações. O painel apresenta opções de pausar/excluir um projeto ou alterar o plano. Nenhuma dessas ações foi executada.
- Consulta de custo pelo MCP na nova organização: recusada por falta de permissão. O painel tem acesso que a conexão MCP atual não oferece.
- Projeto planejado: `impostometro`, região São Paulo. Nenhum banco foi provisionado ou alterado; falta resolver quota e acesso.

## Trabalho preparado

- Skills Supabase 0.1.2 e Postgres Best Practices 1.1.1 consultadas, com guias de menor privilégio e RLS.
- Changelog consultado antes da implementação, incluindo alterações da CLI v3. CLI 3.4.0 fixada após consulta ao registro npm e `migration new --help`.
- Migração criada pela CLI: `20261125234712_criar_registro_buscas_sem_resultado.sql`. Tabela com termo, versão, data e criação; inserção anônima restrita por coluna e RLS, sem leitura pública; retenção diária de 30 dias com pg_cron. SQL ainda não aplicado nem testado em banco real.
- Módulo do servidor preparado para enviar somente os campos permitidos, com chave publicável, filtro preventivo e limite de dois segundos. Nenhuma chave de serviço necessária para a coleta.
- Registro agendado por `after` apenas quando dicionário e tabelas oficiais não encontram resultado. Sem configuração, permanece desativado; falha de registro não derruba a busca.
- `.env.example` atualizado com nomes vazios. Nenhum segredo ou arquivo de configuração com chave foi adicionado ao Git.
- Guia em [banco.md](../banco.md) registra o esquema, permissões, configuração e verificações que faltam executar no destino.

## Validação executada

`npm test`: 41 testes aprovados, incluindo dois novos para normalização e descarte preventivo de contatos/documentos. `npm run lint` e `npm run build`: aprovados. O build também executou a verificação de tipos.

Esses resultados verificam a preparação de código; não comprovam RLS, job de retenção nem escrita real no Supabase. Esses checks dependem de criar e conectar o projeto.

## Limpeza autorizada e estado final desta etapa

Após a inspeção inicial acima, Mateus pediu excluir os dois projetos da ORBITA e confirmou expressamente a remoção permanente, incluindo bancos. A confirmação foi obtida imediatamente antes da ação, conforme a política do controle do navegador.

- Excluído: `orbita-banca-2026-disposable` (`nbjrvxbjfgkneebmpsmw`).
- Excluído: `Orbita_Production` (`akudhaziungumdowzdkq`).
- Preservado: `Orbita_Staging` (`etqjqeqqbjrzyyxodntv`), único projeto restante na listagem ORBITA; API retornou `ACTIVE_HEALTHY` após as duas exclusões. Nenhuma configuração dele foi alterada.

O formulário de criação em ReformaImposto voltou a permitir um projeto Free. Ficou preparado com nome `impostometro`, região São Paulo, Data API habilitada, grants automáticos desabilitados e RLS automática habilitada. A criação ainda não foi enviada: a entrada da nova senha e o envio precisam ser realizados pelo Mateus, conforme a política de credenciais do navegador. Não houve geração nem registro de senha.

## Próximo passo obrigatório

Mateus define a senha diretamente no formulário preparado e cria o projeto. A conexão Supabase também precisa permitir ReformaImposto para aplicar e verificar via MCP; o acesso atual permanece limitado à ORBITA. Depois: aguardar saúde do projeto, inspecionar banco vazio, aplicar migração, testar permissões/retenção e integrar o site. T05 e o critério de persistência do T10 permanecem parciais. Entrega de código e documentação na [PR #4](https://github.com/SenhorMk/impostometro/pull/4).

## Continuação concluída

O Mateus criou o projeto e o banco foi configurado e validado. Este arquivo preserva o histórico da preparação; estado atual e evidências em [Configuração Supabase](2026-11-25-configuracao-supabase.md).
