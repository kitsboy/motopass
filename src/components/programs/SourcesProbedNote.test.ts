/**
 * Weekly source-probe note — UTC day + en-GB short month.
 * Distinct from research freshness (lastChecked → "Sep 2026").
 */
import { describe, expect, it } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SourcesProbedNote } from './SourcesProbedNote'
import { ProgramsTable } from './ProgramsTable'
import { toCinematicProgram } from '../../lib/programAdapter'
import { DisplayCurrencyContext, type DisplayCurrencyContextValue } from '../../context/DisplayCurrencyContext'
import type { Program as DataProgram } from '../../types/program'
import type { Program } from './types'

const PROBE_ISO = '2026-11-08T12:24:29.059Z'

const renderNote = (iso?: string | null) =>
  renderToStaticMarkup(h(SourcesProbedNote, { iso }))

const currency: DisplayCurrencyContextValue = {
  currency: 'BTC',
  suggested: null,
  setCurrency: () => {},
  fx: null,
  fxLoading: false,
  fxDegraded: false,
  refreshFx: () => {},
  priceFor: () => ({
    primary: '1,000,000 sats',
    secondary: '$100,000',
    currency: 'BTC',
    stale: false,
    missing: false,
    source: 'btc',
  }),
}

const corpus = {
  id: 1,
  name: 'Uruguay',
  region: 'Americas',
  category: 'residency_by_investment',
  status: 'active',
  bitcoin_integration: 'test',
  last_checked: '2026-09-29',
  flag: '🇺🇾',
  details: 'Test program',
  sovereignty_score: 8.5,
  risk_level: 'low',
  lightning_ready: false,
  finance: {
    min_investment_usd: 100000,
    typical_investment_usd: 150000,
    processing_time_months: '6-12',
    crypto_friendly_score: 9,
    gov_fees_usd: 0,
    tax_benefits: 'test',
    bitcoin_specific: 'test',
  },
  satohash_proofs: [],
  watch: { urls: [], changed: false, last_probe_at: PROBE_ISO },
} as DataProgram

describe('SourcesProbedNote', () => {
  it('renders the UTC day and en-GB short month', () => {
    const html = renderNote(PROBE_ISO)
    expect(html).toContain('data-testid="sources-probed"')
    expect(html).toContain('Sources probed 8 Nov')
    expect(html).not.toContain('Sep 2026')
  })

  it('renders nothing when the probe timestamp is missing', () => {
    expect(renderNote(undefined)).toBe('')
    expect(renderNote(null)).toBe('')
  })

  it('maps lastProbed from the weekly probe, not last_checked', () => {
    const mapped = toCinematicProgram(corpus)
    expect(mapped.lastChecked).toBe('2026-09-29')
    expect(mapped.lastProbed).toBe(PROBE_ISO)
    expect(toCinematicProgram({ ...corpus, watch: undefined }).lastProbed).toBe(null)
  })

  it('mounts the note beside the freshness badge in the programs table', () => {
    const program: Program = toCinematicProgram(corpus)
    const html = renderToStaticMarkup(
      h(DisplayCurrencyContext.Provider, {
        value: currency,
        children: h(ProgramsTable, { programs: [program], onSelect: () => {} }),
      }),
    )
    const note = html.match(/data-testid="sources-probed"[^>]*>([^<]*)</)
    expect(note?.[1]).toBe('Sources probed 8 Nov')
    expect(note?.[1]).not.toContain('Sep 2026')
  })
})
