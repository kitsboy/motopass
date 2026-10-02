#!/usr/bin/env node
/**
 * MotoPass industry-news watchdog — "what are our competitors publishing?" feed.
 *
 * Watches the industry CBI outlets (CitizenX/PlanBpassport, IMI Daily, Nomad
 * Capitalist, Henley & Partners, Get Golden Visa) via Google News RSS and folds
 * their program announcements into the SAME event feed the official-source
 * watchdog (`source-events.json`) writes to.
 *
 * Why this exists (card t_05522f76): CitizenX/Katie broke the Argentina CBI
 * story while `probe-sources.mjs` only watches official government portals —
 * so competitor / industry CBI announcements never landed until a human saw
 * them on X. This step captures them the same day.
 *
 * Detection facts only. It never rewrites a program's rules: it appends a
 * `kind:'industry'` event to the shared change feed and records the story's
 * guid in `source-snapshots.json` (namespaced) so a story is surfaced exactly
 * once. A human/agent (Rosa or Kimi's lane) reviews the headline and verifies
 * against the official corpus before anything is auto-published.
 *
 * Outputs:
 *   - appends `kind:'industry'` events to public/data/source-events.json
 *   - writes seen-guids to public/data/source-snapshots.json (industry_* keys)
 *   - prints a summary
 *
 * Usage: node scripts/intel-industry.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchAllIndustryNews, classifyIndustryItem } from './lib/intel-sources.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')
const intelDir = resolve(root, 'public/data')
const eventsPath = resolve(intelDir, 'source-events.json')
const snapsPath = resolve(intelDir, 'source-snapshots.json')
const EVENTS_CAP = 200
const DRY_RUN = process.argv.includes('--dry-run')
const ITEMS_PER_SOURCE = 30

function loadJson(path, def) {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return def }
}

async function main() {
  const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
  const countryList = (data.programs || []).map((p) => p.name)
  const countryId = new Map((data.programs || []).map((p) => [p.name, p.id]))
  const nowIso = new Date().toISOString()
  const today = nowIso.slice(0, 10)

  const EVENTS = loadJson(eventsPath, [])
  const SNAP = loadJson(snapsPath, {})
  const seen = new Set(
    Object.keys(SNAP)
      .filter((k) => k.startsWith('industry_'))
      .map((k) => SNAP[k]?.guid),
  )

  if (DRY_RUN) console.log(`🔎 Industry watch — reading ${countryList.length} corpus countries${DRY_RUN ? ' (dry-run)' : ''}\n`)

  const feeds = await fetchAllIndustryNews(ITEMS_PER_SOURCE)
  let feedTotal = 0
  for (const f of feeds) feedTotal += f.items.length

  const newEvents = []
  const seenNow = []
  let countryMatched = 0
  let skips = 0

  for (const feed of feeds) {
    if (!feed.items.length) continue
    console.log(`\n== ${feed.label} — ${feed.items.length} items fetched`)
    for (const item of feed.items) {
      const guid = item.guid || item.link
      if (seen.has(guid)) { skips++; continue }
      const { relevant, country } = classifyIndustryItem(item, countryList)
      if (!relevant) { skips++; continue }
      const prog = country != null ? countryId.get(country) : null
      const after = `${item.source ? `[${item.source}] ` : ''}${item.title}`.slice(0, 220)
      newEvents.push({
        id: `${nowIso}-${feed.key}-${(guid || '').replace(/[^a-z0-9]/gi, '').slice(-8)}-industry`,
        ts: nowIso,
        date: today,
        country: country || 'Industry',
        program_id: prog,
        url: item.link,
        kind: 'industry',
        status: country != null ? 'program-news' : 'announcement',
        before: null,
        after,
      })
      seenNow.push({ key: `industry_${feed.key}_${(guid || '').replace(/[^a-z0-9]/gi, '').slice(-12)}`, guid, ts: nowIso })
      if (country != null) countryMatched++
      console.log(`   • ${country != null ? `[${country}] ` : ''}${item.title.slice(0, 100)}`)
    }
  }

  // ── persist (rolling, newest-first, capped) ─────────────────────────────
  const allEvents = [...newEvents, ...EVENTS].slice(0, EVENTS_CAP)
  for (const entry of seenNow) {
    if (!SNAP[entry.key]) SNAP[entry.key] = { guid: entry.guid, first_seen: entry.ts }
  }

  console.log(`\n✓ Industry watch — ${feedTotal} raw items, ${newEvents.length} new event(s)${DRY_RUN ? ' (dry-run)' : ''}, ${countryMatched} country-matched, ${skips} skipped (already-seen / not program news)`)
  if (newEvents.length) {
    console.log('  NEW program/competitor items:')
    for (const e of newEvents.slice(0, 10)) console.log(`    ${e.date} · ${e.country} · ${e.after.slice(0, 90)}`)
  }

  if (!DRY_RUN) {
    mkdirSync(intelDir, { recursive: true })
    writeFileSync(eventsPath, JSON.stringify(allEvents, null, 2) + '\n')
    writeFileSync(snapsPath, JSON.stringify(SNAP, null, 2) + '\n')
  }
}

main().catch((err) => {
  console.error('✗ Industry watch failed:', err)
  process.exit(1)
})
