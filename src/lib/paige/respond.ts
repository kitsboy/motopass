import type { PaigeHit } from './retrieve'

export const PAIGE_DISCLAIMER =
  'Educational only — not legal, tax, or investment advice. Verify claims on Bitcoin via Satohash before you commit capital.'

export type PaigeBlock = {
  programId: number
  programName: string
  region: string
  status: string
  verified: boolean
  snippets: string[]
  proofUrl?: string
  field?: string
  blockHeight?: number
  redFlag?: string
}

export function buildPaigeBlocks(hits: PaigeHit[]): PaigeBlock[] {
  return hits.map((h) => {
    const p = h.program
    const proof = h.citations[0]
    const verified = Boolean(proof?.proofUrl)
    return {
      programId: p.id,
      programName: p.name,
      region: p.region,
      status: p.status,
      verified,
      snippets: h.snippets.map((s) => (verified ? s : `[unverified] ${s}`)),
      proofUrl: proof?.proofUrl,
      field: proof?.field,
      blockHeight: proof?.blockHeight,
      redFlag: p.paige_fields?.red_flags?.[0],
    }
  })
}

export function buildPaigeResponse(query: string, hits: PaigeHit[]): string {
  if (!hits.length) {
    return `I couldn't match "${query}" to a verified program in our corpus. Try a country name (Uruguay, UAE, Portugal) or "Bitcoin residency".\n\n${PAIGE_DISCLAIMER}`
  }

  const blocks = hits.map((h) => {
    const p = h.program
    const proof = h.citations[0]
    const verified = Boolean(proof?.proofUrl)
    const lines = [
      `**${p.name}** (${p.region}) — ${p.status}`,
      verified
        ? `✓ Satohash verified · block #${proof.blockHeight ?? '—'}`
        : '⚠ UNVERIFIED — treat all claims below as research stubs until stamped',
      ...h.snippets.map((s) =>
        verified ? `• ${s}` : `• [unverified] ${s}`,
      ),
    ]
    if (p.paige_fields?.red_flags?.[0]) {
      lines.push(`⚠ ${p.paige_fields.red_flags[0]}`)
    }
    if (verified && proof.proofUrl) {
      lines.push(`Cite: ${proof.proofUrl}`)
      if (proof.field) lines.push(`Field: ${proof.field}`)
    } else {
      lines.push('No Satohash citation — verify independently before capital commitment')
    }
    return lines.join('\n')
  })

  return `${blocks.join('\n\n')}\n\n${PAIGE_DISCLAIMER}`
}