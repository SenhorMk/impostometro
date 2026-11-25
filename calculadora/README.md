# Calculadora oficial da Receita, empacotada em Docker

Esta pasta transforma a **calculadora oficial da Reforma Tributária** (CBS, IBS e Imposto Seletivo), publicada pela Receita Federal no GitHub, num container que qualquer pessoa liga com um comando e que sempre dá o mesmo resultado.

- Código original: <https://github.com/ReceitaFederal/calculadora-rtc-regime-regular>
- Versão empacotada: **1.7.2** (commit `39363aa`), com tabelas oficiais **V0073** de 09/11/2026
- Licença: **MIT**, Copyright (c) 2026 Receita Federal do Brasil. A cópia está em [`LICENSE-RECEITA-FEDERAL.txt`](LICENSE-RECEITA-FEDERAL.txt) e também vai dentro da imagem, em `/app/LICENSE-RECEITA-FEDERAL.txt`.

> Nós **não alteramos uma linha** do código da Receita. Só compilamos e empacotamos. Isso é o que garante a transparência: o número que o site mostra é o número que o motor oficial calculou.

---

## 1. Como a calculadora funciona (a visão de cima)

A calculadora **não é uma biblioteca** que a gente importa no site. Ela é um **servidor**: um programa Java que fica ligado esperando perguntas. O site manda os dados de uma venda em JSON e ela devolve os impostos em JSON.

```
  Site (Next.js na Vercel)                 Calculadora (este container, no Fly.io)
  ───────────────────────                  ──────────────────────────────────────
  empresário digita a venda   ── JSON ──▶  POST /api/calculadora/observabilidade/regime-geral
                                                 │
                                                 ├─ confere NCM/NBS, CST, cClassTrib
                                                 ├─ busca a redução da tabela oficial (SQLite)
                                                 └─ calcula CBS, IBS e IS + "memória de cálculo"
  mostra o resultado          ◀── JSON ──  { vCBS: "42.24", vIBS: "0.48", ... }
```

Ela tem três peças:

| Peça | O que é | Onde fica no container |
|---|---|---|
| Servidor Java (Spring Boot) | o programa que recebe e responde | `/app/app.jar` |
| Banco SQLite | as tabelas oficiais: alíquotas, reduções, NCM, NBS, classificações | `/app/calculadora/db/calculadora-pro.db` |
| Java 25 | o "motor" que roda o programa | já vem na imagem base |

O banco é gerado durante o build a partir dos scripts SQL oficiais (ferramenta Flyway). Ele abre **somente leitura**: a calculadora nunca grava nada, então não guarda dado de cliente nenhum.

## 2. O que o Dockerfile faz, passo a passo

Arquivo: [`Dockerfile`](Dockerfile)

1. **Baixa o código oficial numa versão fixa.** Usa a tag `1.7.2` e confere o hash do commit. Se alguém mudar a tag no GitHub, o build falha em vez de pegar outra coisa sem avisar.
2. **Gera o banco** com `mvn flyway:migrate`. São mais de 70 scripts SQL da Receita com as tabelas.
3. **Compila o servidor** com `mvn package`, gerando o `.jar`.
4. **Monta a imagem final** só com o Java de execução, o `.jar`, o banco e a licença. Roda com um usuário sem privilégios.

As portas:

- `8080`: a API. A documentação interativa (Swagger) fica em <http://localhost:8080/api/swagger-ui.html>.
- `9101`: saúde (<http://localhost:9101/health>) e métricas. É o endereço que o Fly.io vai usar para saber se o container está vivo.

## 3. Como rodar na sua máquina

Você precisa do **Docker Desktop** instalado. Na raiz do repositório:

```bash
docker compose up -d --build          # 1ª vez: uns 5 minutos (baixa e compila)
./scripts/validar-calculadora.sh      # confere o exemplo oficial
docker compose down                   # desliga
```

O script de validação precisa de `curl` e `jq`. No Windows, rode pelo **Git Bash** ou pelo **WSL**.

Depois que estiver no ar, você pode brincar pelo navegador no Swagger (link acima) ou mandar o exemplo direto:

```bash
curl -X POST http://localhost:8080/api/calculadora/observabilidade/regime-geral \
  -H 'Content-Type: application/json' \
  -d @calculadora/exemplos/operacao-oficial.json
```

## 4. A validação: o exemplo oficial bate?

O arquivo [`exemplos/operacao-oficial.json`](exemplos/operacao-oficial.json) é copiado sem mudanças da documentação da Receita (`docs/exemplos.md`). É uma venda com 4 itens:

| Item | O que é | O que deve acontecer |
|---|---|---|
| 1 | Arroz (cesta básica) | redução de 100%, imposto zero |
| 2 | Cerveja | tem Imposto Seletivo de R$ 15,00 |
| 3 | **Serviço de educação, R$ 1.200,00** | redução de 60%, **CBS de R$ 42,24** |
| 4 | Item com erro proposital | a calculadora recusa só este item (erro `REG-011`) |

**Resultado em 25/11/2026: todos os 11 valores conferidos bateram.** A resposta completa, com a memória de cálculo, está em [`exemplos/resposta-oficial-1.7.2.json`](exemplos/resposta-oficial-1.7.2.json).

### A conta do item 3, na mão

É isso que a calculadora faz por dentro, e é o tipo de explicação que o site deve mostrar ao cliente:

```
Base de cálculo ............................ R$ 1.200,00
Alíquota da CBS informada .................. 8,80 %
Redução para educação (Art. 129, LC 214) ... 60 %   → paga 40% da alíquota
Alíquota efetiva ........................... 8,80 % × 40 % = 3,52 %
CBS ........................................ R$ 1.200,00 × 3,52 % = R$ 42,24

IBS estadual  0,05 % × 40 % = 0,02 %  → R$ 0,24
IBS municipal 0,05 % × 40 % = 0,02 %  → R$ 0,24
IBS total ................................................ R$ 0,48
```

A própria calculadora devolve esse raciocínio em texto, no campo `memoriaCalculo`:

> "Operação de consumo com enquadramento legal em Art. 129, tributada conforme Alíquota reduzida em 60%. A base de cálculo utilizada é de R$ 1.200,00, com alíquota de 8,80%, sendo que esse regime define uma redução de 60,00% na alíquota."

### Três coisas importantes que o exemplo ensina

1. **Em 2027 quem informa a alíquota é quem chama.** A calculadora só tem alíquotas de referência cadastradas até 2026. Para datas a partir de 2027, o campo `aliquotasNominais` é obrigatório, e o resultado vem marcado como `CALCULO_SIMULADO`. Os 8,8% do exemplo são da documentação da Receita, não a alíquota definitiva. O nosso site vai ter que decidir e mostrar com clareza qual alíquota está usando.
2. **A resposta é HTTP 200 mesmo com erro num item.** Por isso o site sempre tem que olhar o `estadoItem` de cada item: `CALCULADO`, `CALCULO_SIMULADO`, `INCONSISTENCIA_ENTRADA`, `NAO_IMPLEMENTADO` ou `FALHA_TECNICA`.
3. **Os totais somam só os itens que deram certo.** O item 4 ficou de fora do total de CBS (R$ 56,76).

## 5. Como atualizar quando a Receita lançar versão nova

A Receita atualiza quase toda semana, e às vezes muda centavos. Para subir de versão:

1. Veja a nova tag em <https://github.com/ReceitaFederal/calculadora-rtc-regime-regular/tags> e copie o hash completo do commit dela.
2. Troque `CALC_VERSION` e `CALC_COMMIT` no [`docker-compose.yml`](../docker-compose.yml) (e os valores padrão no `Dockerfile`).
3. Rode `docker compose up -d --build` e `./scripts/validar-calculadora.sh`.
4. Se algum valor mudar, leia o `CHANGELOG.md` da Receita antes de aceitar. Pode ser correção legítima, e aí atualizamos o valor esperado no script.

O GitHub Actions ([`.github/workflows/calculadora.yml`](../.github/workflows/calculadora.yml)) faz os passos 3 e 4 sozinho a cada mudança nesta pasta.

## 6. Próximo passo: colocar no Fly.io

Notas para o ticket de deploy (ainda não feito aqui):

- **Memória:** com 512 MB funciona, mas usa uns 440 MB. Recomendo **1 GB** para ter folga.
- **Health check:** `GET http://<host>:9101/health` deve responder `"status":"UP"`.
- **Região:** `gru` (São Paulo).
- **Aviso esperado nos logs:** a calculadora tenta consultar a versão do simulador online do governo (`piloto-cbs.tributos.gov.br`) para comparar. Se não conseguir, só registra um aviso e continua funcionando normalmente.
- A calculadora **não deve ficar aberta para a internet toda**: só o nosso backend na Vercel deve chamá-la (proteger com rede privada ou um token). Isso entra no ticket de deploy.

## 7. Se você compila atrás de um proxy corporativo

Normalmente isto não se aplica. Se o build falhar com erro de certificado (`PKIX path building failed`):

- coloque o certificado do proxy, em formato `.crt` (um certificado por arquivo), na pasta [`certs/`](certs/). Arquivos `.crt` ali são ignorados pelo git;
- passe o proxy para o Maven: `--build-arg MAVEN_OPTS="-Dhttps.proxyHost=... -Dhttps.proxyPort=..."`.

As imagens base também podem ser trocadas, por exemplo para um espelho do Docker Hub: `--build-arg BUILD_IMAGE=mirror.gcr.io/library/maven:3.9-eclipse-temurin-25 --build-arg JRE_IMAGE=mirror.gcr.io/library/eclipse-temurin:25-jre`.
