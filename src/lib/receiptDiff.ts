import type { VerificationReceipt } from './verificationReceipt'

export type ReceiptDiffState = 'changed' | 'added' | 'removed'

export interface ReceiptDiffRow {
  path: string
  before: string
  after: string
  state: ReceiptDiffState
}

function valueText(value: string | number | boolean | null | undefined): string {
  if (value == null) return '—'
  return typeof value === 'string' ? value : String(value)
}

function flatten(receipt: VerificationReceipt): Map<string, string> {
  const rows = new Map<string, string>()
  rows.set('tool', receipt.tool)
  rows.set('title', receipt.title)
  rows.set('generatedAt', receipt.generatedAt)
  receipt.steps.forEach((step, index) => {
    rows.set(`steps[${index}].label`, step.label)
    rows.set(`steps[${index}].state`, step.state)
    if (step.detail != null) rows.set(`steps[${index}].detail`, step.detail)
  })
  receipt.limits.forEach((limit, index) => rows.set(`limits[${index}]`, limit))
  for (const [key, value] of Object.entries(receipt.fields ?? {})) {
    rows.set(`fields.${key}`, valueText(value))
  }
  return rows
}

/**
 * A digest proves that a receipt changed, not which field changed. A field-level
 * diff needs a second copy supplied out of band. This compares two validated
 * receipts and never claims the reference copy is authentic by itself.
 */
export function diffVerificationReceipts(
  original: VerificationReceipt,
  candidate: VerificationReceipt,
): ReceiptDiffRow[] {
  const before = flatten(original)
  const after = flatten(candidate)
  const paths = Array.from(new Set([...before.keys(), ...after.keys()])).sort()
  const rows: ReceiptDiffRow[] = []
  for (const path of paths) {
    const oldValue = before.get(path)
    const newValue = after.get(path)
    if (oldValue === newValue) continue
    rows.push({
      path,
      before: oldValue ?? '—',
      after: newValue ?? '—',
      state: oldValue == null ? 'added' : newValue == null ? 'removed' : 'changed',
    })
  }
  return rows
}

export function groupDigestFingerprint(digest: string): string {
  const normalized = digest.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(normalized)) return digest
  return normalized.match(/.{1,4}/g)?.join(' ') ?? normalized
}
