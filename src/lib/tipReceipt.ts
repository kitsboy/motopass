import { getEventHash, verifyEvent, type Event } from 'nostr-tools'
import { hasNostrExtension } from './nostr'
import { publishEvent, relayStatusSummary, type PublishResult } from './nostrRelay'
import { signedEventMatchesTemplate } from './timestampSecurity'
import type { LedgerSigner } from './nostrLedger'

/**
 * A settlement receipt for a gap tip.
 *
 * This is not a NIP-57 zap receipt: a zap receipt is issued by the receiving
 * lightning node with its own key. MotoPass is not that node, so claiming one
 * would be a lie. Instead the *payer* signs a kind-30078 record naming the
 * invoice, amount, payment hash, and (when their wallet reports it) the
 * preimage and settlement time. That proves who is recording the payment and
 * lets anyone re-check the preimage against the hash — it does not prove the
 * invoice was for research, which the memo and the row link carry.
 */

const HEX64 = /^[a-f0-9]{64}$/i

export interface TipReceiptInput {
  program: string
  countryCode?: string
  factKey: string
  sats: number
  paymentHash: string
  preimage?: string | null
  invoice?: string | null
  /** Unix seconds reported by the payer's wallet, when it reports one. */
  settledAt?: number | null
  /** Fixed creation time for tests; defaults to now. */
  createdAt?: number
}

export type TipReceiptEvent = {
  kind: 30078
  created_at: number
  tags: string[][]
  content: string
}

export type TipReceiptBuild = { ok: true; event: TipReceiptEvent } | { ok: false; error: string }

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function buildTipReceipt(input: TipReceiptInput): TipReceiptBuild {
  const sats = input.sats
  const paymentHash = input.paymentHash.trim().toLowerCase()
  const factKey = input.factKey.trim()
  const program = input.program.trim()
  if (!program) return { ok: false, error: 'Program is required' }
  if (!factKey) return { ok: false, error: 'Fact is required' }
  if (!Number.isInteger(sats) || sats <= 0) return { ok: false, error: 'Amount must be whole sats' }
  if (!HEX64.test(paymentHash)) return { ok: false, error: 'Payment hash must be 64 hex characters' }
  const preimage = input.preimage?.trim().toLowerCase() ?? ''
  if (preimage && !HEX64.test(preimage)) return { ok: false, error: 'Preimage must be 64 hex characters' }
  const settledAt =
    typeof input.settledAt === 'number' && Number.isFinite(input.settledAt) && input.settledAt > 0
      ? Math.floor(input.settledAt)
      : null
  const createdAt = input.createdAt ?? settledAt ?? Math.floor(Date.now() / 1000)

  const tags: string[][] = [
    ['d', `motopass-tip-${slug(program)}-${slug(factKey)}-${paymentHash.slice(0, 12)}`],
    ['t', 'motopass'],
    ['t', 'gap-tip'],
    ['program', program],
    ['field', factKey],
    ['amount', String(sats)],
    ['payment_hash', paymentHash],
  ]
  const code = input.countryCode?.trim()
  if (code) tags.push(['country', code.slice(0, 8)])
  if (preimage) tags.push(['preimage', preimage])
  if (settledAt != null) tags.push(['settled_at', String(settledAt)])

  return {
    ok: true,
    event: {
      kind: 30078,
      created_at: createdAt,
      tags,
      content: JSON.stringify({
        platform: 'MotoPass',
        kind: 'gap-tip-receipt',
        program,
        country_code: code ?? null,
        field: factKey,
        sats,
        payment_hash: paymentHash,
        preimage: preimage || null,
        settled_at: settledAt,
        invoice: input.invoice?.trim() || null,
        settlement_source: 'nip47-lookup-invoice',
      }),
    },
  }
}

export type ReceiptPublishStatus = 'published' | 'signed-unpublished' | 'unsigned' | 'rejected'

export interface ReceiptPublishResult {
  status: ReceiptPublishStatus
  event: TipReceiptEvent
  json: string
  relaySummary?: string
  error?: string
}

/**
 * Sign the receipt with the payer's key and publish it. Never throws.
 * Without a signer, the exact JSON is returned — no "published" state.
 */
export async function publishTipReceipt(
  event: TipReceiptEvent,
  opts: { signer?: LedgerSigner } = {},
): Promise<ReceiptPublishResult> {
  const signer =
    opts.signer ??
    (hasNostrExtension() && window.nostr?.signEvent ? (template: unknown) => window.nostr!.signEvent(template) : null)
  if (!signer) {
    return { status: 'unsigned', event, json: JSON.stringify(event, null, 2) }
  }

  try {
    const signed = await signer(event)
    const candidate = signed as {
      id?: unknown
      pubkey?: unknown
      sig?: unknown
      kind?: unknown
      created_at?: unknown
      tags?: unknown
      content?: unknown
    }
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      typeof candidate.id !== 'string' ||
      typeof candidate.pubkey !== 'string' ||
      typeof candidate.sig !== 'string'
    ) {
      return { status: 'rejected', event, json: JSON.stringify(event, null, 2), error: 'The signer did not return a signed event' }
    }
    if (!signedEventMatchesTemplate(signed as { kind: number; created_at: number; tags: unknown; content: string }, event)) {
      return { status: 'rejected', event, json: JSON.stringify(event, null, 2), error: 'Signer changed the receipt — publish aborted' }
    }
    if (candidate.id !== getEventHash(signed as unknown as Event) || !verifyEvent(signed as unknown as Event)) {
      return { status: 'rejected', event, json: JSON.stringify(event, null, 2), error: 'Signature failed verification' }
    }

    const results: PublishResult[] = await publishEvent(signed as unknown as Event)
    const accepted = results.filter(result => result.ok).length
    return {
      status: accepted > 0 ? 'published' : 'signed-unpublished',
      event,
      json: JSON.stringify(signed, null, 2),
      relaySummary: relayStatusSummary(results),
      error: accepted > 0 ? undefined : 'Signed locally — no relay accepted. Keep the JSON.',
    }
  } catch (err) {
    return {
      status: 'rejected',
      event,
      json: JSON.stringify(event, null, 2),
      error: err instanceof Error ? err.message : 'Signing failed',
    }
  }
}

/** Only a wallet-reported `paid` state may produce a receipt. */
export function canIssueReceipt(state: string): boolean {
  return state === 'paid'
}

/** Short, honest label for a receipt digest: preimage tail is the useful bit. */
export function receiptEvidenceLine(paymentHash: string, preimage: string | null): string {
  return preimage
    ? `preimage ${preimage.slice(0, 8)}… proves sha256(preimage) = ${paymentHash.slice(0, 8)}…`
    : `payment hash ${paymentHash.slice(0, 8)}… (no preimage reported by the wallet)`
}
