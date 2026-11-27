# T27 · Entregar relatório revisável do período em PDF e planilha

| Campo | Valor |
|---|---|
| Status | ⏳ A fazer |
| Marco | B |
| Prioridade | P0 assinatura |
| Pontos | A estimar após revisar o código existente |
| Depende de | T34, T35, T18, T37 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/22 |

## História

Como usuário, quero levar uma análise compreensível e conferível ao contador sem copiar resultados de várias telas.

## Estado existente

T27 era uma ideia pós-MVP. O relatório de estratégia o promove à entrega mínima paga. Conta aberta e cálculo em lote fornecem dados a aproveitar.

## Escopo

- Gerar resumo do período e detalhe por nota/item a partir do mesmo resultado persistido.
- Exportar PDF legível e CSV ou XLSX conferível, com especificação de campos e formatos.
- Incluir cobertura, pendências, premissas, data e versões usadas, sem chamar o resultado de imposto definitivo a recolher.

## Critérios de aceite

- [ ] PDF e planilha reconciliam com os valores da tela e os centavos do resultado, sem novo cálculo divergente na exportação.
- [ ] Resumo identifica empresa, período, cenário, documentos incluídos/excluídos/duplicados e itens não calculados.
- [ ] Detalhe mostra base, CBS, IBS, classificação e origem, com memória/fonte e versões suficientes para conferência.
- [ ] Bases estimadas, alíquotas provisórias, premissas pendentes e cobertura parcial aparecem junto aos resultados relevantes.
- [ ] Arquivos respeitam permissão do usuário, política de retenção e minimização de dados; não usam link público permanente por padrão.
- [ ] CSV/XLSX protege conteúdo textual contra interpretação como fórmula; números e separadores são documentados.
- [ ] Conferir visualmente um relatório curto e um extenso, com quebras de página, e validar a soma com amostras de resultado conhecido.

## Verificação

Comparar tela, persistência, PDF e planilha com mesmos dados; QA visual, precisão de centavos e teste de autorização.

## Fora do escopo

Assinar parecer contábil, emitir guia fiscal, enviar documento ao contador sem instrução do usuário ou contratar gerador de relatórios pago.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [T12](T12-como-chegamos-nisso.md), [T17](T17-calcular-o-lote-item-a-item.md), [T36](T36-cenarios-versionados-e-comparacao.md).

Arquivos ou destinos previstos: `site/src/lib/lote.ts`, `site/src/components/Importador.tsx`, `docs/estrategia-assinatura.md`.

Skills: `pdf:pdf`, `supabase:supabase` e `vercel:verification`.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
