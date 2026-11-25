# Decisões

Registro curto do que foi decidido, quando e por quê. Novas decisões entram no topo.

| Data | Decisão | Por quê | Status |
|---|---|---|---|
| 2026-11-25 | Calculadora protegida por chave (Caddy na frente, `Authorization: Bearer`) | a calculadora oficial não tem senha e fica acessível pela internet para a Vercel chamar | feito |
| 2026-11-25 | Fly.io, São Paulo, 1 GB, sempre ligado | medido: ~600 MB de uso e 12 ms por cálculo. Mais barato sem cold start (~US$ 6,70/mês). Render e Cloud Run "dormem" e o Java demora a acordar. Railway é alternativa (~US$ 10+/mês) | recomendado, aguardando o Mateus criar a conta |
| 2026-11-25 | Nome provisório "Calcula Reforma" | "Impostômetro" é marca conhecida da Associação Comercial de SP | aguardando T04 |
| 2026-11-25 | Preço de marcador R$ 29/mês | só para montar a landing | aguardando T04 |
| 2026-11-25 | CBS 2027 = 11,2%, provisória | TCU calculou 11,3% em 28/10/2026 (11,3468%); 2027 tem redutor de 0,1 p.p. Senado pode mudar até 15/12/2026 | revisar após 15/12/2026 |
| 2026-11-25 | Testes dourados com alíquotas fixas (8,8% / 0,05% / 0,05%) | testam o motor, não a política; não mudam quando a alíquota mudar | feito |
| 2026-11-25 | Busca de atividades no navegador, num dicionário próprio | rápida, sem custo de servidor, e o empresário não sabe o que é NCM/cClassTrib | feito (52 atividades) |
| 2026-11-25 | Build com a imagem oficial do Maven, não o `mvnw` da Receita | o repositório da Receita não traz o `.jar` do Maven Wrapper | feito |
| 2026-11-25 | Calculadora fixada na v1.7.2 por hash de commit | build reproduzível; se a tag mudar, o build falha em vez de pegar outra coisa | feito |
| 2026-11-25 | Site na Vercel, banco/login no Supabase, motor Java separado | a Vercel não mantém servidor Java; Supabase junta banco, login e arquivos em São Paulo | decidido com o Mateus |
| 2026-11-25 | Regime regular primeiro; Simples Nacional depois | a calculadora oficial do Simples ainda só cobre a 1ª faixa | recomendado |
| 2026-11-25 | Fora do escopo: ORBITA | era só um exemplo do Mateus | decidido |
