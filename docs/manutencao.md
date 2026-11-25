# Manutenção: tarefas comuns

## Atualizar a alíquota (por exemplo, quando o Senado fixar a CBS de 2027)

Arquivo: `site/src/dados/aliquotas.json`.

1. Edite o período (ou crie um novo com `vigenciaInicio` e `vigenciaFim`):
   - `cbs`, `ibsEstadual`, `ibsMunicipal` em %;
   - `status`: `"provisorio"` ou `"oficial"`;
   - `explicacao.cbs` e `explicacao.ibs` em português simples (aparecem na "conta aberta");
   - `fontes`: sempre com link da fonte oficial (Senado, Diário Oficial, Receita).
2. Mude `versaoTabela` para a data de hoje (`AAAA-MM-DD`). Ela aparece em cada resultado.
3. Revise os textos que citam a alíquota: `site/src/app/page.tsx` (seções "O que muda", "Transparência" e as dúvidas frequentes).
4. Rode `python3 testes-dourados/atividades.py` e teste o site localmente.
5. Abra um pull request explicando a mudança e a fonte.

Os testes dourados **não** mudam: eles usam alíquotas fixas de propósito (testam o motor, não a política).

**Pendência conhecida:** a CBS de 2027 (11,2%) é provisória até a resolução do Senado (prazo 15/12/2026). Depois disso, conferir e atualizar.

## Atualizar a versão da calculadora da Receita

A Receita lança versão nova quase toda semana: <https://github.com/ReceitaFederal/calculadora-rtc-regime-regular/tags>.

1. Leia o `CHANGELOG.md` da versão nova.
2. Pegue o hash completo do commit da tag (na página da tag, ou `git ls-remote --tags https://github.com/ReceitaFederal/calculadora-rtc-regime-regular.git`).
3. Troque `CALC_VERSION` e `CALC_COMMIT` em **três lugares**: `docker-compose.yml`, valores padrão no `calculadora/Dockerfile` e a tag da imagem (`impostometro/calculadora:<versão>`) no `docker-compose.yml` e em `.github/workflows/calculadora.yml`.
4. `docker compose up -d --build`, depois:
   ```bash
   ./scripts/validar-calculadora.sh
   python3 testes-dourados/dourados.py
   python3 testes-dourados/atividades.py
   ```
5. Se algum valor mudar: entenda pelo CHANGELOG. Se for correção legítima, regrave com `python3 testes-dourados/dourados.py --gerar` e explique no pull request. Se o exemplo oficial mudar, atualize `scripts/validar-calculadora.sh` e `calculadora/exemplos/`.
6. Se a Receita mudar a lista de municípios, regenere `site/src/dados/municipios.json` (veja o script no histórico do commit que criou o arquivo, ou use `GET /dados-abertos/ufs/municipios?siglaUf=XX`).
7. Depois do merge: `cd calculadora && fly deploy`.

## Adicionar uma atividade ao "o que você vende?"

Arquivo: `site/src/dados/atividades.json`. Cada item:

```json
{"id":"barbearia","nome":"Barbearia","sinonimos":["barbeiro","corte masculino"],"tipo":"nbs","codigo":"126021000","cClassTrib":"000001"}
```

1. Ache o código (NBS para serviço, NCM para produto) nas tabelas oficiais. Com a calculadora ligada:
   - lista de NBS: `GET http://localhost:8080/api/calculadora/dados-abertos/nbs/lista?data=2027-03-10`;
   - classificações e reduções: `GET .../dados-abertos/classificacoes-tributarias/cbs-ibs?data=2027-03-10`.
2. Escolha o cClassTrib (`000001` = tributação integral; reduções em `200xxx`). Na dúvida, confirme com um contador.
3. Rode `python3 testes-dourados/atividades.py`: ele confere se a combinação calcula.
4. Teste a busca no site.

## Rodar tudo do zero numa máquina nova

```bash
git clone https://github.com/SenhorMk/impostometro.git && cd impostometro
docker compose up -d --build && ./scripts/validar-calculadora.sh
cd site && cp .env.example .env.local && npm install && npm run dev
```
