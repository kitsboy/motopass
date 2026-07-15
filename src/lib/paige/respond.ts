import type { PaigeHit } from './retrieve'

const DISCLAIMER =
  'Educational only — not legal, tax, or investment advice. Verify claims on Bitcoin via Satohash before you commit capital.'

export function buildPaigeResponse(query: string, hits: PaigeHit[]): string {
  if (!hits.length) {
    return `I couldn't match "${query}" to a verified program in our corpus. Try a country name (Uruguay, UAE, Portugal) or "Bitcoin residency".\n\n${DISCLAIMER}`
  }

  const blocks = hits.map((h) => {
    const p = h.program
    const lines = [
      `**${p.name}** (${p.region}) — ${p.status}`,
      ...h.snippets.map((s) => `• ${s}`),
    ]
    if (p.paige_fields?.red_flags?.[0]) {
      lines.push(`⚠ ${p.paige_fields.red_flags[0]}`)
    }
    const proof = h.citations[0]
    if (proof?.proofUrl) {
      lines.push(`Verify: block #${proof.blockHeight ?? '—'} · ${proof.proofUrl}`)
    } else {
      lines.push('Proof: unverified stub — flagship depth in progress')
    }
    return lines.join('\n')
  })

  return `${blocks.join('\n\n')}\n\n${DISCLAIMER}`
}