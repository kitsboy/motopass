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
  proof_status?: 'verified' | 'demo'
}

export function buildProgramUpdateEvent(programName: string, change: string, satohashUrl?: string): ProgramUpdateEvent {
  const tags: string[][] = [
    ['d', `motopass-program-${programName.toLowerCase().replace(/\s+/g, '-')}`],
    ['t', 'motopass'],
    ['t', 'program-update'],
  ]
  if (satohashUrl) tags.push(['satohash', satohashUrl])

  return {
    kind: 30078,
    content: JSON.stringify({ program: programName, change, platform: 'MotoPass' }),
    tags,
    created_at: Math.floor(Date.now() / 1000),
  }
}

/** Kind 30078 stub with full proof context — publish stub only (no relay) */
export function buildProgramProofEvent(
  programName: string,
  change: string,
  proof: ProgramProofContext,
): ProgramUpdateEvent {
  const tags: string[][] = [
    ['d', `motopass-program-${programName.toLowerCase().replace(/\s+/g, '-')}`],
    ['t', 'motopass'],
    ['t', 'program-proof'],
  ]
  if (proof.proof_url) tags.push(['satohash', proof.proof_url])
  if (proof.content_hash) tags.push(['hash', proof.content_hash])
  if (proof.field) tags.push(['field', proof.field])
  if (proof.block_height != null) tags.push(['block', String(proof.block_height)])
  if (proof.ots_path) tags.push(['ots', proof.ots_path])
  if (proof.proof_status) tags.push(['proof-status', proof.proof_status])

  return {
    kind: 30078,
    content: JSON.stringify({
      program: programName,
      change,
      platform: 'MotoPass',
      proof,
      publish_stub: true,
    }),
    tags,
    created_at: Math.floor(Date.now() / 1000),
  }
}

export function serializeNostrEvent(event: ProgramUpdateEvent): string {
  return JSON.stringify(event, null, 2)
}