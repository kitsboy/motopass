import { describe, expect, it } from 'vitest'
import { buildAllAlerts, buildProgramAlerts, buildSourceAlerts } from './alerts'
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

/**
 * Regression guard for the source-watchdog alerts.
 *
 * The fixture deliberately mirrors the shape the harness ACTUALLY writes for a
 * rule event (`scripts/probe-sources.mjs`): id/ts/date/country/program_id/url/
 * kind/scopes/before/after — and NO `status` field. An earlier version filtered
 * on `status === 'changed'`, so it could never match and the whole path was
 * silently dead. If someone reintroduces a status-based filter, these fail.
 */
describe('buildSourceAlerts', () => {
  const realRuleEvent = {
    id: '2026-09-15T20:07:26.184Z-t.gov.py-rule',
    ts: '2026-09-15T20:07:26.184Z',
    date: '2026-09-15',
    country: 'Paraguay',
    program_id: 7,
    url: 'https://www.set.gov.py',
    kind: 'rule',
    before: 'old rule text',
    after: 'new rule text',
  }

  it('surfaces a rule event for a confirmed-changed country (harness shape, no status)', () => {
    const alerts = buildSourceAlerts([realRuleEvent], ['Paraguay'], [], 20)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].alertType).toBe('rule-change')
    expect(alerts[0].programName).toBe('Paraguay')
    expect(alerts[0].source).toBe('set.gov.py')
    expect(alerts[0].proofUrl).toBe('/sources')
  })

  it('fails CLOSED for an unconfirmed country (no false alerts)', () => {
    const alerts = buildSourceAlerts([realRuleEvent], ['Mexico'], [], 20)
    expect(alerts).toHaveLength(0)
  })

  it('fails CLOSED when no confirmed set is supplied at all', () => {
    expect(buildSourceAlerts([realRuleEvent])).toHaveLength(0)
  })

  it('never surfaces a coverage event, even for a confirmed country', () => {
    const coverage = { ...realRuleEvent, id: 'cov-1', kind: 'coverage', status: 'unreachable' }
    expect(buildSourceAlerts([coverage], ['Paraguay'], [], 20)).toHaveLength(0)
  })

  it('pins a watched country ahead of an unwatched one on the same date', () => {
    const mexico = { ...realRuleEvent, id: 'mx-1', country: 'Mexico', program_id: 8, url: 'https://dof.gob.mx' }
    const alerts = buildSourceAlerts([realRuleEvent, mexico], ['Paraguay', 'Mexico'], [8], 20)
    expect(alerts[0].watched).toBe(true)
    expect(alerts[0].programName).toBe('Mexico')
  })
})
