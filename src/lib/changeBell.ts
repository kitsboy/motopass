import type { Program } from '../types/program'

/**
 * The change bell reads the source-watch latch. It does not probe, and it
 * does not publish. A webhook leaves this machine only when a public https
 * address is configured for the script.
 */

export interface BellPage {
  url: string
  status: string
  lastProbed: string | null
}

export interface BellCountry {
  name: string
  changed: boolean
  lastProbeAt: string | null
  changedPages: BellPage[]
}

export interface ChangeBellReport {
  changed: BellCountry[]
  steady: number
  latestProbe: string | null
}

function latestIso(values: Array<string | null | undefined>): string | null {
  const stamps = values.filter((value): value is string => Boolean(value))
  if (!stamps.length) return null
  const sorted = stamps.slice().sort()
  return sorted[sorted.length - 1] ?? null
}

export function changeBellReport(programs: Program[]): ChangeBellReport {
  const countries = programs.map(program => {
    const pages = program.watch?.urls ?? []
    const changedPages = pages
      .filter(page => page.status === 'changed')
      .map(page => ({
        url: page.url,
        status: page.status,
        lastProbed: page.last_probed ?? null,
      }))
    const changed = program.watch?.changed === true || changedPages.length > 0
    return {
      name: program.name,
      changed,
      lastProbeAt: program.watch?.last_probe_at ?? null,
      changedPages,
    }
  })
  const changed = countries.filter(country => country.changed)
  return {
    changed,
    steady: countries.length - changed.length,
    latestProbe: latestIso(countries.map(country => country.lastProbeAt)),
  }
}

export function changeBellNote(report: ChangeBellReport): string {
  const when = report.latestProbe?.slice(0, 10) ?? 'unknown'
  const lines = [`MotoPass change bell`, `Probed: ${when}`]
  if (!report.changed.length) {
    lines.push('Changed: none')
    lines.push(`${report.steady} watched countries are steady.`)
    return lines.join('\n')
  }
  lines.push(`Changed: ${report.changed.length}`)
  for (const country of report.changed) {
    const urls = country.changedPages.map(page => page.url)
    lines.push(urls.length ? `${country.name}: ${urls.join(', ')}` : country.name)
  }
  return lines.join('\n')
}

export function changeBellPayload(report: ChangeBellReport) {
  return {
    kind: 'motopass.change-bell',
    probed_at: report.latestProbe,
    steady: report.steady,
    changed: report.changed.map(country => ({
      name: country.name,
      urls: country.changedPages.map(page => page.url),
    })),
  }
}

/** Public https only. Private hosts and link-local addresses are refused. */
export function webhookUrlAllowed(raw: string | undefined | null): boolean {
  if (!raw?.trim()) return false
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false
  if (host === '0.0.0.0' || host === '::1' || host === 'metadata.google.internal') return false
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    if (a === 10 || a === 127 || a === 0) return false
    if (a === 169 && b === 254) return false
    if (a === 192 && b === 168) return false
    if (a === 172 && b >= 16 && b <= 31) return false
  }
  return true
}
