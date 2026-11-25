#!/usr/bin/env python3
"""
Confere o dicionário "o que você vende?" (site/src/dados/atividades.json):
cada atividade precisa ser CALCULADA pela calculadora oficial com o código e o
cClassTrib sugeridos. Se a Receita mudar uma tabela e um código deixar de valer,
este teste avisa antes de algum cliente ver erro.

    python3 testes-dourados/atividades.py
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

BASE_URL = os.environ.get("CALCULADORA_URL", "http://localhost:8080/api/calculadora")
# Em produção (Fly.io) o porteiro exige a chave: exporte MOTOR_CHAVE.
CABECALHOS = {"Content-Type": "application/json"}
if os.environ.get("MOTOR_CHAVE"):
    CABECALHOS["Authorization"] = f"Bearer {os.environ['MOTOR_CHAVE']}"
ARQUIVO = Path(__file__).parent.parent / "site" / "src" / "dados" / "atividades.json"


def main():
    atividades = json.loads(ARQUIVO.read_text())
    falhas = 0
    for a in atividades:
        item = {"numero": 1, a["tipo"]: a["codigo"], "cst": a["cClassTrib"][:3], "cClassTrib": a["cClassTrib"],
                "baseCalculo": 1000, "aliquotasNominais": {"cbs": 8.8, "ibsEstadual": 0.05, "ibsMunicipal": 0.05}}
        if a["tipo"] == "ncm":
            item.update(quantidade=1, unidade="UN")
        operacao = {"id": "dic", "versao": "1.0.0", "dhFatoGerador": "2027-03-10T10:00:00-03:00",
                    "municipio": 3550308, "uf": "SP", "itens": [item]}
        req = urllib.request.Request(f"{BASE_URL}/observabilidade/regime-geral", json.dumps(operacao).encode(), CABECALHOS)
        obj = json.load(urllib.request.urlopen(req, timeout=30))["objetos"][0]
        if obj["estadoItem"] in ("CALCULADO", "CALCULO_SIMULADO"):
            continue
        falhas += 1
        detalhe = (obj.get("erros") or [{}])[0].get("detail", obj["estadoItem"])
        print(f"  ✗ {a['id']}: {detalhe}")
    if falhas:
        sys.exit(f"❌ {falhas} de {len(atividades)} atividades do dicionário não calculam mais.")
    print(f"✅ As {len(atividades)} atividades do dicionário calculam na calculadora oficial.")


if __name__ == "__main__":
    main()
