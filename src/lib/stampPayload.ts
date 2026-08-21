/** Canonical objects hashed for Satohash. Never include name, notes, or filenames. */

/** Normalize an arbitrary list of doc hashes: lowercase hex, deduped, sorted. */
export function normalizeDocHashes(hashes: string[] | undefined | null): string[] {
  return Array.from(
    new Set(
      (hashes ?? [])
        .map(h => (typeof h === 'string' ? h.trim().toLowerCase() : ''))
        .filter(h => /^[a-f0-9]{64}$/.test(h)),
    ),
  ).sort()
}

export function applyStampPayload(input: {
  program: string
  created: string
  npub?: string | null
  proofHash?: string
  /** Stamped document hashes attached to this application (never names). */
  docHashes?: string[]
}): Record<string, unknown> {
  const docs = normalizeDocHashes(input.docHashes)
  return {
    platform: 'MotoPass',
    kind: 'application-interest',
    program: input.program.trim(),
    created: input.created,
    npub: input.npub ?? null,
    proof: input.proofHash && /^[a-f0-9]{64}$/i.test(input.proofHash) ? input.proofHash.toLowerCase() : null,
    docs: docs.length ? docs : null,
  }
}
