import { describe, expect, it } from 'vitest'
import type { Program } from '../types/program'
import catalogJson from '../../research/countries.json'
import { gazetteHits, gazetteLine, isGazetteUrl } from './gazetteWatch'

describe('gazette watch', () => {
  it('ignores a news slug that only uses the word gazettes', () => {
    expect(isGazetteUrl('https://news.bloombergtax.com/daily-tax-report-international/el-salvador-gazettes-decree-amending-bitcoin-law')).toBe(false)
  })

  it('reads a watched gazette and a cited gazette that is not watched', () => {
    const watched = gazetteHits({
      officialUrls: ['https://www.boletinoficial.gob.ar'],
      watchUrls: [{ url: 'https://www.boletinoficial.gob.ar', status: 'ok', last_probed: '2026-11-09T00:00:00.000Z' }],
    })
    expect(gazetteLine(watched)).toBe('watched')
    const cited = gazetteHits({
      sources: ['St Lucia official gazette — https://www.cipsaintlucia.com/s/gazettejuly92024.pdf'],
    })
    expect(gazetteLine(cited)).toBe('cited')
    expect(cited[0].url).toBe('https://www.cipsaintlucia.com/s/gazettejuly92024.pdf')
    expect(gazetteLine(gazetteHits({}))).toBe('none')
  })

  it('maps a probe status to the line it belongs on, on a fixture', () => {
    const line = (status: 'ok' | 'changed' | 'blocked' | 'unreachable' | 'error') =>
      gazetteLine(
        gazetteHits({
          watchUrls: [{ url: 'https://dof.gob.mx/', status, last_probed: '2026-11-11T00:00:00.000Z' }],
        }),
      )
    expect(line('ok')).toBe('watched')
    // A page the watchdog found changed must not be reported as a clean watch.
    expect(line('changed')).toBe('changed')
    // Blocked or unreachable is still a watched page; only a change moves it.
    expect(line('blocked')).toBe('watched')
    expect(line('unreachable')).toBe('watched')
  })

  it('matches the gazettes already in the shipped catalog', () => {
    const lines = (catalogJson as { programs: Program[] }).programs.map(program => ({
      name: program.name,
      line: gazetteLine(gazetteHits({
        sources: program.sources,
        officialUrls: program.legal_compliance?.official_urls,
        watchUrls: program.watch?.urls,
      })),
    }))
    const byLine = (line: string) => lines.filter(row => row.line === line).map(row => row.name).sort()
    // Derived from the corpus, not from a probe run: whatever a program's
    // watched gazette reports, the line must agree with that status.
    const expected = (catalogJson as { programs: Program[] }).programs
      .filter(program => {
        const hits = gazetteHits({
          sources: program.sources,
          officialUrls: program.legal_compliance?.official_urls,
          watchUrls: program.watch?.urls,
        })
        return gazetteLine(hits) === 'changed'
      })
      .map(program => program.name)
      .sort()
    expect(byLine('changed')).toEqual(expected)
    expect(byLine('watched').length + byLine('cited').length + byLine('changed').length + byLine('none').length)
      .toBe((catalogJson as { programs: Program[] }).programs.length)
  })
})
