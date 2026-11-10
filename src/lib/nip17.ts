import {
  getEventHash,
  getPublicKey,
  nip19,
  nip44,
  verifyEvent,
  type Event,
  type UnsignedEvent,
} from 'nostr-tools'

/**
 * NIP-17 / NIP-59 gift-wrap inspector.
 *
 * Public structure is verified first: kind 1059 (or ephemeral 21059), a valid
 * signature, one `p` recipient and a past timestamp. That proves only who
 * published the wrapper — the wrapper key is random.
 *
 * Adding the recipient's nsec lets the same tab unwrap the seal (kind 13) and
 * the unsigned rumor inside. The nsec is used for NIP-44 only and is never
 * returned, stored or put in a result object. A valid seal proves the sender's
 * key, not that the message was delivered or read.
 */

export interface Nip17Checks {
  kind: boolean
  signature: boolean
  oneRecipient: boolean
  pastTimestamp: boolean
}

export interface Nip17UnwrappedChecks {
  sealKind: boolean
  sealSignature: boolean
  sealEmptyTags: boolean
  senderMatches: boolean
  rumorId: boolean
  rumorKind: boolean
  recipientTagged: boolean
}

export interface Nip17Rumor {
  id: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
}

export interface Nip17Unwrapped {
  seal: Event
  rumor: Nip17Rumor
  checks: Nip17UnwrappedChecks
  warnings: string[]
}

export interface Nip17Inspection {
  event: Event
  checks: Nip17Checks
  recipients: string[]
  unlocked: Nip17Unwrapped | null
  unlockError: string | null
  warnings: string[]
}

export type Nip17Result = { ok: true; result: Nip17Inspection } | { ok: false; error: string }

function asEvent(value: unknown): Event | null {
  if (!value || typeof value !== 'object') return null
  const event = value as Partial<Event>
  if (
    typeof event.id !== 'string' ||
    typeof event.pubkey !== 'string' ||
    typeof event.created_at !== 'number' ||
    typeof event.kind !== 'number' ||
    !Array.isArray(event.tags) ||
    typeof event.content !== 'string' ||
    typeof event.sig !== 'string'
  ) {
    return null
  }
  return event as Event
}

function asRumor(value: unknown): Nip17Rumor | null {
  if (!value || typeof value !== 'object') return null
  const rumor = value as Partial<Nip17Rumor>
  if (
    typeof rumor.id !== 'string' ||
    typeof rumor.pubkey !== 'string' ||
    typeof rumor.created_at !== 'number' ||
    typeof rumor.kind !== 'number' ||
    !Array.isArray(rumor.tags) ||
    typeof rumor.content !== 'string'
  ) {
    return null
  }
  return rumor as Nip17Rumor
}

/** Parse an nsec or 32-byte hex secret. Never return it from an inspection. */
export function parseNip17Secret(raw: string): Uint8Array | null {
  const value = raw.trim()
  if (!value) return null
  if (/^[0-9a-f]{64}$/i.test(value)) {
    return Uint8Array.from(value.match(/.{2}/g)?.map(byte => Number.parseInt(byte, 16)) ?? [])
  }
  try {
    const decoded = nip19.decode(value)
    return decoded.type === 'nsec' ? (decoded.data as Uint8Array) : null
  } catch {
    return null
  }
}

function parseJsonObject(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function conversationKey(secret: Uint8Array, pubkey: string): Uint8Array | null {
  try {
    return nip44.v2.utils.getConversationKey(secret, pubkey)
  } catch {
    return null
  }
}

function decryptJson(content: string, secret: Uint8Array, pubkey: string): unknown {
  const key = conversationKey(secret, pubkey)
  if (!key) return null
  try {
    return parseJsonObject(nip44.v2.decrypt(content, key))
  } catch {
    return null
  }
}

export function inspectNip17GiftWrap(raw: string, secretInput?: string): Nip17Result {
  const parsed = parseJsonObject(raw.trim())
  const event = asEvent(parsed)
  if (!event) return { ok: false, error: 'Paste a complete Nostr event JSON object' }

  const recipients = event.tags.filter(tag => tag[0] === 'p' && typeof tag[1] === 'string').map(tag => tag[1])
  const checks: Nip17Checks = {
    kind: event.kind === 1059 || event.kind === 21059,
    signature: (() => {
      try {
        return verifyEvent(event)
      } catch {
        return false
      }
    })(),
    oneRecipient: recipients.length === 1,
    pastTimestamp: event.created_at <= Math.floor(Date.now() / 1000) + 300,
  }

  const warnings: string[] = []
  if (!checks.kind) warnings.push(`Kind ${event.kind} is not a NIP-59 gift wrap (1059 or 21059).`)
  if (!checks.signature) warnings.push('The wrapper event id or signature does not verify.')
  if (!checks.oneRecipient) warnings.push(`Expected one p-tagged recipient, found ${recipients.length}.`)
  if (!checks.pastTimestamp) warnings.push('The wrapper timestamp is in the future; relays may reject it.')

  const secret = secretInput?.trim() ? parseNip17Secret(secretInput) : null
  if (secretInput?.trim() && !secret) {
    return { ok: true, result: { event, checks, recipients, unlocked: null, unlockError: 'Use an nsec or 32-byte hex secret.', warnings } }
  }

  if (!secret) {
    return {
      ok: true,
      result: {
        event,
        checks,
        recipients,
        unlocked: null,
        unlockError: 'Add the recipient nsec to unwrap the seal and rumor.',
        warnings,
      },
    }
  }

  const recipientPubkey = getPublicKey(secret)
  if (!recipients.includes(recipientPubkey)) {
    return {
      ok: true,
      result: {
        event,
        checks,
        recipients,
        unlocked: null,
        unlockError: 'That secret does not match the p-tagged recipient on this wrapper.',
        warnings,
      },
    }
  }

  const sealValue = decryptJson(event.content, secret, event.pubkey)
  const seal = asEvent(sealValue)
  if (!seal) {
    return {
      ok: true,
      result: { event, checks, recipients, unlocked: null, unlockError: 'The gift-wrap content did not decrypt to a seal event.', warnings },
    }
  }

  const sealSignature = (() => {
    try {
      return verifyEvent(seal)
    } catch {
      return false
    }
  })()
  const sealWarnings = [...warnings]
  if (seal.kind !== 13) sealWarnings.push(`The decrypted seal is kind ${seal.kind}, not 13.`)
  if (!sealSignature) sealWarnings.push('The seal signature does not verify.')
  if (seal.tags.length > 0) sealWarnings.push('A NIP-59 seal must not carry tags.')

  const rumorValue = decryptJson(seal.content, secret, seal.pubkey)
  const rumor = asRumor(rumorValue)
  if (!rumor) {
    return {
      ok: true,
      result: {
        event,
        checks,
        recipients,
        unlocked: null,
        unlockError: 'The seal content did not decrypt to a rumor.',
        warnings: sealWarnings,
      },
    }
  }

  let computedId: string | null = null
  try {
    computedId = getEventHash({
      pubkey: rumor.pubkey,
      created_at: rumor.created_at,
      kind: rumor.kind,
      tags: rumor.tags,
      content: rumor.content,
    })
  } catch {
    computedId = null
  }

  const checksUnwrapped: Nip17UnwrappedChecks = {
    sealKind: seal.kind === 13,
    sealSignature,
    sealEmptyTags: seal.tags.length === 0,
    senderMatches: seal.pubkey === rumor.pubkey,
    rumorId: computedId != null && computedId === rumor.id,
    rumorKind: rumor.kind === 14 || rumor.kind === 15 || rumor.kind === 7,
    recipientTagged: rumor.tags.some(tag => tag[0] === 'p' && tag[1] === recipientPubkey),
  }

  if (!checksUnwrapped.senderMatches) sealWarnings.push('The rumor pubkey differs from the seal signer; treat the sender as unproven.')
  if (!checksUnwrapped.rumorId) sealWarnings.push('The rumor id does not match its content.')
  if (!checksUnwrapped.rumorKind) sealWarnings.push(`Rumor kind ${rumor.kind} is not a NIP-17 chat, file or reaction message.`)
  if (!checksUnwrapped.recipientTagged) sealWarnings.push('The rumor does not p-tag this recipient.')

  return {
    ok: true,
    result: {
      event,
      checks,
      recipients,
      unlocked: { seal, rumor, checks: checksUnwrapped, warnings: sealWarnings },
      unlockError: null,
      warnings,
    },
  }
}

/** The unsigned rumor is not a relay event: this is only for display. */
export function nip17RumorTemplate(rumor: Nip17Rumor): UnsignedEvent {
  return {
    pubkey: rumor.pubkey,
    created_at: rumor.created_at,
    kind: rumor.kind,
    tags: rumor.tags,
    content: rumor.content,
  }
}
