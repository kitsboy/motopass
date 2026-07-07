import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Program } from '../types/program'

type ProgramsContextValue = {
  programs: Program[]
  loading: boolean
  error: string | null
  byId: (id: number) => Program | undefined
}

const ProgramsContext = createContext<ProgramsContextValue | null>(null)

type ProgramsCache = { programs: Program[]; error: string | null }

let cache: ProgramsCache | null = null
let inflight: Promise<ProgramsCache> | null = null

function fetchProgramsOnce(): Promise<ProgramsCache> {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight

  inflight = fetch('/research/countries.json')
    .then(r => {
      if (!r.ok) throw new Error('Failed to load programs')
      return r.json()
    })
    .then(d => {
      cache = { programs: d.programs ?? [], error: null }
      return cache
    })
    .catch(e => {
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

  useEffect(() => {
    let active = true
    fetchProgramsOnce().then(result => {
      if (!active) return
      setPrograms(result.programs)
      setError(result.error)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const byId = (id: number) => programs.find(p => p.id === id)

  return (
    <ProgramsContext.Provider value={{ programs, loading, error, byId }}>
      {children}
    </ProgramsContext.Provider>
  )
}

export function useProgramsContext() {
  const ctx = useContext(ProgramsContext)
  if (!ctx) throw new Error('useProgramsContext must be used within ProgramsProvider')
  return ctx
}