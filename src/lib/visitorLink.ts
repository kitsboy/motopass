/**
 * Where a click should go. The research corpus stays as recorded.
 * A page that did not load for a visitor opens its Wayback snapshot.
 * A bot wall (status "blocked", or HTTP 403) stays on the live URL,
 * because a normal browser can still pass it.
 */

const VISITOR_DEAD_URLS = [
  'https://adoptingelsalvador.gob.sv',
  'https://aima.gov.pt',
  'https://aima.gov.pt/pt/a-aima/perguntas-frequentes-faqs/autorizacao-de-residencia-para-investimento-ari/faq-residence-permit-for-investment-activity-ari',
  'https://aima.gov.pt/pt/viver/autorizacao-de-residencia-para-investimento-art-90-o-a',
  'https://investorvisa.mise.gov.it',
  'https://investorvisa.mise.gov.it/index.php/en',
  'https://www.uruguayxxi.gub.uy/en/invest/investors-guide/entry-requirements',
  'https://cbiu.gov.dm',
  'https://www.cbiu.gov.dm',
  'https://www.cbiu.gov.dm/investment-options',
  'https://www.ciu.gov.lc',
  'https://imagrenada.gd',
  'https://imagrenada.gd/citizenship-by-investment',
  'https://www.cbi.gov.gd',
  'https://laws.bahamas.gov.bs',
  'https://www.bahamaschamber.com',
  'https://www.ciregistry.gov.ky',
  'https://www.immigration.gov.ky',
  'https://www.boletinoficial.gob.ar',
  'https://brsb.itamaraty.gov.br/en-us',
  'https://cilc.vu',
] as const

export function normalizeVisitorUrl(url: string): string {
  try {
    const u = new URL(url.trim())
    const path = u.pathname.replace(/\/+$/, '')
    return `${u.protocol}//${u.hostname.toLowerCase()}${path}${u.search}`
  } catch {
    return url.trim().replace(/\/+$/, '')
  }
}

const DEAD = new Set<string>(VISITOR_DEAD_URLS.map(normalizeVisitorUrl))

export function visitorUrlIsDead(url: string): boolean {
  return DEAD.has(normalizeVisitorUrl(url))
}

/** Wayback snapshot nearest the probe day. `2` lets the archive pick the closest capture. */
export function waybackUrl(url: string, probedIso?: string | null): string {
  const day = probedIso ? probedIso.slice(0, 10).replace(/-/g, '') : ''
  const stamp = /^\d{8}$/.test(day) ? day : '2'
  return `https://web.archive.org/web/${stamp}/${url}`
}

export type VisitorLink = {
  href: string
  title: string
  archived: boolean
}

function isHttp(url: string): boolean {
  try {
    const protocol = new URL(url).protocol
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

export function visitorLink(
  url: string,
  opts?: { status?: string | null; probed?: string | null; liveMissed?: string },
): VisitorLink {
  const liveMissed = opts?.liveMissed ?? 'Live page did not load'
  const status = opts?.status ?? ''
  const archived = status === 'unreachable' || visitorUrlIsDead(url)
  if (archived && isHttp(url)) {
    return {
      href: waybackUrl(url, opts?.probed),
      title: `${liveMissed} — ${url}`,
      archived: true,
    }
  }
  if (status === 'blocked') {
    return { href: url, title: `${url} — walled`, archived: false }
  }
  return { href: url, title: url, archived: false }
}
