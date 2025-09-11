#!/usr/bin/env bash
set -euo pipefail

# Removes legacy Laravel and infra from the repository working tree using git rm.
# Run from repository root:
#   chmod +x scripts/prune-legacy.sh
#   ./scripts/prune-legacy.sh

if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

echo "[prune] Removing legacy Laravel and infra..."
git rm -r --ignore-unmatch app bootstrap config database docker public resources routes storage || true
git rm -f --ignore-unmatch artisan composer.json package.json Dockerfile docker-compose.yml docker-compose.preview.yml vite.config.js || true

echo "[prune] Committing changes..."
git commit -m "chore: remove legacy Laravel and infra (migrated to Next.js)"

echo "[prune] Done. Review the commit and push when ready."