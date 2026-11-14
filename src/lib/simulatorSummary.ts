import type { Program } from '../types/program'
import { parseMonthsToDays } from './programAdapter'
import { formatSats, formatUsdCompact, usdToSats } from './btcPrice'
import { BTC_PRICE_IS_LIVE, BTC_USD_AT_CAPTURE } from '../data/btcPriceAtCapture'

export function formatStackSummary(stack: Program[]): string {
  if (!stack.length) return 'MotoPass stack: (empty)'
  const costKnown = stack.filter(p => p.finance.typical_investment_usd != null)
  const totalCost = costKnown.reduce((s, p) => s + (p.finance.typical_investment_usd ?? 0), 0)
  const sovereignty = Math.round(stack.reduce((s, p) => s + (p.sovereignty_score ?? 5), 0) / stack.length)
  const months = Math.max(...stack.map(p => Math.ceil(parseMonthsToDays(p.finance.processing_time_months) / 30)))
  const names = stack.map(p => p.name).join(', ')
  return [
    `MotoPass stack (${stack.length} programs)`,
    `Programs: ${names}`,
    costKnown.length
      ? `Typical cost: ${formatUsdCompact(totalCost)}${
          BTC_PRICE_IS_LIVE ? ` (${formatSats(usdToSats(totalCost, BTC_USD_AT_CAPTURE))})` : ''
        } — ${costKnown.length} of ${stack.length} programs on file`
      : `Typical cost: not on file (0 of ${stack.length} programs)`,
    `Avg sovereignty: ${sovereignty}/10`,
    `Longest timeline: ${months}mo`,
  ].join('\n')
}