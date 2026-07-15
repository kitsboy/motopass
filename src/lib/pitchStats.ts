import type { Program } from '../types/program'

function parseMonths(raw: string | null | undefined): number {
  if (!raw) return 12
  const m = raw.match(/(\d+)(?:\s*-\s*(\d+))?/)
  if (!m) return 12
  const low = Number(m[1])
  const high = m[2] ? Number(m[2]) : low
  return (low + high) / 2
}

export type PitchStats = {
  programCount: number
  flagshipCount: number
  /** Researched deep flagships (excludes template-tier scaffolds). */
  deepCount: number
  lightningCount: number
  avgSovereignty: number
  avgTypicalInvestment: number
  avgGovFees: number
  avgProcessingMonths: number
  fastTrackMonths: number
  traditionalAdvisoryUsd: number
  motopassAdvisoryUsd: number
  costSavingsUsd: number
  costSavingsPct: number
  timeSavingsMonths: number
  timeSavingsPct: number
}

export function computePitchStats(programs: Program[]): PitchStats {
  const n = programs.length || 1
  const lightning = programs.filter(p => p.lightning_ready)
  const flagshipCount = programs.filter(p => p.flagship_depth).length
  const deepCount = programs.filter(p => p.flagship_depth && p.flagship_tier !== 'template').length
  const avgSovereignty =
    programs.reduce((s, p) => s + (p.sovereignty_score ?? 6), 0) / n
  const avgTypical =
    programs.reduce((s, p) => s + (p.finance.typical_investment_usd ?? 0), 0) / n
  const avgFees =
    programs.reduce((s, p) => s + (p.finance.gov_fees_usd ?? 0), 0) / n
  const avgMonths =
    programs.reduce((s, p) => s + parseMonths(p.finance.processing_time_months), 0) / n

  const fastPrograms = lightning.length ? lightning : programs.slice(0, 8)
  const fastTrackMonths =
    fastPrograms.reduce((s, p) => s + parseMonths(p.finance.processing_time_months), 0) /
    (fastPrograms.length || 1)

  const traditionalAdvisoryUsd = Math.round(avgTypical * 0.11 + avgFees * 0.35 + 28000)
  const motopassAdvisoryUsd = Math.round(2400 + avgFees * 0.08)
  const costSavingsUsd = Math.max(traditionalAdvisoryUsd - motopassAdvisoryUsd, 0)
  const costSavingsPct = Math.round((costSavingsUsd / traditionalAdvisoryUsd) * 100)

  const timeSavingsMonths = Math.max(avgMonths - fastTrackMonths, 0)
  const timeSavingsPct = Math.round((timeSavingsMonths / avgMonths) * 100)

  return {
    programCount: programs.length,
    flagshipCount,
    deepCount,
    lightningCount: lightning.length,
    avgSovereignty: Math.round(avgSovereignty * 10) / 10,
    avgTypicalInvestment: Math.round(avgTypical),
    avgGovFees: Math.round(avgFees),
    avgProcessingMonths: Math.round(avgMonths * 10) / 10,
    fastTrackMonths: Math.round(fastTrackMonths * 10) / 10,
    traditionalAdvisoryUsd,
    motopassAdvisoryUsd,
    costSavingsUsd,
    costSavingsPct,
    timeSavingsMonths: Math.round(timeSavingsMonths * 10) / 10,
    timeSavingsPct,
  }
}

export function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${n}`
}

export type PitchMetric = {
  label: string
  value: number
  suffix?: string
  prefix?: string
  /** When set, UI renders Bitcoin-first dual price via live spot. */
  usdValue?: number
}

export type SavingsRow = {
  label: string
  traditional: number
  motopass: number
  unit: string
}

export function pitchStatsToMetrics(stats: PitchStats): PitchMetric[] {
  const metrics: PitchMetric[] = [
    { label: 'Jurisdictions tracked', value: stats.programCount },
    { label: 'Avg. stack savings', value: stats.costSavingsUsd, usdValue: stats.costSavingsUsd },
    { label: 'Avg. days to residency', value: Math.round(stats.avgProcessingMonths * 30), suffix: 'd' },
  ]
  if (stats.flagshipCount > 0) {
    const depthValue = stats.deepCount > 0 ? stats.deepCount : stats.flagshipCount
    metrics.push({
      label: '50/50 flagship depth',
      value: depthValue,
      suffix: `/${stats.programCount}`,
    })
  }
  return metrics
}

export function pitchStatsToSavingsRows(stats: PitchStats): SavingsRow[] {
  return [
    {
      label: 'Legal & advisory fees',
      traditional: stats.traditionalAdvisoryUsd,
      motopass: stats.motopassAdvisoryUsd,
      unit: '$',
    },
    {
      label: 'Time to approval',
      traditional: Math.round(stats.avgProcessingMonths * 30),
      motopass: Math.round(stats.fastTrackMonths * 30),
      unit: 'days',
    },
    {
      label: 'Jurisdictions evaluated',
      traditional: 3,
      motopass: stats.programCount,
      unit: 'programs',
    },
  ]
}

export function latestProofTimestamp(programs: import('../types/program').Program[]): string | undefined {
  const dates = programs
    .map(p => p.last_checked)
    .filter(Boolean)
    .sort()
  return dates.at(-1) ? `${dates.at(-1)}T12:00:00Z` : undefined
}