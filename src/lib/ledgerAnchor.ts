import { pollStamp, satohashProofVerifyUrl, satohashVerifyUrl, sha256Hex, stampHash } from './satohash'

/**
 * Anchor a whole signed ledger to Bitcoin with one OpenTimestamps commitment.
 *
 * A stamp commits one SHA-256 hash. Stamping every audit row separately would
 * be hundreds of calendar submissions for no extra proof, so the ledger is
 * committed as a set: the digest of its sorted, de-duplicated event ids. The
 * stamp proves that this exact set of ids existed at or before a block — it
 * does not prove each id is true, and the UI says so.
 *
 * Only signed events have ids. An unsigned template cannot be anchored, and
 * nothing here invents one.
 */

const HEX64 = /^[a-f0-9]{64}$/i

/** Canonical commitment input: sorted, unique, malformed ids dropped. */
export function ledgerRootInput(ids: string[]): string | null {
  const clean = Array.from(
    new Set(
      (ids ?? [])
        .map(id => id.trim().toLowerCase())
        .filter(id => HEX64.test(id)),
    ),
  ).sort()
  return clean.length > 0 ? clean.join('\n') : null
}

/** SHA-256 over the canonical set, or null when there is nothing signable. */
export async function ledgerRoot(ids: string[]): Promise<string | null> {
  const input = ledgerRootInput(ids)
  if (!input) return null
  return sha256Hex(input)
}

export interface LedgerAnchorResult {
  ok: boolean
  root?: string
  stampId?: string
  blockHeight: number | null
  status: string | null
  verifyUrl: string | null
  error?: string
}

/** One honest line — a block height is proof; "pending" is not. */
export function anchorStatusLabel(blockHeight: number | null, status: string | null): string {
  if (blockHeight != null) return `Bitcoin block ${blockHeight}`
  const s = (status ?? '').toLowerCase()
  if (s === 'confirmed' || s === 'anchored' || s === 'complete' || s === 'completed') {
    return 'confirmed — block height not reported'
  }
  if (s === 'failed' || s === 'error' || s === 'rejected') return 'stamp failed'
  return 'pending — waiting for Bitcoin'
}

/**
 * Submit the ledger root to Satohash and poll briefly for a block height.
 * Never throws. `ok` means the stamp was accepted, not that a block exists:
 * check `blockHeight` before calling anything anchored.
 */
export async function anchorLedger(
  ids: string[],
  opts: { attempts?: number; intervalMs?: number } = {},
): Promise<LedgerAnchorResult> {
  const root = await ledgerRoot(ids)
  if (!root) return { ok: false, blockHeight: null, status: null, verifyUrl: null, error: 'No signed events to anchor' }

  const submitted = await stampHash(root, { filename: 'motopass-audit-ledger' })
  if (!submitted.ok) {
    return { ok: false, root, blockHeight: null, status: null, verifyUrl: null, error: submitted.error ?? 'Stamp failed' }
  }

  let blockHeight: number | null = null
  let status: string | null = submitted.status ?? null
  if (submitted.id) {
    const proof = await pollStamp(submitted.id, {
      attempts: opts.attempts ?? 3,
      intervalMs: opts.intervalMs ?? 1500,
    })
    if (proof.ok) {
      blockHeight = proof.bitcoin_block_height ?? null
      status = proof.status ?? status
    }
  }

  return {
    ok: true,
    root,
    stampId: submitted.id,
    blockHeight,
    status,
    verifyUrl:
      (submitted.id ? satohashProofVerifyUrl(submitted.id) : '') || satohashVerifyUrl(root) || null,
  }
}
