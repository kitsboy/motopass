import type { PaigeHit, PaigeKnowledgeHit, PaigeResult } from './retrieve'

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

const TOPIC_LABELS: Record<string, string> = {
  'satohash': 'Satohash & Timestamping',
  'intel-pipeline': 'Intel Pipeline & Self-Healing',
  'vault-stamping': 'Vault & Document Stamping',
}

function buildKnowledgeBlock(kh: PaigeKnowledgeHit): string {
  const label = TOPIC_LABELS[kh.topic] ?? kh.topic
  const lines = [`**${label}**`]
  if (kh.scripts.length) {
    lines.push(kh.scripts[0])
  } else if (kh.facts.length) {
    lines.push(kh.facts[0])
  }
  return lines.join('\n')
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

/**
 * Build a response that mixes knowledge-base hits with program hits.
 * Knowledge topics appear first (they answer "how does X work?" questions),
 * then program-specific results.
 */
export function buildPaigeResponseWithKnowledge(query: string, results: PaigeResult[]): string {
  if (!results.length) {
    return `I couldn't match "${query}" to a verified program or knowledge topic in our corpus. Try a country name (Uruguay, UAE, Portugal), "Bitcoin residency", or ask about Satohash, the Vault, or the intel pipeline.\n\n${PAIGE_DISCLAIMER}`
  }

  const knowledgeHits = results.filter((r): r is PaigeKnowledgeHit => 'kind' in r && r.kind === 'knowledge')
  const programHits = results.filter((r): r is PaigeHit => !('kind' in r && r.kind === 'knowledge'))

  const parts: string[] = []

  for (const kh of knowledgeHits) {
    parts.push(buildKnowledgeBlock(kh))
  }

  if (programHits.length) {
    const programBlocks = programHits.map((h) => {
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
      }
      return lines.join('\n')
    })
    parts.push(...programBlocks)
  }

  return `${parts.join('\n\n')}\n\n${PAIGE_DISCLAIMER}`
}