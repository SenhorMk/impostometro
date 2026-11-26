# T10 · Busca “o que você vende?”

| Campo | Valor |
|---|---|
| Status | ✅ Implementado e validado localmente |
| Épico | E3 Calculadora grátis |
| Sprint | S2 |
| Prioridade | P0 |
| Pontos | 5 |
| Depende de | T01 |

## História

Como empresário, quero digitar “pizzaria” ou “corte de cabelo” e o site achar os códigos, porque não sei o que é NCM nem cClassTrib.

## Critérios de aceite

- [x] Dicionário inicial com 50 atividades comuns (52 em `site/src/dados/atividades.json`, todas conferidas no CI).
- [x] Busca também nas tabelas oficiais: as 10.417 NCM e 920 NBS da Receita, com descrição, aparecem na lista em "Nas tabelas oficiais da Receita" (`/api/codigos`, `src/lib/codigos.ts`). Quando o código tem tratamento especial na lei (ex.: cesta básica), a pessoa escolhe; o padrão é a tributação integral. Cada código e classificação oferecidos foram conferidos no porte. A busca de classificações (cClassTrib) por descrição vem do PR #4 (`/api/busca-oficial`).
- [x] Buscas sem resultado ficam registradas, para crescer o dicionário (Supabase real, com integração local validada; deploy pendente do T05).
- [x] Usuário avançado pode digitar o NCM/NBS direto.

## Notas

A lista sai das tabelas oficiais por `scripts/porte/exportar-codigos.ts` (roda com `npm run porte:tabelas`; a CI confere se está atualizada).

Suposição: a escolha do código para cada atividade foi feita por nós; vale um contador revisar.

## Busca oficial implementada

O fallback consulta o servidor após 250 ms sem digitação, limita seis opções e respeita a vigência da simulação. Descrições textuais vêm de cClassTrib. (Depois, o PR #5 acrescentou as descrições de NCM/NBS, exportadas do banco oficial completo para `src/dados/codigos-oficiais.json`.) Selecionar um resultado oficial abre os campos de código e classificação, preenchendo somente o dado encontrado.

Persistência aplicada no projeto Supabase `uivewvttfvaoqdzltrnc`, com RLS, permissões de coluna e retenção de 30 dias. Consulta pelo endpoint local gravou uma linha confirmada no banco; acesso público de leitura, alteração e exclusão foi negado. A política de privacidade informa a coleta e seus limites. A ativação em produção depende do deploy do T05. [Funcionamento](../busca.md) · [Banco e evidências](../banco.md).

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
