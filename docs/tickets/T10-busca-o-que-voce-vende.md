# T10 · Busca “o que você vende?”

| Campo | Valor |
|---|---|
| Status | 🟡 Parcial |
| Épico | E3 Calculadora grátis |
| Sprint | S2 |
| Prioridade | P0 |
| Pontos | 5 |
| Depende de | T01 |

## História

Como empresário, quero digitar “pizzaria” ou “corte de cabelo” e o site achar os códigos, porque não sei o que é NCM nem cClassTrib.

## Critérios de aceite

- [x] Dicionário inicial com 50 atividades comuns (52 em `site/src/dados/atividades.json`, todas conferidas no CI).
- [x] Busca também nas tabelas oficiais: as 10.417 NCM e 920 NBS da Receita, com descrição, aparecem na lista em "Nas tabelas oficiais da Receita" (`/api/codigos`, `src/lib/codigos.ts`). Quando o código tem tratamento especial na lei (ex.: cesta básica), a pessoa escolhe; o padrão é a tributação integral. Cada código e classificação oferecidos foram conferidos no porte.
- [ ] Buscas sem resultado ficam registradas, para crescer o dicionário (precisa do banco).
- [x] Usuário avançado pode digitar o NCM/NBS direto.

## Notas

A lista sai das tabelas oficiais por `scripts/porte/exportar-codigos.ts` (roda com `npm run porte:tabelas`; a CI confere se está atualizada). Registrar buscas sem resultado depende do banco (T13 em diante).

Suposição: a escolha do código para cada atividade foi feita por nós; vale um contador revisar.

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
