# T15 · Validar empresa e isolamento entre contas reais de teste

| Campo | Valor |
|---|---|
| Status | 🟡 Formulário e tabela existentes; integração a validar |
| Marco | B |
| Prioridade | P0 assinatura |
| Pontos | A estimar após revisar o código existente |
| Depende de | T13 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/16 |

## História

Como usuário, quero cadastrar a empresa usada nas minhas análises e ter certeza de que outra conta não vê nem altera meus dados.

## Estado existente

Há formulário, tabela empresas e políticas RLS. Escopo inicial: uma empresa por conta. Aproveitar código e migração existentes.

## Escopo

- Conferir UF, município, regime e campos opcionais com persistência real.
- Aplicar o escopo atendido na interface e no servidor, sem transformar regime incompatível em cálculo regular silenciosamente.
- Testar separação de dados com duas contas descartáveis autorizadas.

## Critérios de aceite

- [ ] Dados válidos persistem após sair e entrar; dados inválidos apresentam erro compreensível.
- [ ] Outra conta não lê, altera nem grava empresa em nome da primeira, inclusive via requisição direta.
- [ ] Escopo de regime e tipos de documento suportados é apresentado antes da importação.
- [ ] CNPJ e demais campos só são exigidos quando necessários à tarefa ou ao pagamento, com finalidade explicada.
- [ ] Excluir conta segue a política documentada, sem deixar dados de outra conta acessíveis.

## Verificação

Duas contas reais de teste e requisições autorizadas/negadas; registrar evidências sem dados pessoais.

## Fora do escopo

Múltiplas empresas por usuário, escritório contábil ou suporte ao Simples/MEI nesta entrega.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [T34](T34-periodo-e-integridade-das-notas.md), [T37](T37-acesso-gratis-previa-e-assinatura.md).

Arquivos ou destinos previstos: `site/src/components/Conta.tsx`, `site/src/lib/contas.ts`, `supabase/migrations/20261126120000_contas_perfis_e_empresas.sql`.

Skills: `supabase:supabase`, `vercel:verification` e, para segredos, `vercel:env-vars`.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
