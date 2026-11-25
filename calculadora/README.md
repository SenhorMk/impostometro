# Calculadora oficial da Receita, empacotada em Docker

Esta pasta transforma a **calculadora oficial da Reforma Tributária** (CBS, IBS e Imposto Seletivo), publicada pela Receita Federal no GitHub, num container que qualquer pessoa liga com um comando e que sempre dá o mesmo resultado.

- Código original: <https://github.com/ReceitaFederal/calculadora-rtc-regime-regular>
- Versão empacotada: **1.7.2** (commit `39363aa`), com tabelas oficiais **V0073** de 09/11/2026
- Licença: **MIT**, Copyright (c) 2026 Receita Federal do Brasil. A cópia está em [`LICENSE-RECEITA-FEDERAL.txt`](LICENSE-RECEITA-FEDERAL.txt) e também vai dentro da imagem, em `/app/LICENSE-RECEITA-FEDERAL.txt`.

> Nós **não alteramos uma linha** do código da Receita. Só compilamos e empacotamos.
>
> **Papel desta pasta hoje: referência.** O site não chama este container. Ele usa um porte fiel da calculadora em TypeScript ([`site/src/motor/`](../site/src/motor/README.md)), que roda dentro do próprio site. Este container oficial roda no seu computador e na CI para conferir que o porte dá exatamente a mesma resposta (`cd site && npm run porte:comparar`, 1.519 pedidos), e é de onde saem as tabelas do porte (`npm run porte:tabelas`). Esta página continua valendo para entender como a calculadora oficial funciona, porque o porte segue a mesma lógica.

---

## 1. Como a calculadora funciona (a visão de cima)

A calculadora oficial **não é uma biblioteca** que dê para importar no site. Ela é um **servidor**: um programa Java que fica ligado esperando perguntas. Quem chama manda os dados de uma venda em JSON e ela devolve os impostos em JSON. (Por isso fizemos o porte: a mesma lógica, em TypeScript, como uma função que o site chama direto.)

```
  Quem chama (testes, CI)                  Calculadora (este container)
  ───────────────────────                  ────────────────────────────
  dados de uma venda          ── JSON ──▶  POST /api/calculadora/observabilidade/regime-geral
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
- `9101`: saúde (<http://localhost:9101/health>) e métricas. É o endereço que diz se o container está vivo.

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

## 6. Medições (T01)

Medido em 25/11/2026, versão 1.7.2, máquina de 4 núcleos, com o container já aquecido:

| Situação | Tempo por cálculo | Memória do container |
|---|---|---|
| Em repouso, logo depois de ligar | — | ~560 MB (sem limite) |
| 50 cálculos seguidos, 1 item | média 12 ms, pior 22 ms | ~610 MB |
| 50 cálculos seguidos, 4 itens | média 13 ms, pior 25 ms | ~610 MB |
| 50 cálculos, 10 ao mesmo tempo | média 57 ms, pior 102 ms | ~660 MB (pico) |
| Limitado a 512 MB | os mesmos resultados, validação passou | ~440 MB de 512 MB |

Leitura: o Java ocupa a memória que encontrar livre, por isso sem limite ele passa de 600 MB. Com o teto de 512 MB ele funciona, mas sem folga. **Recomendação: 1 GB** no Fly.io (o backlog estimava 2 GB, dá para economizar). O cálculo em si é rápido: o que vai pesar no tempo total é a rede entre a Vercel e o Fly.io.

## 7. Produção

Este container **não vai para produção**. O site usa o porte em TypeScript (veja a seção do topo e [`docs/decisoes.md`](../docs/decisoes.md)). Uma versão anterior do projeto rodava este container no Fly.io atrás de um porteiro com chave; esses arquivos foram apagados e estão no histórico do git, caso um dia sejam úteis.

O `Dockerfile` tem duas etapas: `build` (compila) e `runtime` (a calculadora pura, usada no `docker compose` e na CI).

Aviso esperado nos logs: a calculadora tenta consultar a versão do simulador online do governo (`piloto-cbs.tributos.gov.br`) para comparar. Se não conseguir, só registra um aviso e continua funcionando.

## 8. Se você compila atrás de um proxy corporativo

Normalmente isto não se aplica. Se o build falhar com erro de certificado (`PKIX path building failed`):

- coloque o certificado do proxy, em formato `.crt` (um certificado por arquivo), na pasta [`certs/`](certs/). Arquivos `.crt` ali são ignorados pelo git;
- passe o proxy para o Maven: `--build-arg MAVEN_OPTS="-Dhttps.proxyHost=... -Dhttps.proxyPort=..."`.

As imagens base também podem ser trocadas, por exemplo para um espelho do Docker Hub: `--build-arg BUILD_IMAGE=mirror.gcr.io/library/maven:3.9-eclipse-temurin-25 --build-arg JRE_IMAGE=mirror.gcr.io/library/eclipse-temurin:25-jre`.
