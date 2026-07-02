import type { Program } from '../types/program'

export interface ProgramFilters {
  search: string
  region: string
  category: string
  minInvestment: number
  maxInvestment: number
  minCryptoScore: number
  lightningOnly: boolean
  status: string
}

export const DEFAULT_FILTERS: ProgramFilters = {
  search: '',
  region: 'All',
  category: 'All',
  minInvestment: 0,
  maxInvestment: 2_000_000,
  minCryptoScore: 0,
  lightningOnly: false,
  status: 'All',
}

export function filterPrograms(programs: Program[], filters: ProgramFilters): Program[] {
  let result = [...programs]
  const q = filters.search.trim().toLowerCase()
  if (q) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.details.toLowerCase().includes(q) ||
      p.bitcoin_integration.toLowerCase().includes(q),
    )
  }
  if (filters.region !== 'All') result = result.filter(p => p.region === filters.region)
  if (filters.category !== 'All') result = result.filter(p => p.category === filters.category)
  if (filters.status !== 'All') result = result.filter(p => p.status.includes(filters.status))
  if (filters.lightningOnly) result = result.filter(p => p.lightning_ready)
  if (filters.minCryptoScore > 0) {
    result = result.filter(p => (p.finance.crypto_friendly_score ?? 0) >= filters.minCryptoScore)
  }
  result = result.filter(p => {
    const min = p.finance.min_investment_usd ?? 0
    return min >= filters.minInvestment && min <= filters.maxInvestment
  })
  return result
}

export function sortPrograms(programs: Program[], key: 'name' | 'score' | 'investment'): Program[] {
  return [...programs].sort((a, b) => {
    if (key === 'name') return a.name.localeCompare(b.name)
    if (key === 'score') return (b.finance.crypto_friendly_score ?? 0) - (a.finance.crypto_friendly_score ?? 0)
    return (a.finance.min_investment_usd ?? 0) - (b.finance.min_investment_usd ?? 0)
  })
}