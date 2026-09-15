import { createContext, useContext } from 'react'
import type { DisplayCurrency, FiatCode, FxQuote, Priced } from '../lib/fx'

export interface DisplayCurrencyContextValue {
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

/**
 * Context object + consumer hook only — the provider (and its FX polling) lives
 * in `./DisplayCurrencyProvider`. See the note in ThemeContext.tsx for why:
 * `react-refresh/only-export-components`, with consumer import paths unchanged.
 */
export const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(null)

export function useDisplayCurrency() {
  const ctx = useContext(DisplayCurrencyContext)
  if (!ctx) throw new Error('useDisplayCurrency must be used within DisplayCurrencyProvider')
  return ctx
}
