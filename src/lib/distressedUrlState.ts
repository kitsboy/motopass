import type { DistressedFilters } from '../types/distressedListing'

export function distressedFiltersFromSearchParams(params: URLSearchParams): Partial<DistressedFilters> {
  const out: Partial<DistressedFilters> = {}
  const region = params.get('region')
  if (region) out.region = region

  const minScore = params.get('minScore')
  if (minScore != null && minScore !== '') {
    const n = Number(minScore)
    if (Number.isFinite(n) && n >= 1 && n <= 5) out.minScore = n
  }

  const maxAsk = params.get('maxAsk')
  if (maxAsk != null && maxAsk !== '') {
    const n = Number(maxAsk)
    if (Number.isFinite(n) && n >= 0) out.maxBtcUsd = n
  }

  return out
}

export function distressedFiltersToSearchParams(
  filters: DistressedFilters,
  existing: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(existing)

  if (filters.region !== 'all') params.set('region', filters.region)
  else params.delete('region')

  if (filters.minScore > 1) params.set('minScore', String(filters.minScore))
  else params.delete('minScore')

  if (filters.maxBtcUsd > 0) params.set('maxAsk', String(filters.maxBtcUsd))
  else params.delete('maxAsk')

  return params
}