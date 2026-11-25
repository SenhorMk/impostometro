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
- [ ] Busca também nas tabelas oficiais quando o termo não está no dicionário (agora dá para buscar direto em `src/motor/dados/tabelas.json`).
- [ ] Buscas sem resultado ficam registradas, para crescer o dicionário (precisa do banco).
- [x] Usuário avançado pode digitar o NCM/NBS direto.

## Notas

Suposição: a escolha do código para cada atividade foi feita por nós; vale um contador revisar.

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
