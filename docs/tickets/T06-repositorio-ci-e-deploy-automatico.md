# T06 · Repositório, CI e deploy automático

| Campo | Valor |
|---|---|
| Status | 🟡 Parcial |
| Épico | E1 Infraestrutura |
| Sprint | S1 |
| Prioridade | P0 |
| Pontos | 3 |
| Depende de | T05 |

## História

Como time, quero que cada mudança aprovada vá para o ar sozinha, para lançar rápido sem mexer no servidor na mão.

## Critérios de aceite

- [x] Repositório no GitHub com o projeto Next.js + TypeScript.
- [x] GitHub Actions roda lint, testes, tipos e build, compila a imagem oficial e compara porte × oficial (`.github/workflows/`).
- [ ] Push na `main` publica o site na Vercel sozinho (falta ligar a Vercel ao repositório).
- [x] ~~Motor publicado no Fly.io pelo Actions~~ → não existe mais motor separado.
- [x] Segredos fora do código (só `.env.example` versionado).

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
