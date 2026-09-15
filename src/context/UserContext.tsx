import { createContext, useContext } from 'react'
import type { UserProfile } from '../types/user'

interface UserContextValue {
  profile: UserProfile | null
  isLoggedIn: boolean
  login: () => Promise<boolean>
  logout: () => void
  setProfile: (p: UserProfile) => void
  refresh: () => void
}

/**
 * Context object + consumer hook only — the provider lives in
 * `./UserProvider` (see the note in ThemeContext.tsx for why:
 * `react-refresh/only-export-components`, with consumer import paths unchanged).
 */
export const UserContext = createContext<UserContextValue | null>(null)

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
