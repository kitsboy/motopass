import { describe, it, expect } from 'vitest'
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { nip19 } from 'nostr-tools'
import { buildTipReceipt } from './tipReceipt'
import { parseReceiptAuthor, selectTipReceipts } from './receiptRelays'

function signedFor(secret: Uint8Array, paymentHash = 'a'.repeat(64), createdAt = 1_760_000_100) {
  const built = buildTipReceipt({
    program: 'Panama',
    factKey: 'gov_fees',
    sats: 5_000,
    paymentHash,
    preimage: 'b'.repeat(64),
    settledAt: createdAt,
    createdAt,
  })
  if (!built.ok) throw new Error(built.error)
  return finalizeEvent(
    { kind: 30078, created_at: built.event.created_at, tags: built.event.tags, content: built.event.content },
    secret,
  )
}

describe('parseReceiptAuthor', () => {
  it('accepts a hex pubkey and an npub, and normalises case', () => {
    const pubkey = getPublicKey(generateSecretKey())
    expect(parseReceiptAuthor(pubkey.toUpperCase())).toBe(pubkey)
    expect(parseReceiptAuthor(` ${nip19.npubEncode(pubkey)} `)).toBe(pubkey)
  })

  it('refuses an nsec, an empty field and junk', () => {
    const secret = generateSecretKey()
    expect(parseReceiptAuthor(nip19.nsecEncode(secret))).toBeNull()
    expect(parseReceiptAuthor('   ')).toBeNull()
    expect(parseReceiptAuthor('npub1notvalid')).toBeNull()
  })
})

describe('selectTipReceipts', () => {
  it('keeps only the requested author, de-duplicates and sorts newest first', () => {
    const mine = generateSecretKey()
    const other = generateSecretKey()
    const author = getPublicKey(mine)
    const older = signedFor(mine, 'c'.repeat(64), 1_760_000_000)
    const newer = signedFor(mine, 'd'.repeat(64), 1_760_000_500)

    const selected = selectTipReceipts([older, newer, older, signedFor(other)], author)
    expect(selected.map(receipt => receipt.paymentHash)).toEqual(['d'.repeat(64), 'c'.repeat(64)])
  })

  it('drops a relay event whose signature was tampered with', () => {
    const mine = generateSecretKey()
    const author = getPublicKey(mine)
    const event = signedFor(mine)
    const tampered = { ...event, content: '{"sats":1}' }
    expect(selectTipReceipts([tampered], author)).toEqual([])
    expect(selectTipReceipts([event], author)).toHaveLength(1)
  })
})
