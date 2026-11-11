import {
  pollStamp,
  satohashProofVerifyUrl,
  satohashStampGuideUrl,
  satohashVerifyUrl,
  stampHash,
} from './satohash'

export type ReceiptAnchorStatus = 'pending' | 'confirmed' | 'error'

export interface ReceiptAnchorResult {
  status: ReceiptAnchorStatus
  stampId: string | null
  blockHeight: number | null
  verifyUrl: string
  guideUrl: string
  note: string
}

/** Pure status mapping so the UI never invents a confirmation. */
export function receiptAnchorStatus(apiStatus?: string, blockHeight?: number | null): ReceiptAnchorStatus {
  if (blockHeight != null) return 'confirmed'
  const status = (apiStatus ?? '').toLowerCase()
  if (['confirmed', 'anchored', 'complete', 'completed'].includes(status)) return 'confirmed'
  if (['failed', 'error', 'rejected'].includes(status)) return 'error'
  return 'pending'
}

/**
 * Submit one receipt digest to Satohash for OpenTimestamps anchoring.
 *
 * Only the 64-character SHA-256 leaves the device. A pending/confirmed anchor
 * says the digest existed by a Bitcoin block; it does not prove the receipt's
 * claims, a payment, or that the link was not edited before it was anchored.
 */
export async function anchorReceiptDigest(digestInput: string): Promise<ReceiptAnchorResult> {
  const digest = digestInput.trim().toLowerCase()
  const guideUrl = satohashStampGuideUrl(digest)
  if (!/^[a-f0-9]{64}$/.test(digest)) {
    return {
      status: 'error',
      stampId: null,
      blockHeight: null,
      verifyUrl: '',
      guideUrl: '',
      note: 'A receipt digest must be 64 lowercase hex characters.',
    }
  }

  const submitted = await stampHash(digest, { filename: 'motopass-verification-receipt' })
  if (!submitted.ok || !submitted.id) {
    return {
      status: 'error',
      stampId: null,
      blockHeight: null,
      verifyUrl: satohashVerifyUrl(digest),
      guideUrl,
      note: submitted.error ?? 'Satohash could not accept the digest. Use the stamp guide link instead.',
    }
  }

  const polled = await pollStamp(submitted.id, { attempts: 2, intervalMs: 1000 })
  const status = receiptAnchorStatus(polled.ok ? polled.status : submitted.status, polled.ok ? polled.bitcoin_block_height : null)
  return {
    status,
    stampId: submitted.id,
    blockHeight: polled.ok ? polled.bitcoin_block_height ?? null : null,
    verifyUrl: satohashProofVerifyUrl(submitted.id) || satohashVerifyUrl(digest),
    guideUrl,
    note:
      status === 'confirmed'
        ? 'The digest is anchored in a Bitcoin block. This proves the digest existed, not that the receipt is true or a payment happened.'
        : status === 'error'
          ? 'The anchor could not be confirmed. The digest may still be pending; check the Satohash proof later.'
          : 'The digest was submitted and is waiting for a Bitcoin anchor. This is not a confirmation yet.',
  }
}
