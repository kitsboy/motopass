import type { Program } from '../types/program'

/**
 * Everything the Stage 2 hero shows, read from the real corpus.
 *
 * No derived claim is invented: counts come from the loaded records, the
 * "checked" date is the newest `last_checked` in the corpus, the source count
 * is the number of distinct official URLs cited, and the featured record is a
 * real program with a real Satohash anchor. A missing field renders as
 * "not on file" rather than a plausible-looking guess.
 */
export interface HeroFacts {
  programs: number | null
  checked: string | null
  sources: number | null
}

export interface VisaRecord {
  name: string
  flag: string | null
  kind: string
  /** Formatted in USD, or null when the record does not carry the figure. */
  minInvestment: string | null
  typicalInvestment: string | null
  timeline: string | null
  checked: string | null
  sourceUrl: string | null
  sourceName: string | null
  blockHeight: number | null
  hash: string | null
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

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

function usd(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  // 0 is a real answer for these programs: there is no minimum investment.
  if (value === 0) return 'No minimum'
  return `$${value.toLocaleString('en-US')}`
}

const SOURCE_URL = /https?:\/\/[^\s,;)]+/

function sourceOf(program: Program): { url: string; name: string } | null {
  const list = Array.isArray(program.sources) ? program.sources : []
  for (const entry of list) {
    const text = String(entry)
    const url = text.match(SOURCE_URL)?.[0]
    if (!url) continue
    const name = text.split(' — ')[0].split(' - ')[0].trim()
    return { url, name: name || new URL(url).hostname }
  }
  return null
}

export function heroFacts(programs: Program[]): HeroFacts {
  if (!programs.length) return { programs: null, checked: null, sources: null }

  const dates = programs.map(p => isoDate(p.last_checked)).filter((d): d is string => !!d).sort()
  const urls = new Set<string>()
  for (const p of programs) {
    for (const entry of (Array.isArray(p.sources) ? p.sources : [])) {
      const url = String(entry).match(SOURCE_URL)?.[0]
      if (url) urls.add(url.replace(/\/+$/, ''))
    }
  }

  return {
    programs: programs.length,
    checked: prettyDate(dates[dates.length - 1] ?? null),
    sources: urls.size || null,
  }
}

/** One real record, chosen for having the most verifiable fields present. */
export function featuredRecord(programs: Program[]): VisaRecord | null {
  if (!programs.length) return null

  const score = (p: Program) => {
    let s = 0
    if (p.finance?.typical_investment_usd) s += 2
    if (p.finance?.processing_time_months) s += 1
    if (p.last_checked) s += 1
    if (p.last_verified_block) s += 2
    if (Array.isArray(p.satohash_proofs) && p.satohash_proofs.length) s += 2
    if (sourceOf(p)) s += 1
    if (p.flag) s += 1
    return s
  }

  const pick = [...programs].sort((a, b) => score(b) - score(a))[0]
  const source = sourceOf(pick)
  const proof = Array.isArray(pick.satohash_proofs) ? pick.satohash_proofs[0] : undefined
  const hash = typeof proof?.content_hash === 'string' ? proof.content_hash : null
  const block = typeof pick.last_verified_block === 'number'
    ? pick.last_verified_block
    : typeof proof?.block_height === 'number'
      ? proof.block_height
      : null

  const category = String(pick.category ?? '')
  const kind = category === 'cbi' ? 'Citizenship' : category === 'rbi' ? 'Residency' : 'Program'

  return {
    name: pick.name,
    flag: pick.flag ?? null,
    kind,
    minInvestment: usd(pick.finance?.min_investment_usd),
    typicalInvestment: usd(pick.finance?.typical_investment_usd),
    timeline: pick.finance?.processing_time_months
      ? `${pick.finance.processing_time_months} months`
      : null,
    checked: prettyDate(isoDate(pick.last_checked)),
    sourceUrl: source?.url ?? null,
    sourceName: source?.name ?? null,
    blockHeight: block,
    hash,
  }
}
