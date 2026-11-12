import type { Program } from '../../types/program'
import type { CompareRow } from './types'
import { formatSats, formatUsdCompact, usdToSats } from '../../lib/btcPrice'
import { BTC_USD_AT_CAPTURE } from '../../data/btcPriceAtCapture'

/**
 * A figure is "known" when it is a real number above zero. Zero is how this
 * corpus stores "we do not have it", so it must never win a comparison.
 */
export function isKnown(n: number | null | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0
}

export function bestIndex(nums: (number | null)[], mode: 'min' | 'max'): Set<number> {
  const valid = nums.filter(isKnown)
  // A single known value has nothing to beat: no BEST badge for it.
  if (valid.length < 2) return new Set()
  const distinct = new Set(valid)
  if (distinct.size < 2) return new Set()
  const target = mode === 'min' ? Math.min(...valid) : Math.max(...valid)
  const indices = new Set<number>()
  nums.forEach((n, i) => {
    if (isKnown(n) && n === target) indices.add(i)
  })
  return indices
}

/** Sats-first plain-text figure for clipboard/markdown export: "388M sats (≈$300k)". */
export function formatMoneyText(usd: number | null | undefined): string {
  // A figure we do not have is not zero — never let a missing number become
  // "0 sats" in an export or a clipboard summary.
  if (usd == null) return 'not on file'
  return `${formatSats(usdToSats(usd, BTC_USD_AT_CAPTURE))} (≈${formatUsdCompact(usd)})`
}

export function rowValuesDiffer(row: CompareRow, programs: Program[]): boolean {
  if (programs.length < 2) return false
  const nums = programs.map(p => row.numeric(p))
  const numericRow = nums.some(n => typeof n === 'number')
  if (numericRow) {
    // A missing figure is not a difference: it can neither win nor rank.
    const known = nums.filter(isKnown)
    return known.length >= 2 && new Set(known).size > 1
  }
  const keys = programs
    .map(p => row.valueKey(p))
    .filter(k => k && k !== '—' && k !== 'null' && k !== 'undefined' && k !== 'Not on file')
  return keys.length >= 2 && new Set(keys).size > 1
}