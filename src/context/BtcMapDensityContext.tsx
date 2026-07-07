import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getProgramDensity, loadDensitySnapshot, type DensitySnapshot, type ProgramDensity } from '../lib/btcmapDensity'

type Ctx = {
  snapshot: DensitySnapshot | null
  loading: boolean
  densityFor: (programName: string) => ProgramDensity | null
}

const BtcMapDensityContext = createContext<Ctx>({
  snapshot: null,
  loading: true,
  densityFor: () => null,
})

export function BtcMapDensityProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DensitySnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadDensitySnapshot()
      .then((s) => { if (!cancelled) setSnapshot(s) })
      .catch(() => { if (!cancelled) setSnapshot(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const densityFor = (programName: string) => getProgramDensity(snapshot, programName)

  return (
    <BtcMapDensityContext.Provider value={{ snapshot, loading, densityFor }}>
      {children}
    </BtcMapDensityContext.Provider>
  )
}

export function useBtcMapDensity(programName?: string) {
  const ctx = useContext(BtcMapDensityContext)
  return {
    ...ctx,
    density: programName ? ctx.densityFor(programName) : null,
  }
}