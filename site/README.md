# Site (Next.js)

A landing page que já é a calculadora, a API e o porte da calculadora oficial da Receita (`src/motor/`), que roda aqui dentro.

## Rodar no seu computador

```bash
cd site
npm install
npm test                      # porte: exemplo oficial + 30 dourados (sem Docker)
npm run dev                   # abre em http://localhost:3000
npm run porte:comparar        # porte × oficial (precisa de `docker compose up -d` na raiz)
```

## Como as peças se encaixam

```
Navegador                          Vercel (este site)
─────────                          ──────────────────
Calculadora.tsx  ── POST ──▶  /api/calcular (route.ts)
  busca local no                 └─ lib/motor.ts  (T08)
  dicionário (T10)                    ├─ escolhe as alíquotas em dados/aliquotas.json
                                      ├─ monta o pedido no formato da Receita
                                      ├─ chama o porte  src/motor/  (mesma conta da oficial, sem rede)
                                      └─ traduz a resposta + memória de cálculo
Resultado.tsx    ◀── JSON ──   { total, cbs, ibs, fundamentação, versões, fontes }
  "Como chegamos nesse número" (T12)
```

| Arquivo | O que faz |
|---|---|
| `src/app/page.tsx` | landing page: calculadora no topo, como funciona, o que muda, transparência, planos, dúvidas (com dados estruturados de FAQ para o Google) |
| `src/components/Calculadora.tsx` | formulário: o que você vende, valor, estado e cidade |
| `src/components/Resultado.tsx` | resultado e a conta aberta, passo a passo |
| `src/motor/` | o porte da calculadora oficial (veja o `README.md` da pasta) |
| `src/lib/motor.ts` | **único** ponto que chama o porte; nunca inventa número |
| `src/app/api/calcular/route.ts` | valida o pedido e chama `lib/motor.ts` |
| `src/app/api/municipios/route.ts` | lista de cidades por estado (tirada das tabelas oficiais, não depende do motor) |
| `src/dados/aliquotas.json` | alíquotas de 2027 com fonte e status (T03) |
| `src/dados/atividades.json` | dicionário "o que você vende?" com 52 atividades (T10) |
| `src/lib/config.ts` | nome do site, preço e itens dos planos |
| `vercel.json` | funções na região de São Paulo (`gru1`) |

## Suposições a revisar

- **Nome provisório "Calcula Reforma"** e domínio em `src/lib/config.ts`. "Impostômetro" já é uma marca conhecida da Associação Comercial de São Paulo, então evitei usar no site. Decisão do T04.
- **Preço R$ 29/mês** é só um marcador. Decisão do T04.
- **Dicionário de atividades:** os 52 códigos calculam na calculadora oficial (o CI confere), mas a escolha do código para cada atividade foi minha. Vale um contador revisar, principalmente as reduções de profissões intelectuais (30%), que têm condições na lei.
- **Termos e privacidade** são rascunhos para revisão de um advogado (T21).
- **Login e assinatura** ainda não existem: o botão "Entrar" explica que as contas abrem em janeiro.

## Variáveis de ambiente

O site não precisa de nenhuma para calcular. Só para a comparação com a oficial:

| Nome | Para quê |
|---|---|
| `CALCULADORA_URL` | endereço da calculadora oficial em Docker (padrão: `http://localhost:8080/api/calculadora`) |
