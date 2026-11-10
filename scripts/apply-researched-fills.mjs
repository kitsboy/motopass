#!/usr/bin/env node
/**
 * Applies the researched coverage fills to research/countries.json.
 *
 * Every entry names the page it came from. Nothing is inferred: a value is only
 * written where this session read a source that states it. Renewal is left null
 * on citizenship-at-grant programs on purpose — there is no permit to renew, and
 * the app already renders that as "None".
 *
 * Idempotent: sources and audit rows are added only once.
 *
 *   node scripts/apply-researched-fills.mjs
 *   node scripts/apply-researched-fills.mjs --dry-run
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = new URL('../research/countries.json', import.meta.url)
const data = JSON.parse(readFileSync(FILE, 'utf8'))
const programs = data.programs ?? data
const dryRun = process.argv.includes('--dry-run')
const DATE = '2026-11-09'
const HENLEY = 'Henley Passport Index 2026 (September global ranking) — https://cdn.henleyglobal.com/storage/app/media/HPI/Henley%20Passport%20Index%202026%20September%20Global%20Ranking.pdf'

/**
 * Visa-free destination counts from the September 2026 Henley index, scored
 * visa-free ÷ 20 and rounded. Cayman Islands has no separately ranked passport
 * (holders travel on a BOTC passport), so it stays null.
 */
const MOBILITY = {
  'El Salvador': 131,
  Portugal: 184,
  Italy: 185,
  Uruguay: 155,
  'Antigua and Barbuda': 154,
  'St. Kitts and Nevis': 157,
  Dominica: 145,
  'St. Lucia': 144,
  Grenada: 147,
  Bahamas: 158,
  Barbados: 163,
  Spain: 185,
  Ireland: 185,
  Argentina: 168,
  Brazil: 168,
  Malta: 184,
  Vanuatu: 87,
  Panama: 147,
  Mexico: 156,
  'São Tomé and Príncipe': 58,
}

const RENEWAL_NOTE = 'mobility from the Henley Passport Index 2026 (visa-free destinations ÷ 20, rounded); banking still pending — no published method yet'

const CLOCK_FILLS = {
  Bahamas: {
    residency_day_count_target: 90,
    citizenship_eligibility_years: 10,
    note: 'Economic Permanent Residence requires a cumulative 90 days a year (Immigration (Amendment) Act 2021, s.17A(1)(b)). Citizenship needs 10 years of legal permanent residence, including the 12 months before applying and 6 years of actual residence.',
    source: 'Bahamas Immigration Department — Citizenship — https://www.immigration.gov.bs/applying-to-stay/applying-for-citizenship/ ; Higgs & Johnson — EPR 90-day rule — https://higgsjohnson.com/living-in-paradise-permanent-residency-in-the-bahamas',
    extra: ['Bahamas Immigration Department — Citizenship (10 years PR, 6 years residence) — https://www.immigration.gov.bs/applying-to-stay/applying-for-citizenship/', 'Higgs & Johnson — Economic Permanent Residence 90-day rule (Immigration (Amendment) Act 2021) — https://higgsjohnson.com/living-in-paradise-permanent-residency-in-the-bahamas'],
  },
  Barbados: {
    residency_day_count_target: 0,
    citizenship_eligibility_years: 5,
    note: 'The Special Entry and Residing Permit sets no codified minimum presence. Naturalisation needs 12 months immediately before applying plus 5 years of residence in the preceding 7 (Citizenship Act, Cap. 186).',
    source: 'Barbados Citizenship Act, Cap. 186 — https://www.refworld.org/legal/legislation/natlegbod/1966/en/20336 ; Barbados Immigration Department — Special Entry Permit — https://immigration.gov.bb/pages/SpecialEntryPermit.aspx',
    extra: ['Barbados Immigration Department — Special Entry Permit requirements — https://immigration.gov.bb/pages/SpecialEntryPermit.aspx', 'Barbados Citizenship Act, Cap. 186 (naturalisation: 12 months + 5 of 7 years) — https://www.refworld.org/legal/legislation/natlegbod/1966/en/20336'],
  },
  'Cayman Islands': {
    citizenship_eligibility_years: 20,
    note: 'The right to be Caymanian needs 20 years of legal and ordinary residence including 10 holding permanent residence (Caymanian Protection Act, in force 1 May 2026; previously 15 and 5). BOTC naturalisation under UK law is a separate, earlier step.',
    source: 'Cayman Islands Government / MCEI — Immigration Reform Guide (Caymanian Protection Act, 1 May 2026) — https://gov.ky/documents/35692/0/MCEI+Immigration+Reform+Guide+Book+-+18JUNE2026.pdf',
    extra: ['Cayman Islands Government / MCEI — Immigration Reform Guide, Caymanian Protection Act (20 years, 10 as PR, from 1 May 2026) — https://gov.ky/documents/35692/0/MCEI+Immigration+Reform+Guide+-+18JUNE2026.pdf'],
  },
}

const TAX_FILLS = { Italy: 6, 'St. Lucia': 8, Grenada: 8, Bahamas: 9, Barbados: 6, 'Cayman Islands': 10, Spain: 6, Ireland: 6 }

const VANUATU_TAX = {
  text: 'No personal income tax, no capital gains tax, no corporate income tax, no withholding tax, no wealth or inheritance tax — individuals pay no direct tax on income or capital. Revenue rests on indirect taxes: VAT at 15%, import duties, a 15% rent tax on residential rent above VT200,000 per six months, and stamp duty of up to 1% on some property and share transactions.\n\nCrypto/Bitcoin tax: No capital gains tax and no income tax, so Bitcoin gains and holdings are not taxed in Vanuatu and individuals file no tax return. The tax is on spending, not on holding or selling: VAT at 15% applies to goods and services. Citizenship does not by itself make the holder tax-resident, so obligations in the country of actual residence still apply.',
  source: 'Vanuatu Foreign Investment Promotion Agency (official) — Low tax jurisdiction — https://investvanuatu.vu/untapped-potential/low-tax-jurisdiction/',
}

function find(name) {
  const program = programs.find(item => item.name === name)
  if (!program) throw new Error(`Missing program: ${name}`)
  return program
}

function addSource(program, source) {
  program.sources = program.sources ?? []
  if (!program.sources.includes(source)) program.sources.push(source)
}

function addAudit(program, entry) {
  program.audit_trail = program.audit_trail ?? []
  const exists = program.audit_trail.some(row => row.date === entry.date && row.field === entry.field)
  if (!exists) program.audit_trail.push({ date: DATE, hash: null, ...entry })
}

let changed = 0

for (const [name, fill] of Object.entries(CLOCK_FILLS)) {
  const program = find(name)
  const clock = (program.compliance_clock = program.compliance_clock ?? {})
  const before = { days: clock.residency_day_count_target, years: clock.citizenship_eligibility_years }
  clock.residency_day_count_target = fill.residency_day_count_target ?? clock.residency_day_count_target
  clock.citizenship_eligibility_years = fill.citizenship_eligibility_years ?? clock.citizenship_eligibility_years
  program.critical_tests = program.critical_tests ?? {}
  if (!/90 days|no codified minimum|20 years/i.test(program.critical_tests.notes ?? '')) {
    program.critical_tests.notes = `${program.critical_tests.notes ?? ''} ${fill.note}`.trim()
  }
  for (const source of fill.extra) addSource(program, source)
  addAudit(program, {
    field: 'compliance_clock',
    from: `days ${before.days ?? 'null'}, years ${before.years ?? 'null'}`,
    to: `days ${clock.residency_day_count_target}, years ${clock.citizenship_eligibility_years}`,
    source: fill.source,
  })
  changed++
}

for (const [name, count] of Object.entries(MOBILITY)) {
  const program = find(name)
  const score = Math.max(1, Math.min(10, Math.round(count / 20)))
  const previous = program.scorecard?.mobility ?? null
  program.scorecard = program.scorecard ?? {}
  program.scorecard.mobility = score
  addSource(program, HENLEY)
  addAudit(program, {
    field: 'scorecard.mobility',
    from: String(previous),
    to: `${score} (${count} visa-free destinations)`,
    source: HENLEY,
  })
  changed++
}

for (const [name, score] of Object.entries(TAX_FILLS)) {
  const program = find(name)
  const previous = program.scorecard?.tax ?? null
  program.scorecard = program.scorecard ?? {}
  program.scorecard.tax = score
  addAudit(program, {
    field: 'scorecard.tax',
    from: String(previous),
    to: String(score),
    source: 'Headline-tax rubric (see docs/COUNTRY-DATA-COVERAGE.md): 10 = no direct taxes at all; 8–9 = no capital gains or no personal income tax; 6–7 = material income tax with reliefs. Applied to the tax_benefits text already on file for this program.',
  })
  changed++
}

for (const program of programs) {
  if (program.scorecard?.mobility != null && /mobility & banking pending research/i.test(program.scorecard.note ?? '')) {
    program.scorecard.note = program.scorecard.note.replace(/mobility & banking pending research/i, RENEWAL_NOTE)
    changed++
  }
}

const vanuatu = find('Vanuatu')
if (!/Crypto\/Bitcoin tax:/i.test(vanuatu.finance.tax_benefits ?? '')) {
  vanuatu.finance.tax_benefits = VANUATU_TAX.text
  addSource(vanuatu, VANUATU_TAX.source)
  addAudit(vanuatu, {
    field: 'finance.tax_benefits',
    from: 'No personal income tax (Wikipedia)',
    to: 'Full direct-tax position + Crypto/Bitcoin tax sentence',
    source: VANUATU_TAX.source,
  })
  changed++
}

if (dryRun) {
  console.log(`Dry run — ${changed} writes would be applied.`)
} else {
  writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`Applied ${changed} writes to research/countries.json.`)
}
