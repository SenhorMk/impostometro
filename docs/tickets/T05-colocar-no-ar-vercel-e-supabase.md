# T05 · Colocar no ar: Vercel e Supabase

| Campo | Valor |
|---|---|
| Status | 🟡 Parcial |
| Épico | E1 Infraestrutura |
| Sprint | S1 |
| Prioridade | P0 |
| Pontos | 5 |
| Depende de | T01, T04 |

## História

Como dono, quero subir o site sem administrar servidor, com cada parte num serviço feito para ela.

## Critérios de aceite

- [ ] Projeto Supabase criado na região São Paulo, com login Google e link por e-mail ligados e um bucket privado para XMLs.
- [ ] Projeto Vercel ligado ao repositório, funções na região São Paulo (`site/vercel.json` pronto), variáveis de ambiente fora do código.
- [x] ~~Motor oficial no Fly.io com chave secreta~~ → não é mais necessário: a calculadora roda dentro do site (porte, T08b).
- [ ] Domínio apontado para a Vercel, com HTTPS automático; www redireciona para o principal.
- [x] Tempo de um cálculo simples abaixo de 500 ms (o porte calcula em milissegundos, sem rede).
- [x] Passo a passo escrito para recriar tudo do zero ([`deploy.md`](../deploy.md)).

## Notas

Projeto Supabase criado em São Paulo na organização ReformaImposto, Free, ID `uivewvttfvaoqdzltrnc`. Registro do T10 aplicado e testado, com RLS e retenção; site local conectado. Login Google, configuração de e-mail para o produto e bucket privado de XMLs continuam pendentes e o primeiro critério permanece desmarcado. Vercel e domínio também pendentes. O histórico remoto das migrações aplicadas manualmente precisa ser reconciliado antes de automatizar o deploy do banco. Estado em [`banco.md`](../banco.md).

Custo esperado: Vercel (grátis no desenvolvimento, US$ 20/mês Pro quando cobrar) e Supabase (grátis, US$ 25/mês Pro depois). **Pedir confirmação ao Mateus antes de criar qualquer projeto ou recurso pago nas contas dele.**

---
[← Todos os tickets](README.md) · [Status geral](../backlog.md)
