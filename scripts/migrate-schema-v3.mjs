#!/usr/bin/env node
/**
 * Schema v3 migration — adds the Country Intel blocks to every program.
 *
 * Idempotent: existing pros/cons/scorecard/watch/audit_trail blocks are
 * preserved; only missing blocks are seeded. Safe to run every daily run.
 *
 * Derivation is HONEST-ONLY: every seeded claim comes from the vetted corpus
 * (paige_fields, critical_tests, finance, risk_level, legal_compliance) and is
 * tagged with `source` + `verified_at: last_checked`. No new facts invented.
 *
 * Usage: node scripts/migrate-schema-v3.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonicalSliceHash } from './lib/canonical-slice.mjs'
import {
  CORPUS_SOURCE,
  daysSince,
  freshnessStatus,
  derivePros,
  deriveCons,
  deriveScorecard,
} from './lib/derive-intel.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')
const DRY_RUN = process.argv.includes('--dry-run')

function seedProgram(p, today) {
  const changed = {}
  if (!p.freshness) {
    const days = daysSince(p.last_checked)
    p.freshness = { status: freshnessStatus(days), days_stale: days ?? 0, last_sweep: null }
    changed.freshness = true
  }
  if (!p.watch) {
    p.watch = {
      urls: (p.legal_compliance?.official_urls ?? []).map(url => ({
        url,
        last_probed: null,
        last_hash: null,
        status: 'unprobed',
      })),
      changed: false,
      last_probe_at: null,
    }
    changed.watch = true
  }
  if (!p.pros) {
    p.pros = derivePros(p)
    changed.pros = true
  }
  if (!p.cons) {
    p.cons = deriveCons(p)
    changed.cons = true
  }
  if (!p.scorecard) {
    p.scorecard = deriveScorecard(p)
    changed.scorecard = true
  }
  if (!Array.isArray(p.audit_trail)) {
    p.audit_trail = [
      {
        date: today,
        field: 'schema.v3',
        to: 'v3 intel blocks seeded (pros/cons/scorecard/freshness/watch)',
        source: CORPUS_SOURCE,
        hash: canonicalSliceHash(p),
      },
    ]
    changed.audit_trail = true
  }
  return Object.keys(changed).length
}

function main() {
  const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
  const today = new Date().toISOString().slice(0, 10)
  let touched = 0
  let blocks = 0
  for (const p of data.programs) {
    const n = seedProgram(p, today)
    if (n > 0) {
      touched++
      blocks += n
    }
  }
  if (DRY_RUN) {
    console.log(`[dry-run] would seed ${blocks} v3 blocks across ${touched}/${data.programs.length} programs`)
    return
  }
  writeFileSync(countriesPath, JSON.stringify(data, null, 2) + '\n')
  console.log(`✓ Schema v3 seeded — ${blocks} blocks across ${touched}/${data.programs.length} programs`)
}

main()
