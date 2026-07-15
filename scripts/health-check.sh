#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://motopass.giveabit.io}"
RETRIES=5

retry_curl() {
  local url="$1"
  for i in $(seq 1 $RETRIES); do
    if curl -sf "$url" -o /tmp/motopass-health.json 2>/dev/null; then
      return 0
    fi
    echo "retry $i/$RETRIES $url"
    sleep 8
  done
  return 1
}

echo "Checking $BASE ..."

curl -sfI "$BASE/research/countries.json" | grep -qi 'application/json' || { echo "FAIL json content-type"; exit 1; }
echo "OK content-type application/json"

retry_curl "$BASE/research/countries.json" || { echo "FAIL fetch countries.json"; exit 1; }
node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('/tmp/motopass-health.json','utf8'));
if (!Array.isArray(d.programs) || d.programs.length < 25) {
  console.error('FAIL programs count', d.programs?.length);
  process.exit(1);
}
console.log('OK programs', d.programs.length, 'last_updated', d.last_updated);
"

curl -sfI "$BASE/logo.png" | grep -qi 'image' && echo "OK logo.png" || { echo "FAIL logo.png"; exit 1; }
curl -sf "$BASE/sitemap.xml" | grep -q 'urlset' && echo "OK sitemap.xml" || { echo "FAIL sitemap.xml"; exit 1; }

node scripts/verify-live-app.mjs "$BASE" || { echo "FAIL main JS bundle"; exit 1; }

echo "Health check passed for $BASE"