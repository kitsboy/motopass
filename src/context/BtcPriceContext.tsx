import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  BTC_USD_REFERENCE,
  fetchBtcUsdPrice,
  loadPitchAnchorReference,
  type BtcUsdQuote,
} from '../lib/btcPrice'

type BtcPriceContextValue = {
  /** USD per 1 BTC */
  rate: number
  quote: BtcUsdQuote | null
  loading: boolean
  error: boolean
  retry: () => void
}

const BtcPriceContext = createContext<BtcPriceContextValue | null>(null)

const POLL_MS = 300_000
const MAX_BACKOFF_MS = 900_000

export function BtcPriceProvider({ children }: { children: ReactNode }) {
  const [rate, setRate] = useState(BTC_USD_REFERENCE)
  const [quote, setQuote] = useState<BtcUsdQuote | null>(null)
  const [loading, setLoading] = useState(true)
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
      setLoading(true)
      const live = await fetchBtcUsdPrice()
      if (cancelled) return

      if (live) {
        setRate(live.usd)
        setQuote(live)
        setError(false)
        backoffRef.current = POLL_MS
      } else {
        const anchor = await loadPitchAnchorReference()
        if (cancelled) return
        setRate(anchor)
        setQuote({
          usd: anchor,
          source: anchor === BTC_USD_REFERENCE ? 'fallback' : 'pitch-anchor',
          fetchedAt: new Date().toISOString(),
        })
        setError(true)
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS)
      }
      setLoading(false)
      timerRef.current = setTimeout(() => { void tick() }, backoffRef.current)
    }

    void tick()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pollGen])

  return (
    <BtcPriceContext.Provider value={{ rate, quote, loading, error, retry }}>
      {children}
    </BtcPriceContext.Provider>
  )
}

export function useBtcPrice() {
  const ctx = useContext(BtcPriceContext)
  if (!ctx) throw new Error('useBtcPrice must be used within BtcPriceProvider')
  return ctx
}