import { describe, expect, it } from 'vitest'
import { decodeBech32, offerDeepLink, parseBolt12Offer, shortOffer } from './bolt12'

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
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

/** Test-only encoder so a valid offer exists without a node. */
function encode(hrp: string, words: number[]): string {
  const values = [...expand(hrp), ...words, 0, 0, 0, 0, 0, 0]
  const mod = polymod(values) ^ 1
  const checksum = [0, 1, 2, 3, 4, 5].map(i => (mod >>> (5 * (5 - i))) & 31)
  return `${hrp}1${[...words, ...checksum].map(word => CHARSET[word]).join('')}`
}

const VALID = encode('lno', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

describe('decodeBech32', () => {
  it('decodes a checksum-valid string and strips the checksum', () => {
    const decoded = decodeBech32(VALID)
    expect(decoded.ok).toBe(true)
    if (decoded.ok) {
      expect(decoded.hrp).toBe('lno')
      expect(decoded.words).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    }
  })

  it('rejects a changed character, mixed case and a missing separator', () => {
    const corrupted = VALID.slice(0, -1) + (VALID.endsWith('q') ? 'p' : 'q')
    expect(decodeBech32(corrupted)).toEqual({ ok: false, error: 'Checksum failed' })
    expect(decodeBech32('LNO1qqqqqq')).toEqual({ ok: false, error: 'Mixed case' })
    expect(decodeBech32('notanoffer')).toEqual({ ok: false, error: 'No bech32 separator' })
  })
})

describe('parseBolt12Offer', () => {
  it('accepts a well-formed lno offer without claiming to read its fields', () => {
    const parsed = parseBolt12Offer(VALID.toUpperCase())
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.offer.hrp).toBe('lno')
      expect(parsed.offer.wordCount).toBe(10)
      expect(parsed.offer.offer).toBe(VALID)
    }
  })

  it('refuses BOLT11, an edited offer and empty input', () => {
    expect(parseBolt12Offer('lnbc1qqqq')).toEqual({ ok: false, error: 'Not a BOLT12 offer — expected lno1…' })
    expect(parseBolt12Offer('')).toEqual({ ok: false, error: 'No offer configured' })
    const corrupted = VALID.slice(0, -1) + (VALID.endsWith('q') ? 'p' : 'q')
    expect(parseBolt12Offer(corrupted)).toEqual({ ok: false, error: 'Checksum failed' })
  })

  it('only deep-links a validated offer', () => {
    expect(offerDeepLink(VALID)).toBe(`lightning:${VALID}`)
    expect(offerDeepLink('lno1garbage')).toBeNull()
  })

  it('shortens for display without pretending the short form is payable', () => {
    const long = `${VALID}qqqqqq`
    expect(shortOffer(long)).toBe(`${long.slice(0, 10)}…${long.slice(-6)}`)
    expect(shortOffer(VALID)).toBe(VALID)
    expect(shortOffer('lno1')).toBe('lno1')
  })
})
