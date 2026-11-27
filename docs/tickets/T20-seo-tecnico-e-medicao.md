# T20 · SEO técnico e medição

| Campo | Valor |
|---|---|
| Status | 🟡 Parcial |
| Épico | E6 Conteúdo e SEO |
| Sprint | S3 |
| Prioridade | P0 |
| Pontos | 2 |
| Depende de | T11 |

## História

Como dono, quero que o Google indexe o site rápido e saber de onde vêm as visitas.

## Critérios de aceite

- [x] Título e descrição por página e dados estruturados de FAQ.
- [x] Sitemap e robots.
- [x] Páginas por setor ("imposto 2027 + atividade"), dados estruturados de aplicação, artigo e trilha de navegação, imagem de compartilhamento e ícone (PR de design e SEO, 26/11).
- [ ] Site cadastrado no Google Search Console.
- [ ] Plausible ou Google Analytics contando visitas e cálculos grátis.

## Entrega e pendências

Sitemap, robots e canônicas implementados no [PR #2](https://github.com/SenhorMk/impostometro/pull/2). `SITE_URL` define o endereço público; prévias e ambientes sem configuração ficam fora da indexação. [Deploy](../deploy.md) descreve a configuração. O T19 inclui artigos e glossário no sitemap automaticamente. Configuração e verificação de produção, Search Console e medição continuam pendentes.

Em 26/11 (design e SEO, [diário](../diario/2026-11-26-design-e-seo.md)): 52 páginas `/imposto-2027/[atividade]` com exemplo calculado pelo porte no build, índice `/imposto-2027`, schema `WebApplication`/`WebSite` na inicial, `Article` e `BreadcrumbList` nos guias, `FAQPage` e `BreadcrumbList` nos setores, `opengraph-image` gerada por código, `icon.svg`, `lastModified` dos guias no sitemap.

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
