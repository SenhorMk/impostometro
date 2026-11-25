# Conteúdo editorial (T19)

O conteúdo público fica em `site/src/dados/conteudo.ts`, versionado junto com o código. As páginas são renderizadas no servidor e os cinco slugs conhecidos são gerados por `generateStaticParams`. Não há CMS, banco ou dependência adicional para publicar um artigo.

## Rotas

| Rota | Objetivo |
|---|---|
| `/artigos` | Índice dos cinco guias |
| `/artigos/como-calcular-cbs-e-ibs` | Dados da operação, conta percentual e leitura do resultado |
| `/artigos/quanto-vou-pagar-em-2027` | Limites da estimativa por venda e planejamento da apuração |
| `/artigos/linha-do-tempo-2026-a-2033` | Etapas da substituição dos tributos sobre o consumo |
| `/artigos/reforma-no-simples-nacional` | Simples, opção regular de CBS/IBS e limites do simulador |
| `/artigos/o-que-e-cclasstrib` | Classificação da operação e consulta às tabelas |
| `/glossario` | CBS, IBS, IS, crédito, não cumulatividade, split payment e alíquota de referência |

Cada página tem título, descrição e URL canônica. O sitemap inclui índice, glossário e artigos quando a indexação está habilitada. Cabeçalho e rodapé levam ao conteúdo; a navegação do conteúdo também funciona no celular. Todo artigo termina com um link para `/#calculadora`. Slugs desconhecidos usam `notFound()` e exibem uma mensagem em português. Com streaming, o Next.js pode responder HTTP 200 quando já enviou o início da página; a mensagem de ausência e `noindex` são conferidos além do status ([documentação](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/dynamicParams)).

## Fontes consultadas em 25/11/2026

| Fonte primária | Uso |
|---|---|
| [LC 214/2025, texto atualizado](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm) | Base do cálculo e definições legais de IBS/CBS/IS, regime, referência e recolhimento |
| [Receita: entenda a reforma](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/entenda) | Calendário de 2026 a 2033 e transição |
| [Receita: alterações no Simples Nacional](https://www8.receita.fazenda.gov.br/SimplesNacional/noticias/NoticiaCompleta.aspx?id=e595d010-1e04-4c3b-95d9-185fc58594b5) | Distinção entre ingresso no Simples e opção regular de CBS/IBS |
| [Portal NF-e: tabelas](https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?AspxAutoDetectCookieSupport=1&tipoConteudo=%2FNJarYc9nus%3D) e [Informe Técnico 2025.002](https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?AspxAutoDetectCookieSupport=1&conteudo=RkY7TWxNDgU%3D) | cClassTrib, CST e consulta à tabela vigente |
| [Glossário da Receita, maio de 2026](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/manuais/reforma-tributaria-do-consumo/glossario-rtc-versao-iii-maio-de-2026.pdf/@@download/file) | Créditos e não cumulatividade |
| [Calculadora da Receita](https://github.com/ReceitaFederal/calculadora-rtc-regime-regular) | Contexto do motor oficial que originou o porte |

O informe consultado explica o significado dos campos; ele não é usado como tabela vigente de códigos. O artigo remete ao índice oficial para a versão atual. O texto sobre Simples não reproduz prazos de opção, porque publicações oficiais de datas diferentes apresentam calendários alterados. O visitante é direcionado ao portal oficial para confirmar o prazo aplicável.

## Regras editoriais

- Linguagem para empresários. Separar cálculo de uma venda de apuração mensal, créditos e DAS.
- Não publicar valor ilustrativo em reais produzido fora do motor. Os artigos desta entrega não adicionam exemplos numéricos de imposto.
- Não copiar a alíquota provisória para os artigos. A tabela e o resultado da calculadora mostram o percentual, status, versão e fontes.
- Colocar fontes junto às seções que explicam regras tributárias. Os trechos que descrevem limites do produto derivam do código e do backlog.
- Revisão editorial por agente não equivale a revisão por contador. O aviso público e o ticket registram a revisão contábil pendente.
- O motor, suas tabelas oficiais e os testes dourados não foram alterados por esta entrega.

## Atualizar um artigo ou termo

1. Reabra a fonte primária e confira o texto em vigor. Quando o assunto for prazo, confira as resoluções e publicações mais recentes.
2. Edite `ARTIGOS` ou `GLOSSARIO` em `site/src/dados/conteudo.ts`. Registre fontes em `FONTES` e associe-as à seção ou ao termo. Mude `atualizadoEm` somente quando revisar o conteúdo.
3. Para novo artigo, escolha slug único e estável. As rotas estáticas e o sitemap usam `ARTIGOS` automaticamente. Evite mudar slug já indexado sem planejar redirecionamento.
4. Rode os checks do site descritos em `AGENTS.md`. No navegador, confira índice, página, fontes, link final e layout de celular e computador. Para slug inexistente, confira a mensagem de ausência e `noindex`, observando a ressalva de streaming acima.
5. Atualize ticket, backlog e diário com o que foi conferido e com qualquer revisão humana pendente. Abra PR; publicação depende de aprovação e deploy.

## Revisão contábil

Pendente: não foi apresentada nesta sessão uma revisão assinada ou confirmada por parceiro. Quando houver, registrar data, responsável com autorização para identificação, artigos revisados, fontes e ajustes solicitados. Só então marcar o critério correspondente no T19.
