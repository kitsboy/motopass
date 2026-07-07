#!/usr/bin/env bash
# Playwright smoke tests — home, footer BUILD, programs, theme toggle
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -d node_modules/@playwright/test ]]; then
  echo "Installing @playwright/test…"
  npm install --no-save @playwright/test
fi

echo "Building production bundle for e2e…"
npm run build --silent

npx playwright test e2e/smoke.spec.ts "$@"