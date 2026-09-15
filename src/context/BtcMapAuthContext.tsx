import { createContext, useContext } from 'react'
import type { BtcMapAuthSession } from '../lib/btcmapAuth'

type Ctx = {
  session: BtcMapAuthSession | null
  savedIds: Set<number>
  loading: boolean
  signingIn: boolean
  signIn: () => Promise<boolean>
  signOut: () => void
  toggleSave: (placeId: number) => Promise<void>
  isSaved: (placeId: number) => boolean
}

/**
 * Context object + consumer hook only — the provider lives in
 * `./BtcMapAuthProvider` (see the note in ThemeContext.tsx for why:
 * `react-refresh/only-export-components`, with consumer import paths unchanged).
 */
export const BtcMapAuthContext = createContext<Ctx | null>(null)

export function useBtcMapAuth() {
  const ctx = useContext(BtcMapAuthContext)
  if (!ctx) throw new Error('useBtcMapAuth requires BtcMapAuthProvider')
  return ctx
}
