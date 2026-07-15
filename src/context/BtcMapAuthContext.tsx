import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { addSavedPlace, getSavedPlaces, removeSavedPlace } from '../lib/btcmap'
import {
  addLocalSavedId,
  loadLocalSavedIds,
  removeLocalSavedId,
  syncSavedMerchantsNostr,
} from '../lib/btcmapSavedSync'
import {
  clearBtcMapToken,
  getBtcMapToken,
  signInBtcMapWithNostr,
  type BtcMapAuthSession,
} from '../lib/btcmapAuth'
import { hasNostrExtension } from '../lib/nostr'

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

const BtcMapAuthContext = createContext<Ctx | null>(null)

export function BtcMapAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<BtcMapAuthSession | null>(null)
  const [savedIds, setSavedIds] = useState<Set<number>>(() => new Set(loadLocalSavedIds()))
  const [loading, setLoading] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  const refreshSaved = useCallback(async () => {
    if (!getBtcMapToken()) return
    setLoading(true)
    try {
      const places = await getSavedPlaces()
      setSavedIds(new Set(places.map((p) => p.id)))
    } catch {
      setSavedIds(new Set())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!getBtcMapToken()) return
    let cancelled = false
    getSavedPlaces()
      .then((places) => {
        if (cancelled) return
        setSavedIds(new Set(places.map((p) => p.id)))
      })
      .catch(() => {
        if (cancelled) return
        setSavedIds(new Set(loadLocalSavedIds()))
      })
    return () => { cancelled = true }
  }, [])

  const signIn = useCallback(async () => {
    if (!hasNostrExtension()) {
      window.open('https://nostr.com/get-started', '_blank')
      return false
    }
    setSigningIn(true)
    try {
      const s = await signInBtcMapWithNostr()
      if (!s) return false
      setSession(s)
      await refreshSaved()
      return true
    } finally {
      setSigningIn(false)
    }
  }, [refreshSaved])

  const signOut = useCallback(() => {
    clearBtcMapToken()
    setSession(null)
    setSavedIds(new Set())
  }, [])

  const toggleSave = useCallback(async (placeId: number) => {
    if (!getBtcMapToken()) {
      const wasSaved = savedIds.has(placeId)
      const ids = wasSaved ? removeLocalSavedId(placeId) : addLocalSavedId(placeId)
      setSavedIds(new Set(ids))
      if (session?.npub) void syncSavedMerchantsNostr(session.npub, ids)
      return
    }
    const wasSaved = savedIds.has(placeId)
    const ids = wasSaved ? await removeSavedPlace(placeId) : await addSavedPlace(placeId)
    setSavedIds(new Set(ids))
    if (session?.npub) void syncSavedMerchantsNostr(session.npub, ids)
  }, [savedIds, session])

  const isSaved = useCallback((placeId: number) => savedIds.has(placeId), [savedIds])

  return (
    <BtcMapAuthContext.Provider
      value={{ session, savedIds, loading, signingIn, signIn, signOut, toggleSave, isSaved }}
    >
      {children}
    </BtcMapAuthContext.Provider>
  )
}

export function useBtcMapAuth() {
  const ctx = useContext(BtcMapAuthContext)
  if (!ctx) throw new Error('useBtcMapAuth requires BtcMapAuthProvider')
  return ctx
}