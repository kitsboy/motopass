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
    expect(byLine('watched')).toEqual(['Argentina', 'Mexico', 'Panama'])
    expect(byLine('cited')).toEqual(['Grenada', 'St. Lucia'])
    expect(byLine('changed')).toEqual([])
    expect(byLine('none')).toHaveLength(16)
  })
})
