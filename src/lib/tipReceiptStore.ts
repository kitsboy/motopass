import { verifyEvent, type Event } from 'nostr-tools'
import type { ReceiptPublishResult } from './tipReceipt'

/**
 * Signed gap-tip receipts, kept on this device.
 *
 * A receipt is a public Nostr event: id, pubkey, signature, tags and content.
 * Nothing secret is stored, and no invoice or wallet connection string is
 * written here. The signature is re-verified on load, so a hand-edited entry
 * stops counting as a receipt instead of being displayed as one.
 */

export const TIP_RECEIPT_KEY = 'motopass-tip-receipts'
const MAX_RECEIPTS = 20
const HEX64 = /^[a-f0-9]{64}$/i

export interface StoredTipReceipt {
  id: string
  pubkey: string
  sig: string
  kind: 30078
  created_at: number
  tags: string[][]
  content: string
  /** Cached from the `payment_hash` tag so matching never re-parses. */
  paymentHash: string | null
  program: string | null
  field: string | null
  sats: number | null
}

export interface ReceiptStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function defaultStorage(): ReceiptStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

function tagValue(tags: string[][], name: string): string | null {
  const found = tags.find(tag => tag[0] === name)
  return found && typeof found[1] === 'string' ? found[1] : null
}

/** Shape check plus a real signature check; anything else is not a receipt. */
export function toStoredTipReceipt(value: unknown): StoredTipReceipt | null {
  if (!value || typeof value !== 'object') return null
  const event = value as Partial<Event>
  if (event.kind !== 30078) return null
  if (typeof event.id !== 'string' || !HEX64.test(event.id)) return null
  if (typeof event.pubkey !== 'string' || !HEX64.test(event.pubkey)) return null
  if (typeof event.sig !== 'string' || event.sig.length !== 128) return null
  if (typeof event.content !== 'string') return null
  if (typeof event.created_at !== 'number' || !Number.isFinite(event.created_at)) return null
  if (
    !Array.isArray(event.tags) ||
    !event.tags.every(tag => Array.isArray(tag) && tag.every(part => typeof part === 'string'))
  ) {
    return null
  }
  const candidate = event as Event
  if (!verifyEvent(candidate)) return null

  const tags = candidate.tags
  const paymentHash = tagValue(tags, 'payment_hash')
  const sats = tagValue(tags, 'amount')
  return {
    id: candidate.id,
    pubkey: candidate.pubkey,
    sig: candidate.sig,
    kind: 30078,
    created_at: candidate.created_at,
    tags,
    content: candidate.content,
    paymentHash: paymentHash && HEX64.test(paymentHash) ? paymentHash.toLowerCase() : null,
    program: tagValue(tags, 'program'),
    field: tagValue(tags, 'field'),
    sats: sats && /^\d+$/.test(sats) ? Number(sats) : null,
  }
}

/** Newest first, de-duplicated by event id, capped. Corrupt entries are dropped. */
export function loadTipReceipts(storage: ReceiptStorage | null = defaultStorage()): StoredTipReceipt[] {
  if (!storage) return []
  let raw: string | null
  try {
    raw = storage.getItem(TIP_RECEIPT_KEY)
  } catch {
    return []
  }
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const seen = new Set<string>()
  const receipts: StoredTipReceipt[] = []
  for (const value of parsed) {
    const receipt = toStoredTipReceipt(value)
    if (!receipt || seen.has(receipt.id)) continue
    seen.add(receipt.id)
    receipts.push(receipt)
    if (receipts.length >= MAX_RECEIPTS) break
  }
  return receipts
}

/**
 * Save a receipt that was actually signed. `unsigned` and `rejected` results
 * are refused: an unsigned template is not a receipt, and storing it would let
 * the ledger claim a payment the payer never signed for.
 */
export function saveTipReceipt(
  result: ReceiptPublishResult,
  storage: ReceiptStorage | null = defaultStorage(),
): { ok: true; receipts: StoredTipReceipt[] } | { ok: false; error: string } {
  if (result.status !== 'published' && result.status !== 'signed-unpublished') {
    return { ok: false, error: 'Only a signed receipt can be saved on this device' }
  }
  if (!storage) return { ok: false, error: 'This browser does not allow local storage' }

  let parsed: unknown
  try {
    parsed = JSON.parse(result.json)
  } catch {
    return { ok: false, error: 'The signed receipt could not be read' }
  }
  const receipt = toStoredTipReceipt(parsed)
  if (!receipt) return { ok: false, error: 'The signed receipt did not verify' }

  const existing = loadTipReceipts(storage)
  const receipts = [receipt, ...existing.filter(item => item.id !== receipt.id)].slice(0, MAX_RECEIPTS)
  try {
    storage.setItem(TIP_RECEIPT_KEY, JSON.stringify(receipts))
  } catch {
    return { ok: false, error: 'This browser refused to store the receipt' }
  }
  return { ok: true, receipts }
}

/** Payment hashes a wallet row can be matched against. */
export function storedReceiptHashes(receipts: StoredTipReceipt[]): string[] {
  return [
    ...new Set(
      receipts
        .map(receipt => receipt.paymentHash)
        .filter((hash): hash is string => typeof hash === 'string' && HEX64.test(hash)),
    ),
  ]
}

export function clearTipReceipts(storage: ReceiptStorage | null = defaultStorage()): void {
  if (!storage) return
  try {
    storage.removeItem(TIP_RECEIPT_KEY)
  } catch {
    /* nothing to clear */
  }
}
