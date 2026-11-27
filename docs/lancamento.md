# Checklist de lançamento (T22)

Antes de abrir a assinatura para o público. Cada item precisa de evidência (link, print ou anotação no diário); não marcar sem conferir.

## Infraestrutura
- [ ] Vercel em plano pago (Pro), se o uso comercial exigir (o plano Hobby da Vercel é só para uso não comercial)
- [ ] Supabase em plano Pro (backup diário e projeto que não pausa)
- [ ] Domínio próprio com HTTPS e `SITE_URL` configurado (T04/T20)
- [ ] Backup testado: uma restauração feita e anotada ([`monitoramento.md`](monitoramento.md))
- [ ] Sentry recebendo erros e alerta do `/api/saude` testado ([`monitoramento.md`](monitoramento.md))

## Cálculo
- [ ] CI verde no `main`: testes dourados e porte × oficial 100% idêntico
- [ ] Alíquota da CBS de 2027 conferida depois de 15/12/2026 (`site/src/dados/aliquotas.json`)

## Conta e pagamento
- [ ] Login por e-mail funcionando no endereço de produção (URLs de login no Supabase)
- [ ] Todas as migrações de `supabase/migrations/` aplicadas ([`banco.md`](banco.md))
- [ ] Asaas em produção, webhook apontando para o site
- [ ] Pagamento real testado (R$ 1, passo 6 do [`banco.md`](banco.md)) e preço voltou ao normal
- [ ] Cancelamento testado

## Legal e contato
- [ ] Termos e privacidade revisados por advogado (T21)
- [ ] Página de contato no ar (`/contato`, pronta) com um e-mail do produto em `CONTATO_EMAIL` na Vercel
- [ ] Nome e preço finais decididos (T04)

## Medição
- [ ] Funil contando: depois de um teste, `select * from funil_diario order by dia desc;` mostra visita, cálculo, cadastro, assinatura e cancelamento
- [ ] Search Console e medição de visitas (T20)
