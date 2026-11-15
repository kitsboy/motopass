import type { Program } from '../types/program'
import { parseMonthsToDays } from './programAdapter'
import { formatSats, formatUsdCompact, usdToSats } from './btcPrice'
import { BTC_PRICE_IS_LIVE, BTC_USD_AT_CAPTURE } from '../data/btcPriceAtCapture'

export function formatStackSummary(stack: Program[]): string {
  if (!stack.length) return 'MotoPass stack: (empty)'
  const costKnown = stack.filter(p => p.finance.typical_investment_usd != null)
  const totalCost = costKnown.reduce((s, p) => s + (p.finance.typical_investment_usd ?? 0), 0)
  // A missing processing time is not "fast" — it is excluded from the timeline.
  const timed = stack.filter(p => p.finance.processing_time_months)
  const months = timed.length ? Math.max(...timed.map(p => Math.ceil(parseMonthsToDays(p.finance.processing_time_months) / 30))) : null
  const names = stack.map(p => p.name).join(', ')
  return [
    `MotoPass stack (${stack.length} programs)`,
    `Programs: ${names}`,
    costKnown.length
      ?    `Typical cost: ${formatUsdCompact(totalCost)}${
          BTC_PRICE_IS_LIVE ? ` (${formatSats(usdToSats(totalCost, BTC_USD_AT_CAPTURE))})` : ''
        } — ${costKnown.length} of ${stack.length} programs on file`
      : `Typical cost: not on file (0 of ${stack.length} programs)`,
    months === null
      ? 'Longest timeline: not on file'
      : `Longest timeline: ${months}mo${timed.length < stack.length ? ` (${timed.length} of ${stack.length} on file)` : ''}`,
  ].join('\n')
}