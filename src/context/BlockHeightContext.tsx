import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { fetchBitcoinBlockHeight } from '../lib/satohash'

type BlockHeightContextValue = {
  height: number | null
  error: boolean
  retry: () => void
}

const BlockHeightContext = createContext<BlockHeightContextValue | null>(null)

const POLL_MS = 120_000
const MAX_BACKOFF_MS = 480_000

export function BlockHeightProvider({ children }: { children: ReactNode }) {
  const [height, setHeight] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const [pollGen, setPollGen] = useState(0)
  const backoffRef = useRef(POLL_MS)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const retry = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    backoffRef.current = POLL_MS
    setPollGen((g) => g + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      const next = await fetchBitcoinBlockHeight()
      if (cancelled) return
      if (next != null) {
        setHeight(next)
        setError(false)
        backoffRef.current = POLL_MS
      } else {
        setError(true)
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS)
      }
      timerRef.current = setTimeout(() => { void tick() }, backoffRef.current)
    }

    void tick()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pollGen])

  return (
    <BlockHeightContext.Provider value={{ height, error, retry }}>
      {children}
    </BlockHeightContext.Provider>
  )
}

export function useBlockHeight() {
  const ctx = useContext(BlockHeightContext)
  if (!ctx) throw new Error('useBlockHeight must be used within BlockHeightProvider')
  return ctx
}