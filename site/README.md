# Site (Next.js)

A landing page que já é a calculadora, e a API que conversa com a calculadora oficial da Receita.

## Rodar no seu computador

```bash
docker compose up -d          # na raiz: liga a calculadora oficial (porta 8080)
cd site
cp .env.example .env.local    # endereço da calculadora
npm install
npm run dev                   # abre em http://localhost:3000
```

## Como as peças se encaixam

```
Navegador                          Vercel (este site)                         Fly.io
─────────                          ──────────────────                         ──────
Calculadora.tsx  ── POST ──▶  /api/calcular (route.ts)
  busca local no                 └─ lib/motor.ts  (T08)
  dicionário (T10)                    ├─ escolhe as alíquotas em dados/aliquotas.json
                                      ├─ monta o pedido no formato da Receita   ── POST ──▶  calculadora oficial
                                      └─ traduz a resposta + memória de cálculo ◀── JSON ──
Resultado.tsx    ◀── JSON ──   { total, cbs, ibs, fundamentação, versões, fontes }
  "Como chegamos nesse número" (T12)
```

| Arquivo | O que faz |
|---|---|
| `src/app/page.tsx` | landing page: calculadora no topo, como funciona, o que muda, transparência, planos, dúvidas (com dados estruturados de FAQ para o Google) |
| `src/components/Calculadora.tsx` | formulário: o que você vende, valor, estado e cidade |
| `src/components/Resultado.tsx` | resultado e a conta aberta, passo a passo |
| `src/lib/motor.ts` | **único** ponto que fala com a calculadora oficial; nunca inventa número |
| `src/app/api/calcular/route.ts` | valida o pedido e chama `lib/motor.ts` |
| `src/app/api/municipios/route.ts` | lista de cidades por estado (tirada das tabelas oficiais, não depende do motor) |
| `src/dados/aliquotas.json` | alíquotas de 2027 com fonte e status (T03) |
| `src/dados/atividades.json` | dicionário "o que você vende?" com 52 atividades (T10) |
| `src/lib/config.ts` | nome do site, preço e itens dos planos |

## Suposições a revisar

- **Nome provisório "Calcula Reforma"** e domínio em `src/lib/config.ts`. "Impostômetro" já é uma marca conhecida da Associação Comercial de São Paulo, então evitei usar no site. Decisão do T04.
- **Preço R$ 29/mês** é só um marcador. Decisão do T04.
- **Dicionário de atividades:** os 52 códigos calculam na calculadora oficial (o CI confere), mas a escolha do código para cada atividade foi minha. Vale um contador revisar, principalmente as reduções de profissões intelectuais (30%), que têm condições na lei.
- **Termos e privacidade** são rascunhos para revisão de um advogado (T21).
- **Login e assinatura** ainda não existem: o botão "Entrar" explica que as contas abrem em janeiro.

## Variáveis de ambiente

| Nome | Para quê |
|---|---|
| `MOTOR_URL` | endereço da calculadora oficial (padrão: `http://localhost:8080/api/calculadora`) |
| `MOTOR_CHAVE` | chave que o proxy da calculadora vai exigir em produção (T05) |
