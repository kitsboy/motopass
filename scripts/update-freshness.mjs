#!/usr/bin/env node
/**
 * Daily freshness sweep — recomputes per-program freshness from `last_checked`
 * and writes the runtime manifest `public/data/intel.json`.
 *
 * Never rewrites `last_checked` (a human research date) and never changes the
 * canonical slice, so daily runs do NOT trigger re-stamps.
 *
 * Usage: node scripts/update-freshness.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { freshnessStatus, daysSince } from './lib/derive-intel.mjs'
import { canonicalSliceHash } from './lib/canonical-slice.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')
const intelPath = resolve(root, 'public/data/intel.json')

/** Build the runtime manifest from countries.json. Pure — exported for tests. */
export function buildIntel(data, opts = {}) {
  const nowIso = opts.nowIso ?? new Date().toISOString()
  const now = opts.now ?? Date.now()
  const counts = { fresh: 0, watch: 0, stale: 0 }
  const programs = {}

  for (const p of data.programs) {
    const days = daysSince(p.last_checked, now)
    const status = freshnessStatus(days)
    counts[status]++
    const proof = p.satohash_proofs?.[0]
    const recentChanges = (p.audit_trail ?? []).slice(-5).reverse().map(e => ({
      date: e.date,
      field: e.field,
      from: e.from,
      to: e.to,
      hash: e.hash,
    }))
    const proofHash = proof?.content_hash ?? proof?.proof_url?.split('/').pop() ?? null
    programs[p.name] = {
      id: p.id,
      freshness: { status, days_stale: days ?? 0, last_checked: p.last_checked },
      watch: {
        changed: p.watch?.changed === true,
        probed: (p.watch?.urls ?? []).filter(u => u.status !== 'unprobed').length,
        unreachable: (p.watch?.urls ?? []).filter(u => u.status === 'unreachable').length,
      },
      proof: {
        hash: proofHash,
        // True when the stored proof hash matches the current canonical slice —
        // false while the incremental re-stamp loop is still converging.
        in_sync: proofHash != null && proofHash === canonicalSliceHash(p),
        block: proof?.block_height ?? p.last_verified_block ?? null,
        stamped_at: proof?.stamped_at ?? null,
        stamp_id: proof?.stamp_id ?? null,
      },
      recent_changes: recentChanges,
    }
  }

  return {
    generated_at: nowIso,
    schema: 'motopass.country-intel.v1',
    sweep: {
      fresh: counts.fresh,
      watch: counts.watch,
      stale: counts.stale,
      swept_at: nowIso,
      ...(opts.lastProbeAt ? { last_probe_at: opts.lastProbeAt } : {}),
      ...(opts.satohashApi ? { satohash_api: opts.satohashApi } : {}),
    },
    programs,
  }
}

function main() {
  const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
  const intel = buildIntel(data)
  mkdirSync(resolve(root, 'public/data'), { recursive: true })
  writeFileSync(intelPath, JSON.stringify(intel, null, 2) + '\n')
  console.log(
    `✓ Freshness swept — ${intel.sweep.fresh} fresh / ${intel.sweep.watch} watch / ${intel.sweep.stale} stale → ${intelPath}`,
  )
}

// Allow import for tests without running main.
if (process.argv[1] && process.argv[1].endsWith('update-freshness.mjs')) {
  main()
}
