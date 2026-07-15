import type { Program } from '../components/programs/types'

export interface SovereigntyBreakdownItem {
  key: 'base' | 'crypto' | 'lightning' | 'synergy' | 'risk'
  labelKey: string
  value: string
}

/** Flagship score tooltip: how sovereigntyScore (0–100) is composed from program signals. */
export function getSovereigntyBreakdown(program: Program): SovereigntyBreakdownItem[] {
  const base = Math.round(program.sovereigntyScore / 10)
  return [
    { key: 'base', labelKey: 'programs.scoreBase', value: `${base}/10` },
    {
      key: 'crypto',
      labelKey: 'programs.scoreCrypto',
      value: program.cryptoFriendlyScore != null ? `${program.cryptoFriendlyScore}/10` : '—',
    },
    {
      key: 'lightning',
      labelKey: 'programs.scoreLightning',
      value: program.lightningReady ? 'ready' : 'notReady',
    },
    {
      key: 'synergy',
      labelKey: 'programs.scoreSynergy',
      value: program.stackingSynergy ?? '—',
    },
    {
      key: 'risk',
      labelKey: 'programs.scoreRisk',
      value: program.riskLevel ?? '—',
    },
  ]
}