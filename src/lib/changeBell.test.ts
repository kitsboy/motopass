import { describe, expect, it } from 'vitest'
import type { Program } from '../types/program'
import catalogJson from '../../research/countries.json'
import {
  changeBellNote,
  changeBellPayload,
  changeBellReport,
  webhookUrlAllowed,
} from './changeBell'

function country(partial: Partial<Program> & Pick<Program, 'name'>): Program {
  return {
    id: 1,
    category: 'rbi_cbi',
    region: 'Test',
    status: 'Researching',
    bitcoin_integration: '',
    finance: {
      min_investment_usd: 0,
      typical_investment_usd: 0,
      gov_fees_usd: 0,
      processing_time_months: '1-2',
      tax_benefits: '',
      crypto_friendly_score: null,
      bitcoin_specific: '',
    },
    details: '',
    last_checked: '2026-11-08',
    ...partial,
  }
}

describe('change bell', () => {
  it('names only countries whose watch latch or a page is changed', () => {
    const report = changeBellReport([
      country({
        name: 'Quietland',
        watch: { changed: false, last_probe_at: '2026-11-09T14:00:00.000Z', urls: [{ url: 'https://a.example', status: 'ok' }] },
      }),
      country({
        id: 2,
        name: 'Movedland',
        watch: {
          changed: true,
          last_probe_at: '2026-11-09T15:00:00.000Z',
          urls: [{ url: 'https://law.example/gazette', status: 'changed', last_probed: '2026-11-09T15:00:00.000Z' }],
        },
      }),
    ])
    expect(report.steady).toBe(1)
    expect(report.changed.map(item => item.name)).toEqual(['Movedland'])
    expect(report.latestProbe).toBe('2026-11-09T15:00:00.000Z')
    expect(changeBellNote(report)).toContain('Movedland: https://law.example/gazette')
    expect(changeBellPayload(report).kind).toBe('motopass.change-bell')
  })

  it('says none when every latch is clear', () => {
    const report = changeBellReport([
      country({ name: 'Quietland', watch: { changed: false, last_probe_at: '2026-11-09T14:00:00.000Z', urls: [] } }),
    ])
    expect(changeBellNote(report)).toContain('Changed: none')
  })

  it('follows the shipped catalog without flipping a clear latch', () => {
    const report = changeBellReport((catalogJson as { programs: Program[] }).programs)
    expect(report.changed.map(item => item.name)).toEqual([])
    expect(report.steady).toBe(21)
  })

  it('refuses private and non-https webhook addresses', () => {
    expect(webhookUrlAllowed('https://hooks.example/motopass')).toBe(true)
    expect(webhookUrlAllowed('http://hooks.example/motopass')).toBe(false)
    expect(webhookUrlAllowed('https://localhost/hook')).toBe(false)
    expect(webhookUrlAllowed('https://127.0.0.1/hook')).toBe(false)
    expect(webhookUrlAllowed('https://169.254.169.254/latest')).toBe(false)
    expect(webhookUrlAllowed('https://10.0.0.5/hook')).toBe(false)
    expect(webhookUrlAllowed('')).toBe(false)
  })
})
