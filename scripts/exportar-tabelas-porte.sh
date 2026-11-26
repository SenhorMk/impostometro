#!/usr/bin/env bash
# =============================================================================
# Tira o banco de dados oficial de dentro da imagem Docker da calculadora da
# Receita e exporta as tabelas para o porte em TypeScript
# (site/src/motor/dados/tabelas.json).
#
# Uso:   ./scripts/exportar-tabelas-porte.sh
#        (ou, dentro de site/:  npm run porte:tabelas)
#
# Precisa: Docker, a imagem já compilada (docker compose build) e Node 22.
# A versão da imagem é lida do docker-compose.yml.
# Também gera site/src/dados/codigos-oficiais.json (busca de NCM/NBS, T10).
# Depois de rodar: `git diff --stat site/src/motor/dados/ site/src/dados/` mostra se algo mudou.
# =============================================================================
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
IMAGEM="$(grep -m1 -oE 'impostometro/calculadora:[0-9.]+' "$RAIZ/docker-compose.yml")"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"; [ -n "${CID:-}" ] && docker rm -f "$CID" >/dev/null' EXIT

echo "→ Tirando o banco da imagem $IMAGEM"
CID="$(docker create "$IMAGEM")"
docker cp "$CID:/app/calculadora/db/calculadora-pro.db" "$TMP/calculadora-pro.db"

echo "→ Exportando as tabelas"
cd "$RAIZ/site"
node scripts/porte/exportar-tabelas.mjs "$TMP/calculadora-pro.db"

echo "→ Exportando a lista oficial de NCM e NBS para a busca do site"
node scripts/porte/exportar-codigos.ts "$TMP/calculadora-pro.db"
