import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadPortfolio,
  savePortfolio,
  togglePortfolio,
  addPortfolioIds,
  exportProgramsJson,
  importProgramsJson,
  saveStack,
  deleteStack,
  loadStacks,
  PORTFOLIO_KEY,
} from './portfolioStorage'
import type { Program } from '../types/program'

const storage: Record<string, string> = {}

const sampleProgram: Program = {
  id: 42,
  name: 'Uruguay',
  category: 'rbi_cbi',
  region: 'South America',
  status: 'Researching',
  bitcoin_integration: 'Crypto friendly',
  lightning_ready: false,
  sovereignty_score: 8,
  stacking_synergy: 'medium',
  risk_level: 'low',
  finance: {
    min_investment_usd: 100000,
    typical_investment_usd: 150000,
    gov_fees_usd: 15000,
    processing_time_months: '3-8',
    tax_benefits: 'Territorial',
    crypto_friendly_score: 8,
    bitcoin_specific: 'Stable',
  },
  details: 'Territorial tax',
  last_checked: '2026-07-02',
}

beforeEach(() => {
  Object.keys(storage).forEach(k => delete storage[k])
  globalThis.localStorage = {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => { storage[k] = v },
    removeItem: (k: string) => { delete storage[k] },
    clear: () => Object.keys(storage).forEach(k => delete storage[k]),
    key: () => null,
    length: 0,
  }
})

describe('portfolioStorage', () => {
  it('round-trips portfolio toggle add/remove', () => {
    expect(loadPortfolio()).toEqual([])
    const afterAdd = togglePortfolio(42)
    expect(afterAdd).toEqual([42])
    expect(JSON.parse(storage[PORTFOLIO_KEY]!)).toEqual([42])
    const afterRemove = togglePortfolio(42)
    expect(afterRemove).toEqual([])
    expect(loadPortfolio()).toEqual([])
  })

  it('adds multiple ids without duplicates', () => {
    savePortfolio([1])
    const next = addPortfolioIds([2, 3, 2])
    expect(next).toEqual([1, 2, 3])
    expect(loadPortfolio()).toEqual([1, 2, 3])
  })

  it('persists explicit save and reload', () => {
    savePortfolio([1, 2, 3])
    expect(loadPortfolio()).toEqual([1, 2, 3])
    savePortfolio([2])
    expect(loadPortfolio()).toEqual([2])
  })

  it('round-trips export/import programs json', () => {
    const exported = exportProgramsJson([sampleProgram])
    const parsed = JSON.parse(exported)
    expect(parsed.programs).toHaveLength(1)
    expect(parsed.programs[0].name).toBe('Uruguay')
    expect(parsed.exported_at).toBeTruthy()

    const imported = importProgramsJson(exported)
    expect(imported.programs).toHaveLength(1)
    expect(imported.programs[0].id).toBe(42)
    expect(imported.error).toBeUndefined()
  })

  it('imports bare array json', () => {
    const raw = JSON.stringify([sampleProgram])
    const imported = importProgramsJson(raw)
    expect(imported.programs).toHaveLength(1)
    expect(imported.programs[0].name).toBe('Uruguay')
  })

  it('rejects invalid import json', () => {
    expect(importProgramsJson('not json').error).toBeTruthy()
    expect(importProgramsJson('[]').error).toBeTruthy()
  })

  it('caps saved stacks at 20 and supports delete', () => {
    for (let i = 0; i < 22; i++) {
      saveStack({ id: `s-${i}`, name: `Stack ${i}`, programIds: [i], createdAt: new Date().toISOString() })
    }
    expect(loadStacks()).toHaveLength(20)
    deleteStack('s-0')
    expect(loadStacks().find(s => s.id === 's-0')).toBeUndefined()
  })
})