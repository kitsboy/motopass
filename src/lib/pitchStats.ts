import type { Program } from '../types/program'
import { isTraced } from './claims'

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
}

/**
 * Aggregate facts about the corpus — averages of fields that exist in the
 * research data, nothing extrapolated.
 *
 * Deliberately absent: the old "traditional advisor costs $81,000, MotoPass
 * costs $3,900" model. It was three constants (0.11, 0.35, 28000) dressed as a
 * comparison against an unnamed competitor, and a made-up comparator costs more
 * trust than the number ever earned.
 */
export function computePitchStats(programs: Program[]): PitchStats {
  const n = programs.length || 1
  const lightning = programs.filter(p => p.lightning_ready)
  const flagshipCount = programs.filter(p => p.flagship_depth).length
  const deepCount = programs.filter(p => p.flagship_depth && p.flagship_tier !== 'template').length
  const avgSovereignty = programs.reduce((s, p) => s + (p.sovereignty_score ?? 6), 0) / n
  // Averages are taken over TRACED figures only. A figure with no official page
  // behind it must not move a number a visitor can read.
  const tracedVals = (path: string, pick: (p: Program) => number | null) => {
    const vals = programs
      .filter(p => isTraced(p, path))
      .map(pick)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }
  const avgTypical =
    tracedVals('finance.typical_investment_usd', p => p.finance.typical_investment_usd) ?? 0
  const avgFees = tracedVals('finance.gov_fees_usd', p => p.finance.gov_fees_usd) ?? 0
  const avgMonths =
    tracedVals('finance.processing_time_months', p => parseMonths(p.finance.processing_time_months)) ?? 0

  return {
    programCount: programs.length,
    flagshipCount,
    deepCount,
    lightningCount: lightning.length,
    avgSovereignty: Math.round(avgSovereignty * 10) / 10,
    avgTypicalInvestment: Math.round(avgTypical),
    avgGovFees: Math.round(avgFees),
    avgProcessingMonths: Math.round(avgMonths * 10) / 10,
  }
}

export function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${n}`
}

export type PitchMetric = {
  label: string
  /**
   * i18n key overriding `label` at render time — set when the label must
   * localize (components resolve via t()). Falls back to `label`.
   */
  labelKey?: 'pitch.metric.flagshipDepth' | 'pitch.metric.jurisdictions' | 'pitch.metric.daysToResidency'
  value: number
  suffix?: string
  prefix?: string
}

export function pitchStatsToMetrics(stats: PitchStats): PitchMetric[] {
  const metrics: PitchMetric[] = [
    { label: 'Jurisdictions tracked', labelKey: 'pitch.metric.jurisdictions', value: stats.programCount },
    // "Avg. days to residency" was removed: it averaged processing times that
    // no official page supports (0 of 141 money/time figures are traced).
  ]
  if (stats.flagshipCount > 0) {
    const depthValue = stats.deepCount > 0 ? stats.deepCount : stats.flagshipCount
    metrics.push({
      label: 'Flagship depth',
      labelKey: 'pitch.metric.flagshipDepth',
      value: depthValue,
      suffix: `/${stats.programCount}`,
    })
  }
  return metrics
}

/**
 * The newest `last_checked` date across the corpus, as a plain date.
 *
 * The hero used to print `${last}T12:00:00Z` — a timestamp with a midday time
 * that no process ever produced. A date is what the pipeline actually records.
 */
export function latestResearchDate(programs: Pick<Program, 'last_checked'>[]): string | undefined {
  const dates = programs
    .map(p => p.last_checked)
    .filter((d): d is string => Boolean(d))
    .sort()
  const last = dates[dates.length - 1]
  return last ? last.slice(0, 10) : undefined
}
