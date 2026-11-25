#!/usr/bin/env python3
"""
Testes dourados: 30 operações com resultado conhecido.

    python3 testes-dourados/dourados.py            # confere (usado no CI)
    python3 testes-dourados/dourados.py --gerar    # regrava os resultados esperados

Para que serve: a Receita atualiza a calculadora quase toda semana. Se uma versão
nova mudar qualquer valor, mesmo um centavo, este teste falha e mostra onde.
Só use --gerar depois de entender e aceitar a mudança (leia o CHANGELOG da Receita).

Só usa a biblioteca padrão do Python (não precisa instalar nada).
"""
import json
import os
import sys
import time
import urllib.request
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from casos import CASOS, montar_entrada  # noqa: E402

BASE_URL = os.environ.get("CALCULADORA_URL", "http://localhost:8080/api/calculadora")
# Opcional: se a calculadora oficial estiver atrás de um porteiro com chave, exporte MOTOR_CHAVE.
CABECALHOS = {"Content-Type": "application/json"}
if os.environ.get("MOTOR_CHAVE"):
    CABECALHOS["Authorization"] = f"Bearer {os.environ['MOTOR_CHAVE']}"
PASTA = Path(__file__).parent / "esperados"

# Conferência "à mão": reduções que conferimos direto na LC 214/2025.
# Para estes casos, além de comparar com o arquivo, checamos se o motor aplicou
# exatamente a redução da lei e se a conta base x alíquota x (1 - redução) fecha.
REDUCAO_DA_LEI = {
    "09": ("60.00", "LC 214/2025, art. 129 e Anexo II (educação)"),
    "11": ("60.00", "LC 214/2025, art. 130 e Anexo III (saúde humana)"),
    "17": ("70.00", "LC 214/2025, art. 261 (locação de imóveis)"),
    "18": ("40.00", "LC 214/2025, art. 281 (hotelaria)"),
    "19": ("30.00", "LC 214/2025, art. 127 (profissões intelectuais)"),
    "21": ("100.00", "LC 214/2025, art. 125 e Anexo I (cesta básica)"),
}

CAMPOS = [  # (nome no arquivo, caminho dentro de gIBSCBS)
    ("vBC", ["vBC"]),
    ("pCBS", ["gCBS", "pCBS"]),
    ("pRedCBS", ["gCBS", "gRed", "pRedAliq"]),
    ("pAliqEfetCBS", ["gCBS", "gRed", "pAliqEfet"]),
    ("vCBS", ["gCBS", "vCBS"]),
    ("pIBSUF", ["gIBSUF", "pIBSUF"]),
    ("vIBSUF", ["gIBSUF", "vIBSUF"]),
    ("pIBSMun", ["gIBSMun", "pIBSMun"]),
    ("vIBSMun", ["gIBSMun", "vIBSMun"]),
    ("vIBS", ["vIBS"]),
]


def calcular(entrada):
    req = urllib.request.Request(
        f"{BASE_URL}/observabilidade/regime-geral",
        data=json.dumps(entrada).encode(), headers=CABECALHOS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def pegar(d, caminho):
    for chave in caminho:
        if not isinstance(d, dict) or chave not in d:
            return None
        d = d[chave]
    return d


def resumir(resposta):
    """Reduz a resposta do motor ao que importa para o teste."""
    obj = resposta["objetos"][0]
    r = {"estadoItem": obj.get("estadoItem")}
    if obj.get("erros"):
        r["erros"] = [e.get("code") for e in obj["erros"]]
    g = pegar(obj, ["tribCalc", "IBSCBS", "gIBSCBS"])
    if g:
        for nome, caminho in CAMPOS:
            v = pegar(g, caminho)
            if v is not None:
                r[nome] = v
    return r


def conta_na_mao(r):
    """vCBS = base x alíquota x (1 - redução), arredondado a 2 casas."""
    base, aliq = Decimal(r["vBC"]), Decimal(r["pCBS"])
    red = Decimal(r.get("pRedCBS", "0"))
    return str((base * aliq / 100 * (1 - red / 100)).quantize(Decimal("0.01"), ROUND_HALF_UP))


def esperar_motor(segundos=180):
    inicio = time.time()
    while True:
        try:
            urllib.request.urlopen(urllib.request.Request(f"{BASE_URL}/dados-abertos/versao", headers=CABECALHOS), timeout=5)
            return
        except Exception:
            if time.time() - inicio > segundos:
                sys.exit("A calculadora não respondeu. Ela está ligada? (docker compose up -d)")
            time.sleep(3)


def main():
    gerar = "--gerar" in sys.argv
    esperar_motor()
    versao = json.load(urllib.request.urlopen(urllib.request.Request(f"{BASE_URL}/dados-abertos/versao", headers=CABECALHOS)))
    print(f"Motor {versao['versaoApp']} · tabelas {versao['versaoDb']}\n")
    PASTA.mkdir(exist_ok=True)
    falhas = 0

    for caso in CASOS:
        cid, desc = caso[0], caso[1]
        entrada = montar_entrada(caso)
        obtido = resumir(calcular(entrada))
        arquivo = PASTA / f"{cid}.json"

        if gerar:
            registro = {"id": cid, "descricao": desc, "motor": versao["versaoApp"],
                        "tabelas": versao["versaoDb"], "entrada": entrada, "esperado": obtido}
            if cid in REDUCAO_DA_LEI:
                registro["conferidoAMao"] = REDUCAO_DA_LEI[cid][1]
            arquivo.write_text(json.dumps(registro, ensure_ascii=False, indent=2) + "\n")
            print(f"  gravado {cid} {obtido.get('estadoItem'):24} vCBS={obtido.get('vCBS', '-'):>10}  {desc}")
            continue

        esperado = json.loads(arquivo.read_text())["esperado"]
        problemas = [f"{k}: esperado {esperado.get(k)}, veio {obtido.get(k)}"
                     for k in sorted(set(esperado) | set(obtido)) if esperado.get(k) != obtido.get(k)]

        if cid in REDUCAO_DA_LEI and "vCBS" in obtido:
            red_lei, fonte = REDUCAO_DA_LEI[cid]
            if obtido.get("pRedCBS", "0.00") != red_lei:
                problemas.append(f"redução {obtido.get('pRedCBS')} diferente da lei ({red_lei}%, {fonte})")
            if conta_na_mao(obtido) != obtido["vCBS"]:
                problemas.append(f"conta na mão dá {conta_na_mao(obtido)}, motor deu {obtido['vCBS']}")

        if problemas:
            falhas += 1
            print(f"  ✗ {cid} {desc}")
            for p in problemas:
                print(f"      {p}")
        else:
            marca = " (conferido à mão)" if cid in REDUCAO_DA_LEI else ""
            print(f"  ✓ {cid} {desc}{marca}")

    if gerar:
        print(f"\n{len(CASOS)} resultados gravados em {PASTA}")
        return
    print()
    if falhas:
        sys.exit(f"❌ {falhas} de {len(CASOS)} operações mudaram de resultado.")
    print(f"✅ As {len(CASOS)} operações de referência bateram.")


if __name__ == "__main__":
    main()
