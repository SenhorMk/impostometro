# Documentação do projeto

Comece pelo [guia de agentes](../AGENTS.md), consulte o [backlog](backlog.md) e abra o [ticket](tickets/README.md) antes de programar. Os documentos descrevem o estado das branches de trabalho; funcionalidades em PR não estão publicadas automaticamente.

| Documento | Conteúdo |
|---|---|
| [Plano de implementação](plano-implementacao.md) | Ordem dos tickets, marcos gratuito e pago, dependências e evidências |
| [Tickets](tickets/README.md) | Histórias, critérios de aceite, dependências e status |
| [Arquitetura](arquitetura.md) | Componentes, fluxo de cálculo e vocabulário técnico |
| [Decisões](decisoes.md) | Escolhas e seus motivos |
| [Skills](skills.md) | Pesquisa de skills, disponibilidade e aplicação por ticket |
| [Conteúdo editorial](conteudo.md) | Fontes, rotas e manutenção dos cinco artigos e glossário |
| [Busca](busca.md) | Dicionário, consulta oficial, vigências, API e limites |
| [Banco](banco.md) | Preparação Supabase, esquema, permissões e bloqueios de provisionamento |
| [Monitoramento e backup](monitoramento.md) | Sentry, `/api/saude`, alerta de site fora do ar, backup e restauração |
| [Checklist de lançamento](lancamento.md) | O que precisa estar pronto antes de abrir a assinatura |
| [Diário de desenvolvimento](diario/README.md) | Histórico das entregas, evidências e pendências |
| [Deploy](deploy.md) | Configuração de produção e indexação |
| [Manutenção](manutencao.md) | Atualização do motor, tabelas e atividades |
| [Estratégia da assinatura](estrategia-assinatura.md) | Pesquisa de referências internacionais, proposta paga e plano de validação comercial |
| [Segurança](seguranca.md) | Revisão de segurança, o que foi corrigido, tarefas nas contas e limitações |
| [Acesso](acesso.md) | Quem pode usar o quê: simulação grátis, prévia, assinatura e `MODO_ACESSO` (T37) |

## Fluxo de uma entrega

1. Leia o ticket e suas dependências. Registre o escopo e as suposições no diário da entrega.
2. Escolha as skills pertinentes em `skills.md`. Leia o `SKILL.md` disponível no ambiente antes de usá-lo. Registre versão ou localização da fonte consultada quando possível.
3. Implemente na branch de trabalho e mantenha código, fontes e documentação juntos. As regras do motor e os testes dourados continuam protegidos por `AGENTS.md`.
4. Execute as verificações adequadas. Anote comandos, resultados e limites reais: tentativa não é aprovação e revisão automatizada não equivale à revisão de contador.
5. Atualize o ticket, o índice de tickets, o backlog e o diário. Atualize decisões, arquitetura e guias operacionais quando o comportamento mudar.
6. Abra PR com escopo, evidências e pendências. Mateus revisa e decide o merge. Depois da publicação, registre URL, commit e verificações de produção.

O histórico do Git preserva o detalhe de cada alteração; o diário explica o que a entrega permite fazer e o que ainda precisa ser conferido. Não registre segredos, dados de clientes ou credenciais nos documentos.
