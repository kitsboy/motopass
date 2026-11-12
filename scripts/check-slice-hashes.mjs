#!/usr/bin/env node
/**
 * Slice-hash audit: does each record's stamped hash still describe its content?
 *
 * The proof covers `canonicalSlice(program)`. If a record is edited and not
 * re-stamped, the stamp covers older content and the badge must say so. This
 * walks every program, recomputes the slice hash, and compares it with the
 * stamped hash.
 *
 * Usage:
 *   node scripts/check-slice-hashes.mjs           # report, exit 1 on drift
 *   node scripts/check-slice-hashes.mjs --json    # machine-readable, no exit
 */
import { readFileSync } from 'node:fs'
import { canonicalSliceHash } from './lib/canonical-slice.mjs'

const corpus = JSON.parse(readFileSync(new URL('../research/countries.json', import.meta.url), 'utf8'))
const asJson = process.argv.includes('--json')
// --write emits the map the UI reads, so a drifted record shows "changed since
// last timestamp" without shipping the hash logic to the browser.
const writeIdx = process.argv.indexOf('--write')

const rows = corpus.programs.map((program) => {
  const proof = (program.satohash_proofs ?? [])[0]
  const sliceHash = canonicalSliceHash(program)
  const storedHash = proof?.content_hash ?? null
  return {
    name: program.name,
    sliceHash,
    storedHash,
    inSync: Boolean(storedHash) && storedHash === sliceHash,
    stampedAt: proof?.stamped_at ?? null,
  }
})

const drifted = rows.filter((r) => !r.inSync)

if (writeIdx !== -1) {
  const { writeFileSync } = await import('node:fs')
  const out = Object.fromEntries(rows.map((r) => [r.name, { inSync: r.inSync, stampedAt: r.stampedAt }]))
  writeFileSync(new URL('../src/data/sliceStatus.json', import.meta.url), JSON.stringify(out, null, 2) + '\n')
  console.log(`slice status written for ${rows.length} records · ${drifted.length} changed since timestamp`)
  process.exit(0)
}

if (asJson) {
  console.log(JSON.stringify({ checked: rows.length, drifted: drifted.length, rows }, null, 2))
  process.exit(0)
}

for (const row of drifted) {
  console.error(
    `✗ ${row.name}: content changed since the timestamp ` +
      `(slice ${row.sliceHash.slice(0, 12)}… ≠ stamp ${(row.storedHash ?? 'none').slice(0, 12)}…)`,
  )
}
console.log(
  drifted.length
    ? `\n${drifted.length} of ${rows.length} records changed since their timestamp`
    : `\nall ${rows.length} records match their timestamp`,
)
process.exit(drifted.length ? 1 : 0)
