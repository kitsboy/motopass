import { describe, expect, it } from 'vitest'
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { bech32Encode, bytesToWords } from './bech32'
import { verifyPaymentEvidence } from './paymentEvidence'
import { sha256Hex } from './preimage'

const PREIMAGE = '11'.repeat(32)

function timeWords(timestamp: number): number[] {
  const words: number[] = []
  let remaining = timestamp
  for (let i = 0; i < 7; i += 1) {
    words.unshift(remaining & 31)
    remaining = Math.floor(remaining / 32)
  }
  return words
}

function tag(type: number, bytes: Uint8Array): number[] {
  const words = bytesToWords(bytes)
  return [type, (words.length >> 5) & 31, words.length & 31, ...words]
}

function invoice(paymentHash: string): string {
  const hash = Uint8Array.from(paymentHash.match(/.{2}/g)!.map(byte => Number.parseInt(byte, 16)))
  const words = [
    ...timeWords(1_700_000_000),
    ...tag(1, hash),
    ...tag(13, new TextEncoder().encode('Evidence bundle')),
    ...bytesToWords(new Uint8Array(65).fill(9)),
  ]
  return bech32Encode('lnbc2500u', words, 'bech32')
}

describe('payment evidence bundle', () => {
  it('marks an invoice alone as incomplete', async () => {
    const hash = await sha256Hex(PREIMAGE)
    if (!hash) throw new Error('SHA-256 unavailable')
    const result = await verifyPaymentEvidence({ invoice: invoice(hash) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.verdict).toBe('incomplete')
    expect(result.checks.preimage).toBe(null)
  })

  it('links a matching preimage and fails a mismatching one', async () => {
    const hash = await sha256Hex(PREIMAGE)
    if (!hash) throw new Error('SHA-256 unavailable')
    const value = invoice(hash)

    const matching = await verifyPaymentEvidence({ invoice: value, preimage: PREIMAGE })
    expect(matching.ok).toBe(true)
    if (matching.ok) {
      expect(matching.checks.preimage).toBe(true)
      expect(matching.verdict).toBe('consistent')
    }

    const wrong = await verifyPaymentEvidence({ invoice: value, preimage: '22'.repeat(32) })
    expect(wrong.ok).toBe(true)
    if (wrong.ok) {
      expect(wrong.checks.preimage).toBe(false)
      expect(wrong.verdict).toBe('failed')
    }
  })

  it('cross-checks a zap receipt against the same invoice hash and amount', async () => {
    const hash = await sha256Hex(PREIMAGE)
    if (!hash) throw new Error('SHA-256 unavailable')
    const value = invoice(hash)
    const recipientSecret = generateSecretKey()
    const recipient = getPublicKey(recipientSecret)
    const eventId = 'a'.repeat(64)
    const request = finalizeEvent(
      {
        kind: 9731,
        created_at: 1_700_000_000,
        tags: [
          ['p', recipient],
          ['e', eventId],
          ['amount', '250000000'],
        ],
        content: 'zap',
      },
      generateSecretKey(),
    )
    const receipt = finalizeEvent(
      {
        kind: 9735,
        created_at: 1_700_000_010,
        tags: [
          ['p', recipient],
          ['e', eventId],
          ['bolt11', value],
          ['description', JSON.stringify(request)],
        ],
        content: '',
      },
      recipientSecret,
    )

    const result = await verifyPaymentEvidence({ invoice: value, zapReceipt: JSON.stringify(receipt) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.checks.zapReceipt).toBe(true)
    expect(result.checks.zapInvoice).toBe(true)
    expect(result.checks.zapAmount).toBe(true)
    expect(result.verdict).toBe('consistent')
  })

  it('does not pretend malformed invoice input is evidence', async () => {
    const result = await verifyPaymentEvidence({ invoice: 'not an invoice' })
    expect(result.ok).toBe(false)
  })
})
