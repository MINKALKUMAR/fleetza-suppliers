# =========================================================================
# Fleetza Suppliers Backend - Production Multi-Stage Dockerfile (Railway Root)
# =========================================================================

# Stage 1: Build JAR using Maven & JDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy backend source and compile
COPY backend/src src
RUN mvn clean package -DskipTests

# Stage 2: Minimal, fast, and secure JRE 17 Runtime
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Security non-root user
RUN groupadd -r fleetza && useradd -r -g fleetza fleetza
USER fleetza:fleetza

COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=mysql
EXPOSE ${PORT}

ENTRYPOINT ["sh", "-c", "java -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
