# Backlog e status

## Plano vigente para implementar

A prioridade é tornar o site confiável e utilizável, depois abrir a entrega paga e aprender com aquisição orgânica. O [plano de implementação](plano-implementacao.md) é a ordem vigente; não há requisito de dez empresas, parceiros ou verba de anúncio.

| Ticket | Marco | Estado | Issue |
|---|---|---|---|
| [T20](tickets/T20-seo-tecnico-e-medicao.md) · Publicar o domínio oficial com indexação verificável | A | 🟡 Configuração parcial; produção a conferir | A criar |
| [T33](tickets/T33-site-claro-e-confiavel.md) · Apresentar um site claro e confiável com oferta verdadeira | A | ⏳ A fazer; aproveitar PR 7 | A criar |
| [T21](tickets/T21-termos-privacidade-e-aviso-nao-oficial.md) · Publicar identidade contato e informações de uso verdadeiras | A | 🟡 Textos existentes; revisão pendente | A criar |
| [T38](tickets/T38-jornada-acessivel-e-sem-falhas.md) · Validar navegação cálculo e importação no celular e computador | A | ⏳ A fazer | A criar |
| [T07](tickets/T07-backup-diario-e-monitoramento.md) · Operar com verificação de saúde e recuperação dos dados | A | 🟡 Implementação proposta no PR 6 | A criar |
| [T13](tickets/T13-login-com-link-por-e-mail.md) · Validar o acesso real por e-mail e esconder provedores indisponíveis | B | 🟡 Código e SMTP existentes; sessão real pendente | A criar |
| [T15](tickets/T15-cadastro-minimo-da-empresa.md) · Validar empresa e isolamento entre contas reais de teste | B | 🟡 Formulário e tabela existentes; integração a validar | A criar |
| [T14](tickets/T14-assinatura-recorrente-e-limite-do-plano.md) · Concluir Asaas com pagamento acesso e cancelamento verificáveis | B | 🟡 Código existente; Asaas completo não validado | A criar |
| [T37](tickets/T37-acesso-gratis-previa-e-assinatura.md) · Separar acesso gratuito prévia e assinatura no servidor | B | ⏳ A fazer | A criar |
| [T34](tickets/T34-periodo-e-integridade-das-notas.md) · Preparar o período e mostrar a cobertura real das notas | B | ⏳ A fazer | A criar |
| [T35](tickets/T35-premissas-e-classificacoes-confirmadas.md) · Registrar premissas e confirmação das classificações | B | ⏳ A fazer | A criar |
| [T18](tickets/T18-historico-de-calculos.md) · Integrar histórico com reabertura fiel e isolamento | B | 🟡 Código proposto no PR 6 | A criar |
| [T27](tickets/T27-relatorio-revisavel-do-periodo.md) · Entregar relatório revisável do período em PDF e planilha | B | ⏳ A fazer | A criar |
| [T36](tickets/T36-cenarios-versionados-e-comparacao.md) · Comparar cenários da mesma análise preservando premissas | C | ⏳ A fazer | A criar |
| [T22](tickets/T22-funil-medido-e-checklist-de-lancamento.md) · Medir os primeiros usos e recolher feedback sem recrutar empresas | A | 🟡 Funil proposto no PR 6 | A criar |
| [T30](tickets/T30-conteudo-util-e-divulgacao-organica.md) · Publicar conteúdo útil e preparar divulgação orgânica sustentável | C | 🟡 Páginas propostas no PR 7; revisão pendente | A criar |
| [T39](tickets/T39-criterios-de-lancamento-gratuito-e-pago.md) · Registrar os critérios e evidências dos dois lançamentos | A | ⏳ A fazer | A criar |

Os quadros originais abaixo registram o planejamento anterior e serão reconciliados conforme cada entrega; a ordem desta revisão prevalece. Nenhum critério novo foi marcado como concluído nesta decomposição.

## Histórico do planejamento


**Cada ticket tem um arquivo em [`docs/tickets/`](tickets/README.md)**, com história, critérios de aceite (marcados quando prontos), prioridade, pontos e dependências. Este arquivo é o **resumo do status**: atualize-o junto com o arquivo do ticket em cada pull request. (Fonte original: [Backlog do MVP](https://claude.ai/artifact/Hr4U1WJddcMCdYTgVGzvJy).)

Legenda: ✅ feito · 🟡 em andamento ou parcial · ⏳ a fazer · 🧑 depende do Mateus

Lançamento 1 (calculadora grátis pública): meta 23/12/2026. Lançamento 2 (assinatura + XML): meta 25/01/2027.

## Sprint 0 · Estudo e decisões

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T01 | Rodar o motor oficial e medir RAM e tempo | ✅ | v1.7.2, 12 ms por cálculo, ~600 MB. `calculadora/` |
| T02 | 30 operações de referência (testes dourados) | ✅ | `testes-dourados/`. 6 conferidas à mão; falta revisão de contador |
| T03 | Tabela de alíquotas 2027 versionada | ✅ | `site/src/dados/aliquotas.json`. CBS 11,2% provisória até 15/12/2026 |
| T04 | Nome, domínio, preço, regime, quem programa | 🧑 | nome e preço provisórios em `site/src/lib/config.ts` |

## Sprint 1 · Infra e motor

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T05 | Vercel e Supabase | 🟡 | site no ar na Vercel (projeto `impostometro`, deploy automático da `main`). Supabase criado e registro do T10 validado no site local; login pendente ([`banco.md`](banco.md)). Domínio depende do T04 |
| T06 | Repositório, CI e deploy automático | 🟡 | CI pronto (`.github/workflows/`), com comparação porte × oficial. Falta ligar a Vercel ao repositório |
| T08b | Porte da calculadora para TypeScript (roda dentro do site) | ✅ | `site/src/motor/`. 1.519 de 1.519 pedidos idênticos à oficial 1.7.2. Atualização em [`manutencao.md`](manutencao.md) |
| T08 | Serviço de cálculo | ✅ | `site/src/lib/motor.ts`, agora chamando o porte. Falta gravar cada cálculo no banco (depende do Supabase) |

## Sprint 2 · Calculadora grátis

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T09 | Testes dourados no CI | ✅ | `calculadora.yml` |
| T10 | Busca "o que você vende?" | ✅ | 52 atividades + busca nas 11 mil NCM/NBS oficiais com descrição e tratamento especial + busca de classificações (cClassTrib) + registro das buscas sem resultado no Supabase (RLS, retenção de 30 dias). Detalhes em `docs/busca.md` |
| T11 | Simulação rápida sem cadastro | ✅ | página inicial. Medir tempo de carga em produção |

## Sprint 3 · Lançamento 1

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T12 | "Como chegamos nisso" | ✅ | `Resultado.tsx` |
| T19 | 5 artigos base e glossário | 🟡 | cinco artigos, glossário, fontes oficiais, links e metadados implementados; revisão contábil pendente. Fontes em `docs/conteudo.md`; evidências no diário |
| T20 | SEO técnico, Search Console e medição | 🟡 | títulos, descrição, FAQ, sitemap, robots e canônicas feitos. `SITE_URL` configura o endereço; prévias e ambientes sem URL ficam fora da indexação. Falta: configurar URL de produção, Search Console e Plausible/GA |
| T21 | Termos, privacidade e aviso "não oficial" | 🟡 | rodapé feito; termos e privacidade são rascunhos para advogado revisar |
| T07 | Backup e monitoramento | ⏳ | Sentry + aviso se o site cair |

## Sprints 4 a 6 · Conta, assinatura e XML

| ID | Ticket | Status | Notas |
|---|---|---|---|
| T13 | Login com link por e-mail e Google | 🟡 | `/entrar` e `/conta` prontos (aceite dos termos, sair, apagar conta). Tabelas criadas no Supabase; faltam as URLs de login no painel ([`banco.md`](banco.md)) |
| T15 | Cadastro mínimo da empresa | 🟡 | formulário em `/conta`, tabela `empresas` com RLS criada no Supabase |
| T16 | Upload e leitura de XML de NF-e/NFC-e | 🟡 | XML lido no navegador (não sai do computador). Prévia em `/importar`; falta restringir a assinantes (T13/T14) |
| T14 | Assinatura recorrente (Pix e cartão) | 🟡 | Asaas (decisão do Mateus). Assinar, avisos, cancelar e XML só para assinante prontos; tabelas criadas no Supabase; falta ligar o Asaas, testar no sandbox e com R$ 1 ([`banco.md`](banco.md)) |
| T17 | Calcular o lote item a item | 🟡 | Total, detalhe por item e confirmação da classificação. 500 notas em 1,7 s. Em revisão |
| T18 | Histórico de cálculos | ⏳ | |
| T22 | Funil medido e checklist de lançamento | ⏳ | |

## Depois do MVP (P2)

T23 aviso automático de versão nova da Receita (abre tarefa para um agente atualizar o porte) · T24 Simples Nacional · T25 NFS-e · T26 créditos das compras · T28 alertas · T29 painel de alíquotas · T31 comparar com o imposto atual · T32 painel do contador.

## Próximo passo recomendado

1. T33: revisar apresentação e confiança aproveitando o PR 7.
2. T20 e T21: concluir indexação, endereço oficial e informações de uso e contato.
3. T07 e T38: verificar operação e jornada gratuita; registrar o marco A no T39.
4. Seguir o marco B para login, empresa, controle de acesso, Asaas, notas e relatório.
5. T22 e T30: observar os primeiros usos e divulgar conteúdo útil organicamente.
