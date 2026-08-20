#!/usr/bin/env node
/**
 * Official-source watchdog — the "rules changed?" detector.
 *
 * Probes each program's `watch.urls` (seeded from legal_compliance.official_urls),
 * hashes the response body's first bytes, and flags when the hash differs from
 * the stored baseline. Detected changes are recorded in `audit_trail` with the
 * canonical-slice hash — they are DETECTION facts, never invented rule rewrites.
 * Humans (us / Kimi / Paige) review flagged countries and update the corpus.
 *
 * Behavior:
 *   - First probe of a URL records the baseline (status 'ok'), no change entry.
 *   - Later probe with a different body hash → status 'changed' + audit entry.
 *   - Unreachable hosts → status 'unreachable' (no audit spam, one entry max).
 *
 * Usage: node scripts/probe-sources.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { canonicalSliceHash } from './lib/canonical-slice.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')
const DRY_RUN = process.argv.includes('--dry-run')

const PROBE_TIMEOUT_MS = Number(process.env.PROBE_TIMEOUT_MS ?? 10_000)
const MAX_BODY_BYTES = 16_000
const CONCURRENCY = Number(process.env.PROBE_CONCURRENCY ?? 5)

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

function probeUrl(url) {
  return new Promise(resolveProbe => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
    fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'motopass-intel-probe/1.0 (+https://motopass.giveabit.io)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      },
    })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = Buffer.from(await res.arrayBuffer())
        const slice = buf.subarray(0, Math.min(buf.length, MAX_BODY_BYTES))
        const hash = createHash('sha256').update(slice).digest('hex')
        resolveProbe({ ok: true, hash, bytes: buf.length })
      })
      .catch(err => {
        resolveProbe({ ok: false, hash: null, error: err instanceof Error ? err.message : 'probe failed' })
      })
      .finally(() => clearTimeout(timer))
  })
}

async function main() {
  const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
  const nowIso = new Date().toISOString()
  let changed = 0
  let unreachable = 0

  // Flatten all watch entries with back-references, probe with bounded concurrency.
  const targets = []
  for (const p of data.programs) {
    const watch = p.watch
    if (!watch?.urls?.length) continue
    for (const entry of watch.urls) targets.push({ p, watch, entry })
  }

  const results = await mapWithConcurrency(targets, CONCURRENCY, ({ entry }) => probeUrl(entry.url))

  for (let i = 0; i < targets.length; i++) {
    const { p, watch, entry } = targets[i]
    const result = results[i]
    if (!result.ok) {
      if (entry.status !== 'unreachable') {
        entry.status = 'unreachable'
        entry.last_probed = nowIso
      }
      unreachable++
      continue
    }
    entry.last_probed = nowIso
    if (!entry.last_hash) {
      // Baseline — first recorded observation, no change flag.
      entry.last_hash = result.hash
      entry.status = 'ok'
      continue
    }
    if (entry.last_hash !== result.hash) {
      entry.last_hash = result.hash
      entry.status = 'changed'
      watch.changed = true
      changed++
      if (!Array.isArray(p.audit_trail)) p.audit_trail = []
      p.audit_trail.push({
        date: nowIso.slice(0, 10),
        field: `watch.${entry.url}`,
        to: 'Official source content changed — manual rule review required',
        source: 'source-probe',
        hash: canonicalSliceHash(p),
      })
    } else {
      entry.status = 'ok'
    }
  }

  for (const p of data.programs) {
    if (p.watch) p.watch.last_probe_at = nowIso
  }

  if (DRY_RUN) {
    console.log(`[dry-run] ${targets.length} URLs probed · ${changed} changed · ${unreachable} unreachable (not written)`)
    return
  }
  writeFileSync(countriesPath, JSON.stringify(data, null, 2) + '\n')
  console.log(`✓ Source probe — ${targets.length} URLs · ${changed} changed · ${unreachable} unreachable`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
