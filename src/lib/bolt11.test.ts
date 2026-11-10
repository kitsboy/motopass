import { describe, expect, it } from 'vitest'
import { bolt11AmountSats, bolt11ExpiryLabel, decodeBolt11 } from './bolt11'
import { BECH32_CHARSET, bytesToWords } from './bech32'

const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

function polymod(values: number[]): number {
  let checksum = 1
  for (const value of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i += 1) if ((top >>> i) & 1) checksum ^= GENERATOR[i]
  }
  return checksum >>> 0
}

function expand(hrp: string): number[] {
  const out: number[] = []
  for (const ch of hrp) out.push(ch.charCodeAt(0) >>> 5)
  out.push(0)
  for (const ch of hrp) out.push(ch.charCodeAt(0) & 31)
  return out
}

/** Test-only BOLT11 encoder: checksum, tags and a 65-byte signature placeholder. */
function encodeInvoice(hrp: string, timestamp: number, tags: number[][], signature: Uint8Array): string {
  const time: number[] = []
  let remaining = timestamp
  for (let i = 0; i < 7; i += 1) {
    time.unshift(remaining & 31)
    remaining = Math.floor(remaining / 32)
  }
  const words = [...time, ...tags.flat(), ...bytesToWords(signature)]
  const values = [...expand(hrp), ...words, 0, 0, 0, 0, 0, 0]
  const mod = polymod(values) ^ 1
  const checksum = [0, 1, 2, 3, 4, 5].map(i => (mod >>> (5 * (5 - i))) & 31)
  return `${hrp}1${[...words, ...checksum].map(word => BECH32_CHARSET[word]).join('')}`
}

function tag(type: number, words: number[]): number[] {
  return [type, (words.length >> 5) & 31, words.length & 31, ...words]
}

function intWords(value: number): number[] {
  const words: number[] = []
  let remaining = value
  do {
    words.unshift(remaining & 31)
    remaining = Math.floor(remaining / 32)
  } while (remaining > 0)
  return words
}

function invoice(opts: { hrp?: string; tags?: number[][]; sig?: Uint8Array } = {}): string {
  return encodeInvoice(
    opts.hrp ?? 'lnbc2500u',
    1_700_000_000,
    opts.tags ?? [
      tag(1, bytesToWords(new Uint8Array(32).fill(7))),
      tag(13, bytesToWords(new TextEncoder().encode('Research gap'))),
      tag(6, intWords(7200)),
      tag(24, intWords(144)),
    ],
    opts.sig ?? new Uint8Array(65).fill(9),
  )
}

describe('decodeBolt11', () => {
  it('reads amount, timestamp, expiry, payment hash and description', () => {
    const result = decodeBolt11(invoice())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.invoice.network).toBe('bitcoin')
    expect(result.invoice.amountText).toBe('2500u')
    expect(result.invoice.amountMsat).toBe(250_000_000)
    expect(result.invoice.timestamp).toBe(1_700_000_000)
    expect(result.invoice.expirySeconds).toBe(7200)
    expect(result.invoice.expiresAt).toBe(1_700_007_200)
    expect(result.invoice.paymentHash).toBe('07'.repeat(32))
    expect(result.invoice.description).toBe('Research gap')
    expect(result.invoice.minFinalCltv).toBe(144)
    expect(result.invoice.signature).toHaveLength(130)
    expect(result.invoice.warnings).toEqual([])
  })

  it('accepts a lightning: prefix and uppercase without changing the fields', () => {
    const value = invoice()
    const result = decodeBolt11(`lightning:${value.toUpperCase()}`)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.invoice.paymentHash).toBe('07'.repeat(32))
  })

  it('parses every amount multiplier, and refuses a pico amount that is not a whole msat', () => {
    const open = decodeBolt11(invoice({ hrp: 'lnbc' }))
    expect(open.ok && open.invoice.amountMsat).toBe(null)

    const pico = decodeBolt11(invoice({ hrp: 'lnbc10p' }))
    expect(pico.ok && pico.invoice.amountMsat).toBe(1)

    const tiny = decodeBolt11(invoice({ hrp: 'lnbc15p' }))
    expect(tiny).toEqual({ ok: false, error: 'Pico-bitcoin amount is not a whole millisecond' })

    const nano = decodeBolt11(invoice({ hrp: 'lntb100n' }))
    expect(nano.ok && nano.invoice.amountMsat).toBe(10_000)
    expect(nano.ok && nano.invoice.network).toBe('testnet')
  })

  it('rejects an edited invoice at the checksum, not later', () => {
    const value = invoice()
    const corrupted = `${value.slice(0, -1)}${value.endsWith('q') ? 'p' : 'q'}`
    expect(decodeBolt11(corrupted)).toEqual({ ok: false, error: 'Checksum failed' })
  })

  it('warns rather than inventing a payment hash when the field is absent', () => {
    const result = decodeBolt11(invoice({ tags: [tag(13, bytesToWords(new TextEncoder().encode('No hash')))] }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.invoice.paymentHash).toBe(null)
    expect(result.invoice.warnings).toContain('No payment hash field — this invoice cannot be paid as written.')
  })

  it('refuses non-invoice input and truncation', () => {
    expect(decodeBolt11('')).toEqual({ ok: false, error: 'Paste a BOLT11 invoice first' })
    expect(decodeBolt11('lno1abc')).toMatchObject({ ok: false })
    expect(decodeBolt11(invoice({ hrp: 'lnbc2500u' }).slice(0, 80))).toMatchObject({ ok: false })
  })
})

describe('BOLT11 amount and expiry labels', () => {
  it('only turns a whole-satoshi amount into sats', () => {
    expect(bolt11AmountSats(250_000_000)).toBe(250_000)
    expect(bolt11AmountSats(1_500)).toBe(null)
    expect(bolt11AmountSats(null)).toBe(null)
  })

  it('describes an expiry as a time, including when it has passed', () => {
    expect(bolt11ExpiryLabel(1_000 + 600, 1_000)).toBe('Expires in 10 min')
    expect(bolt11ExpiryLabel(1_000 - 120, 1_000)).toBe('Expired 2 min ago')
    expect(bolt11ExpiryLabel(1_000 + 7_200, 1_000)).toBe('Expires in 2 h')
  })
})
