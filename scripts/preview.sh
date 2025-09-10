#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose -f docker-compose.preview.yml"

echo "[preview] Building and starting containers..."
$COMPOSE up -d --build

echo "[preview] Waiting for Postgres readiness..."
for i in {1..30}; do
  if $COMPOSE exec -T postgres pg_isready -U izauser -d izamanagement >/dev/null 2>&1; then
    echo "[preview] Postgres is ready."
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "[preview] Postgres not ready after waiting. Proceeding anyway."
  fi
done

echo "[preview] Running Laravel setup (non-fatal if already set)..."
$COMPOSE exec -T app php artisan key:generate || true
$COMPOSE exec -T app php artisan config:cache || true
$COMPOSE exec -T app php artisan route:cache || true
$COMPOSE exec -T app php artisan view:cache || true
$COMPOSE exec -T app php artisan migrate --force || true
$COMPOSE exec -T app php artisan db:seed --force || true
$COMPOSE exec -T app php artisan storage:link || true

echo
echo "Preview is up:"
echo "  App URL:  http://localhost:8080"
echo "  Health:   curl http://localhost:8080/health"
echo
$COMPOSE ps