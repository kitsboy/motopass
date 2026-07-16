import { useCallback, useEffect, useState } from 'react'
import { clearPortfolio, loadPortfolio, movePortfolioItem, reorderPortfolio, PORTFOLIO_KEY, togglePortfolio } from '../lib/portfolioStorage'

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<number[]>(() => loadPortfolio())

  const refresh = useCallback(() => setPortfolio(loadPortfolio()), [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PORTFOLIO_KEY || e.key === null) refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  const toggle = useCallback((id: number) => {
    const next = togglePortfolio(id)
    setPortfolio(next)
    return next
  }, [])

  const clearAll = useCallback(() => {
    const next = clearPortfolio()
    setPortfolio(next)
    return next
  }, [])

  const moveItem = useCallback((id: number, direction: 'up' | 'down') => {
    const next = movePortfolioItem(id, direction)
    setPortfolio(next)
    return next
  }, [])

  const reorder = useCallback((ids: number[]) => {
    const next = reorderPortfolio(ids)
    setPortfolio(next)
    return next
  }, [])

  return { portfolio, setPortfolio, toggle, clearAll, moveItem, reorder, refresh }
}