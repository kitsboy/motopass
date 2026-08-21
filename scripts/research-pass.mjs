#!/usr/bin/env node
/**
 * Freshness research pass — generates per-country research briefs.
 *
 * For every stale program (or the stalest N via `--top N`), writes
 * `research/passes/<date>/<slug>-brief.md` containing the CURRENT corpus
 * facts, the official URLs to check, and a fill-in "sources found" checklist.
 * A researcher (human or agent with web access) fills each brief with
 * sourced findings, then updates `last_checked` + `legal_compliance` in
 * countries.json — the pipeline re-anchors the new state automatically.
 *
 * This script NEVER changes corpus facts — it organizes the work and keeps
 * the audit honest. `last_checked` is only ever moved by a human with sources.
 *
 * Usage: node scripts/research-pass.mjs [--top N] [--all]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { daysSince, freshnessStatus } from './lib/derive-intel.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')

const args = process.argv.slice(2)
const topArg = args.find(a => a.startsWith('--top='))
const top = topArg ? Number(topArg.split('=')[1]) : 10
const includeAll = args.includes('--all')

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function briefFor(p, days) {
  const lines = []
  lines.push(`# Research brief — ${p.name}`)
  lines.push('')
  lines.push(`**Status:** ${p.status} · **Stale:** ${days} days (last checked ${p.last_checked}) · **Risk:** ${p.risk_level ?? '—'}`)
  lines.push('')
  lines.push('## Current corpus facts (what we claim today)')
  lines.push('')
  lines.push(`- **Bitcoin integration:** ${p.bitcoin_integration ?? '—'}`)
  lines.push(`- **Finance:** min $${p.finance?.min_investment_usd ?? '—'} · typical $${p.finance?.typical_investment_usd ?? '—'} · gov fees $${p.finance?.gov_fees_usd ?? '—'} · processing ${p.finance?.processing_time_months ?? '—'} mo`)
  lines.push(`- **Crypto friendly score:** ${p.finance?.crypto_friendly_score ?? '—'}/10 · **Sovereignty:** ${p.sovereignty_score ?? '—'}/10 · **Lightning ready:** ${p.lightning_ready ? 'yes' : 'no'}`)
  lines.push(`- **Tax:** ${p.finance?.tax_benefits ?? '—'}`)
  lines.push(`- **Recent changes (on file):** ${p.legal_compliance?.recent_changes ?? '—'}`)
  lines.push('')
  lines.push('## What to verify (fill with sources)')
  lines.push('')
  lines.push('- [ ] Have investment thresholds changed since ' + p.last_checked + '?')
  lines.push('- [ ] Has processing time / route availability changed?')
  lines.push('- [ ] Any new or closed pathways (visa/CBI programs)?')
  lines.push('- [ ] Crypto/tax treatment changes (capital gains, legal tender, VASP rules)?')
  lines.push('- [ ] Property ownership rules for foreigners?')
  lines.push('- [ ] Dual citizenship / residency requirements changed?')
  lines.push('')
  lines.push('## Official sources to check')
  lines.push('')
  for (const u of p.legal_compliance?.official_urls ?? []) lines.push(`- ${u}`)
  lines.push('')
  lines.push('## Sources found (researcher fills)')
  lines.push('')
  lines.push('| Date | Fact changed | New value | Source URL | Confidence |')
  lines.push('|------|--------------|-----------|------------|------------|')
  lines.push('| | | | | |')
  lines.push('')
  lines.push('## Verdict after research')
  lines.push('')
  lines.push('- [ ] No material change — refresh `last_checked` and re-verify figures')
  lines.push('- [ ] Changes found — update `legal_compliance.recent_changes`, `finance`, `pathways`, `status` as needed, then re-stamp')
  lines.push('')
  return lines.join('\n')
}

function main() {
  const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
  const now = Date.now()
  const ranked = data.programs
    .map(p => ({ p, days: daysSince(p.last_checked, now) ?? 999 }))
    .filter(({ p, days }) => includeAll || freshnessStatus(days) === 'stale')
    .sort((a, b) => b.days - a.days)

  const selected = ranked.slice(0, top)
  const date = new Date().toISOString().slice(0, 10)
  const outDir = resolve(root, 'research/passes', date)
  mkdirSync(outDir, { recursive: true })

  const index = []
  index.push(`# Freshness research pass — ${date}`)
  index.push('')
  index.push(`**Scope:** ${selected.length} programs (stalest first) — fill each brief with sourced findings, then update countries.json and let the pipeline re-anchor.`)
  index.push('')
  index.push('| Rank | Program | Stale (days) | Brief |')
  index.push('|------|---------|--------------|-------|')
  selected.forEach(({ p, days }, i) => {
    const file = `${slugify(p.name)}-brief.md`
    writeFileSync(resolve(outDir, file), briefFor(p, days))
    index.push(`| ${i + 1} | ${p.name} | ${days} | \`${file}\` |`)
  })
  index.push('')
  writeFileSync(resolve(outDir, 'README.md'), index.join('\n'))
  console.log(`✓ Research pass briefs: ${selected.length} programs → research/passes/${date}/`)
  for (const { p, days } of selected) console.log(`  ${days}d ${p.name}`)
}

main()
