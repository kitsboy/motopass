#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const STUB_RE = /aaaa|placeholder|stub|demo|0000000/i
const SHA64 = /^[a-f0-9]{64}$/i

const data = JSON.parse(readFileSync('research/countries.json', 'utf8'))
let failed = false
let flagshipCount = 0

for (const p of data.programs) {
  const proof = p.satohash_proofs?.[0]
  if (p.flagship_depth) {
    flagshipCount++
    if (!proof?.proof_url) {
      console.error(`✗ ${p.name}: flagship missing proof_url`)
      failed = true
      continue
    }
    const hash = proof.proof_url.replace(/\/$/, '').split('/').pop()
    if (!SHA64.test(hash)) {
      console.error(`✗ ${p.name}: invalid proof hash`)
      failed = true
    }
    if (STUB_RE.test(proof.proof_url)) {
      console.error(`✗ ${p.name}: stub proof URL on flagship`)
      failed = true
    }
    if (proof.block_height && p.last_verified_block && proof.block_height !== p.last_verified_block) {
      console.error(`✗ ${p.name}: block_height mismatch`)
      failed = true
    }
    if (!p.pathways?.length || !p.critical_tests || !p.paige_fields) {
      console.error(`✗ ${p.name}: incomplete flagship schema`)
      failed = true
    }
  }
}

// The corpus is the truth — never a hard-coded 50. The historical 50-country
// export was superseded by the curated 21-program corpus (see the 2026-09-29
// handoff): G1 broke on "Expected 50/50 flagships, found 20" for weeks while
// the data was correct.
//
// This gate verifies STAMP INTEGRITY: every program that claims flagship_depth
// must carry complete, non-stub proofs. Corpus-wide flagship completeness is
// RESEARCH PROGRESS (e.g. a newly added country mid-research) — reported
// honestly below, never invented, and never a blocker here. Templates are
// listed so scaffolds can't hide behind a passing total.
const templatePrograms = data.programs.filter(
  (p) => p.flagship_depth && p.flagship_tier === 'template',
)
if (templatePrograms.length > 0) {
  console.warn(
    `⚠ ${templatePrograms.length} flagship-tier template scaffold(s): ${templatePrograms.map((p) => p.name).join(', ')}`,
  )
}

if (failed) process.exit(1)
const depth = `${flagshipCount}/${data.programs.length}`
if (flagshipCount < data.programs.length) {
  console.warn(
    `⚠ Flagship depth ${depth} — ${data.programs.length - flagshipCount} program(s) still in research (integrity gate, not a depth gate)`,
  )
}
console.log(`✓ Stamps validated — depth ${depth}, ${data.programs.length} total programs`)