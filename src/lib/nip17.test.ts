import { describe, expect, it } from 'vitest'
import { finalizeEvent, generateSecretKey, getEventHash, getPublicKey, nip19, nip44, type Event } from 'nostr-tools'
import { inspectNip17GiftWrap, parseNip17Secret } from './nip17'

function conversationKey(secret: Uint8Array, pubkey: string): Uint8Array {
  return nip44.v2.utils.getConversationKey(secret, pubkey)
}

function giftWrapFixture(): { wrap: Event; recipientSecret: Uint8Array; senderPubkey: string } {
  const senderSecret = generateSecretKey()
  const recipientSecret = generateSecretKey()
  const senderPubkey = getPublicKey(senderSecret)
  const recipientPubkey = getPublicKey(recipientSecret)

  const rumor = {
    pubkey: senderPubkey,
    created_at: 1_700_000_000,
    kind: 14,
    tags: [['p', recipientPubkey]],
    content: 'Hola, que tal?',
  }
  const rumorWithId = { ...rumor, id: getEventHash(rumor) }

  const seal = finalizeEvent(
    {
      kind: 13,
      created_at: 1_700_000_000,
      tags: [],
      content: nip44.v2.encrypt(JSON.stringify(rumorWithId), conversationKey(senderSecret, recipientPubkey)),
    },
    senderSecret,
  )

  const wrapperSecret = generateSecretKey()
  const wrap = finalizeEvent(
    {
      kind: 1059,
      created_at: 1_700_000_000,
      tags: [['p', recipientPubkey]],
      content: nip44.v2.encrypt(JSON.stringify(seal), conversationKey(wrapperSecret, recipientPubkey)),
    },
    wrapperSecret,
  )

  return { wrap, recipientSecret, senderPubkey }
}

describe('parseNip17Secret', () => {
  it('accepts nsec and hex, and rejects anything else', () => {
    const secret = generateSecretKey()
    expect(parseNip17Secret(nip19.nsecEncode(secret))).toEqual(secret)
    expect(parseNip17Secret('01'.repeat(32))).toEqual(new Uint8Array(32).fill(1))
    expect(parseNip17Secret(nip19.npubEncode(getPublicKey(secret)))).toBeNull()
    expect(parseNip17Secret('not-a-key')).toBeNull()
  })
})

describe('inspectNip17GiftWrap', () => {
  it('verifies the public wrapper and unwraps the seal and unsigned rumor', () => {
    const { wrap, recipientSecret, senderPubkey } = giftWrapFixture()
    const result = inspectNip17GiftWrap(JSON.stringify(wrap), nip19.nsecEncode(recipientSecret))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.checks).toEqual({
      kind: true,
      signature: true,
      oneRecipient: true,
      pastTimestamp: true,
    })
    expect(result.result.unlocked?.checks).toEqual({
      sealKind: true,
      sealSignature: true,
      sealEmptyTags: true,
      senderMatches: true,
      rumorId: true,
      rumorKind: true,
      recipientTagged: true,
    })
    expect(result.result.unlocked?.rumor.content).toBe('Hola, que tal?')
    expect(result.result.unlocked?.rumor.pubkey).toBe(senderPubkey)
    expect(result.result.unlockError).toBeNull()
  })

  it('checks the public structure without a secret', () => {
    const { wrap } = giftWrapFixture()
    const result = inspectNip17GiftWrap(JSON.stringify(wrap))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.unlocked).toBeNull()
    expect(result.result.unlockError).toContain('recipient nsec')
    expect(result.result.checks.signature).toBe(true)
  })

  it('refuses to unwrap with a secret that is not the p-tagged recipient', () => {
    const { wrap } = giftWrapFixture()
    const otherSecret = generateSecretKey()
    const result = inspectNip17GiftWrap(JSON.stringify(wrap), nip19.nsecEncode(otherSecret))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.unlocked).toBeNull()
    expect(result.result.unlockError).toContain('does not match')
  })

  it('flags a wrong kind and a broken signature without pretending to unwrap', () => {
    const { wrap } = giftWrapFixture()
    const wrongKind = { ...wrap, kind: 1 }
    const result = inspectNip17GiftWrap(JSON.stringify(wrongKind))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.checks.kind).toBe(false)
    expect(result.result.checks.signature).toBe(false)
    expect(result.result.warnings.join(' ')).toContain('not a NIP-59 gift wrap')
  })

  it('rejects junk JSON', () => {
    expect(inspectNip17GiftWrap('not json')).toEqual({ ok: false, error: 'Paste a complete Nostr event JSON object' })
  })
})
