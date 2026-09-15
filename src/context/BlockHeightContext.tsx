import { createContext, useContext } from 'react'

type BlockHeightContextValue = {
  height: number | null
  error: boolean
  retry: () => void
}

/**
 * Context object + consumer hook only — the provider lives in
 * `./BlockHeightProvider` (see the note in ThemeContext.tsx for why:
 * `react-refresh/only-export-components`, with consumer import paths unchanged).
 */
export const BlockHeightContext = createContext<BlockHeightContextValue | null>(null)

export function useBlockHeight() {
  const ctx = useContext(BlockHeightContext)
  if (!ctx) throw new Error('useBlockHeight must be used within BlockHeightProvider')
  return ctx
}
