#!/usr/bin/env node
/**
 * Regenerates research/pitch-anchor.json and docs/pitch/ANCHOR-SNAPSHOT.md
 * from countries.json + live BTC/USD spot. Run: npm run pitch:sync
 *
 * Self-evolving docs: edit countries.json or re-run after deploy — do not
 * hand-edit dollar figures across MARKETING / EXECUTIVE / diligence packs.
 *
 * `npm run pitch:check` (this same script with --check) verifies the committed
 * pair is still in sync WITHOUT rewriting anything — it is the CI gate.
 *
 * Why the check ignores the `build` field
 * ---------------------------------------
 * BUILD_ID is `<YYYY.MM.DD>-<sha7>` of the commit that is being built (see
 * scripts/gen-build-info.mjs), so the id inside a *committed* snapshot can
 * never equal the id computed while checking THAT SAME commit — the sha does
 * not exist until after the file is written. Comparing it made the old
 * `git diff --exit-code` gate red on every single push (the reason ci.yml was
 * switched off 2026-07-15). Provenance is therefore normalised away in check
 * mode; the writer still records the real id for humans.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const ANCHOR_JSON = resolve(root, 'research/pitch-anchor.json')
const SNAPSHOT_MD = resolve(root, 'docs/pitch/ANCHOR-SNAPSHOT.md')
const FALLBACK_BTC_USD = 105_000
const SATS_PER_BTC = 100_000_000
const CHECK = process.argv.includes('--check')

/** Recursive JSON with sorted keys — order-insensitive, whitespace-free compare. */
export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(value ?? null)
}

function parseMonths(raw) {
  if (!raw) return 12
  const m = String(raw).match(/(\d+)(?:\s*-\s*(\d+))?/)
  if (!m) return 12
  const low = Number(m[1])
  const high = m[2] ? Number(m[2]) : low
  return (low + high) / 2
}

function usdToBtc(usd, rate) {
  return usd / rate
}

function formatBtc(btc) {
  if (btc >= 1) return `₿${btc.toFixed(2)}`
  if (btc >= 0.01) return `₿${btc.toFixed(4)}`
  return `₿${btc.toFixed(6)}`
}

function formatUsd(usd) {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`
  if (usd >= 10_000) return `$${Math.round(usd / 1000)}k`
  if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}k`
  return `$${usd.toLocaleString()}`
}

function dual(usd, rate) {
  return { usd, btc: usdToBtc(usd, rate), btc_display: formatBtc(usdToBtc(usd, rate)), usd_display: formatUsd(usd) }
}

async function fetchBtcUsd() {
  const pinned = Number(process.env.PITCH_ANCHOR_BTC_USD)
  if (Number.isFinite(pinned) && pinned > 0) {
    return { usd: pinned, source: 'mempool.space' }
  }
  try {
    const res = await fetch('https://mempool.space/api/v1/prices')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (typeof data.USD === 'number' && data.USD > 0) {
      return { usd: data.USD, source: 'mempool.space' }
    }
  } catch (e) {
    console.warn('BTC price fetch failed, using fallback:', e.message)
  }
  return { usd: FALLBACK_BTC_USD, source: 'fallback' }
}

export function computeStats(programs, btcUsd) {
  const n = programs.length || 1
  const avgTypical = programs.reduce((s, p) => s + (p.finance?.typical_investment_usd ?? 0), 0) / n
  const avgFees = programs.reduce((s, p) => s + (p.finance?.gov_fees_usd ?? 0), 0) / n
  const avgMonths = programs.reduce((s, p) => s + parseMonths(p.finance?.processing_time_months), 0) / n
  const traditionalAdvisoryUsd = Math.round(avgTypical * 0.11 + avgFees * 0.35 + 28000)
  const motopassAdvisoryUsd = Math.round(2400 + avgFees * 0.08)
  const costSavingsUsd = Math.max(traditionalAdvisoryUsd - motopassAdvisoryUsd, 0)

  const uruguay = programs.find((p) => p.name === 'Uruguay')
  const bolivia = programs.find((p) => p.name === 'Bolivia')

  return {
    program_count: programs.length,
    lightning_ready_count: programs.filter((p) => p.lightning_ready).length,
    avg_typical_investment: dual(Math.round(avgTypical), btcUsd),
    avg_gov_fees: dual(Math.round(avgFees), btcUsd),
    avg_processing_months: Math.round(avgMonths * 10) / 10,
    traditional_advisory: dual(traditionalAdvisoryUsd, btcUsd),
    motopass_advisory: dual(motopassAdvisoryUsd, btcUsd),
    cost_savings: dual(costSavingsUsd, btcUsd),
    cost_savings_pct: Math.round((costSavingsUsd / traditionalAdvisoryUsd) * 100),
    flagships: {
      uruguay: uruguay
        ? {
            min_investment: dual(uruguay.finance?.min_investment_usd ?? 100000, btcUsd),
            rentista_monthly_usd: dual(1500, btcUsd),
            gov_fees: dual(uruguay.finance?.gov_fees_usd ?? 15000, btcUsd),
            processing_months: uruguay.finance?.processing_time_months,
            lightning_ready: uruguay.lightning_ready,
          }
        : null,
      bolivia: bolivia
        ? {
            min_investment: dual(bolivia.finance?.min_investment_usd ?? 80000, btcUsd),
            gov_fees: dual(bolivia.finance?.gov_fees_usd ?? 12000, btcUsd),
            status: bolivia.status,
            note: 'Investor/company route — no pure CBI; verify solvency thresholds',
          }
        : null,
    },
  }
}

/** The anchor payload — one implementation, used by both the writer and the check. */
export function buildAnchor({ programs, btcUsd, source, generatedAt, buildId }) {
  return {
    schema: 'motopass-pitch-anchor/v1',
    build: buildId,
    generated_at: generatedAt,
    btc_usd_reference: btcUsd,
    btc_price_source: source,
    sats_per_btc: SATS_PER_BTC,
    display_policy: 'Bitcoin-first: show ₿ (sats-derived) before USD on all monetary figures.',
    stats: computeStats(programs, btcUsd),
  }
}

export function buildSnapshotMd(anchor) {
  const s = anchor.stats
  const u = s.flagships.uruguay
  const b = s.flagships.bolivia
  return `# Pitch Anchor Snapshot (auto-generated)

**Do not edit by hand.** Regenerate with \`npm run pitch:sync\`.

| Field | Value |
|-------|-------|
| Generated | ${anchor.generated_at} |
| BUILD | ${anchor.build} |
| BTC spot | ${formatBtc(1)} · ${formatUsd(anchor.btc_usd_reference)} (${anchor.btc_price_source}) |
| Programs | ${s.program_count} |
| Avg stack savings | ${s.cost_savings.btc_display} · ${s.cost_savings.usd_display} (${s.cost_savings_pct}%) |
| Traditional advisory (modeled) | ${s.traditional_advisory.btc_display} · ${s.traditional_advisory.usd_display} |
| MotoPass advisory (modeled) | ${s.motopass_advisory.btc_display} · ${s.motopass_advisory.usd_display} |
| Avg typical investment | ${s.avg_typical_investment.btc_display} · ${s.avg_typical_investment.usd_display} |

## Uruguay 🇺🇾
${u ? `- RE min: ${u.min_investment.btc_display} · ${u.min_investment.usd_display}
- Rentista ~${u.rentista_monthly_usd.btc_display}/mo · ${u.rentista_monthly_usd.usd_display}/mo
- Gov fees: ${u.gov_fees.btc_display} · ${u.gov_fees.usd_display}` : '- (not in dataset)'}

## Bolivia 🇧🇴
${b ? `- Min (stub): ${b.min_investment.btc_display} · ${b.min_investment.usd_display}
- Status: ${b.status}
- ${b.note}` : '- (not in dataset)'}

---
*Bitcoin-first display policy: ₿ primary, USD secondary. Safe Harbour · Give A Bit.*
`
}

function readPrograms() {
  const raw = JSON.parse(readFileSync(resolve(root, 'research/countries.json'), 'utf8'))
  return raw.programs ?? raw
}

function readBuildId() {
  const buildInfo = readFileSync(resolve(root, 'src/lib/buildInfo.ts'), 'utf8')
  return buildInfo.match(/BUILD_ID = '([^']+)'/)?.[1] ?? 'unknown-build'
}

function readCommittedAnchor() {
  if (!existsSync(ANCHOR_JSON)) return null
  try {
    return JSON.parse(readFileSync(ANCHOR_JSON, 'utf8'))
  } catch (e) {
    console.error(`Could not parse ${ANCHOR_JSON}: ${e.message}`)
    return null
  }
}

/** Normalise provenance fields that can never match across commits (see header). */
function withoutBuild(anchor) {
  const { build: _build, ...rest } = anchor
  return rest
}

function normaliseSnapshotMd(md) {
  return md.replace(/^\| BUILD \| .*\|$/m, '| BUILD | <volatile> |').trimEnd()
}

async function check() {
  const committed = readCommittedAnchor()
  if (!committed) {
    console.error('✗ research/pitch-anchor.json is missing or unreadable — run `npm run pitch:sync`.')
    process.exit(1)
  }

  // Pin spot + timestamp to the committed values so only REAL data drift shows up.
  const expected = buildAnchor({
    programs: readPrograms(),
    btcUsd: committed.btc_usd_reference,
    source: committed.btc_price_source,
    generatedAt: committed.generated_at,
    buildId: readBuildId(),
  })

  const problems = []
  if (stableStringify(withoutBuild(expected)) !== stableStringify(withoutBuild(committed))) {
    const changed = [...new Set([...Object.keys(withoutBuild(expected)), ...Object.keys(withoutBuild(committed))])]
      .filter((k) => stableStringify(expected[k]) !== stableStringify(committed[k]))
    problems.push(`research/pitch-anchor.json is out of date (differs in: ${changed.join(', ') || 'structure'})`)
  }

  const committedMd = existsSync(SNAPSHOT_MD) ? readFileSync(SNAPSHOT_MD, 'utf8') : ''
  if (normaliseSnapshotMd(buildSnapshotMd(expected)) !== normaliseSnapshotMd(committedMd)) {
    problems.push('docs/pitch/ANCHOR-SNAPSHOT.md is out of date')
  }

  if (problems.length) {
    console.error('✗ Pitch anchor out of sync with research/countries.json:')
    for (const p of problems) console.error(`  - ${p}`)
    console.error('')
    console.error('  The published pitch figures are derived from the dataset — they must not drift.')
    console.error('  Fix: npm run pitch:sync  (then commit research/pitch-anchor.json + docs/pitch/ANCHOR-SNAPSHOT.md)')
    process.exit(1)
  }

  console.log('✓ Pitch anchor in sync with research/countries.json (build id normalised).')
}

async function sync() {
  const programs = readPrograms()
  const { usd: btcUsd, source } = await fetchBtcUsd()

  const pinnedGeneratedAt = process.env.PITCH_ANCHOR_GENERATED_AT?.trim()
  const anchor = buildAnchor({
    programs,
    btcUsd,
    source,
    generatedAt: pinnedGeneratedAt || new Date().toISOString(),
    buildId: readBuildId(),
  })

  writeFileSync(ANCHOR_JSON, JSON.stringify(anchor, null, 2) + '\n')

  const snapDir = dirname(SNAPSHOT_MD)
  mkdirSync(snapDir, { recursive: true })
  writeFileSync(SNAPSHOT_MD, buildSnapshotMd(anchor))

  console.log(`pitch-anchor synced → ${ANCHOR_JSON}`)
  console.log(`snapshot → ${SNAPSHOT_MD}`)
  console.log(`spot: ${formatBtc(1)} · ${formatUsd(btcUsd)} (${source})`)
}

const run = CHECK ? check : sync

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
