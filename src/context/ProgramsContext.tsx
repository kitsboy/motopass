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

const EMPTY_PROGRAMS: ProgramsContextValue = {
  programs: [],
  loading: false,
  error: null,
  byId: () => undefined,
  refresh: () => {}
}

export function useProgramsContext() {
  const ctx = useContext(ProgramsContext)
  if (!ctx) {
    // Duplicate-chunk / menu-outside-provider used to throw and trip ErrorBoundary
    // on first paint even though ProgramsProvider wraps the app. Stay quiet.
    return EMPTY_PROGRAMS
  }
  return ctx
}
