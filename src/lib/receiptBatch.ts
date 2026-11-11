import {
  parseReceiptShareHash,
  parseVerificationReceipt,
  verificationReceiptDigest,
  type VerificationReceipt,
} from './verificationReceipt'

export type ReceiptBatchStatus = 'verified' | 'edited' | 'error'

export interface ReceiptBatchRow {
  index: number
  title: string
  tool: string
  status: ReceiptBatchStatus
  digest: string | null
  hashMatches: boolean | null
  note: string
  receipt?: VerificationReceipt
}

export interface ReceiptBatchResult {
  rows: ReceiptBatchRow[]
  verified: number
  edited: number
  errors: number
}

const MAX_BATCH_ITEMS = 100

function errorRow(index: number, note: string): ReceiptBatchRow {
  return { index, title: `Item ${index + 1}`, tool: 'unknown', status: 'error', digest: null, hashMatches: null, note }
}

function parseOne(item: unknown, index: number): ReceiptBatchRow {
  if (typeof item === 'string') {
    const hash = item.includes('#') ? item.slice(item.indexOf('#')) : item
    if (!hash.includes('r=')) return errorRow(index, 'Link has no receipt fragment (r=…).')
    const parsed = parseReceiptShareHash(hash)
    if (!parsed.ok) return errorRow(index, parsed.error)
    return {
      index,
      title: parsed.receipt.title,
      tool: parsed.receipt.tool,
      status: parsed.hashMatches ? 'verified' : 'edited',
      digest: parsed.digest,
      hashMatches: parsed.hashMatches,
      note: parsed.hashMatches ? 'Digest matches the link payload.' : 'Digest does not match the link payload. Treat it as edited.',
      receipt: parsed.receipt,
    }
  }

  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>
    if (typeof record.url === 'string') return parseOne(record.url, index)
    if (typeof record.link === 'string') return parseOne(record.link, index)
    const parsed = parseVerificationReceipt(record)
    if (!parsed.ok) return errorRow(index, parsed.error)
    return {
      index,
      title: parsed.receipt.title,
      tool: parsed.receipt.tool,
      status: 'verified',
      digest: verificationReceiptDigest(parsed.receipt),
      hashMatches: null,
      note: 'Receipt JSON is valid. No link digest was supplied, so compare it out of band.',
      receipt: parsed.receipt,
    }
  }

  return errorRow(index, 'Expected a receipt object or a /tools/receipt link.')
}

/** Parse an array (or `{ receipts: [...] }`) locally; no value is fetched or uploaded. */
export function parseReceiptBatch(raw: string): ReceiptBatchResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { rows: [errorRow(0, 'Batch is not valid JSON.')], verified: 0, edited: 0, errors: 1 }
  }
  const items =
    Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { receipts?: unknown }).receipts)
        ? (parsed as { receipts: unknown[] }).receipts
        : null
  if (!items) {
    return { rows: [errorRow(0, 'Batch must be a JSON array or an object with a receipts array.')], verified: 0, edited: 0, errors: 1 }
  }
  if (items.length > MAX_BATCH_ITEMS) {
    return { rows: [errorRow(0, `Batch is limited to ${MAX_BATCH_ITEMS} receipts.`)], verified: 0, edited: 0, errors: 1 }
  }
  const rows = items.map(parseOne)
  return {
    rows,
    verified: rows.filter(row => row.status === 'verified').length,
    edited: rows.filter(row => row.status === 'edited').length,
    errors: rows.filter(row => row.status === 'error').length,
  }
}

export function serializeReceiptBatch(result: ReceiptBatchResult): string {
  return JSON.stringify(
    {
      app: 'MotoPass',
      kind: 'verification-receipt-batch',
      checkedAt: new Date().toISOString(),
      verified: result.verified,
      edited: result.edited,
      errors: result.errors,
      rows: result.rows.map(row => ({
        index: row.index,
        title: row.title,
        tool: row.tool,
        status: row.status,
        digest: row.digest,
        hashMatches: row.hashMatches,
        note: row.note,
      })),
    },
    null,
    2,
  )
}
