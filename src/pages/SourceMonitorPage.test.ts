/**
 * An open rule change is not "healthy" just because another URL still probes ok.
 * The status word has to say changed — a CHANGED pill is not the status.
 */
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SourceCountryCard, countryTone } from './SourceMonitorPage'

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

  it('falls through to blocked, then unreachable', () => {
    expect(countryTone(country('Malta', false, ['blocked', 'unreachable']))).toBe('blocked')
    expect(countryTone(country('Bahamas', false, ['unreachable']))).toBe('unreachable')
    expect(countryTone({ changed: false, urls: [] })).toBe('unreachable')
  })
})
