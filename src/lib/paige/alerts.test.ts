import { describe, expect, it } from 'vitest'
import { buildAllAlerts, buildProgramAlerts } from './alerts'
import type { Program } from '../../types/program'

function programWithTrail(overrides: Partial<Program> & { id: number; name: string }): Program {
  return {
    region: 'Americas',
    category: 'residency_by_investment',
    status: 'active',
    bitcoin_integration: 'test',
    details: 'test',
    last_checked: '2026-08-01',
    flag: '🏴',
    finance: {
      min_investment_usd: 100000,
      typical_investment_usd: 150000,
      processing_time_months: '6-12',
      crypto_friendly_score: 8,
      gov_fees_usd: 0,
      tax_benefits: 'test',
      bitcoin_specific: 'test',
    },
    audit_trail: [
      {
        date: '2026-09-01',
        field: 'finance.min_investment_usd',
        from: '100000',
        to: '120000',
        source: 'intel-fetch:wikipedia',
      },
    ],
    ...overrides,
  }
}

describe('buildProgramAlerts', () => {
  it('classifies finance audit entries as rule changes', () => {
    const alerts = buildProgramAlerts(programWithTrail({ id: 1, name: 'Uruguay' }))
    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts[0].alertType).toBe('rule-change')
    expect(alerts[0].programName).toBe('Uruguay')
  })
})

describe('buildAllAlerts watch-list integration', () => {
  const programs = [
    programWithTrail({ id: 1, name: 'Uruguay' }),
    programWithTrail({ id: 2, name: 'Bolivia' }),
  ]

  it('flags alerts from watched programs', () => {
    const alerts = buildAllAlerts(programs, [], 20, [2])
    const bolivia = alerts.find(a => a.programName === 'Bolivia')
    const uruguay = alerts.find(a => a.programName === 'Uruguay')
    expect(bolivia?.watched).toBe(true)
    expect(uruguay?.watched).toBe(false)
  })

  it('pins watched alerts ahead of same-date unwatched ones', () => {
    // Same date on both trails → ordering decided by the watched pin
    const alerts = buildAllAlerts(programs, [], 20, [2])
    const firstWatchedIndex = alerts.findIndex(a => a.watched)
    const firstUnwatchedIndex = alerts.findIndex(a => !a.watched)
    expect(firstWatchedIndex).toBeGreaterThanOrEqual(0)
    if (firstUnwatchedIndex >= 0) {
      expect(firstWatchedIndex).toBeLessThan(firstUnwatchedIndex)
    }
  })

  it('works without a watch list (backwards compatible)', () => {
    const alerts = buildAllAlerts(programs, [], 20)
    expect(alerts.every(a => a.watched === false)).toBe(true)
  })
})
