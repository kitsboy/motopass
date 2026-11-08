#!/usr/bin/env node
/**
 * Write public/metrics.json (gab.product-metrics.v1) from research/countries.json.
 *
 * countries_seeded stays 16 — the original deep-seed cohort, not the catalog size.
 * OTS KPIs count current programs whose Satohash .ots file exists under public/,
 * not leftover proofs for retired countries.
 * finance.min_investment_usd of 0 is an unstated floor, not a citizenship price.
 *
 * Run: node scripts/gen-metrics.mjs
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COUNTRIES_PATH = resolve(ROOT, 'research/countries.json')
const METRICS_PATH = resolve(ROOT, 'public/metrics.json')
const PUBLIC_ROOT = resolve(ROOT, 'public')
const PROOFS_DIR = resolve(PUBLIC_ROOT, 'proofs')

/** Original deep-seed cohort. Not data.programs.length. */
const SEEDED_COHORT = 16
const FALLBACK_UMAMI_ID = 'dd982c5b-f27a-40e3-924b-4ea1e64d5f8a'
const WINDOW_FROM = '2026-01-01T00:00:00.000Z'
const UMAMI_DETAIL =
  'Script wired (website dd982c5b-…); reverse proxy to THOR:3002 still required for live pageviews'

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function readExistingMetrics() {
  try {
    return readJson(METRICS_PATH)
  } catch {
    return null
  }
}

function preservedUmamiId(existing) {
  const id = existing?.raw?.umamiWebsiteId
  return typeof id === 'string' && id.length > 0 ? id : FALLBACK_UMAMI_ID
}

function preservedWindowFrom(existing) {
  const from = existing?.window?.from
  return typeof from === 'string' && from.length > 0 ? from : WINDOW_FROM
}

function isUnderPublic(abs) {
  const rootWithSep = PUBLIC_ROOT.endsWith(sep) ? PUBLIC_ROOT : PUBLIC_ROOT + sep
  return abs === PUBLIC_ROOT || abs.startsWith(rootWithSep)
}

function proofAbsPath(proof) {
  const raw = proof?.ots_path
  if (typeof raw !== 'string' || !raw.trim() || raw.includes('\0')) return null
  const rel = raw.replace(/^\/+/, '')
  if (!rel) return null
  const abs = resolve(PUBLIC_ROOT, rel)
  if (!isUnderPublic(abs)) return null
  return abs
}

function proofFileExists(proof) {
  const abs = proofAbsPath(proof)
  return abs != null && existsSync(abs)
}

function programHasOts(program) {
  const proofs = Array.isArray(program?.satohash_proofs) ? program.satohash_proofs : []
  return proofs.some(proofFileExists)
}

function leftoverOtsCount(programs) {
  let files = []
  try {
    files = readdirSync(PROOFS_DIR).filter((name) => name.endsWith('.ots'))
  } catch {
    return 0
  }
  const referenced = new Set()
  for (const program of programs) {
    for (const proof of program.satohash_proofs || []) {
      if (!proofFileExists(proof)) continue
      referenced.add(proofAbsPath(proof))
    }
  }
  return files.filter((name) => !referenced.has(resolve(PROOFS_DIR, name))).length
}

function leadingNumber(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return raw
  if (typeof raw !== 'string') return null
  const text = raw.trim()
  if (!text) return null
  const match = text.match(/(\d+(?:\.\d+)?)(?:\s*[-–—]\s*(\d+(?:\.\d+)?))?/)
  if (!match) return null
  const low = Number(match[1])
  return Number.isFinite(low) ? low : null
}

/** Low end of a finance duration. Ranges like "1-4" use the first number. */
function financeDurationSamples(finance) {
  if (!finance || typeof finance !== 'object') return []
  const samples = []
  for (const [key, value] of Object.entries(finance)) {
    const keyDays = /day/i.test(key)
    const keyMonths = /month/i.test(key)
    if (!keyDays && !keyMonths) continue
    if (value == null || value === '') continue
    const low = leadingNumber(value)
    if (low == null) continue
    const text = typeof value === 'string' ? value : ''
    const asDays = keyDays || /\bdays?\b/i.test(text)
    samples.push({
      key,
      raw: value,
      days: Math.round(asDays ? low : low * 30),
      method: asDays
        ? `low end of finance.${key} treated as days`
        : `low end of finance.${key} in months × 30`,
    })
  }
  return samples
}

function deriveFastest(programs) {
  const rows = []
  for (const program of programs) {
    for (const sample of financeDurationSamples(program.finance)) {
      rows.push({ name: program.name, ...sample })
    }
  }
  if (rows.length === 0) return { derived: false, days: null, programs: [], method: null }
  const days = Math.min(...rows.map((row) => row.days))
  const winners = rows.filter((row) => row.days === days)
  const method = [...new Set(winners.map((row) => row.method))].join('; ')
  return { derived: true, days, programs: winners, method }
}

function fastestHint(result) {
  const alias = 'Alias: fastest_citizenship_days.'
  if (!result.derived) {
    return `Not derived. No numeric low end could be read from finance.processing_time_months or a days field, so no country is named. ${alias}`
  }
  const who = result.programs.map((row) => `${row.name} (${row.raw})`).join(', ')
  const claim =
    result.programs.length === 1
      ? `Minimum is ${result.days} days: ${who}.`
      : `Minimum is ${result.days} days, tied across ${who}. No unique fastest country is claimed.`
  return `Derived from ${result.method}. A range such as "1-4" uses the low end. ${claim} ${alias}`
}

function cheapestPick(programs) {
  const rows = []
  for (const program of programs) {
    const value = program.finance?.min_investment_usd
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      rows.push({ name: program.name, value })
    }
  }
  if (rows.length === 0) return null
  const value = Math.min(...rows.map((row) => row.value))
  return { value, names: rows.filter((row) => row.value === value).map((row) => row.name) }
}

function salvadorFloor(programs) {
  const program = programs.find((item) => String(item?.name || '').trim().toLowerCase() === 'el salvador')
  if (!program) return { present: false, value: null }
  const value = program.finance?.min_investment_usd
  if (typeof value !== 'number' || !Number.isFinite(value)) return { present: true, value: null }
  return { present: true, value }
}

function salvadorSentence(floor) {
  if (floor.present && floor.value === 0) {
    return "El Salvador's min_investment_usd is 0 (no stated investment floor), so $0 is not presented as the cheapest citizenship for sale."
  }
  if (floor.present && typeof floor.value === 'number') {
    return `El Salvador's min_investment_usd is ${floor.value}.`
  }
  return "El Salvador's min_investment_usd was not stated in the catalog, so no $0 floor was invented."
}

function cheapestHint(pick, floor) {
  const floorNote = salvadorSentence(floor)
  if (!pick) return `Not derived. No finance.min_investment_usd greater than 0. ${floorNote}`
  return `Lowest finance.min_investment_usd greater than 0: ${pick.names.join(', ')} · ${usd(pick.value)}. ${floorNote}`
}

function meanTypical(programs) {
  const values = programs
    .map((program) => program.finance?.typical_investment_usd)
    .filter((value) => typeof value === 'number' && Number.isFinite(value))
  if (values.length === 0) return { value: null, count: 0 }
  const sum = values.reduce((total, value) => total + value, 0)
  return { value: Math.round(sum / values.length), count: values.length }
}

function avgHint(avg) {
  if (avg.value == null) {
    return 'Not derived. No numeric finance.typical_investment_usd values in the catalog.'
  }
  return `Arithmetic mean of finance.typical_investment_usd across ${avg.count} programs with a numeric value, rounded to the nearest dollar.`
}

function usd(value) {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? '-' : ''
  const grouped = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${sign}$${grouped}`
}

function buildMetrics() {
  const existing = readExistingMetrics()
  const data = readJson(COUNTRIES_PATH)
  const programs = Array.isArray(data.programs) ? data.programs : []
  const retiredNamed = programs.some((program) => /central african republic/i.test(program?.name || ''))
  if (retiredNamed) {
    throw new Error('refusing to emit metrics: catalog contains a jurisdiction this generator must not treat as live')
  }

  const n = programs.length
  const otsCount = programs.filter(programHasOts).length
  const leftover = leftoverOtsCount(programs)
  const avg = meanTypical(programs)
  const fastest = deriveFastest(programs)
  const cheapest = cheapestPick(programs)
  const floor = salvadorFloor(programs)
  const floorNote = salvadorSentence(floor)
  const now = new Date().toISOString()
  const umamiWebsiteId = preservedUmamiId(existing)

  const metrics = {
    schema: 'gab.product-metrics.v1',
    productId: 'motopass',
    name: 'MotoPass',
    updatedAt: now,
    window: {
      label: 'all',
      from: preservedWindowFrom(existing),
      to: now,
    },
    health: {
      status: n > 0 ? 'green' : 'amber',
      message:
        'This file is generated from research/countries.json by scripts/gen-metrics.mjs. Umami visitor counts stay 0 until the analytics host is public. No live uptime probe on this origin, so uptimePct24h/latencyMs are omitted rather than reported as null.',
      dependencies: [
        {
          id: 'countries-json',
          status: n > 0 ? 'green' : 'amber',
          detail: `research/countries.json · ${n} programs`,
        },
        {
          id: 'ots-proofs',
          status: n > 0 && otsCount === n ? 'green' : 'amber',
          detail: `public/proofs · ${otsCount} current programs with a Satohash .ots file on disk (${leftover} other .ots files are not counted)`,
        },
        {
          id: 'satohash',
          status: 'green',
          detail: 'OpenTimestamps backbone for program snapshots',
        },
        {
          id: 'umami',
          status: 'amber',
          detail: UMAMI_DETAIL,
        },
      ],
    },
    kpis: [
      {
        key: 'countries_seeded',
        label: 'Countries seeded',
        value: SEEDED_COHORT,
        unit: 'countries',
        format: 'number',
        priority: 1,
        hint: `Original deep-seed cohort (${SEEDED_COHORT}/${n}). This is not the catalog size. Full catalog is programs_total.`,
      },
      {
        key: 'programs_total',
        label: 'Programs total',
        value: n,
        unit: 'programs',
        format: 'number',
        priority: 1,
        hint: 'CBI/RBI and special programs in research/countries.json.',
      },
      {
        key: 'countries_ots',
        label: 'Countries OTS-stamped',
        value: otsCount,
        unit: 'countries',
        format: 'number',
        priority: 1,
        hint: 'Current programs with a Satohash proof whose .ots file exists under public/. Historical proofs for retired countries are not counted. Alias: countries_verified_ots.',
      },
      {
        key: 'avg_program_cost_usd',
        label: 'Avg program cost',
        value: avg.value,
        unit: 'USD',
        format: 'usd',
        priority: 1,
        hint: avgHint(avg),
      },
      {
        key: 'fastest_days',
        label: 'Fastest pathway',
        value: fastest.derived ? fastest.days : null,
        unit: 'days',
        format: 'duration',
        priority: 2,
        hint: fastestHint(fastest),
      },
      {
        key: 'target_countries',
        label: 'Target countries',
        value: n,
        unit: 'countries',
        format: 'number',
        priority: 2,
        hint: `Live corpus: ${n} programs in research/countries.json. Same count as programs_total.`,
      },
      {
        key: 'cheapest_program',
        label: 'Cheapest program',
        value: cheapest ? cheapest.value : null,
        unit: 'USD',
        format: 'usd',
        priority: 3,
        hint: cheapestHint(cheapest, floor),
      },
    ],
    series: [],
    funnels: [
      {
        id: 'sovereign_journey',
        label: 'Sovereign journey',
        steps: [
          {
            id: 'browse',
            label: 'Browse programs',
            count: 0,
            hint: 'Umami /programs pageviews once analytics host is public',
          },
          {
            id: 'compare',
            label: 'Compare stack',
            count: 0,
            hint: 'Compare / simulator engagement',
          },
          {
            id: 'verify',
            label: 'Verify OTS',
            count: 0,
            hint: 'Verify / Satohash proof checks',
          },
          {
            id: 'apply',
            label: 'Apply interest',
            count: 0,
            hint: 'Apply / Launch Engine submissions',
          },
        ],
      },
    ],
    segments: [
      {
        id: 'coverage',
        label: 'Coverage progress',
        rows: [
          {
            id: 'seeded',
            label: 'Seeded deep cohort',
            value: SEEDED_COHORT,
            meta: { of: n },
          },
          {
            id: 'programs',
            label: 'Programs in catalog',
            value: n,
            meta: { source: 'research/countries.json' },
          },
          {
            id: 'ots',
            label: 'OTS-stamped',
            value: otsCount,
            meta: { source: 'public/proofs' },
          },
          {
            id: 'target',
            label: 'Target countries',
            value: n,
            meta: { roadmap: true },
          },
        ],
      },
    ],
    offers: [
      {
        id: 'program_oracle',
        title: `${n}-program CBI/RBI oracle`,
        for: ['giveabit', 'hq', 'openstrata'],
        status: 'ga',
        endpoint: 'GET /research/countries.json',
        hint: 'CBI/RBI catalog with finance, pathways, Satohash proofs',
      },
      {
        id: 'ots_proofs',
        title: 'OpenTimestamps program proofs',
        for: ['satohash'],
        status: 'ga',
        endpoint: 'GET /proofs/*.ots',
        hint: 'Immutable program snapshots via Satohash',
      },
      {
        id: 'metrics_v1',
        title: 'Product metrics v1',
        for: ['hq'],
        status: 'ga',
        endpoint: 'GET /metrics.json',
        hint: 'gab.product-metrics.v1 for HQ cards',
      },
    ],
    education: [
      {
        id: 'mold_seeded_vs_total',
        title: `${SEEDED_COHORT} seeded vs ${n} programs`,
        body: `countries_seeded is the original deep-seed cohort (${SEEDED_COHORT}), not the catalog size. The live corpus is ${n} programs: programs_total and target_countries both follow research/countries.json. Pitch ${SEEDED_COHORT}/${n} progress using seeded + target_countries.`,
        action: 'Show seeded/target on HQ card; programs_total on Concert',
        opportunity: 'opportunity',
      },
      {
        id: 'mold_ots',
        title: 'OTS is the truth layer',
        body: `The live corpus is ${n} programs. countries_ots counts those whose Satohash proof has an .ots file on disk under public/ (${otsCount} today). Leftover proofs for retired countries are not counted.`,
        action: 'Link HQ card to /verify and Satohash',
        opportunity: 'info',
      },
      {
        id: 'wire_umami',
        title: 'Visitor funnel needs public Umami',
        body: `Tracking script is in index.html. The live corpus is ${n} programs, but funnel counts stay 0 until analytics.giveabit.io (or the THOR reverse proxy) is reachable from the open web. Umami visitor counts stay 0 until the analytics host is public.`,
        action: 'Point analytics.giveabit.io → THOR:3002 over HTTPS',
        opportunity: 'plan',
      },
    ],
    links: [
      { label: 'MotoPass', url: 'https://motopass.giveabit.io' },
      { label: 'Live metrics', url: 'https://motopass.giveabit.io/metrics.json' },
      { label: 'Programs data', url: 'https://motopass.giveabit.io/research/countries.json' },
      { label: 'Schema', url: 'https://hq.giveabit.io/schemas/product-metrics.v1.schema.json' },
      { label: 'All-site inventory', url: 'https://hq.giveabit.io/docs/ALL-SITE-METRICS.md' },
    ],
    raw: {
      demo: false,
      source: 'research/countries.json + public/proofs via scripts/gen-metrics.mjs',
      programs_total: n,
      countries_seeded: SEEDED_COHORT,
      countries_ots: otsCount,
      countries_verified_ots: otsCount,
      avg_program_cost_usd: avg.value,
      avg_program_cost_sample_size: avg.count,
      fastest_days: fastest.derived ? fastest.days : null,
      fastest_citizenship_days: fastest.derived ? fastest.days : null,
      fastest_days_method: fastest.derived ? fastest.method : 'not derived',
      fastest_days_programs: fastest.derived ? fastest.programs.map((row) => row.name) : [],
      target_countries: n,
      cheapest_program_usd: cheapest ? cheapest.value : null,
      cheapest_program_name: cheapest ? cheapest.names.join(', ') : null,
      el_salvador_min_investment_usd: floor.value,
      el_salvador_min_investment_note: floorNote,
      umamiWebsiteId,
      umamiPending: true,
      note: `This file is generated from research/countries.json by scripts/gen-metrics.mjs. Umami visitor counts stay 0 until the analytics host is public. countries_seeded is the original deep-seed cohort (${SEEDED_COHORT}), not the catalog size. ${floorNote}`,
    },
  }

  const required = [
    'schema',
    'productId',
    'name',
    'updatedAt',
    'window',
    'health',
    'kpis',
    'series',
    'funnels',
    'segments',
    'offers',
    'education',
    'links',
    'raw',
  ]
  for (const key of required) {
    if (!(key in metrics)) throw new Error(`missing top-level key ${key}`)
  }

  const json = `${JSON.stringify(metrics, null, 2)}\n`
  if (/Central African Republic|\bCAR\b/.test(json)) {
    throw new Error('refusing to write metrics that name a jurisdiction outside the catalog')
  }
  writeFileSync(METRICS_PATH, json)
  console.log(
    `metrics.json programs_total=${n} cheapest=${metrics.raw.cheapest_program_name} value=${metrics.raw.cheapest_program_usd} countries_ots=${otsCount} avg=${avg.value} fastest=${metrics.raw.fastest_days}`,
  )
}

buildMetrics()
