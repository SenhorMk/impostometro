# T22 · Medir os primeiros usos e recolher feedback sem recrutar empresas

| Campo | Valor |
|---|---|
| Status | 🟡 Funil proposto no PR 6 |
| Marco | A |
| Prioridade | P1 gratuito |
| Pontos | A estimar após revisar o código existente |
| Depende de | T11 |
| GitHub | https://github.com/SenhorMk/impostometro/issues/24 |

## História

Como dono começando sem orçamento e sem contatos, quero entender onde os visitantes param e receber feedback voluntário para escolher a próxima melhoria.

## Estado existente

O PR 6 propõe contadores diários sem identificadores. Eles medem tendência e não usuários únicos. Aproveitar essa base em vez de adicionar várias ferramentas de analytics.

## Escopo

- Medir visita, cálculo completo, início/resultado de importação, geração do relatório e compra confirmada quando esses fluxos existirem.
- Criar uma forma simples e voluntária de apontar dificuldade ou sugerir melhoria, com destino verdadeiro e sem envio automático não solicitado.
- Documentar leitura dos sinais e registrar a aquisição orgânica com recursos gratuitos.

## Critérios de aceite

- [ ] Eventos possuem definição e origem; compra vem da confirmação do gateway, não do clique no botão.
- [ ] Distinguir eventos, sessões e usuários; não apresentar contadores anônimos como número exato de pessoas ou clientes.
- [ ] Não coletar XML, documento fiscal, IP, cookie ou identificador pessoal para o funil básico; finalidade e limitações ficam documentadas.
- [ ] Formulário/canal de feedback funciona e informa destino e uso dos dados; erro na coleta não bloqueia a calculadora.
- [ ] Sem visitantes, o painel indica falta de dados e não conclui que o preço ou produto foi rejeitado.
- [ ] Dez empresas, entrevistas, contatos prévios e contratação de analytics deixam de ser condições de lançamento.

## Verificação

Executar jornadas de teste e conferir eventos esperados, sem duplicações indevidas conhecidas; feedback de teste autorizado e sem dados reais de terceiros.

## Fora do escopo

Prometer tráfego ou vendas, recrutar dez empresas, comprar anúncios ou enviar mensagens em massa.

## Referências e implementação

Origem: [relatório e ajuste orgânico](../estrategia-assinatura.md). Ordem e critérios dos marcos: [plano de implementação](../plano-implementacao.md).

Relacionados: [PR #6](https://github.com/SenhorMk/impostometro/pull/6), [T30](T30-conteudo-util-e-divulgacao-organica.md), [T39](T39-criterios-de-lancamento-gratuito-e-pago.md).

Arquivos ou destinos previstos: `docs/estrategia-assinatura.md`, `supabase/migrations/20261126170000_funil_diario.sql`.

Skills: as pertinentes de [`docs/skills.md`](../skills.md), consultadas antes da execução.

Os critérios desta revisão medem a entrega no ambiente indicado. Código em PR, teste simulado e configuração salva não significam validação em produção. Em tickets usados por dois marcos, registrar separadamente quais critérios de cada marco foram verificados.

Não contratar recursos pagos nem enviar mensagens a terceiros sem autorização. Não alterar o motor para atender a requisitos de interface ou relatório. Registrar evidências, limitações e próximo passo no diário.

---
[← Todos os tickets](README.md) · [Plano de implementação](../plano-implementacao.md)
