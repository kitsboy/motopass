#!/usr/bin/env node
/** Template flagship depth for programs not yet in flagship-extensions.json */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const countriesPath = resolve(root, 'research/countries.json')
const extPath = resolve(root, 'research/flagship-extensions.json')

const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
const existing = JSON.parse(readFileSync(extPath, 'utf8'))

let added = 0
for (const p of data.programs) {
  if (p.flagship_depth || existing[p.name]) continue
  const min = p.finance?.min_investment_usd ?? p.finance?.typical_investment_usd ?? 50000
  existing[p.name] = {
    flagship_depth: true,
    flagship_tier: 'template',
    pathways: [{
      type: 'research_pending',
      label: 'Primary pathway (research pending)',
      min_investment_usd: min,
      notes: `Template from ${p.name} finance fields — deepen to Uruguay standard.`,
    }],
    critical_tests: {
      live_and_work: null,
      scope_of_freedom: null,
      dual_citizenship: null,
      notes: 'Critical tests pending official research pass.',
    },
    legal_compliance: {
      primary_laws: ['Research pending'],
      official_urls: p.sources?.filter((s) => s.startsWith('http')) ?? [],
      property_foreign_ownership: 'Verify with counsel before committing capital.',
      recent_changes: `Last checked ${p.last_checked ?? '—'}.`,
    },
    compliance_clock: {
      renewal_interval_months: 24,
      citizenship_eligibility_years: null,
      residency_day_count_target: 365,
    },
    paige_fields: {
      common_questions: [`What is the minimum investment for ${p.name}?`, 'Is Bitcoin accepted for fees?'],
      red_flags: ['Template depth — verify all figures before acting'],
      optimization_tips: ['Cross-check with /btcmap merchant density for lifestyle fit'],
      escalate_when: 'Any commitment above typical investment threshold',
    },
  }
  added++
}

writeFileSync(extPath, JSON.stringify(existing, null, 2) + '\n')
console.log(`Seeded ${added} template flagship extensions (${Object.keys(existing).length} total)`)