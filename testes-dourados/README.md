# Testes dourados (T02)

30 vendas com resultado conhecido. Servem de alarme: se uma versão nova da calculadora da Receita mudar qualquer valor, mesmo um centavo, o teste falha e mostra qual operação mudou.

```bash
docker compose up -d                       # liga a calculadora
python3 testes-dourados/dourados.py        # confere as 30
```

## O que tem aqui

| Arquivo | Para que serve |
|---|---|
| [`casos.py`](casos.py) | a lista das 30 operações (o que vende, código, valor, cidade) |
| [`esperados/`](esperados/) | um arquivo por operação, com a entrada enviada e a resposta esperada |
| [`dourados.py`](dourados.py) | manda as 30 para a calculadora e compara |

## O que as 30 cobrem

| Grupo | Casos | Exemplo |
|---|---|---|
| Alíquota cheia, produto (NCM) e serviço (NBS) | 01 a 08 | notebook, software, R$ 0,99, R$ 1 milhão |
| Redução de 60% | 09 a 16 | pré-escola, cirurgia, medicamento, sabonete |
| Reduções de 70%, 40% e 30% | 17 a 20 | aluguel residencial, hotel, advocacia, contabilidade |
| Redução de 100% | 21 a 27 | arroz, leite, tomate, banana, ovos, absorvente |
| Imune (sem alíquota) | 28 | livro |
| Erros que o motor deve recusar | 29 e 30 | código que não combina com a classificação |

## Por que as alíquotas são fixas (8,8% / 0,05% / 0,05%)

Aqui testamos o **motor**, não a política de alíquotas. Usamos as mesmas do exemplo oficial da Receita para que estes testes não mudem quando o Senado fixar a alíquota de 2027. A alíquota que o site vai usar de verdade fica em [`dados/aliquotas.json`](../dados/aliquotas.json).

## O que foi conferido à mão

Seis casos (09, 11, 17, 18, 19 e 21) têm uma conferência extra, feita sem depender do motor:

- a redução aplicada tem que ser a da lei (60% educação e saúde, 70% locação, 40% hotelaria, 30% profissões intelectuais, 100% cesta básica);
- a conta `base × alíquota × (1 − redução)`, arredondada em centavos, tem que dar exatamente o valor do motor.

Exemplo, caso 17 (aluguel de R$ 2.500): 2.500 × 8,8% × (1 − 70%) = 2.500 × 2,64% = **R$ 66,00**.

Suposição: não houve revisão por contador ainda. Vale pedir para um contador parceiro olhar estes seis.

## Quando a Receita lançar versão nova

1. Atualize a versão da calculadora (ver [`calculadora/README.md`](../calculadora/README.md)).
2. Rode `python3 testes-dourados/dourados.py`.
3. Se algo mudar, leia o CHANGELOG da Receita. Se a mudança for legítima, regrave com `python3 testes-dourados/dourados.py --gerar` e explique no pull request.
