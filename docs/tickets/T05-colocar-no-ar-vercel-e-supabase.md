# T05 · Colocar no ar: Vercel e Supabase

| Campo | Valor |
|---|---|
| Status | 🟡 Parcial (site no ar na Vercel) |
| Épico | E1 Infraestrutura |
| Sprint | S1 |
| Prioridade | P0 |
| Pontos | 5 |
| Depende de | T01, T04 |

## História

Como dono, quero subir o site sem administrar servidor, com cada parte num serviço feito para ela.

## Critérios de aceite

- [ ] Projeto Supabase: o Mateus pediu ao Codex para montar o banco num projeto que ele já tem (26/11). Login Google e link por e-mail entram no T13. O bucket de XMLs não é mais necessário se o T16 ler as notas no navegador.
- [x] Projeto Vercel ligado ao repositório (`impostometro`, 26/11/2026), funções na região São Paulo (`site/vercel.json`), sem variáveis de ambiente necessárias para calcular. Primeiro deploy de produção: pronto (READY).
- [x] ~~Motor oficial no Fly.io com chave secreta~~ → não é mais necessário: a calculadora roda dentro do site (porte, T08b).
- [ ] Domínio apontado para a Vercel, com HTTPS automático; www redireciona para o principal.
- [x] Tempo de um cálculo simples abaixo de 500 ms (o porte calcula em milissegundos, sem rede).
- [x] Passo a passo escrito para recriar tudo do zero ([`deploy.md`](../deploy.md)).

## Notas

Custo esperado: Vercel (grátis no desenvolvimento, US$ 20/mês Pro quando cobrar) e Supabase (grátis, US$ 25/mês Pro depois). **Pedir confirmação ao Mateus antes de criar qualquer projeto ou recurso pago nas contas dele.**

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
