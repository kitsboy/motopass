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

if (flagshipCount < 6) {
  console.error(`✗ Expected at least 6 flagships, found ${flagshipCount}`)
  failed = true
}

if (failed) process.exit(1)
console.log(`✓ Stamps validated — ${flagshipCount} flagships, ${data.programs.length} total programs`)