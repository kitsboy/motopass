import type { Program } from '../types/program'

const PORTFOLIO_KEY = 'motopass-portfolio'
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

export function saveStack(stack: SavedStack) {
  const stacks = loadStacks()
  stacks.unshift(stack)
  localStorage.setItem(STACKS_KEY, JSON.stringify(stacks))
}

export function exportProgramsJson(programs: Program[]): string {
  return JSON.stringify({ exported_at: new Date().toISOString(), programs }, null, 2)
}

export function importProgramsJson(raw: string): Program[] {
  const data = JSON.parse(raw)
  return Array.isArray(data) ? data : data.programs ?? []
}