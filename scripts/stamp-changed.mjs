#!/usr/bin/env node
/**
 * Satohash API re-stamp loop — the "self-heal to the chain" step.
 *
 * Compares each program's canonical-slice hash to the stored proof hash and,
 * when they differ (a real research change), anchors the new state via
 * POST https://api.satohash.io/api/stamp. Updates the proof record with the
 * new content_hash, proof_url, stamped_at, stamp_id and block height, and
 * appends an audit entry. Non-fatal when the API is unreachable.
 *
 * Env:
 *   SATOHASH_API_URL  default https://api.satohash.io
 *   SATOHASH_API_KEY  optional (sent as X-Satohash-Key)
 *
 * Usage: node scripts/stamp-changed.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonicalSliceHash } from './lib/canonical-slice.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')
const DRY_RUN = process.argv.includes('--dry-run')

const API_BASE = (process.env.SATOHASH_API_URL || 'https://api.satohash.io').replace(/\/$/, '')
const API_KEY = process.env.SATOHASH_API_KEY || undefined
const CLIENT = 'motopass-intel'
// Respect the Satohash API rate limit: pace stamps and cap each run. Remaining
// drift heals on the next daily run — incremental self-heal by design.
const STAMP_DELAY_MS = Number(process.env.STAMP_DELAY_MS ?? 2000)
const MAX_STAMPS_PER_RUN = Number(process.env.MAX_STAMPS_PER_RUN ?? 15)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const SHA64 = /^[a-f0-9]{64}$/i

async function apiStamp(hash) {
  const headers = { 'Content-Type': 'application/json', 'X-Satohash-Client': CLIENT }
  if (API_KEY) headers['X-Satohash-Key'] = API_KEY
  const res = await fetch(`${API_BASE}/api/stamp`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ hash, filename: 'motopass-country-intel' }),
  })
  let body = {}
  try {
    body = await res.json()
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    throw new Error(`Satohash stamp HTTP ${res.status}: ${body.error ?? body.message ?? 'unknown'}`)
  }
  return body
}

async function apiGetStamp(id) {
  const res = await fetch(`${API_BASE}/api/stamps/${encodeURIComponent(id)}`, {
    headers: { 'X-Satohash-Client': CLIENT },
  })
  let body = {}
  try {
    body = await res.json()
  } catch {
    /* non-JSON */
  }
  if (!res.ok) throw new Error(`Satohash getStamp HTTP ${res.status}`)
  return body
}

async function stampProgram(p) {
  const proof = p.satohash_proofs?.[0]
  if (!proof) return { name: p.name, action: 'skip', reason: 'no proof record' }

  const sliceHash = canonicalSliceHash(p)
  const storedHash = proof.content_hash ?? proof.proof_url?.split('/').pop() ?? null
  if (storedHash === sliceHash) return { name: p.name, action: 'ok', reason: 'hash in sync' }

  if (DRY_RUN) {
    return { name: p.name, action: 'would-stamp', from: storedHash?.slice(0, 8) ?? null, to: sliceHash.slice(0, 8) }
  }

  const stamped = await apiStamp(sliceHash)
  const id = typeof stamped.id === 'string' ? stamped.id : undefined
  const status = typeof stamped.status === 'string' ? stamped.status : undefined

  // Try to learn the anchor block, non-fatal.
  let blockHeight = null
  if (id) {
    try {
      const detail = await apiGetStamp(id)
      if (typeof detail.bitcoin_block_height === 'number') blockHeight = detail.bitcoin_block_height
    } catch {
      /* block height unknown yet — fine, still pending */
    }
  }

  proof.content_hash = sliceHash
  proof.proof_url = `https://satohash.io/verify/${sliceHash}`
  proof.stamped_at = new Date().toISOString()
  proof.block_height = blockHeight ?? proof.block_height
  if (id) proof.stamp_id = id
  // Keep last_verified_block in sync with the stored proof height.
  if (proof.block_height) p.last_verified_block = proof.block_height

  if (!Array.isArray(p.audit_trail)) p.audit_trail = []
  p.audit_trail.push({
    date: new Date().toISOString().slice(0, 10),
    field: 'proof',
    from: storedHash ? storedHash.slice(0, 16) : undefined,
    to: `re-anchored ${sliceHash.slice(0, 16)}${id ? ` (stamp ${id.slice(0, 12)})` : ''}${blockHeight ? ` @ block ${blockHeight}` : ''}`,
    source: 'satohash-api',
    hash: sliceHash,
  })

  return { name: p.name, action: 'stamped', id, status, block: blockHeight }
}

async function main() {
  const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
  const results = []
  let apiDown = false
  let rateLimited = false
  let stampsThisRun = 0

  for (const p of data.programs) {
    if (!p.satohash_proofs?.length) continue
    // Pacing + cap: once the cap is hit, defer the rest to the next run.
    const stampNeeded = canonicalSliceHash(p) !== (p.satohash_proofs?.[0]?.content_hash ?? null)
    if (stampNeeded && stampsThisRun >= MAX_STAMPS_PER_RUN) {
      results.push({ name: p.name, action: 'deferred', reason: 'per-run cap' })
      continue
    }
    try {
      const r = await stampProgram(p)
      if (r.action === 'stamped') stampsThisRun++
      results.push(r)
      if (r.action === 'stamped') await sleep(STAMP_DELAY_MS)
    } catch (err) {
      if (/429|Too many|rate/i.test(err.message)) {
        rateLimited = true
        results.push({ name: p.name, action: 'rate-limited', reason: err.message })
        break // stop the burst; next run continues
      }
      apiDown = true
      results.push({ name: p.name, action: 'api-error', reason: err.message })
    }
  }

  const stamped = results.filter(r => r.action === 'stamped')
  const would = results.filter(r => r.action === 'would-stamp')
  const deferred = results.filter(r => r.action === 'deferred')
  const errors = results.filter(r => r.action === 'api-error')

  if (DRY_RUN) {
    console.log(`[dry-run] ${results.length} programs checked · ${would.length} would re-stamp`)
    for (const r of would) console.log(`  would-stamp ${r.name}: ${r.from} → ${r.to}`)
    return
  }

  writeFileSync(countriesPath, JSON.stringify(data, null, 2) + '\n')
  console.log(`✓ Stamp loop — ${results.length} checked · ${stamped.length} re-stamped · ${deferred.length} deferred · ${errors.length} api errors`)
  for (const r of stamped) console.log(`  ✓ ${r.name} → ${r.id ?? 'stamped'}${r.block ? ` @ block ${r.block}` : ''}`)
  for (const r of errors) console.log(`  ✗ ${r.name}: ${r.reason}`)
  if (rateLimited) console.warn('⚠ Rate-limited — remaining re-stamps deferred to next daily run (incremental self-heal)')
  if (apiDown) console.warn('⚠ Satohash API partially unreachable — remaining re-stamps deferred to next daily run')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
