import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchBitcoinBlockHeight } from '../lib/satohash'

type BlockHeightContextValue = {
  height: number | null
}

const BlockHeightContext = createContext<BlockHeightContextValue | null>(null)

const POLL_MS = 120_000

export function BlockHeightProvider({ children }: { children: ReactNode }) {
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    fetchBitcoinBlockHeight().then(setHeight)
    const id = setInterval(() => fetchBitcoinBlockHeight().then(setHeight), POLL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <BlockHeightContext.Provider value={{ height }}>
      {children}
    </BlockHeightContext.Provider>
  )
}

export function useBlockHeight() {
  const ctx = useContext(BlockHeightContext)
  if (!ctx) throw new Error('useBlockHeight must be used within BlockHeightProvider')
  return ctx
}