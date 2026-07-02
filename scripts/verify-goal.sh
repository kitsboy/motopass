#!/usr/bin/env bash
set -euo pipefail

SCRATCH="${SCRATCH:?Set SCRATCH to the evidence output directory}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p "$SCRATCH"

# Remove stale contradictory smoke/playwright logs from prior manual runs
rm -f "$SCRATCH"/playwright-smoke.log "$SCRATCH"/playwright-unavailable.log

fail() {
  echo "verify-goal FAIL: $*" >&2
  exit 1
}

# --- Step 1: build ---
npm run build >"$SCRATCH/build.log" 2>&1 || fail "npm run build"
for f in dist/research/countries.json dist/logo.png dist/sitemap.xml; do
  test -f "$f" || fail "missing dist artifact: $f"
done
ls -la dist/research/countries.json dist/logo.png dist/sitemap.xml >"$SCRATCH/build-artifacts.log" 2>&1

# --- Step 2: test ---
npm test >"$SCRATCH/test.log" 2>&1 || fail "npm test"

# --- Step 3: git push dry-run (and push if ahead) ---
git push --dry-run origin main >"$SCRATCH/git-push-dry.log" 2>&1 || fail "git push --dry-run"
if git status -sb | grep -q 'ahead '; then
  git push origin main >"$SCRATCH/git-push.log" 2>&1 || fail "git push origin main"
else
  cp "$SCRATCH/git-push-dry.log" "$SCRATCH/git-push.log"
fi
git push --dry-run origin main >"$SCRATCH/git-push-dry-after.log" 2>&1 || fail "git push --dry-run after push"

# --- Step 4: live JSON ---
curl -sI https://motopass.giveabit.io/research/countries.json >"$SCRATCH/live-json.log" 2>&1 || fail "curl -sI live-json"
grep -qi 'application/json' "$SCRATCH/live-json.log" || fail "live-json content-type not application/json"
curl -sf https://motopass.giveabit.io/research/countries.json -o "$SCRATCH/.live-json-full.json" || fail "curl live-json body"
head -c 80 "$SCRATCH/.live-json-full.json" >"$SCRATCH/live-json-body.log"
rm -f "$SCRATCH/.live-json-full.json"
grep -q '"programs"' "$SCRATCH/live-json-body.log" || fail 'live-json-body first 80B missing "programs"'

# --- Step 5: preview + playwright smoke ---
npx playwright --version >"$SCRATCH/playwright-version.log" 2>&1 || {
  npx playwright --version >"$SCRATCH/playwright-unavailable.log" 2>&1 || true
  fail "playwright unavailable"
}

npm run preview -- --host 127.0.0.1 --port 4173 >"$SCRATCH/preview-serve.log" 2>&1 &
PREVIEW_PID=$!
cleanup_preview() {
  kill "$PREVIEW_PID" 2>/dev/null || true
  wait "$PREVIEW_PID" 2>/dev/null || true
}
trap cleanup_preview EXIT

for _ in $(seq 1 60); do
  if curl -sf http://127.0.0.1:4173/ >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -sf http://127.0.0.1:4173/ >/dev/null 2>&1 || fail "preview server did not start on 127.0.0.1:4173"

SCRATCH="$SCRATCH" SMOKE_URL=http://127.0.0.1:4173 node scripts/smoke-routes.mjs >"$SCRATCH/smoke-routes.log" 2>&1 || fail "smoke-routes"

# --- Step 6: data count ---
node -e "
const d = require('./research/countries.json');
if (!Array.isArray(d.programs) || d.programs.length < 25) process.exit(1);
console.log('programs.length =', d.programs.length);
" >"$SCRATCH/data-count.log" 2>&1 || fail "data-count < 25 programs"

# --- Step 7: routes grep ---
grep -rE 'Portfolio|StackSimulator|FinanceCompare|ResearchVault|/portfolio|/simulator|/compare|/vault' src/ >"$SCRATCH/routes-grep.log" 2>&1 || fail "routes-grep no matches"

echo "verify-goal OK — evidence in $SCRATCH"