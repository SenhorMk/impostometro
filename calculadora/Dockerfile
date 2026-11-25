# =============================================================================
# Calculadora oficial da Reforma Tributária (CBS/IBS/IS) — Receita Federal
# Código original: https://github.com/ReceitaFederal/calculadora-rtc-regime-regular
# Licença MIT, Copyright (c) 2026 Receita Federal do Brasil
# (cópia da licença em LICENSE-RECEITA-FEDERAL.txt, também dentro da imagem)
#
# Este Dockerfile NÃO altera o código da Receita. Ele só:
#   1. baixa uma versão fixa (tag) do código oficial;
#   2. gera o banco SQLite com as tabelas oficiais (Flyway);
#   3. compila o servidor Java;
#   4. monta uma imagem pequena, só com o Java de execução, o .jar e o banco.
#
# Para atualizar a calculadora, troque CALC_VERSION e CALC_COMMIT (ver README).
# =============================================================================

ARG BUILD_IMAGE=maven:3.9-eclipse-temurin-25
ARG JRE_IMAGE=eclipse-temurin:25-jre

# -----------------------------------------------------------------------------
# Etapa 0: o código-fonte oficial, numa versão fixa.
# O "checksum" é o hash do commit da tag: se alguém mexer na tag, o build falha.
# -----------------------------------------------------------------------------
FROM scratch AS calc-src
ARG CALC_VERSION=1.7.2
ARG CALC_COMMIT=39363aa84103c6d58f7e8e76acb2f592691ec382
ADD --checksum=${CALC_COMMIT} https://github.com/ReceitaFederal/calculadora-rtc-regime-regular.git?ref=${CALC_VERSION} /

# -----------------------------------------------------------------------------
# Etapa 1: build (imagem oficial com Java 25 + Maven; precisa de internet)
# -----------------------------------------------------------------------------
FROM ${BUILD_IMAGE} AS build

# Opcional: certificados extras (.crt) para quem compila atrás de um proxy
# corporativo. Normalmente a pasta certs/ fica vazia e isto não faz nada.
COPY certs/ /tmp/certs/
RUN set -e; \
    for c in /tmp/certs/*.crt; do \
      [ -f "$c" ] || continue; \
      cp "$c" /usr/local/share/ca-certificates/; \
      keytool -importcert -noprompt -cacerts -storepass changeit -alias "$(basename "$c")" -file "$c"; \
    done; \
    update-ca-certificates >/dev/null 2>&1 || true

# Opcional: configurações de proxy para o Maven (ex.: -Dhttps.proxyHost=...).
ARG MAVEN_OPTS=""

WORKDIR /src
COPY --from=calc-src / /src/

# 1) Gera o banco com as tabelas oficiais (alíquotas, NCM, NBS, cClassTrib...).
# 2) Compila o .jar. Os testes da Receita rodam no CI deles; aqui validamos
#    com o exemplo oficial depois que o container sobe (scripts/validar-calculadora.sh).
RUN mkdir -p calculadora/db \
 && mvn --batch-mode --errors -Dflyway.configFiles=./flyway/flyway-pro.conf flyway:migrate \
 && mvn --batch-mode --errors -DskipTests package \
 && ls -lh calculadora/db/calculadora-pro.db target/api-regime-geral.jar

# -----------------------------------------------------------------------------
# Etapa 2: imagem final (só o necessário para rodar)
# -----------------------------------------------------------------------------
FROM ${JRE_IMAGE}
ARG CALC_VERSION=1.7.2
LABEL org.opencontainers.image.title="calculadora-rtc-regime-regular" \
      org.opencontainers.image.version="${CALC_VERSION}" \
      org.opencontainers.image.source="https://github.com/ReceitaFederal/calculadora-rtc-regime-regular" \
      org.opencontainers.image.licenses="MIT"

# Usuário sem privilégios: o servidor não precisa ser root.
RUN useradd --system --uid 10001 --home /app calc
WORKDIR /app

# O perfil "offline" procura o banco em ./calculadora/db/ (relativo a /app).
COPY --from=build --chown=calc /src/target/api-regime-geral.jar /app/app.jar
COPY --from=build --chown=calc /src/calculadora/db/calculadora-pro.db /app/calculadora/db/calculadora-pro.db
COPY --from=build /src/LICENSE /app/LICENSE-RECEITA-FEDERAL.txt

USER calc
ENV CALC_VERSION=${CALC_VERSION} \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

# 8080: API (http://localhost:8080/api/...)   9101: saúde (/health) e métricas
EXPOSE 8080 9101
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dspring.profiles.active=offline -jar /app/app.jar"]
