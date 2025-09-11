#!/usr/bin/env bash
set -euo pipefail

log() { printf "%s\n" "$*" >&2; }

# Usage:
#   GITHUB_TOKEN=xxx GITHUB_REPO=owner/repo TARGET_BRANCH=feat/proc ./scripts/commit_and_push.sh "message"
# Fallback:
#   ./scripts/commit_and_push.sh "message"   # pushes to 'origin' on current branch
MSG="${1:-feat(preview/procedures): UI updates — Procedures section (Recente/Comune/Catalog/Tutorial), PRP zones (Scalp/Față) with injection map, recency ordering, Romanian UI improvements}"

if ! command -v git >/dev/null 2>&1; then
  log "ERROR: git not found. Install Git and retry."
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/devnull 2>&1; then
  log "ERROR: This directory is not a Git repository. Initialize or cd into the repo."
  exit 1
fi

# Current branch or target override
CURR_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
BRANCH="${TARGET_BRANCH:-$CURR_BRANCH}"

# Ensure user identity is set (warn only)
NAME="$(git config user.name || true)"
EMAIL="$(git config user.email || true)"
if [ -z "$NAME" ] || [ -z "$EMAIL" ]; then
  log "WARNING: git user.name or user.email not set. Set them if commit fails attribution:"
  log "  git config user.name \"Your Name\""
  log "  git config user.email \"you@example.com\""
fi

# Stage, commit, push
git add -A

# Check if anything is staged
if git diff --cached --quiet; then
  log "Nothing to commit (working tree clean)."
  if [ -n "${GITHUB_TOKEN:-}" ] && [ -n "${GITHUB_REPO:-}" ]; then
    git push -u "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" "HEAD:refs/heads/${BRANCH}" || true
  else
    if git remote get-url origin >/dev/null 2>&1; then
      git push -u origin "${BRANCH}" || true
    else
      log "No origin remote and no GITHUB_TOKEN/GITHUB_REPO provided. Nothing pushed."
    fi
  fi
  exit 0
fi

git commit -m "${MSG}"

# Prefer ephemeral HTTPS push with token if provided, to avoid storing credentials
if [ -n "${GITHUB_TOKEN:-}" ] && [ -n "${GITHUB_REPO:-}" ]; then
  git push -u "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" "HEAD:refs/heads/${BRANCH}"
else
  # Fallback to configured origin
  if git remote get-url origin >/dev/null 2>&1; then
    git push -u origin "${BRANCH}"
  else
    log "ERROR: No origin remote configured and no GITHUB_TOKEN/GITHUB_REPO provided."
    exit 1
  fi
fi

log "Done: pushed '${BRANCH}'."