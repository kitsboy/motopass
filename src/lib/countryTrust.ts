import { useEffect, useState } from 'react'
import { BUILD_ID } from './buildInfo'
import type { CountryTrustEnvelope, CountryTrustIndex } from '../types/countryTrust'

/** Fetch one per-country envelope, best-effort (returns null on missing file). */
export async function fetchCountryTrust(iso2: string): Promise<CountryTrustEnvelope | null> {
  try {
    const res = await fetch(`/countries/${iso2}.json?v=${encodeURIComponent(BUILD_ID)}`)
    if (!res.ok) return null
    return (await res.json()) as CountryTrustEnvelope
  } catch {
    return null
  }
}

/** Fetch the aggregate index (all countries, one line each). */
export async function fetchTrustIndex(): Promise<CountryTrustIndex | null> {
  try {
    const res = await fetch(`/trust-state.json?v=${encodeURIComponent(BUILD_ID)}`)
    if (!res.ok) return null
    return (await res.json()) as CountryTrustIndex
  } catch {
    return null
  }
}

type EnvelopeState = {
  envelope: CountryTrustEnvelope | null
  loading: boolean
  error: string | null
}

/** Hook: single-country envelope. */
export function useCountryTrust(iso2: string | null): EnvelopeState {
  const [state, setState] = useState<EnvelopeState>({
    envelope: null,
    loading: !!iso2,
    error: null,
  })

  useEffect(() => {
    let active = true
    if (!iso2) return
    fetchCountryTrust(iso2).then((env) => {
      if (!active) return
      setState({
        envelope: env,
        loading: false,
        error: env ? null : `No trust envelope for ${iso2}`,
      })
    })
    return () => {
      active = false
    }
  }, [iso2])

  return state
}

type IndexState = { index: CountryTrustIndex | null; loading: boolean; error: string | null }

/** Hook: aggregate index (all countries). */
export function useTrustIndex(): IndexState {
  const [state, setState] = useState<IndexState>({ index: null, loading: true, error: null })

  useEffect(() => {
    let active = true
    fetchTrustIndex().then((index) => {
      if (!active) return
      setState({ index, loading: false, error: index ? null : 'Trust index unavailable' })
    })
    return () => {
      active = false
    }
  }, [])

  return state
}
