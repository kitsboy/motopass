import type { Program } from '../types/program'

export const PORTFOLIO_KEY = 'motopass-portfolio'
const FILTERS_KEY = 'motopass-program-filters'
const STACKS_KEY = 'motopass-saved-stacks'

export function loadPortfolio(): number[] {
  try {
    return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function savePortfolio(ids: number[]) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(ids))
}

export function togglePortfolio(id: number): number[] {
  const current = loadPortfolio()
  const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
  savePortfolio(next)
  return next
}

export function clearPortfolio(): number[] {
  savePortfolio([])
  return []
}

export function loadSavedFilters<T>(): T | null {
  try {
    const raw = localStorage.getItem(FILTERS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSavedFilters<T>(filters: T) {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
}

export interface SavedStack {
  id: string
  name: string
  programIds: number[]
  createdAt: string
}

export function loadStacks(): SavedStack[] {
  try {
    return JSON.parse(localStorage.getItem(STACKS_KEY) ?? '[]')
  } catch {
    return []
  }
}

const MAX_STACKS = 20

export function deleteStack(id: string) {
  const stacks = loadStacks().filter(s => s.id !== id)
  localStorage.setItem(STACKS_KEY, JSON.stringify(stacks))
  return stacks
}

export function saveStack(stack: SavedStack) {
  const stacks = loadStacks().filter(s => s.id !== stack.id)
  stacks.unshift(stack)
  localStorage.setItem(STACKS_KEY, JSON.stringify(stacks.slice(0, MAX_STACKS)))
}

export const COMPARE_IDS_KEY = 'motopass-compare-ids'
export const SIMULATOR_IDS_KEY = 'motopass-simulator-selection'
export const PROGRAMS_VIEW_KEY = 'motopass-programs-view'

export function loadCompareIds(): number[] {
  try {
    return JSON.parse(localStorage.getItem(COMPARE_IDS_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveCompareIds(ids: number[]) {
  localStorage.setItem(COMPARE_IDS_KEY, JSON.stringify(ids.slice(0, 4)))
}

export function loadProgramsView(): 'table' | 'card' | null {
  const v = localStorage.getItem(PROGRAMS_VIEW_KEY)
  return v === 'table' || v === 'card' ? v : null
}

export function saveProgramsView(view: 'table' | 'card') {
  localStorage.setItem(PROGRAMS_VIEW_KEY, view)
}

export function exportProgramsJson(programs: Program[]): string {
  return JSON.stringify({ exported_at: new Date().toISOString(), programs }, null, 2)
}

export function importProgramsJson(raw: string): { programs: Program[]; error?: string } {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { programs: [], error: 'Invalid JSON file' }
  }
  const list = Array.isArray(data) ? data : (data as { programs?: Program[] }).programs ?? []
  if (!Array.isArray(list) || list.length === 0) {
    return { programs: [], error: 'No programs found in file' }
  }
  const valid = list.filter(
    (p): p is Program =>
      typeof p === 'object' && p !== null && typeof (p as Program).id === 'number' && typeof (p as Program).name === 'string',
  )
  if (valid.length === 0) {
    return { programs: [], error: 'No valid program entries (need id + name)' }
  }
  return { programs: valid }
}