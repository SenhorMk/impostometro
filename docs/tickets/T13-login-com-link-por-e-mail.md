# T13 · Validar o acesso real por e-mail e esconder provedores indisponíveis

| Campo | Valor |
|---|---|
| Status | 🟡 Código e SMTP existentes; sessão real pendente |
| Marco | B |
| Prioridade | P0 assinatura |
| Pontos | A estimar após revisar o código existente |
| Depende de | T05, T21 |
| GitHub | A criar |

## História

Como usuário, quero receber meu link de acesso, entrar e retornar à minha conta no domínio correto.

## Estado existente

Supabase, Resend verificado, SMTP e modelos em português foram configurados. Site URL aponta para calculareforma.mkautobots.site e /conta está permitido. Google permanece desabilitado no provedor. O código foi testado com serviços simulados; falta uma sessão completa no serviço real.

## Escopo

- Validar pedido, entrega, abertura do link e sessão no domínio oficial.
- Concluir persistência do aceite, saída e recuperação de sessão.
- Renderizar Google somente se o provedor estiver configurado e validado; não exigir OAuth Google para lançar por e-mail.

## Critérios de aceite

- [ ] Um e-mail solicitado pelo usuário de teste é entregue pelo remetente configurado; registrar entrega e retorno à conta sem publicar token ou link mágico.
- [ ] Aceite dos termos é feito pelo próprio usuário; versão e data ficam gravadas.
- [ ] Link expirado ou reutilizado resulta em orientação útil para solicitar novo acesso.
- [ ] Sair encerra a sessão e uma página de conta sem sessão não exibe dados anteriores.
- [ ] Google desabilitado não aparece como caminho disponível na interface.
- [ ] Apagar a própria conta conserva a confirmação explícita e o comportamento de exclusão documentado; validar com conta descartável autorizada.
- [ ] Nenhuma chave secreta é incluída no navegador ou nas evidências.

## Verificação

Sessão real com usuário de teste, fluxo no celular e computador e falhas de link. Usar ações do dono para aceite e códigos de autenticação.

## Fora do escopo

Obrigar Google, criar contas de terceiros ou aceitar termos em nome do usuário.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [T15](T15-cadastro-minimo-da-empresa.md), [T37](T37-acesso-gratis-previa-e-assinatura.md).

Arquivos ou destinos previstos: `site/src/components/Entrar.tsx`, `site/src/components/Conta.tsx`, `site/src/lib/sessao.ts`, `site/src/lib/supabase-navegador.ts`.

Skills: `supabase:supabase`, `vercel:verification` e, para segredos, `vercel:env-vars`.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
