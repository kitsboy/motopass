import type { Program } from '../types/program'

/**
 * Everything the Stage 2 hero shows, read from the real corpus under a rule,
 * never by picking the prettiest record.
 *
 * A record may be featured only when ALL of these hold:
 *   1. it names a concrete pathway (that is the program, not the country),
 *   2. that pathway carries a minimum investment above zero,
 *   3. the country figure `typical_investment_usd` is at least that minimum
 *      (so the card can never print "$30,000 typical" above "No minimum"),
 *   4. it carries a processing time, a last-checked date, a Satohash proof
 *      with a real content hash and block height, and
 *   5. at least one of its sources is an official government or regulator
 *      page — a subscription news article is not evidence.
 *
 * Among qualifying records the one with the most official sources wins, then
 * the most sources overall, then alphabetical. The selection is deterministic:
 * the same corpus always yields the same record.
 */
export interface HeroFacts {
  programs: number | null
  checked: string | null
  officialSources: number | null
  allSources: number | null
}

export interface VisaRecord {
  country: string
  program: string
  kind: string
  /** Date the snapshot block was mined, from the stamp itself. */
  stamped: string | null
  checked: string | null
  sourceUrl: string | null
  sourceName: string | null
  sourceHost: string | null
  proofUrl: string | null
  blockHeight: number | null
  hash: string | null
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const URL_RE = /https?:\/\/[^\s,;)]+/

/** A government or regulator page. Anything else is "other", never "official". */
const OFFICIAL_HOST_RE =
  /(\.gov(\.[a-z]{2})?$)|(\.gob(\.[a-z]{2})?$)|(\.gov\.)|(\.gob\.)|(\.gv\.)|(\.govt\.)|(\.admin\.ch$)|(go\.kr$)|(\.gc\.ca$)|(\.europa\.eu$)/i

function isoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

function prettyDate(iso: string | null): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return `${d} ${MONTHS[m - 1]} ${y}`
}

interface SourceEntry {
  url: string
  name: string
  host: string
  official: boolean
}

function sourcesOf(program: Program): SourceEntry[] {
  const out: SourceEntry[] = []
  for (const raw of (Array.isArray(program.sources) ? program.sources : [])) {
    const text = String(raw)
    const url = text.match(URL_RE)?.[0]
    if (!url) continue
    let host = ''
    try {
      host = new URL(url).hostname.toLowerCase()
    } catch {
      continue
    }
    const name = text.split(' — ')[0].split(' - ')[0].trim() || host
    out.push({ url, name, host, official: OFFICIAL_HOST_RE.test(host) })
  }
  return out
}

export function heroFacts(programs: Program[]): HeroFacts {
  if (!programs.length) {
    return { programs: null, checked: null, officialSources: null, allSources: null }
  }

  const dates = programs
    .map(p => isoDate(p.last_checked))
    .filter((d): d is string => !!d)
    .sort()

  const official = new Set<string>()
  const all = new Set<string>()
  for (const p of programs) {
    for (const s of sourcesOf(p)) {
      all.add(s.url.replace(/\/+$/, ''))
      if (s.official) official.add(s.url.replace(/\/+$/, ''))
    }
  }

  return {
    programs: programs.length,
    checked: prettyDate(dates[dates.length - 1] ?? null),
    officialSources: official.size || null,
    allSources: all.size || null,
  }
}

interface Candidate {
  program: Program
  pathwayLabel: string
  minimum: number
  typical: number
  officialCount: number
  totalCount: number
  proofUrl: string | null
  blockHeight: number
  hash: string
}

function candidate(program: Program): Candidate | null {
  const fund = program.finance ?? {}
  const typical = typeof fund.typical_investment_usd === 'number' ? fund.typical_investment_usd : 0
  if (typical <= 0) return null
  if (!fund.processing_time_months) return null
  if (!isoDate(program.last_checked)) return null

  const pathways = (program.pathways ?? []).filter(
    w => typeof w.min_investment_usd === 'number' && w.min_investment_usd > 0 && w.label,
  )
  if (!pathways.length) return null

  // The named pathway must not exceed the country figure, or the card would
  // show a minimum above its own "typical" number.
  const pathway = pathways
    .filter(w => (w.min_investment_usd as number) <= typical)
    .sort((a, b) => (b.min_investment_usd as number) - (a.min_investment_usd as number))[0]
  if (!pathway) return null

  const proof = (program.satohash_proofs ?? [])[0]
  const hash = typeof proof?.content_hash === 'string' ? proof.content_hash : null
  const blockHeight = typeof proof?.block_height === 'number' ? proof.block_height : null
  if (!hash || !blockHeight) return null

  const sources = sourcesOf(program)
  const officialCount = sources.filter(s => s.official).length
  if (!officialCount) return null

  return {
    program,
    pathwayLabel: String(pathway.label),
    minimum: pathway.min_investment_usd as number,
    typical,
    officialCount,
    totalCount: sources.length,
    proofUrl: typeof proof?.proof_url === 'string' ? proof.proof_url : null,
    blockHeight,
    hash,
  }
}

/** The record that qualifies under the rule, or null when none does. */
export function featuredRecord(programs: Program[]): VisaRecord | null {
  const candidates = programs
    .map(candidate)
    .filter((c): c is Candidate => !!c)
    .sort(
      (a, b) =>
        b.officialCount - a.officialCount ||
        b.totalCount - a.totalCount ||
        a.program.name.localeCompare(b.program.name),
    )

  const pick = candidates[0]
  if (!pick) return null

  const official = sourcesOf(pick.program).find(s => s.official)
  const proof = (pick.program.satohash_proofs ?? [])[0]

  return {
    country: pick.program.name,
    program: pick.pathwayLabel,
    // The label says which residency or citizenship route this is; the country
    // category ("rbi_cbi") cannot, because a country is not a program.
    kind: /citizen/i.test(pick.pathwayLabel) ? 'Citizenship' : 'Residency',
    stamped: prettyDate(isoDate(proof?.stamped_at)),
    checked: prettyDate(isoDate(pick.program.last_checked)),
    sourceUrl: official?.url ?? null,
    sourceName: official?.name ?? null,
    sourceHost: official?.host ?? null,
    proofUrl: pick.proofUrl,
    blockHeight: pick.blockHeight,
    hash: pick.hash,
  }
}

/** Diagnostics for the design brief: who qualifies, and why a record does not. */
export function recordReport(programs: Program[]) {
  return programs.map(p => {
    const c = candidate(p)
    const fund = p.finance ?? {}
    const paths = (p.pathways ?? []).filter(w => (w.min_investment_usd ?? 0) > 0)
    const sources = sourcesOf(p)
    const official = sources.filter(s => s.official)
    const proof = (p.satohash_proofs ?? [])[0]
    return {
      name: p.name,
      qualifies: !!c,
      officialSources: official.length,
      allSources: sources.length,
      typical: fund.typical_investment_usd ?? null,
      lowestPathway: paths.length
        ? Math.min(...paths.map(w => w.min_investment_usd as number))
        : null,
      blocked: !c
        ? [
            !fund.typical_investment_usd && 'no typical investment',
            !fund.processing_time_months && 'no processing time',
            !isoDate(p.last_checked) && 'no last-checked date',
            !proof?.content_hash && 'no proof hash',
            !proof?.block_height && 'no block height',
            !paths.length && 'no paid pathway',
            !official.length && 'no official source',
            !!paths.length &&
              !!fund.typical_investment_usd &&
              !paths.some(
                w => (w.min_investment_usd as number) <= (fund.typical_investment_usd as number),
              ) &&
              'minimum exceeds typical',
          ].filter(Boolean)
        : [],
    }
  })
}
