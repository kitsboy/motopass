#!/usr/bin/env node
/**
 * Intel fetch — the automated research step in the daily pipeline.
 *
 * Fetches real-world data from multiple sources (Wikipedia, BTC Map, CoinGecko),
 * diffs against the existing corpus, and auto-updates countries.json with
 * verified changes. Every change is recorded in audit_trail for honesty.
 *
 * This step replaces the human "fill the brief" work — it's the self-healing
 * research layer that keeps the 50-country corpus honest and near-real-time.
 *
 * Safety rules:
 *   - Only writes changes with confidence >= medium (Wikipedia-only = detection)
 *   - Never overwrites values with null or empty
 *   - Never downgrades a researched value based on weak signals
 *   - All changes go through validateCountryFields before writing
 *   - last_checked is NEVER updated (human research date, preserved)
 *   - Budget: 50 countries × 3 sources = 150 fetches max; concurrency 5
 *
 * Usage:
 *   node scripts/intel-fetch.mjs [--dry-run] [--top=N] [--country=NAME]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchAllSources } from './lib/intel-sources.mjs'
import { diffCountry } from './lib/intel-diff.mjs'
import { canonicalSliceHash } from './lib/canonical-slice.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')

const DRY_RUN = process.argv.includes('--dry-run')
const topArg = process.argv.find(a => a.startsWith('--top='))
const topN = topArg ? Number(topArg.split('=')[1]) : Infinity
const countryArg = process.argv.find(a => a.startsWith('--country='))
const singleCountry = countryArg ? countryArg.split('=')[1] : null

const CONCURRENCY = 5
const FETCH_DELAY_MS = 500 // pace between batches to avoid API throttling

// ── Helpers ──────────────────────────────────────────────────────────────────

async function mapWithConcurrency(items, limit, fn) {
  const results = new Map()
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      const item = items[i]
      results.set(item.name, await fn(item))
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

/**
 * Validate that a proposed change is safe to write.
 * Returns true if the change passes all honesty gates.
 */
function validateChange(change, program) {
  // Never write null or empty strings
  if (change.to == null || (typeof change.to === 'string' && change.to.trim().length === 0)) {
    return false
  }
  // Never write a value that's essentially the same as what we have
  const from = change.from
  if (from != null && String(from).trim() === String(change.to).trim()) {
    return false
  }
  // Only apply medium+ confidence changes
  if (change.confidence === 'low') return false
  // Never touch last_checked (human research date)
  if (change.field === 'last_checked') return false
  // Never touch id or name
  if (change.field === 'id' || change.field === 'name') return false
  return true
}

/**
 * Apply a validated change to a program object.
 * Returns true if something was actually written.
 */
function applyChange(program, change) {
  const parts = change.field.split('.')
  let target = program
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    if (target[key] == null || typeof target[key] !== 'object') {
      target[key] = {}
    }
    target = target[key]
  }
  const lastKey = parts[parts.length - 1]
  const oldValue = target[lastKey]

  // Final guard: don't overwrite with same value
  if (oldValue === change.to) return false

  target[lastKey] = change.to
  return true
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
  const nowIso = new Date().toISOString()
  const today = nowIso.slice(0, 10)

  // Select programs to research
  let programs = data.programs
  if (singleCountry) {
    programs = programs.filter(p => p.name === singleCountry)
    if (programs.length === 0) {
      console.error(`✗ Country "${singleCountry}" not found in corpus`)
      process.exit(1)
    }
  } else {
    // Prioritize stale programs, but cap at topN
    programs = [...data.programs]
      .sort((a, b) => {
        const da = a.freshness?.days_stale ?? 999
        const db = b.freshness?.days_stale ?? 999
        return db - da
      })
      .slice(0, topN)
  }

  console.log(`🔍 Intel fetch — ${programs.length} countries${DRY_RUN ? ' (dry-run)' : ''}`)
  console.log('')

  // ── Phase 1: Fetch all sources ──────────────────────────────────────────
  const sourceResults = await mapWithConcurrency(programs, CONCURRENCY, async (p) => {
    const sources = await fetchAllSources(p.name)
    const hasData = sources.wikipedia || sources.btcmap || sources.cryptoClimate
    if (!hasData) return null
    return sources
  })

  const fetchStats = { wikipedia: 0, btcmap: 0, coingecko: 0, failed: 0 }
  for (const [, sources] of sourceResults) {
    if (!sources) { fetchStats.failed++; continue }
    if (sources.wikipedia) fetchStats.wikipedia++
    if (sources.btcmap) fetchStats.btcmap++
    if (sources.cryptoClimate) fetchStats.coingecko++
  }

  console.log(`📡 Sources fetched: Wikipedia ${fetchStats.wikipedia} · BTC Map ${fetchStats.btcmap} · CoinGecko ${fetchStats.coingecko} · Failed ${fetchStats.failed}`)
  console.log('')

  // ── Phase 2: Diff against corpus ────────────────────────────────────────
  let totalChanges = 0
  let totalSignals = 0
  const appliedChanges = []
  const skippedChanges = []
  const allSignals = []

  for (const program of programs) {
    const sources = sourceResults.get(program.name)
    if (!sources) continue

    const diff = diffCountry(program, sources)
    totalSignals += diff.signals.length
    allSignals.push(...diff.signals.map(s => ({ ...s, country: program.name })))

    for (const change of diff.changes) {
      totalChanges++
      if (!validateChange(change, program)) {
        skippedChanges.push({ country: program.name, ...change, reason: 'validation gate' })
        continue
      }

      if (DRY_RUN) {
        appliedChanges.push({ country: program.name, ...change, reason: 'would-apply' })
        continue
      }

      // Apply the change
      const wrote = applyChange(program, change)
      if (wrote) {
        // Record in audit trail
        if (!Array.isArray(program.audit_trail)) program.audit_trail = []
        program.audit_trail.push({
          date: today,
          field: change.field,
          from: String(change.from ?? '').slice(0, 100),
          to: String(change.to ?? '').slice(0, 100),
          source: `intel-fetch:${change.source}`,
          hash: canonicalSliceHash(program),
        })

        appliedChanges.push({
          country: program.name,
          ...change,
          reason: 'applied',
        })
      }
    }
  }

  // ── Phase 3: Write results ──────────────────────────────────────────────

  if (!DRY_RUN && appliedChanges.length > 0) {
    writeFileSync(countriesPath, JSON.stringify(data, null, 2) + '\n')
  }

  // ── Summary ─────────────────────────────────────────────────────────────

  console.log('📊 Results:')
  console.log(`   ${appliedChanges.length} change(s) ${DRY_RUN ? 'would be ' : ''}applied`)
  console.log(`   ${skippedChanges.length} change(s) skipped (validation gate)`)
  console.log(`   ${totalSignals} signal(s) collected`)
  console.log('')

  if (appliedChanges.length > 0) {
    console.log('📝 Applied changes:')
    for (const c of appliedChanges) {
      const from = String(c.from ?? '∅').slice(0, 40)
      const to = String(c.to ?? '∅').slice(0, 60)
      console.log(`   ${c.country}: ${c.field}  ${from} → ${to}`)
      console.log(`     source=${c.source} confidence=${c.confidence}`)
    }
    console.log('')
  }

  if (skippedChanges.length > 0) {
    console.log('⏭️  Skipped changes:')
    for (const c of skippedChanges) {
      const to = String(c.to ?? '∅').slice(0, 60)
      console.log(`   ${c.country}: ${c.field}  → ${to}  (${c.reason})`)
    }
    console.log('')
  }

  // Signal summary by country
  const signalByCountry = {}
  for (const s of allSignals) {
    if (!signalByCountry[s.country]) signalByCountry[s.country] = []
    signalByCountry[s.country].push(s.type)
  }
  const countriesWithSignals = Object.keys(signalByCountry).length
  console.log(`📈 Signals: ${totalSignals} across ${countriesWithSignals} countries`)

  if (DRY_RUN) {
    console.log('')
    console.log('[dry-run] No files written')
  }
}

main().catch(err => {
  console.error('✗ Intel fetch failed:', err)
  process.exit(1)
})
