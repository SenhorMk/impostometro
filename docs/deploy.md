# Colocar no ar (T05 e T06)

Três serviços. Faça na ordem: **Fly.io → Vercel → domínio**. O Supabase entra quando o login for implementado (T13).

> Custos aproximados (novembro de 2026): Fly.io 1 GB sempre ligado ~US$ 6,70/mês (sem plano grátis, só teste de 7 dias); Vercel Hobby grátis no desenvolvimento, mas **não permite uso comercial**, então o plano Pro (US$ 20/mês) entra quando a assinatura abrir; Supabase grátis no começo (pausa após 7 dias sem uso, sem backup), Pro US$ 25/mês depois.

## 1. Calculadora no Fly.io

Pré-requisito: conta no Fly.io com cartão e o programa `fly` instalado (<https://fly.io/docs/flyctl/install/>).

```bash
cd calculadora
fly auth login
fly apps create calculadora-reforma-motor        # ou outro nome; ajuste "app" no fly.toml
fly secrets set MOTOR_CHAVE=$(openssl rand -hex 32)   # guarde este valor: vai para a Vercel
fly deploy                                       # usa fly.toml: São Paulo, 1 GB, sempre ligado
```

Conferir:

```bash
curl https://calculadora-reforma-motor.fly.dev/saude          # {"status":"UP"...}
curl -i https://calculadora-reforma-motor.fly.dev/api/calculadora/dados-abertos/versao   # 401 (sem chave)
MOTOR_CHAVE=<a chave> ./scripts/validar-calculadora.sh https://calculadora-reforma-motor.fly.dev/api/calculadora
```

Como funciona a proteção: a imagem `producao` (última etapa do `calculadora/Dockerfile`) roda o Caddy na porta 8000 na frente da calculadora. Sem o cabeçalho `Authorization: Bearer <MOTOR_CHAVE>`, a resposta é 401. O container nem sobe se `MOTOR_CHAVE` tiver menos de 32 caracteres.

Trocar a chave: `fly secrets set MOTOR_CHAVE=<nova>` e atualizar a mesma variável na Vercel.

## 2. Site na Vercel

1. Em <https://vercel.com/new>, importe o repositório `SenhorMk/impostometro`.
2. **Root Directory: `site`**. O framework (Next.js) é detectado sozinho.
3. Variáveis de ambiente (Production e Preview):

| Nome | Valor |
|---|---|
| `MOTOR_URL` | `https://calculadora-reforma-motor.fly.dev/api/calculadora` |
| `MOTOR_CHAVE` | a mesma chave do `fly secrets set` |

4. Deploy. As funções rodam em São Paulo (`site/vercel.json` → `gru1`).
5. A partir daí, cada push na `main` publica sozinho, e cada pull request ganha um endereço de prévia.

## 3. Domínio

1. Compre o domínio no Registro.br (decisão do T04).
2. Na Vercel: Project → Settings → Domains → adicione `seudominio.com.br` e `www.seudominio.com.br` (redirecionando para o principal).
3. No Registro.br, aponte o DNS como a Vercel indicar. O HTTPS é automático.
4. Atualize `SITE.dominio` em `site/src/lib/config.ts`.

## 4. Supabase (quando o login for feito, T13)

Planejado:
- projeto na região **South America (São Paulo)**;
- Auth: Google e link mágico por e-mail;
- Storage: bucket **privado** `xmls`, com arquivos apagados após a leitura;
- variáveis na Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e, só no servidor, `SUPABASE_SERVICE_ROLE_KEY`.

## 5. Deploy automático da calculadora (T06, a fazer)

Hoje o `fly deploy` é manual. O próximo passo é um workflow do GitHub Actions que roda `fly deploy` quando a pasta `calculadora/` mudar na `main`, usando o segredo `FLY_API_TOKEN` (criado com `fly tokens create deploy`).

## Variáveis de ambiente (todas)

| Variável | Onde | Para quê |
|---|---|---|
| `MOTOR_URL` | Vercel, `site/.env.local` | endereço da calculadora (local: `http://localhost:8080/api/calculadora`) |
| `MOTOR_CHAVE` | Vercel e `fly secrets` | chave do porteiro da calculadora. Vazia no computador local |
| `CALCULADORA_URL` | quem roda os testes | URL da calculadora para `testes-dourados/*.py` (padrão: local) |
