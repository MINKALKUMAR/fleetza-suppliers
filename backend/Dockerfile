# =========================================================================
# Fleetza Suppliers Backend - Production Multi-Stage Dockerfile (Railway / Cloud)
# =========================================================================

# Stage 1: Build application JAR
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /workspace/app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Cache buster to ensure Railway compiles latest source commits
ARG BUILD_VERSION=2026-10-01-fcm-v2
COPY src src
RUN mvn clean package -DskipTests

# Stage 2: Minimal, high-performance JRE 17 runtime
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Run as non-root user for security
RUN groupadd -r fleetza && useradd -r -g fleetza fleetza
USER fleetza:fleetza

COPY --from=build /workspace/app/target/*.jar app.jar

# Dynamic Port handling for Railway, Render, etc.
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=mysql
EXPOSE ${PORT}

# Production JVM flags for low memory footprint and high throughput
ENTRYPOINT ["sh", "-c", "java -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
