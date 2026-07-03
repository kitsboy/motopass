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