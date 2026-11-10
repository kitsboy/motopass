import { describe, expect, it } from 'vitest'
import { bytesToWords } from './bech32'
import {
  inspectLnurlPay,
  parseLnurlTarget,
  parseMetadata,
  requestAndInspectLnurlInvoice,
} from './lnurlInspect'
import type { FetchLike } from './lnurl'

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

function tag(type: number, bytes: Uint8Array): number[] {
  const words = bytesToWords(bytes)
  return [type, (words.length >> 5) & 31, words.length & 31, ...words]
}

function invoiceAt(hrp: string): string {
  const expand = (value: string) => {
    const out: number[] = []
    for (const ch of value) out.push(ch.charCodeAt(0) >>> 5)
    out.push(0)
    for (const ch of value) out.push(ch.charCodeAt(0) & 31)
    return out
  }
  const polymod = (values: number[]) => {
    let value = 1
    for (const word of values) {
      const top = value >>> 25
      value = ((value & 0x1ffffff) << 5) ^ word
      for (let i = 0; i < 5; i += 1) if ((top >>> i) & 1) value ^= GENERATOR[i]
    }
    return value >>> 0
  }
  const time: number[] = []
  let remaining = 1_700_000_000
  for (let i = 0; i < 7; i += 1) {
    time.unshift(remaining & 31)
    remaining = Math.floor(remaining / 32)
  }
  const words = [
    ...time,
    ...tag(1, new Uint8Array(32).fill(7)),
    ...tag(13, new TextEncoder().encode('test')),
    ...bytesToWords(new Uint8Array(65)),
  ]
  const mod = polymod([...expand(hrp), ...words, 0, 0, 0, 0, 0, 0]) ^ 1
  const checksum = [0, 1, 2, 3, 4, 5].map(i => (mod >>> (5 * (5 - i))) & 31)
  return `${hrp}1${[...words, ...checksum].map(word => CHARSET[word]).join('')}`
}

const INVOICE = invoiceAt('lnbc2500u')

function jsonFetch(body: unknown, status = 200): FetchLike {
  return async () => ({ ok: status >= 200 && status < 300, status, json: async () => body })
}

describe('parseLnurlTarget', () => {
  it('accepts a Lightning Address and builds the well-known endpoint', () => {
    const parsed = parseLnurlTarget('motopass@breez.tips')
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.target.kind).toBe('address')
      expect(parsed.target.endpoint).toBe('https://breez.tips/.well-known/lnurlp/motopass')
    }
  })

  it('rejects schemes, paths and malformed addresses', () => {
    expect(parseLnurlTarget('https://breez.tips/pay')).toMatchObject({ ok: false })
    expect(parseLnurlTarget('motopass')).toMatchObject({ ok: false })
    expect(parseLnurlTarget('')).toEqual({ ok: false, error: 'Paste a Lightning Address or LNURL first' })
  })
})

describe('parseMetadata', () => {
  it('reads text entries and ignores malformed entries', () => {
    expect(parseMetadata('[["text/plain","MotoPass"],["text/identifier","motopass@breez.tips"],["bad"]]')).toEqual([
      { type: 'text/plain', value: 'MotoPass' },
      { type: 'text/identifier', value: 'motopass@breez.tips' },
    ])
  })

  it('returns an empty list for non-JSON metadata', () => {
    expect(parseMetadata('not json')).toEqual([])
  })
})

describe('inspectLnurlPay', () => {
  it('resolves a payRequest and exposes range and metadata', async () => {
    const result = await inspectLnurlPay(
      'motopass@breez.tips',
      jsonFetch({
        tag: 'payRequest',
        callback: 'https://breez.tips/cb',
        minSendable: 1000,
        maxSendable: 500_000_000,
        metadata: '[["text/plain","MotoPass"]]',
      }),
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.inspection.params.minSendable).toBe(1000)
      expect(result.inspection.metadata[0]).toEqual({ type: 'text/plain', value: 'MotoPass' })
    }
  })

  it('surfaces a CORS/network failure as an error', async () => {
    const result = await inspectLnurlPay('motopass@breez.tips', async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(result).toEqual({ ok: false, error: 'Failed to fetch' })
  })
})

describe('requestAndInspectLnurlInvoice', () => {
  it('decodes the returned invoice locally and checks its amount', async () => {
    let call = 0
    const fake: FetchLike = async () => {
      call += 1
      return {
        ok: true,
        status: 200,
        json: async () =>
          call === 1
            ? {
                tag: 'payRequest',
                callback: 'https://breez.tips/cb',
                minSendable: 1000,
                maxSendable: 500_000_000,
                metadata: '[]',
              }
            : { pr: INVOICE },
      }
    }
    const result = await requestAndInspectLnurlInvoice('motopass@breez.tips', 250_000, fake)
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (result.ok) {
      expect(result.result.invoice).toBe(INVOICE)
      expect(result.result.decoded.amountMsat).toBe(250_000_000)
      expect(result.result.paymentHashMatchesAmount).toBe(true)
    }
  })
})
