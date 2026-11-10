import { describe, expect, it } from 'vitest'
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { bytesToWords } from './bech32'
import { verifyZapReceipt } from './zapReceipt'

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

function tag(type: number, bytes: Uint8Array): number[] {
  const words = bytesToWords(bytes)
  return [type, (words.length >> 5) & 31, words.length & 31, ...words]
}

function invoice(): string {
  const hrp = 'lnbc2500u'
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
    ...tag(13, new TextEncoder().encode('zap')),
    ...bytesToWords(new Uint8Array(65)),
  ]
  const mod = polymod([...expand(hrp), ...words, 0, 0, 0, 0, 0, 0]) ^ 1
  const checksum = [0, 1, 2, 3, 4, 5].map(i => (mod >>> (5 * (5 - i))) & 31)
  return `${hrp}1${[...words, ...checksum].map(word => CHARSET[word]).join('')}`
}

const BOLT11 = invoice()

function receiptFixture() {
  const recipientSecret = generateSecretKey()
  const recipient = getPublicKey(recipientSecret)
  const senderSecret = generateSecretKey()
  const eventId = 'a'.repeat(64)
  const request = finalizeEvent(
    {
      kind: 9731,
      created_at: 1_700_000_000,
      tags: [
        ['p', recipient],
        ['e', eventId],
        ['amount', '250000000'],
        ['relays', 'wss://relay.example'],
      ],
      content: 'zap',
    },
    senderSecret,
  )
  const receipt = finalizeEvent(
    {
      kind: 9735,
      created_at: 1_700_000_010,
      tags: [
        ['p', recipient],
        ['e', eventId],
        ['bolt11', BOLT11],
        ['description', JSON.stringify(request)],
      ],
      content: '',
    },
    recipientSecret,
  )
  return { receipt, request, recipient, eventId }
}

describe('verifyZapReceipt', () => {
  it('verifies the receipt, request, invoice and matching tags', async () => {
    const { receipt, recipient, eventId } = receiptFixture()
    const result = await verifyZapReceipt(JSON.stringify(receipt))
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (!result.ok) return
    expect(result.checks.receiptSignature).toBe(true)
    expect(result.checks.zapRequestSignature).toBe(true)
    expect(result.checks.invoiceDecoded).toBe(true)
    expect(result.checks.amountMatches).toBe(true)
    expect(result.checks.recipientMatches).toBe(true)
    expect(result.checks.eventMatches).toBe(true)
    expect(result.details.recipient).toBe(recipient)
    expect(result.details.eventId).toBe(eventId)
  })

  it('marks a tampered receipt signature as invalid without inventing a pass', async () => {
    const { receipt } = receiptFixture()
    const tampered = { ...receipt, sig: '0'.repeat(128) }
    const result = await verifyZapReceipt(JSON.stringify(tampered))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.checks.receiptSignature).toBe(false)
  })

  it('rejects a non-9735 event and malformed JSON', async () => {
    const { request } = receiptFixture()
    expect(await verifyZapReceipt(JSON.stringify(request))).toMatchObject({ ok: false })
    expect(await verifyZapReceipt('{')).toEqual({ ok: false, error: 'That is not valid JSON' })
  })
})
