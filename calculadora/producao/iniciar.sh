#!/bin/sh
# Liga o porteiro (Caddy) e a calculadora oficial no mesmo container.
# Se qualquer um dos dois cair, o container termina e o Fly.io reinicia.
set -e

if [ -z "$MOTOR_CHAVE" ] || [ ${#MOTOR_CHAVE} -lt 32 ]; then
  echo "ERRO: defina MOTOR_CHAVE com pelo menos 32 caracteres (fly secrets set MOTOR_CHAVE=...)" >&2
  exit 1
fi

caddy run --config /app/Caddyfile --adapter caddyfile &
CADDY_PID=$!

java $JAVA_OPTS -Dspring.profiles.active=offline -jar /app/app.jar &
JAVA_PID=$!

# Espera o primeiro que terminar e derruba o outro.
while kill -0 "$CADDY_PID" 2>/dev/null && kill -0 "$JAVA_PID" 2>/dev/null; do
  sleep 2
done
echo "Um dos processos parou; encerrando o container." >&2
kill "$CADDY_PID" "$JAVA_PID" 2>/dev/null || true
exit 1
