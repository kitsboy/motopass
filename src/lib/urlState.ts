import { DEFAULT_FILTERS, type ProgramFilters } from './programFilter'

/** Parse comma-separated numeric ids from URL (max 4 for compare) */
export function parseIdList(raw: string | null, max = 4): number[] {
  if (!raw?.trim()) return []
  const ids = raw
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => Number.isFinite(n) && n > 0)
  return [...new Set(ids)].slice(0, max)
}

export function serializeIdList(ids: number[]): string {
  return ids.join(',')
}

/** Programs page filters ↔ URL search params */
export function filtersFromSearchParams(params: URLSearchParams): ProgramFilters {
  const region = params.get('region')
  const category = params.get('category')
  const minInv = params.get('minInv')
  const maxInv = params.get('maxInv')
  const crypto = params.get('crypto')

  return {
    ...DEFAULT_FILTERS,
    search: params.get('q') ?? '',
    region: region && region.length > 0 ? decodeURIComponent(region) : DEFAULT_FILTERS.region,
    category: category && category.length > 0 ? decodeURIComponent(category) : DEFAULT_FILTERS.category,
    lightningOnly: params.get('lightning') === '1',
    minInvestment: minInv ? Number(minInv) || 0 : DEFAULT_FILTERS.minInvestment,
    maxInvestment: maxInv ? Number(maxInv) || DEFAULT_FILTERS.maxInvestment : DEFAULT_FILTERS.maxInvestment,
    minCryptoScore: crypto ? Number(crypto) || 0 : DEFAULT_FILTERS.minCryptoScore,
    status: params.get('status') ?? DEFAULT_FILTERS.status,
  }
}

export function filtersToSearchParams(filters: ProgramFilters, view?: 'table' | 'card'): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.search.trim()) p.set('q', filters.search.trim())
  if (filters.region !== 'All') p.set('region', filters.region)
  if (filters.category !== 'All') p.set('category', filters.category)
  if (filters.lightningOnly) p.set('lightning', '1')
  if (filters.minInvestment > 0) p.set('minInv', String(filters.minInvestment))
  if (filters.maxInvestment < DEFAULT_FILTERS.maxInvestment) p.set('maxInv', String(filters.maxInvestment))
  if (filters.minCryptoScore > 0) p.set('crypto', String(filters.minCryptoScore))
  if (filters.status !== 'All') p.set('status', filters.status)
  if (view && view !== 'table') p.set('view', view)
  return p
}

export function countActiveFilters(f: ProgramFilters): number {
  let n = 0
  if (f.search.trim()) n++
  if (f.region !== 'All') n++
  if (f.category !== 'All') n++
  if (f.lightningOnly) n++
  if (f.minInvestment > 0) n++
  if (f.maxInvestment < DEFAULT_FILTERS.maxInvestment) n++
  if (f.minCryptoScore > 0) n++
  if (f.status !== 'All') n++
  return n
}

export function isDefaultFilters(f: ProgramFilters): boolean {
  return countActiveFilters(f) === 0
}

export type PortfolioStackPayload = {
  v: 1
  stack: number[]
  exported_at: string
}

function encodePortfolioStackPayload(ids: number[]): string {
  const payload: PortfolioStackPayload = {
    v: 1,
    stack: ids.slice(0, 50),
    exported_at: new Date().toISOString(),
  }
  const b64 = btoa(JSON.stringify(payload))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

/** Decode shareable stack param — supports base64 JSON or legacy comma list. */
export function decodePortfolioStackParam(raw: string | null): number[] {
  if (!raw?.trim()) return []
  try {
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='))
    const data = JSON.parse(json) as PortfolioStackPayload
    if (Array.isArray(data.stack)) {
      return [...new Set(data.stack.filter(n => Number.isFinite(n) && n > 0))].slice(0, 50)
    }
  } catch {
    /* legacy comma list */
  }
  return parseIdList(raw, 50)
}

/** Portfolio stack share URL — `/portfolio?stack=<base64-json>` */
export function portfolioSharePath(ids: number[]): string {
  if (!ids.length) return '/portfolio'
  return `/portfolio?stack=${encodePortfolioStackPayload(ids)}`
}

export function portfolioShareUrl(ids: number[], origin = ''): string {
  return `${origin}${portfolioSharePath(ids)}`
}