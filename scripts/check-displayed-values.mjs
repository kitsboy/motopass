#!/usr/bin/env node
/**
 * A4 gate — displayed value === hashed-slice value; no flagship extension may
 * override a sourced field that drives what the user sees.
 *
 * The card/table/modal minimum comes from `finance.min_investment_usd` (or
 * `typical_investment_usd`). That `finance` object is part of the canonical
 * slice that Satohash/OTS proofs cover (scripts/lib/canonical-slice.mjs →
 * SLICE_FIELDS). So the number a visitor reads is exactly the number a proof
 * backs — unless a flagship extension rewrites `finance` after stamping.
 *
 * Two checks per program:
 *   1. FINANCE OVERRIDE (hard fail): an extension must never replace `finance`
 *      — the field that drives the displayed minimum.
 *   2. OTHER-STAMPED-FIELD note (warn): an extension enriches e.g. `pathways`
 *      (also slice-stamped). Allowed ONLY because the maintainer runs
 *      flagships:apply → flagships:stamp, so those get re-stamped. Anything a
 *      visitor sees remains proof-covered; a stray edit is surfaced as a warning.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { canonicalSliceHash } from './lib/canonical-slice.mjs'

const root = resolve(import.meta.dirname, '..')
const STAMPED_MONEY = ['finance']

export function auditDisplayed(programs, extensions) {
  const results = { checked: 0, failed: [], warnings: [] }
  for (const p of programs) {
    results.checked++
    const pExt = extensions[p.name]
    if (!pExt) continue
    const moneyOverridden = STAMPED_MONEY.filter(k => k in pExt)
    if (moneyOverridden.length) {
      results.failed.push({ name: p.name, fields: moneyOverridden })
      continue
    }
    const sliceHash = canonicalSliceHash(p)
    // report non-money fields whose override would change the hash
    const precise = []
    for (const k of Object.keys(pExt)) {
      if (STAMPED_MONEY.includes(k)) continue
      if (canonicalSliceHash({ ...p, [k]: pExt[k] }) !== sliceHash) {
        precise.push(k)
      }
    }
    if (precise.length) results.warnings.push({ name: p.name, fields: precise })
  }
  return results
}

function main() {
  const corpus = JSON.parse(readFileSync(resolve(root, 'research/countries.json'), 'utf8'))
  const ext = JSON.parse(readFileSync(resolve(root, 'research/flagship-extensions.json'), 'utf8'))
  const r = auditDisplayed(corpus.programs, ext)
  for (const f of r.failed) {
    console.error(`FAIL  ${f.name}: flagship extension overrides ${f.fields.join(', ')} (a stamped/displayed field).`)
  }
  for (const w of r.warnings) {
    console.warn(`note  ${w.name}: extension touches stamped field(s) ${w.fields.join(', ')} — only valid if re-stamped after apply (finance is safe).`)
  }
  if (r.failed.length) {
    console.error(`\nA4: ${r.failed.length} extension override(s) of a sourced/displayed field — BLOCKING.`)
    process.exit(1)
  }
  console.log(`\nA4 displayed-value gate: ${r.checked}/${corpus.programs.length} programs clean (0 finance overrides).`)
  if (r.warnings.length) {
    console.log(`     ${r.warnings.length} note(s): extension enriches non-finance stamped fields (re-stamp-scoped).`)
  }
}

if (process.argv[1] === import.meta.filename) main()
