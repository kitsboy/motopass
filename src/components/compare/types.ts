import type { ReactNode } from 'react'
import type { Program } from '../../types/program'

export type CompareRow = {
  label: string
  group: 'finance' | 'timeline' | 'scores' | 'stack'
  best: 'min' | 'max' | null
  numeric: (p: Program) => number | null
  valueKey: (p: Program) => string
  render: (p: Program) => ReactNode
  /** Plain-English "what does this mean" shown on hover of a cell in this row. */
  meaning?: string
  /** Plain-text sats-first rendering for clipboard/markdown export (React elements can't stringify). */
  renderText?: (p: Program) => string
}

export const COMPARE_GROUPS = ['finance', 'timeline', 'scores', 'stack'] as const