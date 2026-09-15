import { useEffect, useMemo, useState } from 'react'

/**
 * Live source-monitor data (MotoPass official-source watchdog).
 *
 * Reads the deployed feed:
 *   /data/source-monitor.json — per-country status of every watched official source
 *   /data/source-events.json  — the confirmed change + coverage event log
 *
 * Both are fetched once per page load (module-level cache) and shared by every
 * consumer (program cards, alert inbox) so we never hit the CDN twice.
 */

export interface SourceUrl {
  url: string
  status: string // 'ok' | 'changed' | 'blocked' | 'unreachable'
  mode?: string
  last_probed?: string
  scopes?: Record<string, unknown>
}

export interface SourceCountry {
  name: string
  program_id: number
  changed?: boolean
  coverage_gap_days?: number
  urls: SourceUrl[]
}

export interface SourceManifest {
  generated_at?: string
  interval_hours?: number
  extract_v?: number
  total_urls?: number
  ok?: number
  cloudflare_blocked?: number
  unreachable?: number
  changed?: number
  by_country: SourceCountry[]
}

export interface SourceEvent {
  id: string
  ts: string
  date: string
  country: string
  program_id?: number
  url: string
  kind?: string // 'rule' | 'coverage' | ...
  status: string
  before?: string | null
  after?: string | null
}

export type SourceLevel = 'ok' | 'changed' | 'walled'

let manifestPromise: Promise<SourceManifest | null> | null = null
let eventsPromise: Promise<SourceEvent[]> | null = null

function fetchJson<T>(url: string): Promise<T | null> {
  if (typeof fetch !== 'function') return Promise.resolve(null)
  return fetch(url)
    .then((r) => (r.ok ? (r.json() as Promise<T>) : null))
    .catch(() => null)
}

/** Cached manifest fetch — safe to call from many components. */
export function loadSourceManifest(): Promise<SourceManifest | null> {
  if (!manifestPromise) manifestPromise = fetchJson<SourceManifest>('/data/source-monitor.json')
  return manifestPromise
}

/** Cached events fetch — safe to call from many components. */
export function loadSourceEvents(): Promise<SourceEvent[]> {
  if (!eventsPromise) {
    eventsPromise = fetchJson<SourceEvent[]>('/data/source-events.json').then((e) => e ?? [])
  }
  return eventsPromise
}

export interface CountryHealth {
  level: SourceLevel
  /** ISO timestamp of the most recent probe of any of this country's sources. */
  probed?: string
  /** Sources that are readable right now. */
  okCount: number
  total: number
  /** Confirmed rule change waiting on this country. */
  changed: boolean
  coverageGapDays?: number
}

/** Derive an honest per-country health summary from the manifest entry. */
export function countrySourceHealth(c: SourceCountry): CountryHealth {
  const okCount = c.urls.filter((u) => u.status === 'ok').length
  const changed = !!c.changed || c.urls.some((u) => u.status === 'changed')
  const probed = c.urls
    .map((u) => u.last_probed)
    .filter((v): v is string => !!v)
    .sort()
    .pop()
  const level: SourceLevel = changed ? 'changed' : okCount > 0 ? 'ok' : 'walled'
  return { level, probed, okCount, total: c.urls.length, changed, coverageGapDays: c.coverage_gap_days }
}

/** Human "3h ago" style age from an ISO timestamp. */
export function ageLabel(iso?: string): string | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000))
  if (mins < 60) return `${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

/** Reactive manifest accessor — one fetch shared across the app. */
export function useSourceMonitor() {
  const [manifest, setManifest] = useState<SourceManifest | null>(null)

  useEffect(() => {
    let live = true
    loadSourceManifest().then((m) => {
      if (live) setManifest(m)
    })
    return () => {
      live = false
    }
  }, [])

  const byCountry = useMemo(() => {
    const map = new Map<string, CountryHealth>()
    for (const c of manifest?.by_country ?? []) map.set(c.name, countrySourceHealth(c))
    return map
  }, [manifest])

  return { manifest, byCountry }
}
