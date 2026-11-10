import { describe, expect, it } from 'vitest'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex, bytesToWords } from './bech32'
import { verifyBolt11Signature } from './bolt11Signature'

const SECRET = new Uint8Array(32).fill(11)
const PUBLIC_KEY = secp256k1.getPublicKey(SECRET, true)

function wordsToPaddedBytes(words: number[]): Uint8Array {
  let accumulator = 0
  let bits = 0
  const out: number[] = []
  for (const word of words) {
    accumulator = (accumulator << 5) | word
    bits += 5
    while (bits >= 8) {
      bits -= 8
      out.push((accumulator >>> bits) & 0xff)
    }
  }
  if (bits > 0) out.push((accumulator << (8 - bits)) & 0xff)
  return Uint8Array.from(out)
}

function tag(type: number, bytes: Uint8Array): number[] {
  const words = bytesToWords(bytes)
  return [type, (words.length >> 5) & 31, words.length & 31, ...words]
}

async function invoice(includePayee: boolean, secret = SECRET): Promise<string> {
  const hrp = 'lnbc2500u'
  const timestamp = 1_700_000_000
  const time: number[] = []
  let remaining = timestamp
  for (let i = 0; i < 7; i += 1) {
    time.unshift(remaining & 31)
    remaining = Math.floor(remaining / 32)
  }
  const tags = [
    tag(1, new Uint8Array(32).fill(7)),
    tag(13, new TextEncoder().encode('Signature check')),
    ...(includePayee ? [tag(19, PUBLIC_KEY)] : []),
  ].flat()
  const data = [...time, ...tags]
  const message = new Uint8Array([
    ...new TextEncoder().encode(hrp),
    ...wordsToPaddedBytes(data),
  ])
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', message))
  const recovered = secp256k1.sign(digest, secret, { prehash: false, format: 'recovered' })
  // Noble returns recovery-id-first; BOLT11 puts it last after R||S.
  const signature = Uint8Array.from([...recovered.slice(1), recovered[0]])
  const words = [...data, ...bytesToWords(signature)]

  const checksum = (() => {
    const generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
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
        for (let i = 0; i < 5; i += 1) if ((top >>> i) & 1) value ^= generator[i]
      }
      return value >>> 0
    }
    const mod = polymod([...expand(hrp), ...words, 0, 0, 0, 0, 0, 0]) ^ 1
    return [0, 1, 2, 3, 4, 5].map(i => (mod >>> (5 * (5 - i))) & 31)
  })()

  const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  return `${hrp}1${[...words, ...checksum].map(word => charset[word]).join('')}`
}

describe('verifyBolt11Signature', () => {
  it('recovers the signing key and matches the n field', async () => {
    const result = await verifyBolt11Signature(await invoice(true))
    expect(result.status, result.note).toBe('valid')
    expect(result.recoveredKey).toBe(bytesToHex(PUBLIC_KEY))
    expect(result.statedKey).toBe(result.recoveredKey)
  })

  it('recovers the key when the invoice has no n field, without claiming a match', async () => {
    const result = await verifyBolt11Signature(await invoice(false))
    expect(result.status, result.note).toBe('recovered')
    expect(result.statedKey).toBeNull()
    expect(result.note).toContain('no stated key')
  })

  it('rejects an invoice signed by a different key than its n field', async () => {
    const other = new Uint8Array(32).fill(12)
    const result = await verifyBolt11Signature(await invoice(true, other))
    expect(result.status, result.note).toBe('invalid')
    expect(result.recoveredKey).not.toBe(result.statedKey)
  })

  it('rejects an edited signature instead of throwing', async () => {
    const value = await invoice(true)
    const edited = `${value.slice(0, -2)}${value.endsWith('q') ? 'p' : 'q'}${value.slice(-1)}`
    const result = await verifyBolt11Signature(edited)
    expect(result.status).toBe('unreadable')
  })

  it('returns the decode error for a non-invoice', async () => {
    expect((await verifyBolt11Signature('not an invoice')).status).toBe('unreadable')
  })
})
