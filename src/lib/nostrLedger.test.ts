import { describe, it, expect } from 'vitest'
import type { Program } from '../components/programs/types'
import { buildAuditLedgerEvents, ledgerCreatedAt, ledgerJson, programSlug, publishAuditLedger } from './nostrLedger'
import { nostrEventIdStub } from './nostrEventId'

function program(overrides: Partial<Program> = {}): Program {
  return {
    id: 'program-1',
    country: 'Uruguay',
    countryCode: 'UY',
    tier: 'Residency',
    region: 'LATAM',
    minInvestment: 0,
    timelineDays: 90,
    sovereigntyScore: 72,
    proofStatus: 'verified',
    summary: '',
    auditTrail: [
      {
        date: '2026-11-09',
        field: 'scorecard.banking',
        from: 'null',
        to: '7',
        source: 'World Bank Findex — https://data.worldbank.org/indicator/FX.OWN.TOTL.ZS',
      },
      {
        date: '2026-06-15',
        field: 'gov_fees',
        to: '5000',
        source: 'not a url',
      },
    ],
    ...overrides,
  }
}

describe('ledgerCreatedAt', () => {
  it('stamps the row date at noon UTC rather than the publish time', () => {
    expect(ledgerCreatedAt('2026-11-09')).toBe(Math.floor(Date.parse('2026-11-09T12:00:00Z') / 1000))
  })

  it('refuses a missing or malformed date', () => {
    expect(ledgerCreatedAt('')).toBeNull()
    expect(ledgerCreatedAt('9 November 2026')).toBeNull()
    expect(ledgerCreatedAt('2026-13-40')).toBeNull()
  })
})

describe('buildAuditLedgerEvents', () => {
  it('builds one event per dated row with honest tags', () => {
    const events = buildAuditLedgerEvents(program())
    expect(events).toHaveLength(2)
    const [first] = events
    expect(first.kind).toBe(30078)
    expect(first.created_at).toBe(ledgerCreatedAt('2026-11-09'))
    expect(first.tags).toContainEqual(['field', 'scorecard.banking'])
    expect(first.tags).toContainEqual(['date', '2026-11-09'])
    expect(first.tags).toContainEqual(['country', 'UY'])
    expect(first.tags).toContainEqual(['source', 'https://data.worldbank.org/indicator/FX.OWN.TOTL.ZS'])
    const content = JSON.parse(first.content)
    expect(content).toMatchObject({ kind: 'audit-entry', field: 'scorecard.banking', to: '7', hash: null })
  })

  it('drops non-URL sources instead of publishing prose as a link', () => {
    const events = buildAuditLedgerEvents(program())
    expect(events[1].tags.some(tag => tag[0] === 'source')).toBe(false)
    expect(JSON.parse(events[1].content).source).toBeNull()
  })

  it('is deterministic: same rows produce the same stub event ids', () => {
    const a = buildAuditLedgerEvents(program()).map(nostrEventIdStub)
    const b = buildAuditLedgerEvents(program()).map(nostrEventIdStub)
    expect(a).toEqual(b)
    expect(a[0]).toHaveLength(64)
  })

  it('skips rows without a field, a target or a valid date', () => {
    const events = buildAuditLedgerEvents(program({
      auditTrail: [
        { date: '2026-11-09', field: '', to: 'x' },
        { date: '2026-11-09', field: 'tax', to: '' },
        { date: 'someday', field: 'tax', to: '0' },
      ],
    }))
    expect(events).toEqual([])
  })

  it('keeps only a real 64-hex hash tag', () => {
    const events = buildAuditLedgerEvents(program({
      auditTrail: [
        { date: '2026-11-09', field: 'tax', to: '0', hash: 'A'.repeat(64) },
        { date: '2026-11-08', field: 'tax', to: '1', hash: 'deadbeef' },
      ],
    }))
    expect(events[0].tags).toContainEqual(['hash', 'a'.repeat(64)])
    expect(events[1].tags.some(tag => tag[0] === 'hash')).toBe(false)
  })

  it('uses a stable d tag per row', () => {
    const events = buildAuditLedgerEvents(program())
    const d = events[0].tags.find(tag => tag[0] === 'd')?.[1]
    expect(d).toBe('motopass-audit-uy-2026-11-09-scorecard.banking-0')
    expect(programSlug(program())).toBe('uy')
  })

  it('returns an empty ledger rather than inventing rows', () => {
    expect(buildAuditLedgerEvents(program({ auditTrail: [] }))).toEqual([])
    expect(buildAuditLedgerEvents(program({ auditTrail: undefined }))).toEqual([])
  })
})

describe('publishAuditLedger without a signer', () => {
  it('hands back the exact JSON instead of claiming a publish', async () => {
    const result = await publishAuditLedger(program())
    expect(result.status).toBe('unsigned')
    expect(result.signedCount).toBe(0)
    expect(result.publishedCount).toBe(0)
    expect(JSON.parse(result.json).events).toHaveLength(2)
  })

  it('reports an empty trail as empty, not as success', async () => {
    const result = await publishAuditLedger(program({ auditTrail: [] }))
    expect(result.status).toBe('empty')
    expect(ledgerJson([])).toContain('"events": []')
  })
})
