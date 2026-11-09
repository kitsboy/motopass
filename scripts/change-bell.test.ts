import { describe, expect, it } from 'vitest'
import { payloadFromReport, reportFromPrograms, webhookUrlAllowed } from './change-bell.mjs'

describe('change bell script', () => {
  it('builds the same kind of payload and refuses a private webhook', () => {
    const report = reportFromPrograms([
      { name: 'Quietland', watch: { changed: false, last_probe_at: '2026-11-09T14:00:00.000Z', urls: [] } },
    ])
    expect(payloadFromReport(report).changed).toEqual([])
    expect(webhookUrlAllowed('https://192.168.1.9/hook')).toBe(false)
    expect(webhookUrlAllowed('https://hooks.example/motopass')).toBe(true)
  })
})
