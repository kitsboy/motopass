import type { ReactNode } from 'react'
import type { Program } from '../../types/program'

export type CompareRow = {
  label: string
  group: 'finance' | 'timeline' | 'scores' | 'stack'
  best: 'min' | 'max' | null
  /** Neutral marker text for a leading figure: "lower" for money, "shorter" for time. */
  bestLabel?: 'lower' | 'shorter'
  numeric: (p: Program) => number | null
  valueKey: (p: Program) => string
  render: (p: Program) => ReactNode
  /** Claim path behind a figure row (e.g. 'finance.min_investment_usd') for export source flags. */
  figurePath?: () => string
  /** Plain-English "what does this mean" shown on hover of a cell in this row. */
  meaning?: string
  /** Plain-text sats-first rendering for clipboard/markdown export (React elements can't stringify). */
  renderText?: (p: Program) => string
}

export const COMPARE_GROUPS = ['finance', 'timeline', 'scores', 'stack'] as const