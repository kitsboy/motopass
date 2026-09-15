import { createContext, useContext } from 'react'
import type { DensitySnapshot, ProgramDensity } from '../lib/btcmapDensity'

type Ctx = {
  snapshot: DensitySnapshot | null
  loading: boolean
  densityFor: (programName: string) => ProgramDensity | null
}

/**
 * Context object + consumer hook only — the provider lives in
 * `./BtcMapDensityProvider` (see the note in ThemeContext.tsx for why:
 * `react-refresh/only-export-components`, with consumer import paths unchanged).
 */
export const BtcMapDensityContext = createContext<Ctx>({
  snapshot: null,
  loading: true,
  densityFor: () => null,
})

export function useBtcMapDensity(programName?: string) {
  const ctx = useContext(BtcMapDensityContext)
  return {
    ...ctx,
    density: programName ? ctx.densityFor(programName) : null,
  }
}
