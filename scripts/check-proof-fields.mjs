#!/usr/bin/env node
/**
 * Build check: no proof field may be hardcoded.
 *
 * Every block height in research/countries.json must equal the chain value in
 * src/data/proofStatus.json, which is generated from Satohash's API. If someone
 * types a number into the corpus, or the status file goes stale, this fails.
 *
 * No network here, so it is safe in CI. Regenerate the status file with:
 *   node scripts/verify-proofs.mjs
 */
import fs from 'node:fs'

const ROOT = new URL('..', import.meta.url).pathname
const corpus = JSON.parse(fs.readFileSync(`${ROOT}research/countries.json`, 'utf8'))
const status = JSON.parse(fs.readFileSync(`${ROOT}src/data/proofStatus.json`, 'utf8'))
const programs = corpus.programs ?? corpus

const problems = []
let checked = 0

for (const rec of programs) {
  const entry = status.records?.[rec.name]
  for (const proof of rec.satohash_proofs ?? []) {
    checked += 1
    const field = proof.field ?? 'unknown'
    const known = entry?.proofs?.[field]
    if (!known) {
      problems.push(`${rec.name}/${field}: no verified status — run node scripts/verify-proofs.mjs`)
      continue
    }
    if (!known.resolves) {
      // A proof that does not resolve may stay in the corpus, but nothing may
      // show a block height or badge for it.
      if (proof.block_height) {
        problems.push(`${rec.name}/${field}: unresolved proof still carries block ${proof.block_height}`)
      }
      continue
    }
    if (proof.block_height !== known.chain_block_height) {
      problems.push(
        `${rec.name}/${field}: corpus block ${proof.block_height} ≠ chain ${known.chain_block_height}`,
      )
    }
    if (proof.content_hash !== known.hash) {
      problems.push(`${rec.name}/${field}: hash differs from the verified one`)
    }
  }
}

console.log(`proof fields checked ${checked} · problems ${problems.length}`)
for (const p of problems) console.log('  ', p)
if (problems.length) process.exit(1)
