# Colocar no ar (T05 e T06)

Só a **Vercel** (e depois um domínio). Não existe servidor da calculadora para subir: ela roda dentro do site (porte em TypeScript, veja [`arquitetura.md`](arquitetura.md)). O Supabase entra quando o login for implementado (T13).

> Custos aproximados (novembro de 2026): Vercel Hobby grátis no desenvolvimento, mas **não permite uso comercial**, então o plano Pro (US$ 20/mês) entra quando a assinatura abrir; Supabase grátis no começo (pausa após 7 dias sem uso, sem backup), Pro US$ 25/mês depois. O servidor Java no Fly.io (~US$ 6,70/mês) **não é mais necessário**.

## 1. Site na Vercel

1. Em <https://vercel.com/new>, importe o repositório `SenhorMk/impostometro`.
2. **Root Directory: `site`**. O framework (Next.js) é detectado sozinho.
3. Não precisa de nenhuma variável de ambiente para calcular: a calculadora roda dentro do site.
4. Deploy. As funções rodam em São Paulo (`site/vercel.json` → `gru1`).
5. A partir daí, cada push na `main` publica sozinho, e cada pull request ganha um endereço de prévia.

## 2. Domínio

1. Compre o domínio no Registro.br (decisão do T04).
2. Na Vercel: Project → Settings → Domains → adicione `seudominio.com.br` e `www.seudominio.com.br` (redirecionando para o principal).
3. No Registro.br, aponte o DNS como a Vercel indicar. O HTTPS é automático.
4. Atualize `SITE.dominio` em `site/src/lib/config.ts`.

## 3. Supabase (quando o login for feito, T13)

Planejado:
- projeto na região **South America (São Paulo)**;
- Auth: Google e link mágico por e-mail;
- Storage: bucket **privado** `xmls`, com arquivos apagados após a leitura;
- variáveis na Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e, só no servidor, `SUPABASE_SERVICE_ROLE_KEY`.

## Variáveis de ambiente (todas)

| Variável | Onde | Para quê |
|---|---|---|
| `CALCULADORA_URL` | quem roda os testes | endereço da calculadora oficial em Docker para `npm run porte:comparar` e `testes-dourados/*.py` (padrão: `http://localhost:8080/api/calculadora`) |
| `MOTOR_CHAVE` | quem roda os testes (opcional) | só se a calculadora oficial estiver atrás de um porteiro com chave. Normalmente vazia |

O site em produção não usa nenhuma das duas.
