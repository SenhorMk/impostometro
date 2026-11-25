# impostometro

Site para empresários calcularem os impostos da Reforma Tributária (CBS e IBS a partir de 2027), de forma simples e 100% transparente, usando a calculadora oficial publicada pela Receita Federal.

## Como o projeto está organizado

| Pasta | O que tem | Onde vai rodar |
|---|---|---|
| [`calculadora/`](calculadora/) | A calculadora oficial da Receita empacotada em Docker | Fly.io (São Paulo) |
| [`site/src/dados/aliquotas.json`](site/src/dados/aliquotas.json) | Alíquotas de 2027 que o site vai usar, com fonte e status | junto com o site |
| [`testes-dourados/`](testes-dourados/) | 30 operações de referência que avisam se a Receita mudar algum valor | GitHub Actions |
| `site/` *(em breve)* | O site e a API | Vercel |
| *(em breve)* | Banco de dados e login | Supabase |

## Ligar a calculadora oficial na sua máquina

Precisa do Docker Desktop.

```bash
docker compose up -d --build
./scripts/validar-calculadora.sh
```

Se aparecer `✅ Tudo bateu com o exemplo oficial da Receita.`, está funcionando. A explicação completa, didática, está em [`calculadora/README.md`](calculadora/README.md).

## Créditos e licença de terceiros

A calculadora de tributos é obra da **Receita Federal do Brasil**, distribuída sob a licença MIT
(<https://github.com/ReceitaFederal/calculadora-rtc-regime-regular>). Copyright (c) 2026 Receita Federal do Brasil.
O texto da licença está em [`calculadora/LICENSE-RECEITA-FEDERAL.txt`](calculadora/LICENSE-RECEITA-FEDERAL.txt).
Este projeto usa a calculadora sem modificações.
