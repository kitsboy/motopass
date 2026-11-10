#!/usr/bin/env node
/**
 * Fill the banking axis from a published, comparable indicator — and record the
 * one mobility figure we will not guess.
 *
 * Method (docs/BANKING-SCORE-RUBRIC.md):
 *   score = clamp(round(account_ownership_pct / 10), 1, 10)
 *   source = World Bank Global Findex, indicator FX.OWN.TOTL.ZS
 *            "Account ownership at a financial institution or with a
 *             mobile-money-service provider (% of population ages 15+)"
 *
 * The indicator measures domestic account access, not non-resident onboarding.
 * Every write says so in `scorecard.banking_note`, and the audit row carries the
 * observation year plus the API URL, so the number can be recomputed.
 *
 * Cayman Islands: no Findex observation and no authoritative BOTC visa-free
 * count. Both stay null with a written reason.
 *
 *   node scripts/apply-scorecard.mjs            write
 *   node scripts/apply-scorecard.mjs --dry-run  report only
 */
import { readFileSync, writeFileSync } from 'node:fs'

const DRY = process.argv.includes('--dry-run')
const DATE = '2026-11-09'
const WB_INDICATOR = 'FX.OWN.TOTL.ZS'
const WB_DOC = 'https://data.worldbank.org/indicator/FX.OWN.TOTL.ZS'
const BOTC_DOC =
  'https://www.gov.uk/government/publications/british-overseas-territories-citizens/british-overseas-territories-citizens-accessible-version'

const ISO2 = {
  'Antigua and Barbuda': 'AG',
  Argentina: 'AR',
  Bahamas: 'BS',
  Barbados: 'BB',
  Brazil: 'BR',
  'Cayman Islands': 'KY',
  Dominica: 'DM',
  'El Salvador': 'SV',
  Grenada: 'GD',
  Ireland: 'IE',
  Italy: 'IT',
  Malta: 'MT',
  Mexico: 'MX',
  Panama: 'PA',
  Portugal: 'PT',
  'São Tomé and Príncipe': 'ST',
  Spain: 'ES',
  'St. Kitts and Nevis': 'KN',
  'St. Lucia': 'LC',
  Uruguay: 'UY',
  Vanuatu: 'VU',
}

const CATALOG = new URL('../research/countries.json', import.meta.url)
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'))
const programs = catalog.programs

const nationalities = programs.map(p => ISO2[p.name]).filter(Boolean)
const url = `https://api.worldbank.org/v2/country/${nationalities.join(';')}/indicator/${WB_INDICATOR}?format=json&per_page=2000`
const response = await fetch(url)
if (!response.ok) {
  console.error(`World Bank API returned ${response.status}; nothing written.`)
  process.exit(1)
}
const [, rows] = await response.json()

/** Latest non-null observation per ISO2 — the API returns newest first. */
const latest = new Map()
for (const row of rows ?? []) {
  if (row.value == null) continue
  const iso = row.country?.id
  if (!iso || latest.has(iso)) continue
  latest.set(iso, { value: Number(row.value), year: String(row.date) })
}

const round1 = value => Math.round(value * 10) / 10
const scoreFor = value => Math.min(10, Math.max(1, Math.round(value / 10)))

let writes = 0
const missing = []

for (const program of programs) {
  const iso = ISO2[program.name]
  const obs = iso ? latest.get(iso) : undefined
  program.scorecard = program.scorecard ?? {}
  const scorecard = program.scorecard

  if (program.name === 'Cayman Islands') {
    const mobilityNote =
      'Cayman residents travel on a British Overseas Territories citizen passport. GOV.UK states that BOTC-only holders have visa-free travel to "many countries" without publishing a count; third-party trackers in November 2026 gave 50, 157 and 169, so no number is recorded.'
    const bankingNote =
      'The World Bank Findex publishes no observation for the Cayman Islands, so account ownership is not on file.'
    if (scorecard.mobility_note !== mobilityNote) {
      scorecard.mobility_note = mobilityNote
      writes++
    }
    if (scorecard.banking_note !== bankingNote) {
      scorecard.banking_note = bankingNote
      writes++
    }
    if (scorecard.mobility == null) {
      const has = (program.audit_trail ?? []).some(
        row => row.date === DATE && row.field === 'scorecard.mobility',
      )
      if (!has) {
        program.audit_trail = program.audit_trail ?? []
        program.audit_trail.push({
          date: DATE,
          field: 'scorecard.mobility',
          to: 'left null — no authoritative BOTC visa-free count',
          source: BOTC_DOC,
        })
        writes++
      }
    }
    continue
  }

  if (!obs) {
    missing.push(program.name)
    const note = 'The World Bank Findex publishes no observation for this country, so the banking axis stays empty rather than borrowing another country\u2019s figure.'
    const hadPreRubric = scorecard.banking != null
    if (hadPreRubric || scorecard.banking_note !== note) {
      scorecard.banking = null
      scorecard.banking_note = note
      program.audit_trail = program.audit_trail ?? []
      program.audit_trail.push({
        date: DATE,
        field: 'scorecard.banking',
        from: hadPreRubric ? String(scorecard.banking) : 'null',
        to: 'left null \u2014 no World Bank Findex observation',
        source: WB_DOC,
      })
      if (hadPreRubric) {
        // Withdraw the pre-rubric value so every score uses one method.
        console.log(`  withdrew pre-rubric banking score on ${program.name}`)
      }
      writes++
    }
    continue
  }

  const score = scoreFor(obs.value)
  const basis = { indicator: WB_INDICATOR, value: round1(obs.value), year: obs.year, url: WB_DOC }
  const note = `World Bank Findex: ${round1(obs.value)}% of adults 15+ held an account (${obs.year}). Measures domestic access, not non-resident onboarding.`
  const source = `World Bank Global Findex — account ownership ${round1(obs.value)}% of adults 15+ (${obs.year}), ${WB_INDICATOR}`
  const citation = `https://data.worldbank.org/indicator/${WB_INDICATOR}?locations=${iso}`

  const changed =
    scorecard.banking !== score ||
    JSON.stringify(scorecard.banking_basis ?? null) !== JSON.stringify(basis) ||
    scorecard.banking_note !== note
  if (changed) {
    const from = scorecard.banking == null ? 'null' : String(scorecard.banking)
    scorecard.banking = score
    scorecard.banking_basis = basis
    scorecard.banking_note = note
    program.audit_trail = program.audit_trail ?? []
    program.audit_trail.push({
      date: DATE,
      field: 'scorecard.banking',
      from,
      to: `${score} (Findex ${round1(obs.value)}%, ${obs.year})`,
      source: citation,
    })
    writes++
  }
  if (!(program.sources ?? []).includes(source)) {
    program.sources = [...(program.sources ?? []), source]
    writes++
  }
}

/* One canonical note on method, shared by every program that has a score. */
const METHOD_NOTE =
  'Mobility: Henley Sept 2026 visa-free count ÷ 20. Banking: World Bank Findex account ownership ÷ 10. Tax: headline-tax rubric. All three are published methods, not opinions.'
for (const program of programs) {
  if (!program.scorecard) continue
  if (program.scorecard.banking == null) continue
  if (program.scorecard.note === METHOD_NOTE) continue
  program.scorecard.note = METHOD_NOTE
  writes++
}

if (!DRY) writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n')
console.log(`${DRY ? 'Would apply' : 'Applied'} ${writes} writes across ${programs.length} programs.`)
console.log(`Findex observations: ${latest.size}/${nationalities.length}`)
if (missing.length) console.log(`No observation: ${missing.join(', ')}`)
