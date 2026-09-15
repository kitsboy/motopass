import React, { useCallback, useMemo, useState } from 'react'
import { connectNostr } from '../lib/nostr'
import { clearProfile, loadProfile, saveProfile } from '../lib/userStorage'
import type { UserProfile } from '../types/user'
import { UserContext } from './UserContext'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(() => {
    const p = loadProfile()
    if (p?.npub) sessionStorage.setItem('motopass-npub', p.npub)
    return p
  })

  const refresh = useCallback(() => {
    setProfileState(loadProfile())
  }, [])

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
