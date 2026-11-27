# T20 · Publicar o domínio oficial com indexação verificável

| Campo | Valor |
|---|---|
| Status | 🟡 Configuração parcial; produção a conferir |
| Marco | A |
| Prioridade | P0 gratuito |
| Pontos | A estimar após revisar o código existente |
| Depende de | T05 |
| GitHub | A criar |

## História

Como visitante, quero encontrar o site pelo Google e abrir o endereço correto, para usar uma ferramenta identificável e consistente.

## Estado existente

O domínio calculareforma.mkautobots.site responde por HTTPS. SITE_URL foi salva na Vercel, mas a última verificação de robots.txt ainda retornou Disallow: /. O redeploy exigiu verificação de identidade. Código de sitemap e canônicas já existe; completar e verificar, sem reimplementar.

## Escopo

- Concluir o deploy no projeto correto e conferir SITE_URL somente em Production.
- Conferir canônicas, sitemap, robots, metadados e URLs compartilhadas no domínio autorizado.
- Verificar a propriedade no Search Console quando o acesso do dono estiver disponível e registrar a submissão do sitemap.

## Critérios de aceite

- [ ] Registrar URL, commit, deploy e resposta HTTPS do domínio oficial.
- [ ] Na produção, robots permite rastrear as páginas públicas e mantém as rotas privadas/API fora do sitemap.
- [ ] Sitemap contém somente URLs públicas canônicas do domínio escolhido, com resposta válida.
- [ ] HTML da página inicial e de um guia não contém noindex indevido e usa a canônica correta.
- [ ] Prévia e desenvolvimento continuam fora da indexação.
- [ ] Registrar a verificação do Search Console ou o impedimento de acesso específico; não confundir sitemap enviado com indexação garantida.

## Verificação

Inspecionar HTTP e HTML do deploy real; conferir inicial, guia, entrar, robots e sitemap. Não testar só localhost.

## Fora do escopo

Prometer posição no Google, contratar ferramenta SEO ou produzir novas páginas; o conteúdo fica em T30.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [T05](T05-colocar-no-ar-vercel-e-supabase.md), [T06](T06-repositorio-ci-e-deploy-automatico.md), [T30](T30-conteudo-util-e-divulgacao-organica.md).

Arquivos ou destinos previstos: `site/src/lib/seo.ts`, `site/src/app/robots.ts`, `site/src/app/sitemap.ts`, `docs/deploy.md`.

Skills: `vercel:env-vars`, `vercel:deployments-cicd` e `vercel:verification`.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
