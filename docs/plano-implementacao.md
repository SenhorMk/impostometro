# Plano de implementação do site e da assinatura

Revisão de 26/11/2026 a pedido do Mateus. Orçamento disponível para aquisição: zero. Não há rede prévia de empresas nem parceiro de recrutamento. O plano transforma o [relatório](estrategia-assinatura.md) em tarefas executáveis, começando pela confiança do site e por uma entrega que possa ser divulgada organicamente.

## Como executar

Começar por T33, aproveitando o PR 7, para alinhar apresentação, exemplos e chamadas ao que existe. T20 e T21 podem avançar sem esperar a assinatura. Concluir a validação operacional e de navegação antes de divulgar o marco gratuito. No marco pago, revisar primeiro os códigos existentes dos PRs e da main, evitando implementações paralelas.

P0 gratuito bloqueia a divulgação dessa versão; P0 assinatura bloqueia a abertura da cobrança, mas não a calculadora gratuita. T07, T38 e T39 têm verificações distintas por marco. O marco A exige somente os critérios aplicáveis à versão gratuita; os demais continuam pendentes.

Não há compromisso de datas nem conversão fixa de pontos para dias. Estimar cada tarefa após examinar o código e os acessos necessários. O piloto de dez empresas e as metas do relatório não são dependências de nenhum ticket. Preço final, integrações extras e serviços pagos continuam sujeitos a decisão específica.

## Ordem e dependências

### Marco A · Site gratuito confiável

| Ordem | Ticket | Prioridade | Depende de | Issue |
|---|---|---|---|---|
| 1 | [T33 · Apresentar um site claro e confiável com oferta verdadeira](tickets/T33-site-claro-e-confiavel.md) | P0 gratuito | — | https://github.com/SenhorMk/impostometro/issues/10 |
| 2 | [T21 · Publicar identidade contato e informações de uso verdadeiras](tickets/T21-termos-privacidade-e-aviso-nao-oficial.md) | P0 gratuito | — | https://github.com/SenhorMk/impostometro/issues/12 |
| 3 | [T20 · Publicar o domínio oficial com indexação verificável](tickets/T20-seo-tecnico-e-medicao.md) | P0 gratuito | T05 | https://github.com/SenhorMk/impostometro/issues/11 |
| 4 | [T07 · Operar com verificação de saúde e recuperação dos dados](tickets/T07-backup-diario-e-monitoramento.md) | P0 gratuito básico; P0 assinatura recuperação | T05 | https://github.com/SenhorMk/impostometro/issues/14 |
| 5 | [T38 · Validar navegação cálculo e importação no celular e computador](tickets/T38-jornada-acessivel-e-sem-falhas.md) | P0 gratuito e assinatura | T33 | https://github.com/SenhorMk/impostometro/issues/13 |
| 6 | [T22 · Medir os primeiros usos e recolher feedback sem recrutar empresas](tickets/T22-funil-medido-e-checklist-de-lancamento.md) | P1 gratuito | T11 | https://github.com/SenhorMk/impostometro/issues/24 |
| 7 | [T39 · Registrar os critérios e evidências dos dois lançamentos](tickets/T39-criterios-de-lancamento-gratuito-e-pago.md) | P0 por marco | T20, T33, T21, T38, T07 | https://github.com/SenhorMk/impostometro/issues/26 |

### Marco B · Entrega paga mínima

| Ordem | Ticket | Prioridade | Depende de | Issue |
|---|---|---|---|---|
| 1 | [T13 · Validar o acesso real por e-mail e esconder provedores indisponíveis](tickets/T13-login-com-link-por-e-mail.md) | P0 assinatura | T05, T21 | https://github.com/SenhorMk/impostometro/issues/15 |
| 2 | [T15 · Validar empresa e isolamento entre contas reais de teste](tickets/T15-cadastro-minimo-da-empresa.md) | P0 assinatura | T13 | https://github.com/SenhorMk/impostometro/issues/16 |
| 3 | [T37 · Separar acesso gratuito prévia e assinatura no servidor](tickets/T37-acesso-gratis-previa-e-assinatura.md) | P0 assinatura | T13 | https://github.com/SenhorMk/impostometro/issues/18 |
| 4 | [T14 · Concluir Asaas com pagamento acesso e cancelamento verificáveis](tickets/T14-assinatura-recorrente-e-limite-do-plano.md) | P0 assinatura | T13, T15, T37 | https://github.com/SenhorMk/impostometro/issues/17 |
| 5 | [T34 · Preparar o período e mostrar a cobertura real das notas](tickets/T34-periodo-e-integridade-das-notas.md) | P0 assinatura | T15, T16 | https://github.com/SenhorMk/impostometro/issues/19 |
| 6 | [T35 · Registrar premissas e confirmação das classificações](tickets/T35-premissas-e-classificacoes-confirmadas.md) | P0 assinatura | T34 | https://github.com/SenhorMk/impostometro/issues/20 |
| 7 | [T18 · Integrar histórico com reabertura fiel e isolamento](tickets/T18-historico-de-calculos.md) | P0 assinatura | T13, T15 | https://github.com/SenhorMk/impostometro/issues/21 |
| 8 | [T27 · Entregar relatório revisável do período em PDF e planilha](tickets/T27-relatorio-revisavel-do-periodo.md) | P0 assinatura | T34, T35, T18, T37 | https://github.com/SenhorMk/impostometro/issues/22 |

### Marco C · Evolução e descoberta orgânica

| Ordem | Ticket | Prioridade | Depende de | Issue |
|---|---|---|---|---|
| 1 | [T36 · Comparar cenários da mesma análise preservando premissas](tickets/T36-cenarios-versionados-e-comparacao.md) | P1 após primeira entrega paga | T18, T35, T27 | https://github.com/SenhorMk/impostometro/issues/23 |
| 2 | [T30 · Publicar conteúdo útil e preparar divulgação orgânica sustentável](tickets/T30-conteudo-util-e-divulgacao-organica.md) | P1 gratuito | T20, T33 | https://github.com/SenhorMk/impostometro/issues/25 |

O marco C não é uma fila que precise bloquear a aquisição: T30 pode começar assim que T20 e T33 estiverem verificados, com poucas páginas úteis. T36 pode entrar depois da primeira entrega paga conforme as dificuldades observadas.

## Reaproveitamento do trabalho

- PR 6: revisar histórico no T18, saúde e recuperação no T07 e funil no T22. Não reaplicar migrações sem conferir os objetos existentes e o histórico do banco.
- PR 7: aproveitar a apresentação no T33 e revisar as páginas no T30; verificar a versão integrada no T38.
- T13, T14 e T15: completar integração e validação real do código da main.
- T16 e T17: preservar leitor e motor existentes; a conferência do período fica no T34 e a rastreabilidade no T35.
- T27 sai da fila pós-MVP e passa a compor a entrega paga mínima. T30 é antecipado para aquisição orgânica.
- T31 continua sendo comparação com tributos atuais; não confundir com T36, que compara cenários do mesmo cálculo. T26 continua reservado aos créditos de compras.

## Evidência necessária para concluir

Cada entrega registra commit e ambiente, critérios verificados e limitações. Uma mudança visual exige computador e celular; um fluxo de conta exige sessão e isolamento; um fluxo de cobrança exige confirmação pelo gateway e consistência no banco. Testes locais, serviços simulados e PR aberto ficam identificados. Não marcar revisão contábil, jurídica, restauração ou publicação como concluídas sem evidência.

O ticket T39 concentra a revisão dos marcos. A assinatura depende da entrega efetiva e do teste do pagamento, não de uma quantidade de visitantes. Divulgação e feedback começam quando a ferramenta estiver utilizável, sem prometer alcance ou vendas.

## O que fica para depois

T23 atualização automática do motor, T24 Simples, T25 NFS-e, T26 créditos, T28 alertas regulatórios, T29 painel de alíquotas, T31 tributos atuais e T32 carteira do contador continuam fora desta primeira sequência. As rotinas manuais de atualização e as versões explícitas continuam necessárias à confiabilidade. Nenhum ticket desta rodada exige anúncios, listas de contatos, depoimentos inventados ou entrevistas antes de publicar.
