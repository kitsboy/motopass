import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Program } from '../types/program'
import { BUILD_ID } from '../lib/buildInfo'

type ProgramsContextValue = {
  programs: Program[]
  loading: boolean
  error: string | null
  byId: (id: number) => Program | undefined
  refresh: () => void
}

const ProgramsContext = createContext<ProgramsContextValue | null>(null)

type ProgramsCache = { programs: Program[]; error: string | null }

let cache: ProgramsCache | null = null
let inflight: Promise<ProgramsCache> | null = null
let fetchGeneration = 0

function fetchProgramsOnce(force = false): Promise<ProgramsCache> {
  if (!force && cache) return Promise.resolve(cache)
  if (!force && inflight) return inflight

  const gen = ++fetchGeneration
  inflight = fetch(`/research/countries.json?v=${encodeURIComponent(BUILD_ID)}`)
    .then(r => {
      if (!r.ok) throw new Error('Failed to load programs')
      return r.json()
    })
    .then(d => {
      if (gen !== fetchGeneration) return cache ?? { programs: [], error: null }
      cache = { programs: d.programs ?? [], error: null }
      return cache
    })
    .catch(e => {
      if (gen !== fetchGeneration) return cache ?? { programs: [], error: 'Failed to load' }
      cache = { programs: [], error: e instanceof Error ? e.message : 'Failed to load' }
      return cache
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function ProgramsProvider({ children }: { children: ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>(cache?.programs ?? [])
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState<string | null>(cache?.error ?? null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => {
    cache = null
    setLoading(true)
    setTick(t => t + 1)
  }, [])

  useEffect(() => {
    let active = true
    const force = tick > 0
    fetchProgramsOnce(force).then(result => {
      if (!active) return
      setPrograms(result.programs)
      setError(result.error)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [tick])

  const byId = (id: number) => programs.find(p => p.id === id)

  return (
    <ProgramsContext.Provider value={{ programs, loading, error, byId, refresh }}>
      {children}
    </ProgramsContext.Provider>
  )
}

export function useProgramsContext() {
  const ctx = useContext(ProgramsContext)
  if (!ctx) throw new Error('useProgramsContext must be used within ProgramsProvider')
  return ctx
}