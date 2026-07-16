import type { Program } from '../types/program'
import { parseMonthsToDays } from './programAdapter'

export function formatStackSummary(stack: Program[]): string {
  if (!stack.length) return 'MotoPass stack: (empty)'
  const totalCost = stack.reduce((s, p) => s + (p.finance.typical_investment_usd ?? 0), 0)
  const sovereignty = Math.round(stack.reduce((s, p) => s + (p.sovereignty_score ?? 5), 0) / stack.length)
  const months = Math.max(...stack.map(p => Math.ceil(parseMonthsToDays(p.finance.processing_time_months) / 30)))
  const names = stack.map(p => p.name).join(', ')
  return [
    `MotoPass stack (${stack.length} programs)`,
    `Programs: ${names}`,
    `Typical cost: $${totalCost.toLocaleString()}`,
    `Avg sovereignty: ${sovereignty}/10`,
    `Longest timeline: ${months}mo`,
  ].join('\n')
}