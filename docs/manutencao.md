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

Os testes dourados **não** mudam: eles usam alíquotas fixas de propósito (testam o motor, não a política). O porte também não muda: as alíquotas do site são informadas a ele em cada pedido.

**Pendência conhecida:** a CBS de 2027 (11,2%) é provisória até a resolução do Senado (prazo 15/12/2026). Depois disso, conferir e atualizar.

## Atualizar a versão da calculadora da Receita (e o porte)

A Receita lança versão nova quase toda semana: <https://github.com/ReceitaFederal/calculadora-rtc-regime-regular/tags>.

O site **não** usa o Java da Receita: usa o porte em TypeScript (`site/src/motor/`). Então atualizar tem duas partes: subir a versão oficial no Docker (a referência) e trazer as mudanças para o porte, até as duas responderem igual. Este passo a passo foi escrito para um agente seguir sozinho.

### 1. Ver o que mudou

1. Leia o `CHANGELOG.md` da versão nova.
2. Veja a diferença de código entre a versão atual e a nova (troque as versões):
   ```bash
   git clone https://github.com/ReceitaFederal/calculadora-rtc-regime-regular.git /tmp/receita && cd /tmp/receita
   git diff 1.7.2 <nova> --stat
   git diff 1.7.2 <nova> -- src/main/java/br/gov/serpro/rtc/domain/service/ src/main/java/br/gov/serpro/rtc/api/model/ src/main/resources/db/
   ```
   O que importa para o porte:
   - `domain/service/` (regras de cálculo, validações, memória de cálculo);
   - `api/model/` (campos de entrada e de saída, mensagens de validação);
   - `db/migration/` (tabelas: alíquotas, classificações, **fórmulas** na tabela `TRATAMENTO_TRIBUTARIO`).

   Mudança só nas tabelas (o caso mais comum) não exige mexer no código do porte: basta exportar de novo (passo 3).

### 2. Subir a versão oficial (referência)

1. Pegue o hash completo do commit da tag (`git ls-remote --tags https://github.com/ReceitaFederal/calculadora-rtc-regime-regular.git`).
2. Troque a versão e o hash em: `calculadora/Dockerfile` (`CALC_VERSION` e `CALC_COMMIT`, nas duas etapas), `docker-compose.yml` (tag da imagem) e `.github/workflows/calculadora.yml` (tag da imagem).
3. `docker compose up -d --build`.

### 3. Atualizar o porte

1. Exporte as tabelas do banco oficial novo: `cd site && npm run porte:tabelas`.
2. Mude `VERSAO_CALCULADORA` e `COMMIT_CALCULADORA` em `site/src/motor/versao.ts`.
3. Traduza as mudanças de código do passo 1, arquivo por arquivo. O mapa Java → TypeScript está em [`site/src/motor/README.md`](../site/src/motor/README.md). Regras:
   - traduza **linha a linha**, mantendo a mesma ordem das checagens e os mesmos textos de erro (a comparação confere até as mensagens);
   - toda conta com `Dec` (`decimal.js`), nunca com `number`; arredondamento HALF_EVEN, como no Java;
   - não "melhore" nem "corrija" a lógica da Receita: o porte tem que errar igual a ela, se ela errar.
4. Salve a resposta oficial do exemplo da Receita com o nome da versão nova:
   ```bash
   curl -s -X POST http://localhost:8080/api/calculadora/observabilidade/regime-geral \
     -H 'Content-Type: application/json' -d @calculadora/exemplos/operacao-oficial.json \
     | jq 'del(.timestamp, .instance)' > calculadora/exemplos/resposta-oficial-<nova>.json
   ```
   (Confira o formato com o arquivo da versão anterior; `npm test` usa este arquivo.)

### 4. Conferir

```bash
./scripts/validar-calculadora.sh             # exemplo oficial na oficial
python3 testes-dourados/dourados.py          # 30 operações na oficial
python3 testes-dourados/atividades.py        # dicionário do site na oficial
cd site
npm run porte:comparar                       # porte × oficial: precisa dar 100% IDÊNTICO
npm test                                     # porte sem Docker
npm run lint && npx next typegen && npx tsc --noEmit && npm run build
```

- Se `porte:comparar` mostrar diferença, o porte ainda não está igual: ache a mudança no Java e traduza. **Nunca** mude o teste para aceitar a diferença.
- Se um valor dos dourados mudar na oficial: entenda pelo CHANGELOG. Se for correção legítima, regrave com `python3 testes-dourados/dourados.py --gerar` e explique no pull request. Se o exemplo oficial mudar, atualize `scripts/validar-calculadora.sh`.
- Se a Receita criar um caso novo (campo, tipo de alíquota, grupo), acrescente pedidos que o usem em `site/scripts/porte/comparar.ts`.
- Se a Receita mudar a lista de municípios, regenere `site/src/dados/municipios.json` (`GET /dados-abertos/ufs/municipios?siglaUf=XX` na oficial).

### 5. Publicar

Abra o pull request explicando o que mudou na Receita e no porte. A CI repete a comparação com a imagem oficial. Depois do merge, a Vercel publica sozinha: não há servidor da calculadora para atualizar.

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
cd site && npm install && npm test && npm run dev     # o site já calcula sozinho
# opcional, para conferir o porte contra a oficial:
cd .. && docker compose up -d --build && ./scripts/validar-calculadora.sh && cd site && npm run porte:comparar
```
