/** Canonical objects hashed for Satohash. Never include name, notes, or filenames. */

export function applyStampPayload(input: {
  program: string
  created: string
  npub?: string | null
  proofHash?: string
}): Record<string, unknown> {
  return {
    platform: 'MotoPass',
    kind: 'application-interest',
    program: input.program.trim(),
    created: input.created,
    npub: input.npub ?? null,
    proof: input.proofHash && /^[a-f0-9]{64}$/i.test(input.proofHash) ? input.proofHash.toLowerCase() : null,
  }
}

export function profileDocumentStampPayload(input: {
  program: string
  created: string
  contentHash: string
  size: number
  type: string
  npub?: string | null
}): Record<string, unknown> {
  return {
    platform: 'MotoPass',
    kind: 'profile-document',
    program: input.program.trim(),
    created: input.created,
    content_hash: input.contentHash,
    size: input.size,
    type: input.type || 'application/octet-stream',
    npub: input.npub ?? null,
  }
}
