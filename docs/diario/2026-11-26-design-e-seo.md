# 26/11/2026 · Design, animações e SEO da página inicial

## Escopo

Pedido do Mateus: melhorar o SEO e o design do site, com referências de páginas que convertem bem, animações, explicações visuais, imagens e vídeo, sem pesar no celular. A revisão de segurança vem depois, em outro trabalho.

## Skills e referências

- Busca no catálogo de skills (landing page, SEO, motion, conversão, web design): nenhuma skill nova encontrada.
- Usadas: `design:design-critique` (crítica da tela atual em `telas-site/landing-computador.png`), e os princípios de `design:ux-copy` e `design:accessibility-review` nos textos e contrastes.
- Referências de conversão consultadas: guias de 2026 de páginas SaaS (Userpilot, Veza Digital, Swipe Pages, Magic UI) e as calculadoras concorrentes da reforma (Conta Azul, InfinitePay, Omie, Agilize, Débit, Contábeis). Nenhuma marca ou visual foi copiado.

O que a crítica apontou e o que foi feito:

| Problema na tela antiga | Mudança |
|---|---|
| A melhor prova ("conferido em 1.519 casos") ficava escondida numa lista | Faixa de provas logo abaixo da calculadora, só com números verificáveis (sem depoimento inventado) |
| "Como funciona" só com texto | Demonstração animada de 12 s feita com CSS (digita "pizzaria", aperta o botão, o resultado sobe). Não é arquivo de vídeo: pesa quase nada |
| "O que muda" em três cartões de texto | Linha do tempo visual 2026–2033 (barras de ICMS/ISS saindo e IBS entrando), com a fonte (EC 132/2023) |
| Exemplo da "conta aberta" com números digitados à mão | A conta em blocos (valor × alíquota × parte que se paga = CBS), **calculada pelo porte no build** |
| Nenhum caminho para quem busca pelo próprio setor | Cartões de 12 setores na inicial e 52 páginas `/imposto-2027/[atividade]` |
| Guias sem destaque na inicial; menu escondido no celular | Seção de guias e link "Guias" no cabeçalho do celular |

## Implementação

- `site/src/lib/exemplos.ts`: chama `lib/motor.ts` com `"use cache"` para gerar os exemplos no build (R$ 1.000 em São Paulo, 01/01/2027). Regra 3 cumprida: nenhum número é digitado; se o porte não calcular, a página mostra "não calculado".
- `site/src/components/inicio/`: `DemoAnimada`, `LinhaDoTempo`, `ContaAberta`, `Setores`.
- `site/src/app/imposto-2027/`: índice agrupado pela redução que o porte devolveu e uma página por atividade, com valores, alíquota e fonte, fundamento legal, códigos, versões e memória de cálculo oficial.
- Animações só em CSS (`globals.css`): aparecer ao rolar (`animation-timeline: view()`, navegador antigo simplesmente mostra), barras crescendo, pulso e flutuação. Tudo desligado para quem pede "reduzir movimento". Nenhuma biblioteca nova e nenhum JavaScript novo no navegador: os componentes novos são de servidor.
- SEO: `WebApplication` e `WebSite` na inicial, `Article` + `BreadcrumbList` nos guias, `FAQPage` + `BreadcrumbList` nos setores, `opengraph-image.tsx` (imagem do WhatsApp/LinkedIn gerada no build), `icon.svg`, `twitter:card`, sitemap com setores e `lastModified` dos guias. `DadosEstruturados` escapa `<` no JSON-LD.

## Comandos e resultados

```bash
cd site
npx next typegen && npx tsc --noEmit   # sem erros
npm run lint                           # sem erros
npm test                               # porte e libs
npm run build                          # 52 páginas de setor estáticas
```

Teste visual com Playwright (Chromium), computador 1366 px e iPhone 13 (390 px), com e sem animação: sem rolagem horizontal; telas em `/mnt/project-files/telas-site/` (`*-v2.png`). Exemplo conferido: restaurante, R$ 1.000 em SP = R$ 67,80, igual ao resultado da calculadora na tela antiga.

## Limitações

- Revisão contábil dos textos novos pendente (como nos demais guias).
- Sem imagens geradas por IA: o ambiente não tem API de imagem, e ilustrações em SVG/CSS são mais leves. Fotos reais podem entrar depois, se o Mateus quiser.
- `docs/backlog.md`, `docs/decisoes.md` e o índice do diário não foram mexidos para não conflitar com o PR #6; atualizar depois do merge dele.
- Search Console e medição continuam dependendo do domínio (T04/T05).
