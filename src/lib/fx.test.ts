import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  parseEcbDaily,
  priceForDisplay,
  resetFxCachesForTests,
  resolveFxRate,
  BTC_USD_REFERENCE,
  type FxQuote,
} from './fx'

const ECB_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
  <gesmes:subject>Reference rates</gesmes:subject>
  <Cube>
    <Cube time='2026-08-21'>
      <Cube currency='USD' rate='1.1699'/>
      <Cube currency='JPY' rate='185.66'/>
      <Cube currency='GBP' rate='0.85670'/>
      <Cube currency='CHF' rate='0.9353'/>
    </Cube>
  </Cube>
</gesmes:Envelope>`

const SNAPSHOT = {
  captured_at: '2026-08-22T00:00:00Z',
  btc_usd: 77000,
  per_eur: { USD: 1.17, EUR: 1, GBP: 0.85, CHF: 0.93 },
  source: 'test',
}

function mockFetch(handler: (url: string) => Response) {
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    return Promise.resolve(handler(url))
  }))
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
}

const NOW = new Date('2026-08-22T12:00:00Z').getTime()

describe('parseEcbDaily', () => {
  it('extracts the reference date and per-EUR rates', () => {
    const { date, perEur } = parseEcbDaily(ECB_SAMPLE)
    expect(date).toBe('2026-08-21')
    expect(perEur.USD).toBe(1.1699)
    expect(perEur.GBP).toBe(0.8567)
    expect(perEur.JPY).toBe(185.66)
  })
})

describe('resolveFxRate — honest 5-step chain', () => {
  beforeEach(() => {
    resetFxCachesForTests()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('step 1: CoinGecko direct BTC→fiat, fresh, never stale', async () => {
    mockFetch((url) => {
      if (url.includes('coingecko')) return jsonResponse({ bitcoin: { usd: 77264, eur: 66153 } })
      return new Response('', { status: 404 })
    })
    const q = await resolveFxRate('EUR', { now: NOW })
    expect(q.source).toBe('coingecko')
    expect(q.missing).toBe(false)
    expect(q.stale).toBe(false)
    expect(q.ratePerBtc).toBe(66153)
  })

  it('step 2: CoinGecko BTC→USD × ECB fiat-fiat when direct fiat missing', async () => {
    mockFetch((url) => {
      if (url.includes('coingecko')) return jsonResponse({ bitcoin: { usd: 77264 } })
      if (url.includes('ecb')) return new Response(ECB_SAMPLE, { status: 200 })
      return new Response('', { status: 404 })
    })
    const q = await resolveFxRate('EUR', { now: NOW })
    expect(q.source).toBe('coingecko+ecb')
    expect(q.missing).toBe(false)
    // 77264 USD per BTC / 1.1699 USD per EUR ≈ 66,040 EUR per BTC
    expect(q.ratePerBtc).toBeCloseTo(77264 / 1.1699, -1)
  })

  it('step 3: live feeds down → stored snapshot, honestly marked stale', async () => {
    mockFetch((url) => {
      if (url.includes('coingecko') || url.includes('ecb')) return new Response('', { status: 503 })
      if (url.includes('fx-snapshot')) return jsonResponse(SNAPSHOT)
      return new Response('', { status: 404 })
    })
    const q = await resolveFxRate('EUR', { now: NOW })
    expect(q.source).toBe('snapshot')
    expect(q.missing).toBe(false)
    expect(q.stale).toBe(true)
    expect(q.ratePerBtc).toBeCloseTo(77000 / 1.17, -1)
  })

  it('step 5: everything absent → never faked', async () => {
    mockFetch(() => new Response('', { status: 503 }))
    const q = await resolveFxRate('EUR', { now: NOW })
    expect(q.source).toBe('absent')
    expect(q.missing).toBe(true)
    expect(q.ratePerBtc).toBeNull()
  })

  it('USD falls to pitch-anchor reference only after snapshot is gone too', async () => {
    mockFetch(() => new Response('', { status: 503 }))
    const q = await resolveFxRate('USD', { now: NOW })
    expect(q.source).toBe('pitch-anchor')
    expect(q.missing).toBe(false)
    expect(q.stale).toBe(true)
    expect(q.ratePerBtc).toBe(BTC_USD_REFERENCE)
  })
})

describe('priceForDisplay — BTC-first repricing', () => {
  const capture = 77_264
  const freshEur: FxQuote = {
    currency: 'EUR',
    ratePerBtc: 66_153,
    source: 'coingecko',
    fetchedAt: '2026-08-22T11:00:00Z',
    stale: false,
    missing: false,
  }
  const staleEur: FxQuote = { ...freshEur, source: 'snapshot', stale: true }
  const absent: FxQuote = { currency: 'EUR', ratePerBtc: null, source: 'absent', fetchedAt: null, stale: false, missing: true }

  it('defaults to sats (BTC-first)', () => {
    const p = priceForDisplay(30_000, capture, 'SAT', null)
    expect(p.primary).toBe('38.83M sats') // 30000 / 77264 * 1e8 = 38,827,xxx → 38.83M
    expect(p.missing).toBe(false)
    expect(p.secondary).toContain('₿')
  })

  it('shows whole BTC', () => {
    const p = priceForDisplay(38_632, capture, 'BTC', null)
    expect(p.primary).toMatch(/^₿0\.5/)
  })

  it('re-prices to fiat with a live rate, sats secondary', () => {
    const p = priceForDisplay(30_000, capture, 'EUR', freshEur)
    expect(p.missing).toBe(false)
    expect(p.stale).toBe(false)
    // 30000/77264 BTC * 66153 = ~25,680 EUR
    expect(p.primary).toContain('€')
    expect(p.secondary).toContain('sats')
  })

  it('marks a stale fiat rate honestly', () => {
    const p = priceForDisplay(30_000, capture, 'EUR', staleEur)
    expect(p.stale).toBe(true)
    expect(p.missing).toBe(false)
  })

  it('never fakes a fiat number when FX is absent — shows BTC-anchored sats instead', () => {
    const p = priceForDisplay(30_000, capture, 'EUR', absent)
    expect(p.missing).toBe(true)
    expect(p.primary).toBe('—')
    expect(p.secondary).toContain('sats')
  })
})
