import type { DistressedFilters, DistressedLane, DistressedSort } from '../types/distressedListing'

export const DISTRESSED_FILTERS_KEY = 'motopass-distressed-filters'

export type DistressedSavedState = {
  lane: DistressedLane
  sort: DistressedSort
  filters: DistressedFilters
}

const LANES: DistressedLane[] = ['all', 'curated', 'permissionless']
const SORTS: DistressedSort[] = ['discount', 'price', 'region']

function isLane(v: unknown): v is DistressedLane {
  return typeof v === 'string' && LANES.includes(v as DistressedLane)
}

function isSort(v: unknown): v is DistressedSort {
  return typeof v === 'string' && SORTS.includes(v as DistressedSort)
}

function isFilters(v: unknown): v is DistressedFilters {
  if (typeof v !== 'object' || v === null) return false
  const f = v as DistressedFilters
  return (
    typeof f.region === 'string' &&
    typeof f.minScore === 'number' &&
    f.minScore >= 1 &&
    f.minScore <= 5 &&
    typeof f.maxBtcUsd === 'number' &&
    f.maxBtcUsd >= 0
  )
}

export function loadDistressedState(): DistressedSavedState | null {
  try {
    const raw = localStorage.getItem(DISTRESSED_FILTERS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return null
    const { lane, sort, filters } = parsed as Partial<DistressedSavedState>
    if (!isLane(lane) || !isSort(sort) || !isFilters(filters)) return null
    return { lane, sort, filters }
  } catch {
    return null
  }
}

export function saveDistressedState(state: DistressedSavedState): void {
  localStorage.setItem(DISTRESSED_FILTERS_KEY, JSON.stringify(state))
}

export function countDistressedActiveFilters(filters: DistressedFilters, lane: DistressedLane): number {
  let n = 0
  if (lane !== 'all') n += 1
  if (filters.region !== 'all') n += 1
  if (filters.minScore > 1) n += 1
  if (filters.maxBtcUsd > 0) n += 1
  return n
}