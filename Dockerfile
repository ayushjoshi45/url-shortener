# Single-container image for all four microservices (free-tier deploy).
# External state only: Neon (users), Atlas (urls + analytics), Upstash (redis),
# CloudAMQP (rabbitmq). Build each service, ship prod deps + build output.

FROM node:22-slim AS builder
WORKDIR /app

# Manifests first for layer caching.
COPY package*.json ./
COPY api-gateway/package*.json ./api-gateway/
COPY user-service/package*.json ./user-service/
COPY url-service/package*.json ./url-service/
COPY analytics-service/package*.json ./analytics-service/

# Full installs (devDeps needed to compile). One WORKDIR per service instead
# of --prefix: identical result, no flag-parsing surprises.
WORKDIR /app/api-gateway
RUN npm ci
WORKDIR /app/user-service
RUN npm ci
WORKDIR /app/url-service
RUN npm ci
WORKDIR /app/analytics-service
RUN npm ci
WORKDIR /app

# Sources + Prisma schema, then compile (user-service build runs generate).
COPY api-gateway ./api-gateway
COPY user-service ./user-service
COPY url-service ./url-service
COPY analytics-service ./analytics-service

RUN npm run build --prefix api-gateway
RUN npm run build --prefix user-service
RUN npm run build --prefix url-service
RUN npm run build --prefix analytics-service

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Prisma engines need OpenSSL at runtime.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Prod-only installs (prisma CLI stays: user-service needs `migrate deploy`).
COPY api-gateway/package*.json ./api-gateway/
COPY user-service/package*.json ./user-service/
COPY url-service/package*.json ./url-service/
COPY analytics-service/package*.json ./analytics-service/

WORKDIR /app/api-gateway
RUN npm ci --omit=dev
WORKDIR /app/user-service
RUN npm ci --omit=dev
WORKDIR /app/url-service
RUN npm ci --omit=dev
WORKDIR /app/analytics-service
RUN npm ci --omit=dev
WORKDIR /app

# Compiled output + manifests + prisma migration files (deploy reads them).
COPY --from=builder /app/api-gateway/build ./api-gateway/build
COPY --from=builder /app/api-gateway/package.json ./api-gateway/package.json
COPY --from=builder /app/user-service/build ./user-service/build
COPY --from=builder /app/user-service/package.json ./user-service/package.json
COPY --from=builder /app/user-service/prisma ./user-service/prisma
COPY --from=builder /app/url-service/build ./url-service/build
COPY --from=builder /app/url-service/package.json ./url-service/package.json
COPY --from=builder /app/analytics-service/build ./analytics-service/build
COPY --from=builder /app/analytics-service/package.json ./analytics-service/package.json

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Render injects $PORT; gateway listens on it.
EXPOSE 3000

CMD ["sh", "./start.sh"]
