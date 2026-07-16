import type { ReactNode } from 'react'
import type { Program } from '../../types/program'

export type CompareRow = {
  label: string
  group: 'finance' | 'timeline' | 'scores' | 'stack'
  best: 'min' | 'max' | null
  numeric: (p: Program) => number | null
  valueKey: (p: Program) => string
  render: (p: Program) => ReactNode
}

export const COMPARE_GROUPS = ['finance', 'timeline', 'scores', 'stack'] as const