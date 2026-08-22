import type { Program } from '../../types/program'
import type { CompareRow } from './types'
import { formatSats, formatUsdCompact, usdToSats } from '../../lib/btcPrice'
import { BTC_USD_AT_CAPTURE } from '../../data/btcPriceAtCapture'

export function bestIndex(nums: (number | null)[], mode: 'min' | 'max'): Set<number> {
  const valid = nums.filter((n): n is number => n !== null)
  if (!valid.length) return new Set()
  const target = mode === 'min' ? Math.min(...valid) : Math.max(...valid)
  const indices = new Set<number>()
  nums.forEach((n, i) => {
    if (n === target) indices.add(i)
  })
  return indices
}

/** Sats-first plain-text figure for clipboard/markdown export: "388M sats (≈$300k)". */
export function formatMoneyText(usd: number): string {
  return `${formatSats(usdToSats(usd, BTC_USD_AT_CAPTURE))} (≈${formatUsdCompact(usd)})`
}

export function rowValuesDiffer(row: CompareRow, programs: Program[]): boolean {
  if (programs.length < 2) return false
  const keys = programs.map(p => row.valueKey(p))
  return new Set(keys).size > 1
}