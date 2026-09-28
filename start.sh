#!/bin/sh
set -e

# Single-container orchestration for Render free tier.
# Gateway takes Render's injected $PORT; internal services stay on fixed
# localhost ports. External state (Neon/Atlas/Upstash/CloudAMQP) via env.

: "${PORT:=3000}"

# Internal URLs — defaults work inside this container. Do NOT set these in
# the Render dashboard unless you know why.
export USER_SERVICE_URL=${USER_SERVICE_URL:-http://localhost:3001}
export URL_SERVICE_URL=${URL_SERVICE_URL:-http://localhost:3002}
export ANALYTICS_SERVICE_URL=${ANALYTICS_SERVICE_URL:-http://localhost:3003}

# Public base URL for short links and OAuth callbacks. Render provides
# RENDER_EXTERNAL_URL automatically; explicit BASE_URL wins if set.
export BASE_URL=${BASE_URL:-$RENDER_EXTERNAL_URL}
: "${BASE_URL:?BASE_URL is required (public gateway URL; on Render this defaults to RENDER_EXTERNAL_URL)}"
export GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL:-${BASE_URL}/api/users/auth/google/callback}

# Per-service DATABASE_URLs share one name across services, so map the
# distinct dashboard variables here (keeps service code untouched).
export URLS_DB_URL=${URLS_DB_URL:?URLS_DB_URL (Atlas urls_db) is required}
export ANALYTICS_DB_URL=${ANALYTICS_DB_URL:?ANALYTICS_DB_URL (Atlas analytics_db) is required}

echo "Starting backend services..."
echo "Gateway PORT=$PORT BASE_URL=$BASE_URL"

# One-time schema migrate before any service boots (needs DATABASE_URL=Neon).
echo "[user] applying prisma migrations..."
./user-service/node_modules/.bin/prisma migrate deploy --schema user-service/prisma/schema.prisma

# Restart helper: reruns a crashed service with backoff. Render restarts the
# whole container only if this script exits.
run_service() {
  name=$1
  port=$2
  dir=$3
  extra_env=$4
  while true; do
    echo "[$name] starting on $port..."
    code=0
    # shellcheck disable=SC2086
    env PORT=$port $extra_env node "$dir/build/server.js" &
    pid=$!
    wait $pid || code=$?
    echo "[$name] exited with code $code, restarting in 5s..."
    sleep 5
  done
}

run_service user 3001 user-service "DATABASE_URL=$DATABASE_URL" &
run_service url 3002 url-service "DATABASE_URL=$URLS_DB_URL REDIS_URL=$REDIS_URL RABBITMQ_URL=$RABBITMQ_URL" &
run_service analytics 3003 analytics-service "DATABASE_URL=$ANALYTICS_DB_URL RABBITMQ_URL=$RABBITMQ_URL" &

# Stagger gateway start to avoid a cold-start memory spike on 512MB.
sleep 3

run_service gateway "$PORT" api-gateway "" &

wait
