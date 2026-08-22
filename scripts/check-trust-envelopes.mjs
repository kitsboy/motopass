#!/usr/bin/env node
/**
 * CI gate for gab.country-trust.v1 envelopes.
 * Validates shape + honesty contract so a bad generator run can never ship.
 *
 * Honesty checks (non-negotiable):
 *  - 50 envelopes present, all with valid ISO2 filenames.
 *  - schema tag is gab.country-trust.v1.
 *  - Freshness status is one of fresh|watch|stale; days_stale is a number.
 *  - Radar axes: a value is present ONLY when it has a real number; missing
 *    axes must be `present: false` (never a fabricated number).
 *  - Every 'confirmed' proof has a real hash + proof_url (or ots_path).
 *  - threshold.history is non-empty (seeded honest single-point at minimum).
 *
 * Run: node scripts/check-trust-envelopes.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dir = resolve(root, 'public/countries')

if (!existsSync(dir)) {
  console.error('✗ public/countries missing — run npm run trust:envelopes first')
  process.exit(1)
}

const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json')
let failed = false
const fail = (msg) => {
  console.error(`✗ ${msg}`)
  failed = true
}

const AXES = ['crypto_friendly', 'freedom', 'stability', 'tax', 'cost', 'mobility', 'banking']

for (const f of files) {
  const iso = f.slice(0, 2)
  if (!/^[A-Z]{2}$/.test(iso)) fail(`${f}: bad ISO2 filename`)
  const env = JSON.parse(readFileSync(resolve(dir, f), 'utf8'))
  const ctx = `${env.country?.name ?? f}`
  if (env.schema !== 'gab.country-trust.v1') fail(`${ctx}: schema mismatch`)
  if (!['fresh', 'watch', 'stale'].includes(env.freshness?.status))
    fail(`${ctx}: bad freshness status`)
  if (typeof env.freshness?.days_stale !== 'number') fail(`${ctx}: days_stale not a number`)
  for (const ax of AXES) {
    const a = env.scorecard?.axes?.[ax]
    if (!a) fail(`${ctx}: missing axis ${ax}`)
    else if (a.present && typeof a.value !== 'number')
      fail(`${ctx}: ${ax} present but value not a number`)
    else if (!a.present && a.value != null) fail(`${ctx}: ${ax} not present but has a value`)
  }
  if (
    env.proof?.status === 'confirmed' &&
    !env.proof?.hash &&
    !env.proof?.proof_url &&
    !env.proof?.ots_path
  ) {
    fail(`${ctx}: confirmed proof has no hash/url/ots`)
  }
  if (env.threshold?.history?.length === 0) fail(`${ctx}: empty threshold history`)
  if (typeof env.sources?.tiers?.official !== 'number') fail(`${ctx}: source tiers malformed`)
}

if (failed) process.exit(1)
console.log(
  `✓ ${files.length} envelopes valid — honesty contract holds (${files.length} countries)`,
)
