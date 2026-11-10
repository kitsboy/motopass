import { toStoredTipReceipt, type StoredTipReceipt } from './tipReceiptStore'

/**
 * Read a pasted gap-tip receipt and say what it actually proves.
 *
 * The only checks are local ones: the event id matches its fields, the
 * signature verifies, and the tags are readable. It does not prove the invoice
 * was for a gap tip — that is what the memo carries and what nobody can check
 * offline.
 */

export interface ReceiptDetails {
  program: string | null
  field: string | null
  country: string | null
  sats: number | null
  paymentHash: string | null
  preimage: string | null
  settledAt: number | null
  invoice: string | null
}

export type InspectResult =
  | { ok: true; receipt: StoredTipReceipt; details: ReceiptDetails }
  | { ok: false; error: string }

function tagValue(tags: string[][], name: string): string | null {
  const found = tags.find(tag => tag[0] === name)
  return found && typeof found[1] === 'string' ? found[1] : null
}

function contentField(content: string, key: string): string | null {
  try {
    const parsed: unknown = JSON.parse(content)
    if (!parsed || typeof parsed !== 'object') return null
    const value = (parsed as Record<string, unknown>)[key]
    return typeof value === 'string' && value.trim() ? value.trim() : null
  } catch {
    return null
  }
}

export function inspectTipReceiptJson(raw: string): InspectResult {
  const text = raw.trim()
  if (!text) return { ok: false, error: 'Paste a receipt event first' }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That is not valid JSON' }
  }

  const receipt = toStoredTipReceipt(parsed)
  if (!receipt) {
    return {
      ok: false,
      error: 'Not a signed gap-tip receipt — the kind, the fields or the signature did not verify',
    }
  }

  const amount = tagValue(receipt.tags, 'amount')
  const settledAt = tagValue(receipt.tags, 'settled_at')
  return {
    ok: true,
    receipt,
    details: {
      program: receipt.program,
      field: receipt.field,
      country: tagValue(receipt.tags, 'country'),
      sats: amount && /^\d+$/.test(amount) ? Number(amount) : null,
      paymentHash: receipt.paymentHash,
      preimage: tagValue(receipt.tags, 'preimage'),
      settledAt: settledAt && /^\d+$/.test(settledAt) ? Number(settledAt) : null,
      invoice: contentField(receipt.content, 'invoice'),
    },
  }
}
