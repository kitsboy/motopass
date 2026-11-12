#!/usr/bin/env node
/**
 * Verify every proof in research/countries.json against Satohash's own API.
 *
 * Writes research/proof-status.json: for each record, per proof field,
 * whether the hash resolves, the chain's block height, the stamp times and the
 * confirmation status. The site reads this file, so a "Bitcoin-stamped" badge
 * can only appear when the proof actually resolves.
 *
 * Exit 1 when a proof records a block height the chain does not agree with —
 * that is the hardcoded-field failure mode Cam hit, and CI should stop on it.
 */
import fs from 'node:fs'

const ROOT = new URL('..', import.meta.url).pathname
const CORPUS = `${ROOT}research/countries.json`
const OUT = `${ROOT}research/proof-status.json`
const API = 'https://api.satohash.io/api/stamps'

async function fetchAllStamps() {
  const all = new Map()
  let page = 1
  let total = Infinity
  while (all.size < total) {
    const res = await fetch(`${API}?limit=100&page=${page}`)
    if (!res.ok) throw new Error(`satohash ${res.status}`)
    const json = await res.json()
    total = json.total ?? 0
    for (const s of json.stamps ?? []) if (s.hash) all.set(s.hash, s)
    if (!json.stamps?.length) break
    page += 1
  }
  return all
}

const stamps = await fetchAllStamps()
const corpus = JSON.parse(fs.readFileSync(CORPUS, 'utf8'))
const programs = corpus.programs ?? corpus

const status = { source: API, checked_at: new Date().toISOString(), stamps_seen: stamps.size, records: {} }
const mismatches = []

for (const rec of programs) {
  const entry = { proofs: {} }
  for (const proof of rec.satohash_proofs ?? []) {
    const hash = proof.content_hash
    const found = hash ? stamps.get(hash) : null
    const chainHeight = found?.bitcoin_block_height ?? null
    entry.proofs[proof.field ?? 'unknown'] = {
      hash,
      resolves: !!found,
      status: found?.status ?? null,
      confirmed_at: found?.confirmed_at ?? null,
      created_at: found?.created_at ?? null,
      chain_block_height: chainHeight,
      recorded_block_height: proof.block_height ?? null,
      agrees: found ? chainHeight === proof.block_height : null,
      proof_url: proof.proof_url ?? null,
    }
    if (found && chainHeight !== proof.block_height) {
      mismatches.push(`${rec.name}/${proof.field}: corpus ${proof.block_height} vs chain ${chainHeight}`)
    }
  }
  status.records[rec.name] = entry
}

fs.writeFileSync(OUT, JSON.stringify(status, null, 1))
fs.mkdirSync(`${ROOT}src/data`, { recursive: true })
fs.writeFileSync(`${ROOT}src/data/proofStatus.json`, JSON.stringify(status, null, 1))

const all = Object.values(status.records).flatMap(r => Object.values(r.proofs))
const resolved = all.filter(p => p.resolves).length
console.log(`proofs ${all.length} · resolve ${resolved} · missing ${all.length - resolved} · height mismatches ${mismatches.length}`)
for (const m of mismatches.slice(0, 10)) console.log('  MISMATCH', m)
for (const [name, r] of Object.entries(status.records)) {
  const bad = Object.entries(r.proofs).filter(([, p]) => !p.resolves)
  if (bad.length) console.log(`  no proof on record: ${name} — ${bad.map(([f]) => f).join(', ')}`)
}

if (mismatches.length) {
  console.error('Hardcoded or stale block heights found. Run: node scripts/verify-proofs.mjs --fix')
  if (process.argv.includes('--fix')) {
    for (const rec of programs) {
      for (const proof of rec.satohash_proofs ?? []) {
        const found = proof.content_hash ? stamps.get(proof.content_hash) : null
        if (found?.bitcoin_block_height) {
          proof.block_height = found.bitcoin_block_height
          if (found.created_at) proof.stamped_at = `${found.created_at.replace(' ', 'T')}Z`
        }
      }
    }
    fs.writeFileSync(CORPUS, JSON.stringify(corpus, null, 1) + '\n')
    console.log('corpus block heights rewritten from the chain')
    process.exit(0)
  }
  process.exit(1)
}
