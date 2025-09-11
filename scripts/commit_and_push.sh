#!/usr/bin/env bash
set -euo pipefail

log() { printf "%s\n" "$*" >&2; }

# Usage: ./scripts/commit_and_push.sh "your commit message"
MSG="${1:-feat(preview/procedures): UI updates — Procedures section (Recente/Comune/Catalog/Tutorial), PRP zones (Scalp/Față) with injection map, recency ordering, Romanian UI improvements}"

if ! command -v git >/dev/null 2>&1; then
  log "ERROR: git not found. Install Git and retry."
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "ERROR: This directory is not a Git repository. Initialize or cd into the repo."
  exit 1
fi

# Current branch (fallback to main)
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"

# Ensure user identity is set (warn only)
NAME="$(git config user.name || true)"
EMAIL="$(git config user.email || true)"
if [ -z "$NAME" ] || [ -z "$EMAIL" ]; then
  log "WARNING: git user.name or user.email not set. Set them if commit fails attribution:"
  log "  git config user.name \"Your Name\""
  log "  git config user.email \"you@example.com\""
fi

# Check remote
if ! git remote get-url origin >/dev/null 2>&1; then
  log "ERROR: No 'origin' remote configured."
  log "Add it, then rerun this script:"
  log "  git remote add origin https://github.com/<org>/<repo>.git"
  log "  git fetch origin"
  log "  git branch -u origin/${BRANCH} || true"
  exit 1
fi

# Stage, commit, push
git add -A

# Check if anything is staged
if git diff --cached --quiet; then
  log "Nothing to commit (working tree clean)."
  # Still ensure branch exists on origin
  git push -u origin "${BRANCH}" || true
  exit 0
fi

git commit -m "${MSG}"
git push -u origin "${BRANCH}"
log "Done: pushed '${BRANCH}' to origin."