# Imagem do Cimatec Estudos para o servidor de demonstração no Render. O Render não tem runtime
# nativo de Java: para linguagem de JVM, a documentação dele manda usar Docker. São três etapas,
# para a imagem final ter só o que roda: o JRE e o jar (docs/deploy-render.md; DECISOES.md,
# 2026-09-27, "Deploy de demonstração no Render").

# 1) Compila o Angular. Mesma versão principal do Node usada no desenvolvimento (24).
FROM node:24-alpine AS front
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# 2) Empacota o jar com o Angular dentro: o pom.xml copia ../frontend/dist/frontend/browser para
#    static/. Maven e JDK 21 já vêm nesta imagem; o wrapper do projeto não é usado aqui.
FROM maven:3.9-eclipse-temurin-21-alpine AS back
WORKDIR /app/backend
COPY backend/pom.xml ./
# As dependências ficam numa camada própria, refeita só quando o pom muda: o Render guarda as
# camadas entre um deploy e outro.
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
COPY --from=front /app/frontend/dist/frontend/browser /app/frontend/dist/frontend/browser
# Os testes rodam antes de cada commit, na máquina de desenvolvimento; aqui só empacota.
RUN mvn -q -B -DskipTests package

# 3) Só o necessário para rodar: JRE 21, o jar, um usuário sem privilégios e uma pasta gravável
#    para o banco H2 (que no Render é descartada a cada deploy ou reinício: ver DECISOES.md).
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN adduser -D -H app && mkdir -p /app/dados && chown app:app /app/dados
COPY --from=back /app/backend/target/backend-*.jar /app/app.jar
USER app
# Perfil de demonstração (application-demo.properties) e banco na pasta gravável. A porta vem da
# variável PORT, que o Render define; a URL do site vem de APP_URL (painel) ou RENDER_EXTERNAL_URL.
ENV SPRING_PROFILES_ACTIVE=demo APP_BANCO_DIR=/app/dados
# A instância gratuita tem 512 MB e 0,1 CPU: heap limitado a 60% da memória do contêiner, e só o
# compilador rápido da JVM (nível 1), que gasta menos CPU para subir.
CMD ["java", "-XX:MaxRAMPercentage=60", "-XX:TieredStopAtLevel=1", "-jar", "/app/app.jar"]
