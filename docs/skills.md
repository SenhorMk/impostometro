# Skills para construir e manter o projeto

Pesquisa realizada em 25/11/2026 no catálogo oficial [`openai/skills`](https://github.com/openai/skills/tree/main/skills/.curated), por `skill-installer/scripts/list-skills.py --format json`, e no catálogo de skills já disponível nesta sessão do Codex. A seleção considera o projeto atual: Next.js 16, React, TypeScript, Vercel, Supabase planejado e cálculos tributários portados.

Uma skill orienta o trabalho do agente. Ela não instala o serviço, não conecta contas e não certifica regras tributárias. A disponibilidade muda entre ambientes. Consulte novamente o catálogo antes de instalar ou executar uma skill que não estiver presente.

## Disponíveis neste ambiente

| Skill | Quando usar | Tickets | Uso nesta entrega |
|---|---|---|---|
| `skill-installer` | Pesquisar o catálogo oficial e instalar uma skill quando solicitado | todos | Consulta do catálogo; nenhuma instalação adicional |
| `humanizer` | Revisar clareza e remover linguagem artificial sem mudar os fatos | T19, T21 e documentação | Revisão editorial dos guias e documentação |
| `vercel:react-best-practices` | Revisar componentes, acessibilidade, imports e custo de renderização | mudanças React | Revisão das páginas e componentes do T19 |
| `vercel:verification` | Conferir a jornada completa e registrar evidências | mudanças de fluxo | Índice de guias → artigo/glossário → calculadora |
| `vercel:deployments-cicd` e `vercel:vercel-cli` | Inspecionar deploys, configuração e integração contínua | T05, T06 | Reservadas para a etapa de deploy |
| `vercel:env-vars` | Configurar variáveis por ambiente e conferir ausências | T05, T13, T14 | Referência para a futura configuração de produção |
| `supabase:supabase` | Trabalhar com banco, Auth, Storage e políticas de acesso | T05, T08, T13, T15–T18 | Reservada para a integração Supabase |
| `supabase:supabase-postgres-best-practices` | Projetar e revisar consultas, índices e esquema | T08, T15, T18 | Reservada para o banco |
| `domain-modeling` | Esclarecer termos do domínio e registrar ADRs ou CONTEXT.md | mudanças de modelo | Disponível; não necessária ao conteúdo desta entrega |
| `pdf:pdf` | Criar e conferir visualmente relatórios em PDF | T27 | Disponível para depois do MVP |

As skills de Vercel e Supabase acima são fornecidas pelos plugins conectados ao ambiente. Seus nomes são os identificadores do catálogo local; não são nomes para instalar pelo catálogo `openai/skills`. Os `SKILL.md` das skills de React e verificação consultados vieram do pacote Vercel 0.54.1. `humanizer` consultada: versão 3.0.0. `skill-installer`: skill de sistema do Codex.

## Encontradas no catálogo oficial, sem instalação nesta entrega

| Skill e fonte | Utilidade para este repositório | Momento sugerido |
|---|---|---|
| [playwright](https://github.com/openai/skills/tree/main/skills/.curated/playwright) | Automatizar regressões reais de navegação, formulário e resultado | T10, T11, T13, T16 |
| [playwright-interactive](https://github.com/openai/skills/tree/main/skills/.curated/playwright-interactive) | Investigar páginas visualmente em uma sessão interativa | ajustes de interface |
| [gh-fix-ci](https://github.com/openai/skills/tree/main/skills/.curated/gh-fix-ci) | Investigar falhas dos checks de PR e propor correção com evidências | T06, T09 |
| [gh-address-comments](https://github.com/openai/skills/tree/main/skills/.curated/gh-address-comments) | Tratar comentários de revisão e acompanhar pendências de PR | revisões do Mateus |
| [security-best-practices](https://github.com/openai/skills/tree/main/skills/.curated/security-best-practices) | Revisar práticas de segurança de TypeScript e do servidor | antes de login, cobrança e XML |
| [security-threat-model](https://github.com/openai/skills/tree/main/skills/.curated/security-threat-model) | Mapear confiança, dados e ameaças de upload, armazenamento e acesso | T13–T18 |
| [sentry](https://github.com/openai/skills/tree/main/skills/.curated/sentry) | Consultar erros e evidências de produção quando a integração existir | T07 |

Para navegador, esta entrega usa as ferramentas integradas de browser do Codex, sem adicionar Playwright como dependência do produto. Não há benefício em instalar outra skill de deploy agora: o ambiente já oferece as skills Vercel pertinentes.

## Como manter esta seleção

Preparação do banco: `supabase:supabase` e `supabase:supabase-postgres-best-practices` aplicadas ao esquema, grants, RLS e verificação planejada. Changelog e guias atuais consultados; CLI 3.4.0 fixada. Uso e limites no [registro Supabase](diario/2026-11-25-preparacao-supabase.md). Essas skills não removem a quota Free nem ampliam a permissão da conexão.

Aplicação no T10: `vercel:react-best-practices` foi usada para revisar o formulário, cancelamento de requisições e separação do banco no servidor. `vercel:verification` orientou o fluxo busca → API → tabela → escolha → cálculo. Evidências e limites estão no [diário do T10](diario/2026-11-25-merges-e-t10.md). Nenhuma skill nova foi instalada.

- Adicione skills somente quando houver uma tarefa concreta. Registre fonte, motivo e disponibilidade.
- Antes de usar uma nova skill, leia seu `SKILL.md` e confira compatibilidade com o ambiente. Siga a autorização já dada pelo usuário e as regras de `AGENTS.md`.
- Registre no diário quais skills foram usadas de fato. Uma skill listada como candidata não representa auditoria executada.
- Para legislação e cálculo, confirme fontes primárias, mantenha a paridade do motor e solicite revisão contábil quando houver parceiro. Skills de escrita e programação não substituem essa revisão.
