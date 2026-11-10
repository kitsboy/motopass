import {
  buildVerificationReceipt,
  type VerificationReceipt,
  type VerificationReceiptInput,
  type VerificationReceiptState,
} from './verificationReceipt'

/**
 * Local verification history.
 *
 * Result metadata only: the same public fields shown on screen and written to a
 * receipt. Raw inputs and private keys are never stored here. A full or blocked
 * storage area must not break a verification, so every write is best-effort.
 */

const STORAGE_KEY = 'motopass-verification-history'
const MAX_ENTRIES = 12

export const VERIFICATION_HISTORY_EVENT = 'motopass:verification-history'

export interface VerificationHistoryEntry extends VerificationReceipt {
  id: string
}

export interface VerificationHistoryStatus {
  pass: number
  fail: number
  unknown: number
  tone: VerificationReceiptState
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

function stableValue(value: unknown): string {
  if (value == null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableValue(record[key])}`)
    .join(',')}}`
}

/** Stable identity for the same check; the timestamp is deliberately excluded. */
export function verificationFingerprint(input: VerificationReceiptInput): string {
  const payload = stableValue({
    tool: input.tool,
    title: input.title,
    steps: input.steps,
    limits: input.limits,
    fields: input.fields ?? {},
  })
  let hash = 2166136261
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `v1-${(hash >>> 0).toString(16)}`
}

function isEntry(value: unknown): value is VerificationHistoryEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<VerificationHistoryEntry>
  return (
    entry.version === 1 &&
    entry.app === 'MotoPass' &&
    typeof entry.id === 'string' &&
    typeof entry.tool === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.generatedAt === 'string' &&
    Array.isArray(entry.steps) &&
    entry.steps.every(
      step =>
        step &&
        typeof step.label === 'string' &&
        (step.state === 'pass' || step.state === 'fail' || step.state === 'unknown'),
    ) &&
    Array.isArray(entry.limits) &&
    entry.limits.every(limit => typeof limit === 'string') &&
    (entry.fields == null || typeof entry.fields === 'object')
  )
}

export function loadVerificationHistory(): VerificationHistoryEntry[] {
  const store = storage()
  if (!store) return []
  try {
    const parsed: unknown = JSON.parse(store.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isEntry).slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

function announce(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(VERIFICATION_HISTORY_EVENT))
  } catch {
    // A browser without CustomEvent still has a usable persisted history.
  }
}

/**
 * Record a check and move an identical check back to the top. Identical means
 * same tool, trail, limits and generated fields; a rerun only refreshes time.
 */
export function recordVerification(
  input: VerificationReceiptInput,
  now: Date = new Date(),
): VerificationHistoryEntry {
  const receipt = buildVerificationReceipt(input, now)
  const entry: VerificationHistoryEntry = { ...receipt, id: verificationFingerprint(input) }
  const store = storage()
  if (store) {
    try {
      const next = [entry, ...loadVerificationHistory().filter(item => item.id !== entry.id)].slice(
        0,
        MAX_ENTRIES,
      )
      store.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Quota or privacy mode: show the result, just do not persist this one.
    }
  }
  announce()
  return entry
}

export function clearVerificationHistory(): void {
  const store = storage()
  if (store) {
    try {
      store.removeItem(STORAGE_KEY)
    } catch {
      // Best-effort only.
    }
  }
  announce()
}

export function verificationHistoryStatus(entry: VerificationHistoryEntry): VerificationHistoryStatus {
  const pass = entry.steps.filter(step => step.state === 'pass').length
  const fail = entry.steps.filter(step => step.state === 'fail').length
  const unknown = entry.steps.filter(step => step.state === 'unknown').length
  return { pass, fail, unknown, tone: fail > 0 ? 'fail' : unknown > 0 ? 'unknown' : 'pass' }
}

/** The card that can display this tool's result again. */
export function verificationAnchor(tool: string): string {
  if (tool === 'psbt') return 'address-psbt'
  if (tool === 'bolt12-response') return 'bolt12-request'
  return tool
}
