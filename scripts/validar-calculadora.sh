#!/usr/bin/env bash
# =============================================================================
# Valida a calculadora oficial com o exemplo publicado pela própria Receita
# (docs/exemplos.md do repositório calculadora-rtc-regime-regular).
#
# Uso:   ./scripts/validar-calculadora.sh [URL_BASE]
#        URL_BASE padrão: http://localhost:8080/api/calculadora
#        Para conferir a produção (Fly.io), exporte MOTOR_CHAVE antes:
#        MOTOR_CHAVE=... ./scripts/validar-calculadora.sh https://<app>.fly.dev/api/calculadora
# Precisa de: curl e jq.
#
# O que conferimos (valores copiados da documentação oficial):
#   item 3 = serviço de educação, base R$ 1.200,00, redução de 60%
#            CBS 8,8% -> alíquota efetiva 3,52% -> CBS R$ 42,24
#            IBS UF 0,05% + IBS Mun 0,05% (reduzidos) -> IBS R$ 0,48
#   item 4 = erro proposital (NCM não vinculada) -> INCONSISTENCIA_ENTRADA
#   totais = CBS R$ 56,76 | IBS R$ 0,64 | IS R$ 15,00 | base R$ 1.465,00
# =============================================================================
set -euo pipefail

BASE_URL="${1:-http://localhost:8080/api/calculadora}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENTRADA="$DIR/calculadora/exemplos/operacao-oficial.json"
ESPERA_MAX="${ESPERA_MAX:-180}"   # segundos esperando o servidor subir

AUTH=()
if [[ -n "${MOTOR_CHAVE:-}" ]]; then AUTH=(-H "Authorization: Bearer $MOTOR_CHAVE"); fi

for cmd in curl jq; do
  command -v "$cmd" >/dev/null || { echo "Falta o programa '$cmd'. Instale e rode de novo."; exit 2; }
done

echo "→ Esperando a calculadora responder em $BASE_URL (até ${ESPERA_MAX}s)..."
inicio=$(date +%s)
until curl -fsS ${AUTH[@]+"${AUTH[@]}"} "$BASE_URL/dados-abertos/versao" >/dev/null 2>&1; do
  if (( $(date +%s) - inicio > ESPERA_MAX )); then
    echo "✗ A calculadora não respondeu. Veja os logs: docker compose logs calculadora"
    exit 1
  fi
  sleep 3
done
echo "  Versão do banco/tabelas: $(curl -fsS ${AUTH[@]+"${AUTH[@]}"} "$BASE_URL/dados-abertos/versao")"

echo "→ Enviando o exemplo oficial (4 itens) para /observabilidade/regime-geral..."
RESPOSTA="$(curl -fsS ${AUTH[@]+"${AUTH[@]}"} -X POST "$BASE_URL/observabilidade/regime-geral" \
  -H 'Content-Type: application/json' --data-binary @"$ENTRADA")"

# Guarda a resposta completa para quem quiser estudar (inclui a memória de cálculo).
mkdir -p "$DIR/calculadora/exemplos/saida"
echo "$RESPOSTA" | jq . > "$DIR/calculadora/exemplos/saida/resposta-oficial.json"

falhas=0
conferir() { # descrição, filtro jq, valor esperado
  local obtido
  obtido="$(echo "$RESPOSTA" | jq -r "$2")"
  if [[ "$obtido" == "$3" ]]; then
    printf '  ✓ %-48s %s\n' "$1" "$obtido"
  else
    printf '  ✗ %-48s esperado %s, veio %s\n' "$1" "$3" "$obtido"
    falhas=$((falhas + 1))
  fi
}

ITEM3='.objetos[] | select(.nObj == 3) | .tribCalc.IBSCBS.gIBSCBS'
echo "→ Item 3: serviço de educação de R\$ 1.200,00"
conferir "Base de cálculo (vBC)"                 "$ITEM3.vBC"                     "1200.00"
conferir "Redução da CBS (pRedAliq %)"           "$ITEM3.gCBS.gRed.pRedAliq"      "60.00"
conferir "Alíquota efetiva da CBS (%)"           "$ITEM3.gCBS.gRed.pAliqEfet"     "3.52"
conferir "CBS (vCBS)  <- o número do ticket"     "$ITEM3.gCBS.vCBS"               "42.24"
conferir "IBS total (vIBS)"                      "$ITEM3.vIBS"                    "0.48"

echo "→ Item 4: erro proposital"
conferir "Estado do item 4" '.objetos[] | select(.nObj == 4) | .estadoItem' "INCONSISTENCIA_ENTRADA"
conferir "Código do erro"   '.objetos[] | select(.nObj == 4) | .erros[0].code' "REG-011"

echo "→ Totais da operação"
conferir "Base total CBS/IBS" '.total.tribCalc.IBSCBSTot.vBCIBSCBS'   "1465.00"
conferir "CBS total"          '.total.tribCalc.IBSCBSTot.gCBS.vCBS'   "56.76"
conferir "IBS total"          '.total.tribCalc.IBSCBSTot.gIBS.vIBS'   "0.64"
conferir "Imposto Seletivo"   '.total.tribCalc.ISTot.vIS'             "15.00"

echo
if (( falhas == 0 )); then
  echo "✅ Tudo bateu com o exemplo oficial da Receita."
  echo "   Resposta completa salva em calculadora/exemplos/saida/resposta-oficial.json"
else
  echo "❌ $falhas valor(es) diferente(s) do exemplo oficial."
  exit 1
fi
