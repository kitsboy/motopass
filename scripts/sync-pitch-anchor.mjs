#!/usr/bin/env node
/**
 * Regenerates research/pitch-anchor.json and docs/pitch/ANCHOR-SNAPSHOT.md
 * from countries.json + live BTC/USD spot. Run: npm run pitch:sync
 *
 * Self-evolving docs: edit countries.json or re-run after deploy — do not
 * hand-edit dollar figures across MARKETING / EXECUTIVE / diligence packs.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const buildInfo = readFileSync(resolve(root, 'src/lib/buildInfo.ts'), 'utf8')
const BUILD_ID = buildInfo.match(/BUILD_ID = '([^']+)'/)?.[1] ?? '2026.07.14-28'
const FALLBACK_BTC_USD = 105_000
const SATS_PER_BTC = 100_000_000

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

function computeStats(programs, btcUsd) {
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

function buildSnapshotMd(anchor) {
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

async function main() {
  const countriesPath = resolve(root, 'research/countries.json')
  const raw = JSON.parse(readFileSync(countriesPath, 'utf8'))
  const programs = raw.programs ?? raw

  const { usd: btcUsd, source } = await fetchBtcUsd()
  const stats = computeStats(programs, btcUsd)

  const pinnedGeneratedAt = process.env.PITCH_ANCHOR_GENERATED_AT?.trim()
  const anchor = {
    schema: 'motopass-pitch-anchor/v1',
    build: BUILD_ID,
    generated_at: pinnedGeneratedAt || new Date().toISOString(),
    btc_usd_reference: btcUsd,
    btc_price_source: source,
    sats_per_btc: SATS_PER_BTC,
    display_policy: 'Bitcoin-first: show ₿ (sats-derived) before USD on all monetary figures.',
    stats,
  }

  const jsonPath = resolve(root, 'research/pitch-anchor.json')
  writeFileSync(jsonPath, JSON.stringify(anchor, null, 2) + '\n')

  const snapDir = resolve(root, 'docs/pitch')
  mkdirSync(snapDir, { recursive: true })
  writeFileSync(resolve(snapDir, 'ANCHOR-SNAPSHOT.md'), buildSnapshotMd(anchor))

  console.log(`pitch-anchor synced → ${jsonPath}`)
  console.log(`snapshot → docs/pitch/ANCHOR-SNAPSHOT.md`)
  console.log(`spot: ${formatBtc(1)} · ${formatUsd(btcUsd)} (${source})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})