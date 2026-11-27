# T34 · Preparar o período e mostrar a cobertura real das notas

| Campo | Valor |
|---|---|
| Status | ⏳ A fazer |
| Marco | B |
| Prioridade | P0 assinatura |
| Pontos | A estimar após revisar o código existente |
| Depende de | T15, T16 |
| GitHub | A criar |

## História

Como usuário, quero saber quais notas entraram na análise e o que ficou de fora antes de confiar em um total.

## Estado existente

O importador lê XML e ZIP, recusa entradas, devoluções e modelos incompatíveis e permite calcular lotes. Ampliar a preparação da análise sem reescrever o leitor nem mudar o motor.

## Escopo

- Identificar a empresa e o período; conferir que os documentos pertencem ao escopo da análise.
- Detectar duplicidade por chave inclusive entre importações do mesmo conjunto/período.
- Consolidar aceitos, duplicados, excluídos, inválidos e itens não calculados com motivos e cobertura.

## Critérios de aceite

- [ ] A mesma chave não soma duas vezes e o usuário vê a duplicidade.
- [ ] Documento de outra empresa, período incompatível, ausência de identificação e formato inválido têm tratamento explícito, sem exclusão silenciosa.
- [ ] Devolução, cancelamento e evento não suportado aparecem como limitação ou pendência; ausência de evento não é tratada como prova de nota válida.
- [ ] Contagens de arquivos, notas e itens reconciliam com a lista apresentada; o total não é rotulado como mês completo quando há lacunas.
- [ ] Valores não calculados ficam fora do total, com quantidade e motivo visíveis.
- [ ] Distinguir data original da nota de data do cenário projetado para 2027.
- [ ] Limites de arquivo, ZIP, quantidade e itens impedem travamento e processamento excessivo; arquivos permanecem no navegador conforme a política vigente.

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
