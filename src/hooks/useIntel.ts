import { useEffect, useState } from 'react'
import { BUILD_ID } from '../lib/buildInfo'

/** Runtime manifest shape — mirrors scripts/update-freshness.mjs buildIntel(). */
export type IntelFreshness = { status: 'fresh' | 'watch' | 'stale'; days_stale: number; last_checked: string }
export type IntelWatch = { changed: boolean; probed: number; unreachable: number }
export type IntelProof = {
  hash: string | null
  in_sync: boolean
  block: number | null
  stamped_at: string | null
  stamp_id: string | null
}
export type IntelChange = { date: string; field: string; from?: string; to: string; hash?: string }
export type IntelProgram = {
  id: number
  freshness: IntelFreshness
  watch: IntelWatch
  proof: IntelProof
  recent_changes: IntelChange[]
}
export type IntelManifest = {
  generated_at: string
  schema: 'motopass.country-intel.v1'
  sweep: {
    fresh: number
    watch: number
    stale: number
    swept_at: string
    last_probe_at?: string
    satohash_api?: { status: string; version?: string | null }
  }
  programs: Record<string, IntelProgram>
}

type IntelState = { intel: IntelManifest | null; loading: boolean; error: string | null }

let cache: IntelManifest | null = null
let inflight: Promise<IntelManifest | null> | null = null

function fetchIntelOnce(): Promise<IntelManifest | null> {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight
  inflight = fetch(`/data/intel.json?v=${encodeURIComponent(BUILD_ID)}`)
    .then(r => {
      if (!r.ok) return null
      return r.json() as Promise<IntelManifest>
    })
    .then(d => {
      cache = d
      return d
    })
    .catch(() => null)
    .finally(() => {
      inflight = null
    })
  return inflight
}

/**
 * Live Country Intel manifest — freshness counts, per-program watch/proof
 * state, and the most recent audit changes. Best-effort: returns null when
 * the manifest is missing (pre-pipeline deploys) without breaking pages.
 */
export function useIntel(): IntelState {
  const [state, setState] = useState<IntelState>({ intel: cache, loading: !cache, error: null })

  useEffect(() => {
    let active = true
    fetchIntelOnce().then(intel => {
      if (!active) return
      setState({ intel, loading: false, error: intel ? null : 'intel manifest unavailable' })
    })
    return () => {
      active = false
    }
  }, [])

  return state
}
