# Tickets do MVP

## Sequência revisada para lançamento orgânico

A ordem vigente está no [plano de implementação](../plano-implementacao.md), com marcos gratuito e pago separados. Os arquivos abaixo preservam os identificadores existentes; T27 e T30 foram promovidos e T33 a T39 detalham os novos gaps do relatório. Pontos e datas do planejamento original são históricos, sem compromisso atual. Não exigir recrutamento de empresas ou compra de serviços para começar.

## Catálogo

Um arquivo por ticket, com a história, os critérios de aceite (marcados quando prontos), a prioridade, os pontos e as dependências. Fonte original: o [Backlog do MVP](https://claude.ai/artifact/Hr4U1WJddcMCdYTgVGzvJy); **esta pasta é a versão oficial e atualizada**, junto com o resumo em [`../backlog.md`](../backlog.md).

**Como usar:** ao trabalhar num ticket, marque os critérios cumpridos (`- [x]`), mude o Status no arquivo e na tabela abaixo, e atualize o [`backlog.md`](../backlog.md) no mesmo pull request. Ticket novo: copie um arquivo, use o próximo número livre e adicione aqui.

Legenda: P0 = sem isso não lança · P1 = importante, pode atrasar uns dias · P2 = depois do MVP. Pontos antigos precisam de reestimativa; não equivalem a prazo confirmado. Status: ✅ feito · 🟡 parcial · ⏳ a fazer · 🧑 depende do Mateus.

A divulgação gratuita e a abertura da assinatura têm critérios separados no T39; datas serão definidas a partir das entregas verificadas.

| ID | Ticket | Épico | Marco / sprint original | Prioridade | Pontos | Status |
|---|---|---|---|---|---|---|
| [T01](T01-rodar-o-motor-oficial-e-medir.md) | Rodar o motor oficial e medir RAM e tempo | E0 Estudo e decisões | S0 | P0 | 3 | ✅ Feito |
| [T02](T02-montar-30-operacoes-de-referencia-testes.md) | Montar 30 operações de referência (testes dourados) | E0 Estudo e decisões | S0 | P0 | 3 | ✅ Feito |
| [T03](T03-tabela-de-aliquotas-2027-versionada-com.md) | Tabela de alíquotas 2027 versionada, com fonte oficial | E0 Estudo e decisões | S0 | P0 | 2 | ✅ Feito (valor provisório) |
| [T04](T04-decisoes-do-mateus-nome-dominio-preco.md) | Decisões do Mateus: nome, domínio, preço e regime | E0 Estudo e decisões | S0 | P0 | 1 | 🧑 Depende do Mateus |
| [T05](T05-colocar-no-ar-vercel-e-supabase.md) | Colocar no ar: Vercel e Supabase | E1 Infraestrutura | S1 | P0 | 5 | 🟡 Parcial (site no ar na Vercel) |
| [T06](T06-repositorio-ci-e-deploy-automatico.md) | Repositório, CI e deploy automático | E1 Infraestrutura | S1 | P0 | 3 | ✅ Feito |
| [T07](T07-backup-diario-e-monitoramento.md) | Operar com verificação de saúde e recuperação dos dados | Lançamento confiável | A | P0 gratuito básico; P0 assinatura recuperação | A estimar | 🟡 Código no main; falta o Mateus (Sentry, alerta, backup) |
| [T08](T08-servico-de-calculo.md) | Serviço de cálculo | E2 Motor de cálculo | S1 | P0 | 5 | ✅ Feito (falta gravar no banco) |
| [T08b](T08b-porte-da-calculadora-para-typescript-roda.md) | Porte da calculadora para TypeScript (roda dentro do site) | E2 Motor de cálculo | S1 | P0 | 8 | ✅ Feito |
| [T09](T09-testes-dourados-no-ci.md) | Testes dourados no CI | E2 Motor de cálculo | S2 | P0 | 2 | ✅ Feito |
| [T10](T10-busca-o-que-voce-vende.md) | Busca “o que você vende?” | E3 Calculadora grátis | S2 | P0 | 5 | ✅ Busca e registro validados; deploy no T05 |
| [T11](T11-simulacao-rapida-sem-cadastro.md) | Simulação rápida sem cadastro | E3 Calculadora grátis | S2 | P0 | 5 | ✅ Feito |
| [T12](T12-como-chegamos-nisso.md) | “Como chegamos nisso” | E3 Calculadora grátis | S3 | P0 | 3 | ✅ Feito |
| [T13](T13-login-com-link-por-e-mail.md) | Validar o acesso real por e-mail e esconder provedores indisponíveis | Lançamento confiável | B | P0 assinatura | A estimar | 🟡 Código no main; sessão real pendente |
| [T14](T14-assinatura-recorrente-e-limite-do-plano.md) | Concluir Asaas com pagamento acesso e cancelamento verificáveis | Lançamento confiável | B | P0 assinatura | A estimar | 🟡 Código no main; Asaas sandbox e R$ 1 pendentes |
| [T15](T15-cadastro-minimo-da-empresa.md) | Validar empresa e isolamento entre contas reais de teste | Lançamento confiável | B | P0 assinatura | A estimar | 🟡 Código no main; isolamento com contas reais pendente |
| [T16](T16-upload-e-leitura-de-xml-de.md) | Upload e leitura de XML de NF-e/NFC-e | E5 Importação de XML | S4 | P0 | 5 | ✅ Feito |
| [T17](T17-calcular-o-lote-item-a-item.md) | Calcular o lote item a item | E5 Importação de XML | S5 | P0 | 5 | ✅ Feito |
| [T18](T18-historico-de-calculos.md) | Integrar histórico com reabertura fiel e isolamento | Lançamento confiável | B | P0 assinatura | A estimar | 🟡 Código no main (PR 6); validação real pendente |
| [T19](T19-5-artigos-base-e-glossario.md) | 5 artigos base e glossário | E6 Conteúdo e SEO | S3 | P1 | 3 | 🟡 Implementado; revisão contábil pendente |
| [T20](T20-seo-tecnico-e-medicao.md) | Publicar o domínio oficial com indexação verificável | Lançamento confiável | A | P0 gratuito | A estimar | 🟡 Configuração parcial; produção a conferir |
| [T21](T21-termos-privacidade-e-aviso-nao-oficial.md) | Publicar identidade contato e informações de uso verdadeiras | Lançamento confiável | A | P0 gratuito | A estimar | 🟡 Textos existentes; revisão pendente |
| [T22](T22-funil-medido-e-checklist-de-lancamento.md) | Medir os primeiros usos e recolher feedback sem recrutar empresas | Lançamento confiável | A | P1 gratuito | A estimar | 🟡 Funil no main (PR 6); SQL aplicado; medição pendente |
| [T33](T33-site-claro-e-confiavel.md) | Apresentar um site claro e confiável com oferta verdadeira | Lançamento confiável | A | P0 gratuito | A estimar | 🟡 Visual substituído pelo redesign (PR 7); textos e critérios a revisar sobre o novo visual |
| [T38](T38-jornada-acessivel-e-sem-falhas.md) | Validar navegação cálculo e importação no celular e computador | Lançamento confiável | A | P0 gratuito e assinatura | A estimar | ⏳ A fazer |
| [T37](T37-acesso-gratis-previa-e-assinatura.md) | Separar acesso gratuito prévia e assinatura no servidor | Lançamento confiável | B | P0 assinatura | A estimar | 🟡 Código no main (PR 30); validação real pendente |
| [T34](T34-periodo-e-integridade-das-notas.md) | Preparar o período e mostrar a cobertura real das notas | Lançamento confiável | B | P0 assinatura | A estimar | ⏳ A fazer |
| [T35](T35-premissas-e-classificacoes-confirmadas.md) | Registrar premissas e confirmação das classificações | Lançamento confiável | B | P0 assinatura | A estimar | ⏳ A fazer |
| [T27](T27-relatorio-revisavel-do-periodo.md) | Entregar relatório revisável do período em PDF e planilha | Lançamento confiável | B | P0 assinatura | A estimar | ⏳ A fazer |
| [T36](T36-cenarios-versionados-e-comparacao.md) | Comparar cenários da mesma análise preservando premissas | Lançamento confiável | C | P1 após primeira entrega paga | A estimar | ⏳ A fazer |
| [T30](T30-conteudo-util-e-divulgacao-organica.md) | Publicar conteúdo útil e preparar divulgação orgânica sustentável | Lançamento confiável | C | P1 gratuito | A estimar | 🟡 Páginas por setor no main (PR 7); revisão pendente |
| [T39](T39-criterios-de-lancamento-gratuito-e-pago.md) | Registrar os critérios e evidências dos dois lançamentos | Lançamento confiável | A | P0 por marco | A estimar | ⏳ A fazer |

## Marcos de implementação

A ordem, dependências e evidências dos marcos A, B e C estão no [plano de implementação](../plano-implementacao.md). As datas originais não regem esta revisão.

## Depois do MVP (P2)

| ID | Ticket | Por que esperar |
|---|---|---|
| T23 | Aviso automático de versão nova da Receita (abre tarefa para um agente atualizar o porte) | a troca é guiada por `manutencao.md`; a Receita muda quase toda semana, então é o primeiro da fila |
| T24 | Motor do Simples Nacional | a calculadora oficial ainda usa só a primeira faixa do Simples |
| T25 | Importar NFS-e | o padrão varia por município; NF-e e NFC-e cobrem comércio primeiro |
| T26 | Estimativa mensal com créditos das compras | exige XMLs de compra e a soma débito menos crédito, que a calculadora não faz |
| T28 | Alertas por e-mail quando a lei ou a alíquota muda | precisa do T23 e de assinantes |
| T29 | Painel de administração de alíquotas | no MVP basta o arquivo versionado do T03 |
| T31 | Comparar com o imposto atual (PIS, Cofins, ICMS, ISS) | lógica toda nossa; a calculadora oficial não faz |
| T32 | Painel do contador com várias empresas | segundo público; quando houver contadores interessados |
