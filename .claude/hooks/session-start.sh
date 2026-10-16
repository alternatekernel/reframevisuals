#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs dependencies for the monorepo (root + frontend + backend) so that
# builds, linters and tests can run. Idempotent and non-interactive.
set -euo pipefail

# Only run in the remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

echo "[session-start] Installing root dependencies..."
npm install

echo "[session-start] Installing frontend dependencies..."
npm install --prefix frontend

# Backend has a postinstall step that runs `prisma generate`.
echo "[session-start] Installing backend dependencies..."
npm install --prefix backend

echo "[session-start] Dependency installation complete."
