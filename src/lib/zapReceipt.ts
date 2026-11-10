import { getEventHash, verifyEvent, type Event } from 'nostr-tools'
import { decodeBolt11, type Bolt11Invoice } from './bolt11'
import { checkPreimage } from './preimage'

/**
 * NIP-57 zap receipt reader.
 *
 * A kind 9735 event is published by the recipient's node. This verifies the
 * event signature, the embedded zap request signature, the BOLT11 invoice and
 * the local relationships between them. It does not prove the invoice was
 * paid: only a valid preimage does that, and the preimage is optional.
 */

export interface ZapReceiptChecks {
  receiptSignature: boolean
  zapRequestSignature: boolean | null
  invoiceDecoded: boolean
  preimage: 'match' | 'mismatch' | 'unreadable' | null
  amountMatches: boolean | null
  recipientMatches: boolean | null
  eventMatches: boolean | null
}

export interface ZapReceiptDetails {
  recipient: string | null
  eventId: string | null
  sender: string | null
  createdAt: number
  receiptId: string | null
  invoice: string | null
  invoiceDetails: Bolt11Invoice | null
  preimage: string | null
  requestAmountMsat: number | null
  invoiceAmountMsat: number | null
  description: string | null
}

export type ZapReceiptResult =
  | { ok: true; details: ZapReceiptDetails; checks: ZapReceiptChecks; warnings: string[] }
  | { ok: false; error: string }

function asEvent(value: unknown): Event | null {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  if (
    typeof obj.kind !== 'number' ||
    typeof obj.created_at !== 'number' ||
    typeof obj.content !== 'string' ||
    typeof obj.pubkey !== 'string' ||
    typeof obj.sig !== 'string' ||
    !Array.isArray(obj.tags)
  ) {
    return null
  }
  if (!obj.tags.every(tag => Array.isArray(tag) && tag.every(part => typeof part === 'string'))) return null
  return obj as unknown as Event
}

function verify(candidate: Event): boolean {
  try {
    return candidate.id != null && candidate.id === getEventHash(candidate) && verifyEvent(candidate)
  } catch {
    return false
  }
}

function tag(tags: string[][], name: string): string | null {
  const found = tags.find(entry => entry[0] === name)
  return found && found[1] ? found[1] : null
}

function tags(tags: string[][], name: string): string[] {
  return tags.filter(entry => entry[0] === name).map(entry => entry[1]).filter(Boolean)
}

function amountFromRequest(request: Event | null): number | null {
  if (!request) return null
  const value = tag(request.tags, 'amount')
  return value && /^\d+$/.test(value) ? Number(value) : null
}

export async function verifyZapReceipt(raw: string): Promise<ZapReceiptResult> {
  const text = raw.trim()
  if (!text) return { ok: false, error: 'Paste a zap receipt event first' }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That is not valid JSON' }
  }

  const receipt = asEvent(parsed)
  if (!receipt) return { ok: false, error: 'Not a nostr event — expected kind, pubkey, tags, content and sig' }
  if (receipt.kind !== 9735) return { ok: false, error: `Expected a kind 9735 zap receipt, got kind ${receipt.kind}` }

  const warnings: string[] = []
  const receiptSignature = verify(receipt)
  if (!receiptSignature) warnings.push('The receipt event signature or id does not verify.')

  const invoice = tag(receipt.tags, 'bolt11')
  const preimage = tag(receipt.tags, 'preimage')
  const description = tag(receipt.tags, 'description')
  const recipient = tag(receipt.tags, 'p')
  const eventId = tag(receipt.tags, 'e')

  let request: Event | null = null
  let zapRequestSignature: boolean | null = null
  if (description) {
    try {
      request = asEvent(JSON.parse(description))
      if (!request) warnings.push('The description is not a readable zap request event.')
      else {
        if (request.kind !== 9731) warnings.push(`The embedded request is kind ${request.kind}, not 9731.`)
        zapRequestSignature = verify(request)
        if (!zapRequestSignature) warnings.push('The zap request signature or id does not verify.')
      }
    } catch {
      warnings.push('The description is not valid zap request JSON.')
    }
  } else {
    warnings.push('No description tag, so there is no zap request to check.')
  }

  let invoiceDetails: Bolt11Invoice | null = null
  if (invoice) {
    const decoded = decodeBolt11(invoice)
    if (decoded.ok) invoiceDetails = decoded.invoice
    else warnings.push(`The bolt11 tag is not a valid invoice: ${decoded.error}`)
  } else {
    warnings.push('No bolt11 tag on this receipt.')
  }

  const requestAmount = amountFromRequest(request)
  const invoiceAmount = invoiceDetails?.amountMsat ?? null
  const amountMatches = requestAmount != null && invoiceAmount != null ? requestAmount === invoiceAmount : null
  if (amountMatches === false) warnings.push('The zap request amount differs from the invoice amount.')

  const requestRecipient = request ? tags(request.tags, 'p')[0] ?? null : null
  const recipientMatches = requestRecipient && recipient ? requestRecipient === recipient : null
  if (recipientMatches === false) warnings.push('The zap request p tag differs from the receipt p tag.')

  const requestEvent = request ? tags(request.tags, 'e')[0] ?? null : null
  const eventMatches = requestEvent && eventId ? requestEvent === eventId : null
  if (eventMatches === false) warnings.push('The zap request e tag differs from the receipt e tag.')

  let preimageCheck: ZapReceiptChecks['preimage'] = null
  if (preimage && invoiceDetails?.paymentHash) {
    preimageCheck = await checkPreimage(preimage, invoiceDetails.paymentHash)
    if (preimageCheck === 'mismatch') warnings.push('The preimage does not hash to the invoice payment hash.')
  }

  return {
    ok: true,
    details: {
      recipient,
      eventId,
      sender: request?.pubkey ?? null,
      createdAt: receipt.created_at,
      receiptId: receipt.id ?? null,
      invoice,
      invoiceDetails,
      preimage,
      requestAmountMsat: requestAmount,
      invoiceAmountMsat: invoiceAmount,
      description,
    },
    checks: {
      receiptSignature,
      zapRequestSignature,
      invoiceDecoded: invoiceDetails != null,
      preimage: preimageCheck,
      amountMatches,
      recipientMatches,
      eventMatches,
    },
    warnings,
  }
}
