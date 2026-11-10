import { SimplePool, nip19 } from 'nostr-tools'
import { MOTOPASS_RELAYS } from './nostr'
import { toStoredTipReceipt, type StoredTipReceipt } from './tipReceiptStore'

/**
 * Read gap-tip receipts back from relays.
 *
 * A receipt is a public kind-30078 event, so another device can find it by
 * author without any key material: no wallet string, no signature request, no
 * secret. Every event is re-verified here — relays are untrusted storage, so a
 * relay that fabricates or edits a receipt is dropped, not displayed.
 */

const HEX64 = /^[a-f0-9]{64}$/i
const RECEIPT_KIND = 30078

export function parseReceiptAuthor(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  if (HEX64.test(value)) return value.toLowerCase()
  if (!value.toLowerCase().startsWith('npub1')) return null
  try {
    const decoded = nip19.decode(value)
    return decoded.type === 'npub' ? decoded.data.toLowerCase() : null
  } catch {
    return null
  }
}

/** Verify, filter to the requested author, de-duplicate, newest first. */
export function selectTipReceipts(events: unknown[], author: string): StoredTipReceipt[] {
  const pubkey = author.trim().toLowerCase()
  const seen = new Set<string>()
  const receipts: StoredTipReceipt[] = []
  for (const event of events) {
    const receipt = toStoredTipReceipt(event)
    if (!receipt || receipt.pubkey !== pubkey || seen.has(receipt.id)) continue
    seen.add(receipt.id)
    receipts.push(receipt)
  }
  return receipts.sort((a, b) => b.created_at - a.created_at)
}

export type FetchReceiptsResult =
  | { ok: true; receipts: StoredTipReceipt[] }
  | { ok: false; error: string }

export async function fetchTipReceipts(
  authorInput: string,
  opts: { relays?: string[]; timeoutMs?: number } = {},
): Promise<FetchReceiptsResult> {
  const author = parseReceiptAuthor(authorInput)
  if (!author) return { ok: false, error: 'Enter your npub or a 64-character public key' }

  const relays = opts.relays ?? MOTOPASS_RELAYS
  const timeoutMs = opts.timeoutMs ?? 12_000
  const pool = new SimplePool()
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Relays did not answer in time')), timeoutMs)
    })
    const events = await Promise.race([
      pool.querySync(relays, { kinds: [RECEIPT_KIND], authors: [author], '#t': ['gap-tip'] }),
      timeout,
    ])
    return { ok: true, receipts: selectTipReceipts(events, author) }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Relay lookup failed' }
  } finally {
    if (timer) clearTimeout(timer)
    try {
      pool.close(relays)
    } catch {
      /* already closed */
    }
  }
}
