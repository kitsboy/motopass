import {
  isAllowedSatohashUrl,
  normalizeSha256,
  sanitizeBlockHeight,
  sanitizeOtsPath,
  sanitizeShortLabel,
  sanitizeStampId,
} from './timestampSecurity'

/** Kind 30078-style program update stub for Nostr broadcast */
export interface ProgramUpdateEvent {
  kind: 30078
  content: string
  tags: string[][]
  created_at: number
}

export type ProgramProofContext = {
  field?: string
  content_hash?: string
  block_height?: number
  proof_url?: string
  ots_path?: string
  proof_status?: 'verified' | 'demo' | 'unverified'
}

export function buildProgramUpdateEvent(programName: string, change: string, satohashUrl?: string): ProgramUpdateEvent {
  const name = sanitizeShortLabel(programName, 120) ?? 'unknown'
  const note = sanitizeShortLabel(change, 200) ?? ''
  const tags: string[][] = [
    ['d', `motopass-program-${name.toLowerCase().replace(/\s+/g, '-')}`],
    ['t', 'motopass'],
    ['t', 'program-update'],
  ]
  if (satohashUrl && isAllowedSatohashUrl(satohashUrl)) tags.push(['satohash', satohashUrl])

  return {
    kind: 30078,
    content: JSON.stringify({ program: name, change: note, platform: 'MotoPass' }),
    tags,
    created_at: Math.floor(Date.now() / 1000),
  }
}

/** Kind 30078 with full Satohash / OTS proof context. Unsigned until NIP-07 signs it. */
export function buildProgramProofEvent(
  programName: string,
  change: string,
  proof: ProgramProofContext,
): ProgramUpdateEvent {
  const name = sanitizeShortLabel(programName, 120) ?? 'unknown'
  const note = sanitizeShortLabel(change, 200) ?? ''
  const hash = proof.content_hash ? normalizeSha256(proof.content_hash) : null
  const field = proof.field ? sanitizeShortLabel(proof.field, 64) : null
  const block = proof.block_height != null ? sanitizeBlockHeight(proof.block_height) : null
  const ots = proof.ots_path ? sanitizeOtsPath(proof.ots_path) : null
  const proofUrl = proof.proof_url && isAllowedSatohashUrl(proof.proof_url) ? proof.proof_url : undefined
  const status =
    proof.proof_status === 'verified' || proof.proof_status === 'demo' || proof.proof_status === 'unverified'
      ? proof.proof_status
      : undefined

  const tags: string[][] = [
    ['d', `motopass-program-${name.toLowerCase().replace(/\s+/g, '-')}`],
    ['t', 'motopass'],
    ['t', 'program-proof'],
  ]
  if (proofUrl) tags.push(['satohash', proofUrl])
  if (hash) tags.push(['hash', hash])
  if (field) tags.push(['field', field])
  if (block != null) tags.push(['block', String(block)])
  if (ots) tags.push(['ots', ots])
  if (status) tags.push(['proof-status', status])

  return {
    kind: 30078,
    content: JSON.stringify({
      program: name,
      change: note,
      platform: 'MotoPass',
      proof: {
        field: field ?? undefined,
        content_hash: hash ?? undefined,
        block_height: block ?? undefined,
        proof_url: proofUrl,
        ots_path: ots ?? undefined,
        proof_status: status,
      },
    }),
    tags,
    created_at: Math.floor(Date.now() / 1000),
  }
}

export type TimestampAttestationInput = {
  hash: string
  satohashUrl?: string
  stampId?: string
  blockHeight?: number | null
  status?: string
  filename?: string
  programName?: string
}

/**
 * Kind 30078 replaceable attestation: this SHA-256 was stamped via Satohash.
 * Tags carry satohash URL, hash, stamp id, and Bitcoin block when known.
 */
export function buildTimestampAttestationEvent(
  input: TimestampAttestationInput,
): ProgramUpdateEvent {
  const hash = normalizeSha256(input.hash) ?? ''
  const stampId = input.stampId ? sanitizeStampId(input.stampId) : null
  const satohashUrl = input.satohashUrl && isAllowedSatohashUrl(input.satohashUrl) ? input.satohashUrl : null
  const block = input.blockHeight != null ? sanitizeBlockHeight(input.blockHeight) : null
  const status = input.status ? sanitizeShortLabel(input.status, 32) : null
  const filename = input.filename ? sanitizeShortLabel(input.filename, 64) : null
  const program = input.programName ? sanitizeShortLabel(input.programName, 120) : null

  const tags: string[][] = [
    ['d', hash ? `motopass-stamp-${hash}` : 'motopass-stamp-invalid'],
    ['t', 'motopass'],
    ['t', 'timestamp'],
  ]
  if (satohashUrl) tags.push(['satohash', satohashUrl])
  if (hash) tags.push(['hash', hash])
  if (stampId) tags.push(['stamp-id', stampId])
  if (block != null) tags.push(['block', String(block)])
  if (status) tags.push(['stamp-status', status])
  if (filename) tags.push(['filename', filename])
  if (program) tags.push(['program', program])

  return {
    kind: 30078,
    content: JSON.stringify({
      platform: 'MotoPass',
      kind: 'timestamp-attestation',
      hash: hash || null,
      stamp_id: stampId,
      satohash_url: satohashUrl,
      bitcoin_block_height: block,
      status,
      program,
    }),
    tags,
    created_at: Math.floor(Date.now() / 1000),
  }
}

export function serializeNostrEvent(event: ProgramUpdateEvent): string {
  return JSON.stringify(event, null, 2)
}