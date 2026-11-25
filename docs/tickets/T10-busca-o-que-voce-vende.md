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
- [x] Busca também nas tabelas oficiais quando o termo não está no dicionário (descrições de cClassTrib e códigos NCM/NBS vigentes em `src/motor/dados/tabelas.json`).
- [ ] Buscas sem resultado ficam registradas, para crescer o dicionário (precisa do banco).
- [x] Usuário avançado pode digitar o NCM/NBS direto.

## Notas

Suposição: a escolha do código para cada atividade foi feita por nós; vale um contador revisar.

## Busca oficial implementada

O fallback consulta o servidor após 250 ms sem digitação, limita seis opções e respeita a vigência da simulação. Descrições textuais vêm de cClassTrib; NCM/NBS no banco exportado têm apenas códigos e são buscados por número/prefixo. Selecionar um resultado oficial abre os campos de código e classificação, preenchendo somente o dado encontrado.

O registro em banco continua pendente do T05. Não tratamos uma mensagem no terminal como persistência. [Funcionamento e manutenção](../busca.md) · [Merge dos PRs e evidências da entrega](../diario/2026-11-25-merges-e-t10.md).

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
