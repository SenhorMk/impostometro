# Funil: o que medimos e como ler (T22)

O funil conta quantas vezes cada etapa acontece por dia. **Não guarda dado pessoal**: nada de IP, cookie, e-mail, conta, XML ou identificador de visitante. A tabela `public.funil_diario` só tem `dia · etapa · total`.

## Etapas

| Etapa | Quando soma 1 | Quem conta | O que ela é (e o que não é) |
|---|---|---|---|
| `visita` | primeira página aberta numa aba do navegador | navegador | **sessão** aproximada: a mesma pessoa em duas abas conta 2; em modo privado sem `sessionStorage`, não conta |
| `calculo_gratis` | resultado da simulação grátis aparece com sucesso | navegador | evento: a mesma pessoa simulando 5 vezes conta 5 |
| `importacao_inicio` | alguém escolhe arquivos XML para importar | navegador | evento; não diz quantas notas nem de quem |
| `importacao_resultado` | um lote de notas foi calculado e o total apareceu | navegador | evento |
| `relatorio` | alguém gera o PDF ou a planilha do relatório (T27) | navegador | evento. **Ligado quando o PR do T27 entrar** |
| `cadastro` | primeiro aceite dos termos numa conta nova | navegador | aproxima "contas criadas" |
| `assinatura` | o Asaas **confirma** um pagamento que ativa a assinatura | servidor (webhook conferido) | vem da confirmação do gateway, nunca do clique em "Assinar" |
| `cancelamento` | assinatura cancelada | servidor | — |

Visitante consegue chamar `contar_evento` à toa e inflar as etapas do navegador (não há login para conferir). Por isso o funil serve para **tendência e taxas**, não como número exato de pessoas ou clientes. `assinatura` e `cancelamento` só o servidor soma.

## Como ler

No SQL Editor do Supabase:

```sql
select * from funil_semanal;               -- uma linha por semana, etapas lado a lado, com a coluna "leitura"
select * from funil_diario order by dia desc, evento;
```

- A coluna `leitura` avisa quando a semana tem **menos de 100 visitas**: com tão pouco, não dá para concluir nada sobre preço ou produto. Sem visitas, o problema é ser encontrado (SEO, divulgação), não a oferta.
- Taxas úteis: `calculos_gratis / visitas` (a calculadora convence?), `importacoes_iniciadas / visitas da página de importação` (o convite funciona?), `importacoes_calculadas / importacoes_iniciadas` (a importação trava?), `assinaturas / cadastros`.
- Compare semanas entre si. Um salto isolado pode ser alguém recarregando ou um robô.

## Feedback

Link "Sugerir melhoria ou apontar erro" no rodapé e "Algo estranho neste resultado?" embaixo de cada simulação levam a `/contato#sugestao`. Lá, um botão abre o e-mail da pessoa com assunto e roteiro prontos para o `CONTATO_EMAIL`. Nada é enviado sozinho, nada fica gravado no site. Sem `CONTATO_EMAIL` na Vercel, a página diz que o canal abre com o atendimento. Uso da mensagem: "Atendimento" na política de privacidade.

## Aquisição orgânica (recursos gratuitos)

- Google Search Console (T20): buscas que trazem gente, cliques e posição. Registrar uma vez por semana, junto com a linha do `funil_semanal`, numa tabela simples (data, visitas, simulações, cliques do Search Console, o que mudou no site).
- Não contratar analytics pago nem exigir entrevistas ou um número de empresas para lançar.
