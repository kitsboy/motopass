import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { connectNostr } from '../lib/nostr'
import { clearProfile, loadProfile, saveProfile } from '../lib/userStorage'
import type { UserProfile } from '../types/user'

interface UserContextValue {
  profile: UserProfile | null
  isLoggedIn: boolean
  login: () => Promise<boolean>
  logout: () => void
  setProfile: (p: UserProfile) => void
  refresh: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null)

  const refresh = useCallback(() => {
    setProfileState(loadProfile())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = useCallback(async () => {
    const session = await connectNostr()
    if (!session) return false
    const existing = loadProfile()
    if (existing?.npub === session.npub) {
      setProfileState(existing)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    clearProfile()
    sessionStorage.removeItem('motopass-npub')
    setProfileState(null)
  }, [])

  const setProfile = useCallback((p: UserProfile) => {
    saveProfile(p)
    setProfileState(p)
    sessionStorage.setItem('motopass-npub', p.npub)
  }, [])

  const value = useMemo(() => ({
    profile,
    isLoggedIn: !!profile,
    login,
    logout,
    setProfile,
    refresh,
  }), [profile, login, logout, setProfile, refresh])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}