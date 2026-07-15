import type { Program } from '../../types/program'

export type PaigeCitation = {
  programName: string
  field: string
  proofUrl?: string
  blockHeight?: number
}

export type PaigeHit = {
  program: Program
  score: number
  snippets: string[]
  citations: PaigeCitation[]
}

const TOKEN_RE = /[^\s,.;:!?]+/g

function tokens(q: string): string[] {
  return q.toLowerCase().match(TOKEN_RE)?.filter((t) => t.length > 2) ?? []
}

function scoreProgram(p: Program, toks: string[]): { score: number; snippets: string[] } {
  const hay = [
    p.name,
    p.region,
    p.bitcoin_integration,
    p.details,
    p.finance.tax_benefits,
    p.finance.bitcoin_specific,
    ...(p.pathways?.map((x) => `${x.label} ${x.notes}`) ?? []),
    ...(p.paige_fields?.common_questions ?? []),
    ...(p.paige_fields?.optimization_tips ?? []),
  ].join(' ').toLowerCase()

  let score = 0
  const snippets: string[] = []
  for (const t of toks) {
    if (hay.includes(t)) score += 2
    if (p.name.toLowerCase().includes(t)) score += 5
  }
  if (p.flagship_depth) score += 1
  if (p.paige_fields?.optimization_tips[0]) snippets.push(p.paige_fields.optimization_tips[0])
  if (p.finance.bitcoin_specific) snippets.push(p.finance.bitcoin_specific)
  if (p.pathways?.[0]) snippets.push(`${p.pathways[0].label}: ${p.pathways[0].notes}`)
  return { score, snippets: [...new Set(snippets)].slice(0, 3) }
}

export function retrievePrograms(programs: Program[], query: string, limit = 3): PaigeHit[] {
  const toks = tokens(query)
  if (!toks.length) return []

  return programs
    .map((program) => {
      const { score, snippets } = scoreProgram(program, toks)
      const proof = program.satohash_proofs?.[0]
      return {
        program,
        score,
        snippets,
        citations: score > 0 ? [{
          programName: program.name,
          field: proof?.field ?? 'program_snapshot',
          proofUrl: proof?.proof_url,
          blockHeight: proof?.block_height,
        }] : [],
      }
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}