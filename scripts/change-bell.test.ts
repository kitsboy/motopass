import { describe, expect, it } from 'vitest'
import { payloadFromReport, reportFromPrograms, sentencesFromEvents, webhookUrlAllowed } from './change-bell.mjs'

describe('change bell script', () => {
  it('builds the same kind of payload and refuses a private webhook', () => {
    const report = reportFromPrograms([
      { name: 'Quietland', watch: { changed: false, last_probe_at: '2026-11-09T14:00:00.000Z', urls: [] } },
    ])
    expect(payloadFromReport(report).changed).toEqual([])
    expect(webhookUrlAllowed('https://192.168.1.9/hook')).toBe(false)
    expect(webhookUrlAllowed('https://hooks.example/motopass')).toBe(true)
    const sentences = sentencesFromEvents(
      [{ kind: 'rule', country: 'Quietland', date: '2026-10-02', ts: '2026-10-02', url: 'https://law.example', before: 'old fee', after: 'old fee and a new line' }],
      [{ name: 'Quietland', watch: { changed: false } }],
    )
    expect(sentences[0].added).toContain('new line')
    expect(sentences[0].marked_changed).toBe(false)
    expect(payloadFromReport(report, sentences).sentences).toHaveLength(1)
  })
})
