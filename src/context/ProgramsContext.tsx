import { createContext, useContext } from 'react'
import type { Program } from '../types/program'

type ProgramsContextValue = {
  programs: Program[]
  loading: boolean
  error: string | null
  byId: (id: number) => Program | undefined
  refresh: () => void
}

/**
 * Context object + consumer hook only — the provider (and the module-level
 * countries-snapshot cache it owns) lives in `./ProgramsProvider`. See the note
 * in ThemeContext.tsx for why: `react-refresh/only-export-components`, with
 * consumer import paths unchanged.
 */
export const ProgramsContext = createContext<ProgramsContextValue | null>(null)

export function useProgramsContext() {
  const ctx = useContext(ProgramsContext)
  if (!ctx) throw new Error('useProgramsContext must be used within ProgramsProvider')
  return ctx
}
