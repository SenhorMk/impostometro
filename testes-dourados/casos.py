"""
Lista das 30 operações de referência ("testes dourados").

Cada caso é uma venda de 1 item. As alíquotas são FIXAS (8,8% CBS, 0,05% IBS UF,
0,05% IBS Mun, as mesmas do exemplo oficial da Receita) de propósito: aqui
testamos o MOTOR, não a política de alíquotas. Assim, quando o Senado fixar a
alíquota de 2027 (ver dados/aliquotas.json), estes testes continuam valendo.

Campos: id, descrição, cClassTrib, ncm OU nbs, base (R$), município IBGE, UF,
e "esperado_estado" (o que o motor deve responder).
"""

# Municípios usados (código IBGE)
SP, RJ, BH, POA, REC = (3550308, "SP"), (3304557, "RJ"), (3106200, "MG"), (4314902, "RS"), (2611606, "PE")

CASOS = [
    # --- Alíquota cheia (tributação integral, cClassTrib 000001) ---------------
    ("01", "Camiseta de algodão (produto, alíquota cheia)",      "000001", "ncm", "61091000",   100.00, SP),
    ("02", "Notebook (produto, alíquota cheia)",                  "000001", "ncm", "84713012",  4599.90, RJ),
    ("03", "Móveis de madeira (produto, alíquota cheia)",         "000001", "ncm", "94036000",  1850.00, BH),
    ("04", "Celular (produto, alíquota cheia)",                   "000001", "ncm", "85171300",  2399.00, POA),
    ("05", "Desenvolvimento de software pronto (serviço, alíquota cheia)", "000001", "nbs", "115021000",  3000.00, SP),
    ("06", "Software sob encomenda (serviço, alíquota cheia)",   "000001", "nbs", "115022000",   750.00, REC),
    ("07", "Centavos: venda de R$ 0,99 com alíquota cheia",       "000001", "ncm", "61091000",     0.99, SP),
    ("08", "Valor alto: R$ 1.000.000,00 com alíquota cheia",      "000001", "ncm", "84713012", 1000000.00, SP),
    # --- Redução de 60% ----------------------------------------------------------
    ("09", "Pré-escola, R$ 1.200 (exemplo oficial da Receita)",               "200028", "nbs", "122011200",  1200.00, POA),
    ("10", "Pré-escola, mensalidade de R$ 850,00",                  "200028", "nbs", "122011200",   850.00, SP),
    ("11", "Serviço cirúrgico (saúde humana, redução 60%)",                 "200029", "nbs", "123011100",   320.00, RJ),
    ("12", "Dispositivo médico (produto, redução 60%)",           "200030", "ncm", "90183111",    45.50, BH),
    ("13", "Medicamento (produto, redução 60%)",                  "200032", "ncm", "30049099",    89.90, SP),
    ("14", "Sabonete (higiene pessoal, redução 60%)",             "200035", "ncm", "34011190",     4.79, REC),
    ("15", "Escova de dentes (higiene pessoal, redução 60%)",     "200035", "ncm", "96032100",    12.90, POA),
    ("16", "Bovino vivo (agropecuário, redução 60%)",             "200036", "ncm", "01022990",  5200.00, BH),
    # --- Outras reduções ------------------------------------------------------------
    ("17", "Locação de imóvel residencial (redução 70%)",                     "200027", "nbs", "110021000",  2500.00, SP),
    ("18", "Diária de hotel (hotelaria, redução 40%)",            "200048", "nbs", "103031100",   480.00, RJ),
    ("19", "Advocacia criminal (profissão intelectual, redução 30%)",                 "200052", "nbs", "113011000",  5000.00, SP),
    ("20", "Contabilidade (profissão intelectual, redução 30%)",  "200052", "nbs", "113022100",  1234.56, POA),
    # --- Redução de 100% (alíquota zero) ------------------------------------------
    ("21", "Arroz da cesta básica (redução 100%)",                "200003", "ncm", "10063021",   100.00, POA),
    ("22", "Leite (cesta básica, redução 100%)",                  "200003", "ncm", "04011010",    59.40, SP),
    ("23", "Tomate (hortícolas, redução 100%)",                   "200014", "ncm", "07020000",    35.00, BH),
    ("24", "Banana (frutas, redução 100%)",                       "200014", "ncm", "08039000",    18.00, REC),
    ("25", "Ovos (redução 100%)",                                 "200014", "ncm", "04072100",    22.90, RJ),
    ("26", "Absorvente higiênico (redução 100%)",                 "200013", "ncm", "96190000",    15.90, SP),
    ("27", "Medicamento da lista de redução 100%",                "200009", "ncm", "30049099",   120.00, SP),
    # --- Sem alíquota (imunidade) ----------------------------------------------
    ("28", "Livro (imune, sem alíquota)",                         "410008", "ncm", "49019900",    69.90, SP),
    # --- Erros esperados (o motor deve recusar o item) ------------------------
    ("29", "ERRO: queijo não está no anexo do cClassTrib 200034", "200034", "ncm", "04061010",    40.00, SP),
    ("30", "ERRO: NBS de educação errada para 200028",            "200028", "nbs", "122012100",   900.00, SP),
]

ALIQUOTAS_TESTE = {"cbs": 8.8, "ibsEstadual": 0.05, "ibsMunicipal": 0.05}
DATA = "2027-03-10T10:00:00-03:00"


def montar_entrada(caso):
    cid, _desc, cclass, tipo, codigo, base, (mun, uf) = caso
    item = {
        "numero": 1,
        tipo: codigo,
        "cst": cclass[:3],          # o CST são os 3 primeiros dígitos do cClassTrib
        "cClassTrib": cclass,
        "baseCalculo": base,
        "aliquotasNominais": ALIQUOTAS_TESTE,
    }
    if tipo == "ncm":
        item.update({"quantidade": 1, "unidade": "UN"})
    return {"id": f"dourado-{cid}", "versao": "1.0.0", "dhFatoGerador": DATA,
            "municipio": mun, "uf": uf, "itens": [item]}
