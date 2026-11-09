/**
 * Gazette lines come from URLs already in the country file.
 * A cited PDF is not treated as a daily watch, and a missing gazette stays missing.
 */

export interface GazetteSource {
  url: string
  status?: string
  last_probed?: string | null
}

export interface GazetteInput {
  sources?: string[]
  officialUrls?: string[]
  watchUrls?: GazetteSource[]
}

export interface GazetteHit {
  url: string
  onWatch: boolean
  status: string | null
  lastProbed: string | null
}

const GAZETTE_HOSTS = new Set([
  'boletinoficial.gob.ar',
  'gacetaoficial.gob.pa',
  'dof.gob.mx',
])

function hostname(raw: string): string | null {
  try {
    return new URL(raw).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

export function isGazetteUrl(raw: string): boolean {
  const host = hostname(raw)
  if (host && GAZETTE_HOSTS.has(host)) return true
  return /official gazette/i.test(raw)
}

function urlFromText(raw: string): string | null {
  const match = raw.match(/https?:\/\/[^\s)]+/)
  return match ? match[0].replace(/[.,;]+$/, '') : null
}

export function gazetteHits(input: GazetteInput): GazetteHit[] {
  const watch = new Map<string, GazetteSource>()
  for (const page of input.watchUrls ?? []) {
    if (isGazetteUrl(page.url)) watch.set(page.url, page)
  }
  const found = new Map<string, GazetteHit>()
  for (const [url, page] of watch) {
    found.set(url, {
      url,
      onWatch: true,
      status: page.status ?? null,
      lastProbed: page.last_probed ?? null,
    })
  }
  const cited = [...(input.officialUrls ?? []), ...(input.sources ?? [])]
  for (const raw of cited) {
    if (!isGazetteUrl(raw)) continue
    const url = urlFromText(raw) ?? raw
    if (found.has(url)) continue
    const watched = (input.watchUrls ?? []).find(page => page.url === url)
    found.set(url, {
      url,
      onWatch: Boolean(watched),
      status: watched?.status ?? null,
      lastProbed: watched?.last_probed ?? null,
    })
  }
  return [...found.values()]
}

export type GazetteLine = 'changed' | 'watched' | 'cited' | 'none'

export function gazetteLine(hits: GazetteHit[]): GazetteLine {
  if (hits.some(hit => hit.onWatch && hit.status === 'changed')) return 'changed'
  if (hits.some(hit => hit.onWatch)) return 'watched'
  if (hits.length) return 'cited'
  return 'none'
}
