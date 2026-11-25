# Tickets do MVP

Um arquivo por ticket, com a história, os critérios de aceite (marcados quando prontos), a prioridade, os pontos e as dependências. Fonte original: o [Backlog do MVP](https://claude.ai/artifact/Hr4U1WJddcMCdYTgVGzvJy); **esta pasta é a versão oficial e atualizada**, junto com o resumo em [`../backlog.md`](../backlog.md).

**Como usar:** ao trabalhar num ticket, marque os critérios cumpridos (`- [x]`), mude o Status no arquivo e na tabela abaixo, e atualize o [`backlog.md`](../backlog.md) no mesmo pull request. Ticket novo: copie um arquivo, use o próximo número livre e adicione aqui.

Legenda: P0 = sem isso não lança · P1 = importante, pode atrasar uns dias · P2 = depois do MVP. 1 ponto ≈ meio dia de uma pessoa em tempo integral. Status: ✅ feito · 🟡 parcial · ⏳ a fazer · 🧑 depende do Mateus.

Lançamento 1 (calculadora grátis pública): meta 23/12/2026. Lançamento 2 (assinatura + XML): meta 25/01/2027.

| ID | Ticket | Épico | Sprint | Prioridade | Pontos | Status |
|---|---|---|---|---|---|---|
| [T01](T01-rodar-o-motor-oficial-e-medir.md) | Rodar o motor oficial e medir RAM e tempo | E0 Estudo e decisões | S0 | P0 | 3 | ✅ Feito |
| [T02](T02-montar-30-operacoes-de-referencia-testes.md) | Montar 30 operações de referência (testes dourados) | E0 Estudo e decisões | S0 | P0 | 3 | ✅ Feito |
| [T03](T03-tabela-de-aliquotas-2027-versionada-com.md) | Tabela de alíquotas 2027 versionada, com fonte oficial | E0 Estudo e decisões | S0 | P0 | 2 | ✅ Feito (valor provisório) |
| [T04](T04-decisoes-do-mateus-nome-dominio-preco.md) | Decisões do Mateus: nome, domínio, preço e regime | E0 Estudo e decisões | S0 | P0 | 1 | 🧑 Depende do Mateus |
| [T05](T05-colocar-no-ar-vercel-e-supabase.md) | Colocar no ar: Vercel e Supabase | E1 Infraestrutura | S1 | P0 | 5 | 🟡 Parcial |
| [T06](T06-repositorio-ci-e-deploy-automatico.md) | Repositório, CI e deploy automático | E1 Infraestrutura | S1 | P0 | 3 | 🟡 Parcial |
| [T07](T07-backup-diario-e-monitoramento.md) | Backup diário e monitoramento | E1 Infraestrutura | S3 | P0 | 2 | ⏳ A fazer |
| [T08](T08-servico-de-calculo.md) | Serviço de cálculo | E2 Motor de cálculo | S1 | P0 | 5 | ✅ Feito (falta gravar no banco) |
| [T08b](T08b-porte-da-calculadora-para-typescript-roda.md) | Porte da calculadora para TypeScript (roda dentro do site) | E2 Motor de cálculo | S1 | P0 | 8 | ✅ Feito |
| [T09](T09-testes-dourados-no-ci.md) | Testes dourados no CI | E2 Motor de cálculo | S2 | P0 | 2 | ✅ Feito |
| [T10](T10-busca-o-que-voce-vende.md) | Busca “o que você vende?” | E3 Calculadora grátis | S2 | P0 | 5 | 🟡 Parcial |
| [T11](T11-simulacao-rapida-sem-cadastro.md) | Simulação rápida sem cadastro | E3 Calculadora grátis | S2 | P0 | 5 | ✅ Feito |
| [T12](T12-como-chegamos-nisso.md) | “Como chegamos nisso” | E3 Calculadora grátis | S3 | P0 | 3 | ✅ Feito |
| [T13](T13-login-com-link-por-e-mail.md) | Login com link por e-mail e Google | E4 Conta e assinatura | S4 | P0 | 3 | ⏳ A fazer |
| [T14](T14-assinatura-recorrente-e-limite-do-plano.md) | Assinatura recorrente e limite do plano grátis | E4 Conta e assinatura | S5 | P0 | 5 | ⏳ A fazer 🧑 |
| [T15](T15-cadastro-minimo-da-empresa.md) | Cadastro mínimo da empresa | E4 Conta e assinatura | S4 | P0 | 2 | ⏳ A fazer |
| [T16](T16-upload-e-leitura-de-xml-de.md) | Upload e leitura de XML de NF-e/NFC-e | E5 Importação de XML | S4 | P0 | 5 | ⏳ A fazer |
| [T17](T17-calcular-o-lote-item-a-item.md) | Calcular o lote item a item | E5 Importação de XML | S5 | P0 | 5 | ⏳ A fazer |
| [T18](T18-historico-de-calculos.md) | Histórico de cálculos | E4 Conta e assinatura | S6 | P1 | 3 | ⏳ A fazer |
| [T19](T19-5-artigos-base-e-glossario.md) | 5 artigos base e glossário | E6 Conteúdo e SEO | S3 | P1 | 3 | 🟡 Implementado; revisão contábil pendente |
| [T20](T20-seo-tecnico-e-medicao.md) | SEO técnico e medição | E6 Conteúdo e SEO | S3 | P0 | 2 | 🟡 Parcial |
| [T21](T21-termos-privacidade-e-aviso-nao-oficial.md) | Termos, privacidade e aviso “não oficial” | E7 Lançamento | S3 | P0 | 2 | 🟡 Parcial |
| [T22](T22-funil-medido-e-checklist-de-lancamento.md) | Funil medido e checklist de lançamento | E7 Lançamento | S6 | P1 | 2 | ⏳ A fazer |

## Sprints

| Sprint | Datas | Meta | Tickets |
|---|---|---|---|
| S0 | 26/11 a 02/12/2026 | motor rodando, medido e com testes; decisões tomadas | T01, T02, T03, T04 |
| S1 | 03/12 a 09/12 | site no ar com domínio, chamando a calculadora | T05, T06, T08, T08b |
| S2 | 10/12 a 16/12 | calculadora grátis de ponta a ponta | T09, T10, T11 |
| S3 | 17/12 a 23/12 | **Lançamento 1**: calculadora grátis pública, conteúdo e aviso legal | T12, T19, T20, T21, T07 |
| Pausa | 24/12 a 04/01/2027 | festas; só correções | — |
| S4 | 05/01 a 11/01/2027 | conta, empresa e leitura de XML | T13, T15, T16 |
| S5 | 12/01 a 18/01 | cobrança e cálculo do lote | T14, T17 |
| S6 | 19/01 a 25/01 | **Lançamento 2**: assinatura aberta | T18, T22 |

Caminho crítico: T01 → T08 → T11 → T12 (Lançamento 1) e T13 → T16 → T17, com T14 em paralelo (Lançamento 2). O T04 (domínio) trava o T05.

## Depois do MVP (P2)

| ID | Ticket | Por que esperar |
|---|---|---|
| T23 | Aviso automático de versão nova da Receita (abre tarefa para um agente atualizar o porte) | a troca é guiada por `manutencao.md`; a Receita muda quase toda semana, então é o primeiro da fila |
| T24 | Motor do Simples Nacional | a calculadora oficial ainda usa só a primeira faixa do Simples |
| T25 | Importar NFS-e | o padrão varia por município; NF-e e NFC-e cobrem comércio primeiro |
| T26 | Estimativa mensal com créditos das compras | exige XMLs de compra e a soma débito menos crédito, que a calculadora não faz |
| T27 | Relatório em PDF para o contador | útil, mas não decide a primeira venda |
| T28 | Alertas por e-mail quando a lei ou a alíquota muda | precisa do T23 e de assinantes |
| T29 | Painel de administração de alíquotas | no MVP basta o arquivo versionado do T03 |
| T30 | Páginas por setor e por cidade para SEO | depois que os artigos mostrarem quais buscas trazem visitas |
| T31 | Comparar com o imposto atual (PIS, Cofins, ICMS, ISS) | lógica toda nossa; a calculadora oficial não faz |
| T32 | Painel do contador com várias empresas | segundo público; quando houver contadores interessados |
