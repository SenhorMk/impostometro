# T34 · Preparar o período e mostrar a cobertura real das notas

| Campo | Valor |
|---|---|
| Status | 🟡 Em revisão (PR) |
| Marco | B |
| Prioridade | P0 assinatura |
| Pontos | 5 |
| Depende de | T15, T16 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/19 |

## História

Como usuário, quero saber quais notas entraram na análise e o que ficou de fora antes de confiar em um total.

## Estado existente

O importador lê XML e ZIP, recusa entradas, devoluções e modelos incompatíveis e permite calcular lotes. Ampliar a preparação da análise sem reescrever o leitor nem mudar o motor.

## Escopo

- Identificar a empresa e o período; conferir que os documentos pertencem ao escopo da análise.
- Detectar duplicidade por chave inclusive entre importações do mesmo conjunto/período.
- Consolidar aceitos, duplicados, excluídos, inválidos e itens não calculados com motivos e cobertura.

## Critérios de aceite

- [x] A mesma chave não soma duas vezes e o usuário vê a duplicidade. (vale também para arquivos somados depois, no mesmo envio da tela; entre análises salvas no histórico ainda não)
- [x] Documento de outra empresa, período incompatível, ausência de identificação e formato inválido têm tratamento explícito, sem exclusão silenciosa. (empresa e mês escolhidos na tela; nota sem chave vira pendência; arquivo inválido aparece em "não lidos")
- [x] Devolução, cancelamento e evento não suportado aparecem como limitação ou pendência; ausência de evento não é tratada como prova de nota válida. (devolução já era recusada com motivo; cancelada/denegada pelo protocolo ou por XML de evento sai da soma; nota sem protocolo e evento desconhecido viram pendência)
- [x] Contagens de arquivos, notas e itens reconciliam com a lista apresentada; o total não é rotulado como mês completo quando há lacunas. (arquivos = notas + eventos + não lidos; notas = na análise + fora; buraco na numeração marca "cobertura parcial")
- [x] Valores não calculados ficam fora do total, com quantidade e motivo visíveis. (agrupados por motivo no resultado)
- [x] Distinguir data original da nota de data do cenário projetado para 2027. ("emitida em" × "cenário calculado com a data de")
- [x] Limites de arquivo, ZIP, quantidade e itens impedem travamento e processamento excessivo; arquivos permanecem no navegador conforme a política vigente. (200 MB, filtro do .zip, notas por lote e novo teto de 20.000 itens por lote)

Verificado em: testes automáticos (amostras sintéticas) e site local no celular e no computador. Não verificado em produção nem com XMLs reais de um mês inteiro.

## Verificação

Amostras sintéticas com duplicidade, outra empresa, data anterior a 2027, modelo recusado, nota sem evento e falha parcial. Conferir cobertura e soma conhecida.

## Fora do escopo

Busca automática na SEFAZ, suporte a compras/NFS-e/Simples ou promessa de apuração definitiva.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [T17](T17-calcular-o-lote-item-a-item.md), [T35](T35-premissas-e-classificacoes-confirmadas.md), [T27](T27-relatorio-revisavel-do-periodo.md).

Arquivos ou destinos previstos: `site/src/lib/nfe.ts`, `site/src/components/Importador.tsx`, `site/src/lib/lote.ts`.

Skills: as pertinentes de [`docs/skills.md`](../skills.md), consultadas antes da execução.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
