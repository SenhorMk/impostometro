# T21 · Publicar identidade contato e informações de uso verdadeiras

| Campo | Valor |
|---|---|
| Status | 🟡 Textos existentes; revisão pendente |
| Marco | A |
| Prioridade | P0 gratuito |
| Pontos | A estimar após revisar o código existente |
| Depende de | nenhum bloqueio técnico anterior |
| GitHub | A criar |

## História

Como visitante, quero saber quem mantém a ferramenta, como meus dados são usados e como entrar em contato para decidir se confio no site.

## Estado existente

Há termos e privacidade em rascunho, aviso não oficial e atribuição MIT. A operação agora envolve Supabase, Vercel, Resend e, quando ativado, Asaas. Não alegar revisão jurídica inexistente.

## Escopo

- Atualizar os textos para a operação real e o domínio público.
- Criar ou completar apresentação e contato com dados fornecidos pelo dono e canal funcional, sem inventar identidade legal.
- Explicar arquivos lidos no navegador, dados enviados para cálculo, histórico, retenção, exclusão e serviços envolvidos.

## Critérios de aceite

- [ ] Termos e privacidade acessíveis no rodapé e no cadastro, sem datas ou fornecedores incompatíveis com a implementação.
- [ ] Informação de contato real funciona; se faltar dado do dono, registrar o campo exato sem publicar placeholder.
- [ ] Licença MIT e aviso de que a ferramenta não é do governo permanecem em todas as páginas aplicáveis.
- [ ] Texto distingue resultado simulado, classificação confirmada pelo usuário e limites de uso; não promete economia fiscal ou substituição do contador.
- [ ] A versão aceita dos documentos é registrada; alterações relevantes têm data e histórico.
- [ ] Manter a pendência de revisão jurídica externa explicitamente registrada, sem marcar como concluída nem condicionar esta tarefa à contratação de um serviço não autorizado.

## Verificação

Conferir links, conteúdo e contato no domínio real; comparar declarações de dados com os fluxos de conta, importação e histórico.

## Fora do escopo

Emitir parecer jurídico, inventar CNPJ, publicar endereço pessoal sem autorização ou contratar revisão paga.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [T13](T13-login-com-link-por-e-mail.md), [T33](T33-site-claro-e-confiavel.md).

Arquivos ou destinos previstos: `site/src/app/termos/page.tsx`, `site/src/app/privacidade/page.tsx`, `site/src/lib/contas.ts`.

Skills: as pertinentes de [`docs/skills.md`](../skills.md), consultadas antes da execução.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
