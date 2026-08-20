#!/usr/bin/env node
/**
 * CI gate for the intel manifest — validates shape + coverage so a bad daily
 * run can never ship a broken `public/data/intel.json`.
 *
 * Usage: node scripts/check-intel.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const intelPath = resolve(root, 'public/data/intel.json')

if (!existsSync(intelPath)) {
  console.error('✗ public/data/intel.json missing — run npm run intel:run (or intel:migrate + intel:write) first')
  process.exit(1)
}

const intel = JSON.parse(readFileSync(intelPath, 'utf8'))
let failed = false
const fail = (msg) => {
  console.error(`✗ ${msg}`)
  failed = true
}

if (intel.schema !== 'motopass.country-intel.v1') fail('schema tag missing/mismatched')
if (!intel.generated_at) fail('generated_at missing')
if (!intel.sweep || typeof intel.sweep.fresh !== 'number' || typeof intel.sweep.stale !== 'number') {
  fail('sweep counts missing')
}
const names = Object.keys(intel.programs ?? {})
if (names.length !== 50) fail(`expected 50 programs in intel.json, found ${names.length}`)
for (const name of names) {
  const p = intel.programs[name]
  if (!p?.freshness || typeof p.freshness.days_stale !== 'number') fail(`${name}: freshness missing`)
  if (!['fresh', 'watch', 'stale'].includes(p.freshness.status)) fail(`${name}: bad freshness status`)
  if (!p.proof?.hash) fail(`${name}: proof hash missing`)
  if (typeof p.proof.in_sync !== 'boolean') fail(`${name}: proof.in_sync missing`)
  if (!Array.isArray(p.recent_changes)) fail(`${name}: recent_changes missing`)
}

if (failed) process.exit(1)
console.log(`✓ intel.json valid — ${names.length} programs · sweep ${intel.sweep.fresh}/${intel.sweep.watch}/${intel.sweep.stale}`)
