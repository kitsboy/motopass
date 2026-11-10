import { describe, it, expect } from 'vitest'
import {
  clampAmountSats,
  formatLightningAddress,
  lightningDeepLink,
  lnurlpUrl,
  looksLikeBolt11,
  parseLightningAddress,
  requestInvoice,
  resolveLnurlPay,
  satsToMsat,
  type FetchLike,
  type LnurlPayParams,
} from './lnurl'

const BOLT11 =
  'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpu9qrsgquk0rl77nj30yxdy8j9vdx85fkpmdla2087ne0xh8nhedh8w27kyke0nmw9wqj9d7c8qk786x8f7n0hq2f8h4z8k7wq3n0x8m0t'

function jsonFetch(body: unknown, status = 200): FetchLike {
  return async () => ({ ok: status >= 200 && status < 300, status, json: async () => body })
}

const PARAMS: LnurlPayParams = {
  callback: 'https://breez.tips/lnurlp/cb/motopass',
  minSendable: 1_000,
  maxSendable: 1_000_000_000,
  metadata: '[["text/plain","motopass"]]',
  commentAllowed: 40,
}

describe('parseLightningAddress', () => {
  it('accepts a plain user@domain', () => {
    expect(parseLightningAddress('motopass@breez.tips')).toEqual({ user: 'motopass', domain: 'breez.tips' })
    expect(parseLightningAddress('  MotoPass@Breez.Tips ')).toEqual({ user: 'MotoPass', domain: 'breez.tips' })
  })

  it('rejects schemes, paths, empty parts and malformed domains', () => {
    for (const bad of [
      'https://motopass@breez.tips',
      'motopass@breez.tips/pay',
      'motopass@',
      '@breez.tips',
      'motopass',
      'motopass@breez',
      'motopass@-breez.tips',
      'moto pass@breez.tips',
      '',
    ]) {
      expect(parseLightningAddress(bad), bad).toBeNull()
    }
  })

  it('formats back to a single canonical string', () => {
    expect(formatLightningAddress({ user: 'motopass', domain: 'breez.tips' })).toBe('motopass@breez.tips')
  })
})

describe('lnurlpUrl', () => {
  it('builds the LUD-16 url', () => {
    expect(lnurlpUrl('motopass@breez.tips')).toBe('https://breez.tips/.well-known/lnurlp/motopass')
  })

  it('returns null for an invalid address', () => {
    expect(lnurlpUrl('motopass')).toBeNull()
  })
})

describe('resolveLnurlPay', () => {
  it('accepts a payRequest with an https callback and range', async () => {
    const result = await resolveLnurlPay('motopass@breez.tips', jsonFetch({
      tag: 'payRequest',
      callback: PARAMS.callback,
      minSendable: 1000,
      maxSendable: 500_000_000,
      metadata: PARAMS.metadata,
      commentAllowed: 40,
    }))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.params.maxSendable).toBe(500_000_000)
      expect(result.params.commentAllowed).toBe(40)
    }
  })

  it('refuses a non-payRequest, an http callback and an inverted range', async () => {
    const notPay = await resolveLnurlPay('motopass@breez.tips', jsonFetch({ tag: 'withdrawRequest' }))
    expect(notPay).toEqual({ ok: false, error: 'Endpoint is not an LNURL-pay request' })

    const insecure = await resolveLnurlPay('motopass@breez.tips', jsonFetch({
      tag: 'payRequest',
      callback: 'http://breez.tips/cb',
      minSendable: 1000,
      maxSendable: 2000,
      metadata: 'x',
    }))
    expect(insecure.ok).toBe(false)

    const inverted = await resolveLnurlPay('motopass@breez.tips', jsonFetch({
      tag: 'payRequest',
      callback: PARAMS.callback,
      minSendable: 5000,
      maxSendable: 1000,
      metadata: 'x',
    }))
    expect(inverted.ok).toBe(false)
  })

  it('surfaces HTTP and network failures without throwing', async () => {
    const http = await resolveLnurlPay('motopass@breez.tips', jsonFetch({}, 503))
    expect(http).toEqual({ ok: false, error: 'Lightning Address returned HTTP 503' })

    const down = await resolveLnurlPay('motopass@breez.tips', async () => {
      throw new Error('offline')
    })
    expect(down).toEqual({ ok: false, error: 'offline' })
  })
})

describe('clampAmountSats', () => {
  it('clamps into the advertised msat range', () => {
    // Ranges are msat: 200_000_000 msat = a 200,000 sat ceiling.
    expect(clampAmountSats(5000, { minSendable: 1000, maxSendable: 200_000_000 })).toBe(5000)
    expect(clampAmountSats(1, { minSendable: 10_000, maxSendable: 2_000_000 })).toBe(10)
    expect(clampAmountSats(9_999, { minSendable: 1000, maxSendable: 1_000_000 })).toBe(1000)
  })

  it('returns null for zero, negative or inverted ranges', () => {
    expect(clampAmountSats(0, { minSendable: 1000, maxSendable: 2000 })).toBeNull()
    expect(clampAmountSats(-5, { minSendable: 1000, maxSendable: 2000 })).toBeNull()
    expect(clampAmountSats(10, { minSendable: 9000, maxSendable: 1000 })).toBeNull()
  })

  it('converts sats to msat', () => {
    expect(satsToMsat(21)).toBe(21000)
    expect(satsToMsat(0)).toBeNull()
  })
})

describe('requestInvoice', () => {
  it('sends the amount in msat and the comment when allowed', async () => {
    let seen = ''
    const fake: FetchLike = async url => {
      seen = url
      return { ok: true, status: 200, json: async () => ({ pr: BOLT11 }) }
    }
    const result = await requestInvoice(PARAMS, 5000, fake, 'KY mobility gap')
    expect(result).toEqual({ ok: true, invoice: BOLT11, sats: 5000 })
    const parsed = new URL(seen)
    expect(parsed.searchParams.get('amount')).toBe('5000000')
    expect(parsed.searchParams.get('comment')).toBe('KY mobility gap')
  })

  it('omits the comment when the server allows none', async () => {
    let seen = ''
    const fake: FetchLike = async url => {
      seen = url
      return { ok: true, status: 200, json: async () => ({ pr: BOLT11 }) }
    }
    await requestInvoice({ ...PARAMS, commentAllowed: 0 }, 5000, fake, 'ignored')
    expect(new URL(seen).searchParams.has('comment')).toBe(false)
  })

  it('refuses a response without a BOLT11 invoice', async () => {
    const result = await requestInvoice(PARAMS, 5000, jsonFetch({ pr: 'not-an-invoice' }))
    expect(result).toEqual({ ok: false, error: 'Server did not return a BOLT11 invoice' })
  })

  it('refuses an out-of-range amount before calling the network', async () => {
    let called = false
    const fake: FetchLike = async () => {
      called = true
      return { ok: true, json: async () => ({ pr: BOLT11 }) }
    }
    const result = await requestInvoice({ ...PARAMS, maxSendable: 1000, minSendable: 2000 }, 5000, fake)
    expect(result.ok).toBe(false)
    expect(called).toBe(false)
  })
})

describe('looksLikeBolt11 / lightningDeepLink', () => {
  it('accepts bolt11 prefixes and rejects other strings', () => {
    expect(looksLikeBolt11(BOLT11)).toBe(true)
    expect(looksLikeBolt11('lnbc')).toBe(false)
    expect(looksLikeBolt11(`lnurl1${'x'.repeat(120)}`)).toBe(false)
    expect(looksLikeBolt11(undefined)).toBe(false)
  })

  it('builds a wallet URI with msat amount', () => {
    expect(lightningDeepLink('motopass@breez.tips', 5000)).toBe('lightning:motopass@breez.tips?amount=5000000')
    expect(lightningDeepLink('motopass', 5000)).toBeNull()
  })
})
