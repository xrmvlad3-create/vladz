#!/usr/bin/env bash
set -euo pipefail

echo "[preview] Building and starting containers..."
docker compose -f docker-compose.preview.yml up -d --build

echo "[preview] Waiting for containers to settle..."
sleep 8

echo "[preview] Running Laravel optimize steps (non-fatal if already set)..."
docker compose -f docker-compose.preview.yml exec -T app php artisan key:generate || true
docker compose -f docker-compose.preview.yml exec -T app php artisan optimize || true
docker compose -f docker-compose.preview.yml exec -T app php artisan storage:link || true

echo
echo "Preview is up:"
echo "  App URL:  http://localhost:8080"
echo "  Health:   curl http://localhost:8080/health"
echo
docker compose -f docker-compose.preview.yml ps