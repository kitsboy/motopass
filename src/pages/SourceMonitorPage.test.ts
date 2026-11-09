/**
 * An open rule change is not "healthy" just because another URL still probes ok.
 * The status word has to say changed — a CHANGED pill is not the status.
 */
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SourceCountryCard, countryTone, historyDateLabel, newestLastProbed, openReviewRows } from './SourceMonitorPage'

function country(name: string, changed: boolean, statuses: string[]) {
  return {
    program_id: name === 'Uruguay' ? 4 : 13,
    name,
    changed,
    urls: statuses.map((status, i) => ({
      url: `https://example.test/${name.toLowerCase()}/${i}`,
      status,
      last_probed: '2026-11-08T06:01:10.159Z',
    })),
  }
}

describe('SourceMonitorPage country tone', () => {
  it('uses the newest probe time, not the first URL', () => {
    expect(
      newestLastProbed([
        { last_probed: '2026-10-01T00:00:00.000Z' },
        { last_probed: '2026-11-08T12:00:00.000Z' },
      ]),
    ).toBe('2026-11-08T12:00:00.000Z')
  })

  it('does not call a changed country healthy when another URL is ok', () => {
    const uruguay = country('Uruguay', true, ['ok', 'changed'])
    const html = renderToStaticMarkup(h(SourceCountryCard, { country: uruguay }))
    expect(countryTone(uruguay)).toBe('changed')
    expect(html).toContain('changed')
    expect(html).not.toContain('healthy')
  })

  it('labels a country changed when the latch is open even if every URL is ok', () => {
    const portugal = country('Portugal', true, ['ok', 'ok'])
    const html = renderToStaticMarkup(h(SourceCountryCard, { country: portugal }))
    expect(countryTone(portugal)).toBe('changed')
    expect(html).toContain('changed')
    expect(html).not.toContain('healthy')
  })

  it('labels a country changed when a URL status is changed and the latch is closed', () => {
    const flagged = country('Italy', false, ['ok', 'changed'])
    const html = renderToStaticMarkup(h(SourceCountryCard, { country: flagged }))
    expect(countryTone(flagged)).toBe('changed')
    expect(html).toContain('changed')
    expect(html).not.toContain('healthy')
  })

  it('renders an all-ok country as healthy', () => {
    const spain = country('Spain', false, ['ok', 'ok'])
    const html = renderToStaticMarkup(h(SourceCountryCard, { country: spain }))
    expect(countryTone(spain)).toBe('ok')
    expect(html).toContain('healthy')
    expect(html).not.toContain('changed')
  })

  it('labels a mixed country by its worst URL, not its best', () => {
    const salvador = country('El Salvador', false, ['ok', 'blocked'])
    const bahamas = country('Bahamas', false, ['ok', 'unreachable'])
    const salvadorHtml = renderToStaticMarkup(h(SourceCountryCard, { country: salvador }))
    const bahamasHtml = renderToStaticMarkup(h(SourceCountryCard, { country: bahamas }))
    expect(countryTone(salvador)).toBe('blocked')
    expect(salvadorHtml).toContain('blocked')
    expect(salvadorHtml).not.toContain('healthy')
    expect(countryTone(bahamas)).toBe('unreachable')
    expect(bahamasHtml).toContain('unreachable')
    expect(bahamasHtml).not.toContain('healthy')
    expect(countryTone(country('Malta', false, ['blocked', 'unreachable']))).toBe('unreachable')
    expect(countryTone({ changed: false, urls: [] })).toBe('unreachable')
  })

  it('puts the open Uruguay URL above a country that is only healthy', () => {
    const rows = openReviewRows([
      {
        name: 'Uruguay',
        changed: true,
        urls: [
          { url: 'https://www.gub.uy/tramites/residencia-legal', status: 'ok' },
          { url: 'https://www.minterior.gub.uy', status: 'changed' },
        ],
      },
      { name: 'Portugal', changed: false, urls: [{ url: 'https://imigrante.sef.pt', status: 'ok' }] },
    ])
    expect(rows).toEqual([{ name: 'Uruguay', url: 'https://www.minterior.gub.uy' }])
  })
})

describe('history log dates', () => {
  it('shows a calendar day so an old row does not read as recent', () => {
    expect(historyDateLabel('2026-10-02T18:55:58.530Z')).toBe('2 Oct 2026')
    expect(historyDateLabel(null)).toBe('')
  })
})
