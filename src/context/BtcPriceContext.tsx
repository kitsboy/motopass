import { createContext, useContext } from 'react'
import type { BtcUsdQuote } from '../lib/btcPrice'

type BtcPriceContextValue = {
  /** USD per 1 BTC */
  rate: number
  quote: BtcUsdQuote | null
  loading: boolean
  error: boolean
  retry: () => void
}

/**
 * Context object + consumer hook only — the provider lives in
 * `./BtcPriceProvider` (see the note in ThemeContext.tsx for why:
 * `react-refresh/only-export-components`, with consumer import paths unchanged).
 */
export const BtcPriceContext = createContext<BtcPriceContextValue | null>(null)

export function useBtcPrice() {
  const ctx = useContext(BtcPriceContext)
  if (!ctx) throw new Error('useBtcPrice must be used within BtcPriceProvider')
  return ctx
}
