#!/usr/bin/env bash
# Playwright smoke tests — robot-browser checks before ship (home, BUILD, programs, theme, etc.)
#
# Always uses a FRESH preview server (see playwright.config.ts reuseExistingServer: false).
# A lock file prevents two runs at once (the main cause of stuck/slow e2e locally).
set -euo pipefail
cd "$(dirname "$0")/.."

LOCKDIR="${TMPDIR:-/tmp}/motopass-e2e.lock"
if ! mkdir "$LOCKDIR" 2>/dev/null; then
  echo "SKIP e2e: another run is in progress ($LOCKDIR)."
  echo "If stuck, remove the lock: rm -rf \"$LOCKDIR\""
  exit 1
fi
trap 'rmdir "$LOCKDIR" 2>/dev/null || true' EXIT

PORT=4173
if command -v lsof >/dev/null 2>&1; then
  lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
  sleep 0.5
fi

if [[ ! -d node_modules/@playwright/test ]]; then
  echo "Installing @playwright/test…"
  npm install --no-save @playwright/test
fi

echo "Building production bundle for e2e…"
npm run build --silent

echo "Running smoke tests (fresh preview on :$PORT)…"
# CI=1 → retries + consistent behavior; preview is always started by Playwright webServer
CI=1 npx playwright test e2e/smoke.spec.ts e2e/footer-gap.spec.ts "$@"