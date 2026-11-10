import { describe, it, expect } from 'vitest'
import { buildListTransactionsParams } from './nwc'

describe('buildListTransactionsParams', () => {
  it('asks for ten rows by default and clamps what it sends', () => {
    expect(buildListTransactionsParams()).toEqual({ ok: true, params: { limit: 10 } })
    expect(buildListTransactionsParams({ limit: 500 })).toEqual({ ok: true, params: { limit: 50 } })
    expect(buildListTransactionsParams({ limit: 0 })).toEqual({ ok: true, params: { limit: 1 } })
  })

  it('omits absent bounds instead of sending zero', () => {
    expect(buildListTransactionsParams({ from: 1_760_000_000 })).toEqual({
      ok: true,
      params: { limit: 10, from: 1_760_000_000 },
    })
    expect(buildListTransactionsParams({ from: 0, until: -5 })).toEqual({ ok: true, params: { limit: 10 } })
  })

  it('carries a real range and the unpaid flag', () => {
    expect(buildListTransactionsParams({ from: 1_760_000_000, until: 1_760_086_400, unpaid: true })).toEqual({
      ok: true,
      params: { limit: 10, from: 1_760_000_000, until: 1_760_086_400, unpaid: true },
    })
    expect(buildListTransactionsParams({ unpaid: false })).toEqual({ ok: true, params: { limit: 10 } })
  })

  it('refuses a range that ends before it starts', () => {
    expect(buildListTransactionsParams({ from: 1_760_086_400, until: 1_760_000_000 })).toEqual({
      ok: false,
      error: 'The end of the range is before its start',
    })
    expect(buildListTransactionsParams({ from: 1_760_000_000, until: 1_760_000_000 }).ok).toBe(false)
  })
})
