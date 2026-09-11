/**
 * Freshness report — mirrors src/lib/programFreshness.ts thresholds
 * (fresh ≤30d · recent ≤90d · stale >90d) and its resolution order:
 * Satohash proof stamp preferred over last_checked.
 *
 * Levels: 0–30 fresh · 31–90 recent · 90+ stale
 *
 * Run: node scripts/freshness-report.mjs [--queue N]
 * Exit code 0 always (report, not a gate). Pipe to CI logs or run locally.
 */
import { readFileSync } from 'node:fs'

const d = JSON.parse(readFileSync('research/countries.json', 'utf8'))
const queueN = Number(process.argv[process.argv.indexOf('--queue') + 1] || 15)

function daysSince(iso) {
  const then = new Date(`${iso}T12:00:00Z`).getTime()
  const now = new Date()
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12)
  return Math.floor((today - then) / 86_400_000)
}

const rows = d.programs
  .map(p => {
    const stamp = (p.satohash_proofs || []).find(x => x.stamped_at)?.stamped_at
    // resolveFreshnessDate(): proof stamp preferred, else last_checked
    const resolved = stamp ? stamp.slice(0, 10) : (p.last_checked || '').slice(0, 10) || null
    const days = resolved ? daysSince(resolved) : 9999
    const level = days <= 30 ? 'fresh' : days <= 90 ? 'recent' : 'stale'
    return { name: p.name, id: p.id, resolved, days, level, checked: p.last_checked, stamp: stamp ? stamp.slice(0, 10) : null }
  })
  .sort((a, b) => b.days - a.days)

const byLevel = { fresh: 0, recent: 0, stale: 0 }
for (const r of rows) byLevel[r.level]++

console.log(`Freshness report — ${rows.length} programs (resolved date = proof stamp ?? last_checked)`)
console.log(`  fresh:  ${byLevel.fresh}`)
console.log(`  recent: ${byLevel.recent}`)
console.log(`  stale:  ${byLevel.stale}`)
console.log('')

const researchStale = rows.filter(r => r.level === 'stale')
if (researchStale.length) {
  console.log(`⚠ RESEARCH-STALE (>90d) — run the research pipeline on these first:`)
  for (const r of researchStale) console.log(`  ${String(r.days).padStart(3)}d  ${r.name} (checked ${r.checked})`)
  console.log('')
}

console.log(`Next-stalest queue (top ${queueN}):`)
for (const r of rows.slice(0, queueN)) {
  console.log(`  ${String(r.days).padStart(3)}d  ${r.level.padEnd(7)}${r.name} | stamp ${r.stamp ?? '—'} | checked ${r.checked ?? '—'}`)
}

// Lag signal: data re-verified but proof not yet re-anchored (self-heals via pipeline)
const lagging = rows.filter(r => r.stamp && r.checked && r.checked > r.stamp)
if (lagging.length) {
  console.log('')
  console.log(`ℹ ${lagging.length} program(s) verified after their last proof stamp — Satohash re-anchor pending (self-heals):`)
  for (const r of lagging.slice(0, queueN)) console.log(`  ${r.name} | verified ${r.checked} > stamp ${r.stamp}`)
}
