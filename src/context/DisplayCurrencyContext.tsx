import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { BTC_USD_AT_CAPTURE } from '../data/btcPriceAtCapture'
import {
  FIATS,
  resolveFxRate,
  priceForDisplay,
  type DisplayCurrency,
  type FiatCode,
  type FxQuote,
  type Priced,
} from '../lib/fx'

const STORAGE_KEY = 'motopass-currency'

/** BTC-first default: display in sats. Fiat is always opt-in and overridable. */
const DEFAULT_CURRENCY: DisplayCurrency = 'SAT'

/** Per-language default fiat suggestion — surfaced as a hint, NEVER auto-applied, always overridable. */
const LANG_SUGGEST: Partial<Record<string, FiatCode>> = {
  en: 'USD',
  fr: 'EUR',
  es: 'EUR',
  pt: 'EUR',
  de: 'EUR',
  ja: 'JPY',
  hi: 'INR',
  zh: 'USD',
  ar: 'EUR',
  sw: 'USD',
}

interface DisplayCurrencyContextValue {
  currency: DisplayCurrency
  /** The fiat suggested for the current language (null when none / already explicit). */
  suggested: FiatCode | null
  setCurrency: (c: DisplayCurrency) => void
  /** FX quote for the ACTIVE currency when it is a fiat; null otherwise. */
  fx: FxQuote | null
  fxLoading: boolean
  /** True while a fiat conversion is running a fallback to a stale/absent source. */
  fxDegraded: boolean
  refreshFx: () => void
  /** Price a stored USD figure in the active display currency (BTC-first, honest staleness). */
  priceFor: (usd: number) => Priced
}

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(null)

const FX_REFRESH_MS = 5 * 60 * 1000
const FX_BACKOFF_MAX_MS = 15 * 60 * 1000

function readStored(): DisplayCurrency {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'BTC' || saved === 'SAT') return saved
    if (FIATS.some((f) => f.code === saved)) return saved as FiatCode
  } catch {
    /* ignore */
  }
  return DEFAULT_CURRENCY
}

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const { lang } = useI18n()
  const [currency, setCurrencyState] = useState<DisplayCurrency>(readStored)
  const [quotes, setQuotes] = useState<Partial<Record<FiatCode, FxQuote>>>({})
  const [fxLoading, setFxLoading] = useState(true)
  const [fxDegraded, setFxDegraded] = useState(false)
  const [gen, setGen] = useState(0)
  const backoffRef = useRef(FX_REFRESH_MS)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setCurrency = useCallback((c: DisplayCurrency) => {
    setCurrencyState(c)
    try {
      localStorage.setItem(STORAGE_KEY, c)
    } catch {
      /* private mode — keep in-memory only */
    }
  }, [])

  const refreshFx = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    backoffRef.current = FX_REFRESH_MS
    setGen((g) => g + 1)
  }, [])

  // Fetch FX ONLY when a fiat display currency is actually active. The default
  // is BTC-first (SAT/BTC), which needs NO fiat rates — so on a normal load we
  // skip the coingecko/ECB/snapshot round-trips entirely (previously all 8 fiat
  // chains fired on every page, hammering api.coingecko.com for nothing).
  // When the user opts into a fiat, we fetch then. This keeps the live-FX
  // machinery intact while removing it from the first-paint critical path.
  const isFiatActive = currency !== 'BTC' && currency !== 'SAT'

  useEffect(() => {
    if (!isFiatActive) {
      // No fiat active — nothing to fetch. fx stays null; the BTC/sats figures
      // are anchored to btc_price_at_capture and need no network.
      setFxLoading(false)
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    let cancelled = false

    const tick = async () => {
      setFxLoading(true)
      const results = await Promise.all(
        FIATS.map(async (f) => {
          const q = await resolveFxRate(f.code)
          return q
        }),
      )
      if (cancelled) return
      const next: Partial<Record<FiatCode, FxQuote>> = {}
      let degraded = false
      for (const q of results) {
        next[q.currency] = q
        if (q.missing || q.stale) degraded = true
      }
      setQuotes(next)
      setFxDegraded(degraded)
      setFxLoading(false)
      backoffRef.current = degraded ? Math.min(backoffRef.current * 2, FX_BACKOFF_MAX_MS) : FX_REFRESH_MS
      timerRef.current = setTimeout(() => {
        void tick()
      }, backoffRef.current)
    }

    void tick()
    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [gen, isFiatActive])

  const fx = currency !== 'BTC' && currency !== 'SAT' ? (quotes[currency] ?? null) : null

  const priceFor = useCallback(
    (usd: number): Priced => priceForDisplay(usd, BTC_USD_AT_CAPTURE, currency, fx),
    [currency, fx],
  )

  const suggested: FiatCode | null = useMemo(() => {
    // Only suggest when the user hasn't explicitly chosen (BTC-first default or 'system').
    const explicit = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY)
      } catch {
        return null
      }
    })()
    if (explicit) return null
    return LANG_SUGGEST[lang] ?? null
  }, [lang])

  const value = useMemo<DisplayCurrencyContextValue>(
    () => ({ currency, suggested, setCurrency, fx, fxLoading, fxDegraded, refreshFx, priceFor }),
    [currency, suggested, setCurrency, fx, fxLoading, fxDegraded, refreshFx, priceFor],
  )

  return <DisplayCurrencyContext.Provider value={value}>{children}</DisplayCurrencyContext.Provider>
}

export function useDisplayCurrency() {
  const ctx = useContext(DisplayCurrencyContext)
  if (!ctx) throw new Error('useDisplayCurrency must be used within DisplayCurrencyProvider')
  return ctx
}
