# T40 · Cumprir a LGPD: política completa, registro das operações e canal do titular

| Campo | Valor |
|---|---|
| Status | 🟡 Código em PR; decisões do Mateus e revisão jurídica pendentes |
| Marco | A (gratuito) e B (assinatura) |
| Prioridade | P0 assinatura |
| Pontos | 3 |
| Depende de | T21 (textos), revisão de segurança (PR #28) |
| GitHub | https://github.com/SenhorMk/impostometro/issues/33 |

## História

Como cliente, quero saber exatamente quais dados meus o site trata, por quê, por quanto tempo, com quem e como pedir algo, para confiar no serviço.

## Escopo

- Inventário único dos tratamentos em `site/src/lib/privacidade.ts`, usado pela política e pelo "Baixar meus dados".
- Política de privacidade com base legal, finalidade, retenção, local e operadores de cada dado; direitos; incidentes; armazenamento no navegador; idade; mudanças.
- `docs/lgpd.md`: avaliação, registro das operações (art. 37), como atender pedidos, plano de incidente (art. 48) e regra para quem mexe no projeto.
- Controlador (`CONTROLADOR_NOME`) e canal do encarregado (`CONTATO_EMAIL`) vindos da Vercel, sem inventar identidade.

## Critérios de aceite

- [x] Cada tratamento tem finalidade, base legal, retenção e local na política e no registro (teste em `privacidade.test.ts`).
- [x] Operadores e transferência internacional descritos.
- [x] Direitos do art. 18 listados com o caminho para exercer cada um e prazo de resposta.
- [x] Plano de resposta a incidente documentado.
- [x] Sem `CONTROLADOR_NOME`, a página não publica placeholder: diz que a identificação vem antes das contas.
- [ ] 🧑 Decisão do T40: quem é o controlador; `CONTROLADOR_NOME` e `CONTATO_EMAIL` na Vercel.
- [ ] 🧑 Revisão de advogado (inclui o art. 15 do Marco Civil, ver `docs/lgpd.md` seção 4).

## Verificação

Testes unitários do inventário; build; página conferida no celular (390 px, sem rolagem lateral) e no computador.

---
[← Todos os tickets](README.md) · [LGPD](../lgpd.md)
