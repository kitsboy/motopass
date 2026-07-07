import { programCacheSlug } from './btcmapSlug'
import type { BtcMapArea, BtcMapPlace } from './btcmap'

export type BtcMapSnapshot = {
  program: string
  fetchedAt: string
  coord: { lat: number; lon: number; radiusKm: number }
  places: BtcMapPlace[]
  areas: BtcMapArea[]
}

const memory = new Map<string, BtcMapSnapshot | null>()

export async function loadBtcMapSnapshot(programName: string): Promise<BtcMapSnapshot | null> {
  if (memory.has(programName)) return memory.get(programName) ?? null

  const slug = programCacheSlug(programName)
  try {
    const res = await fetch(`/data/btcmap/${slug}.json`)
    if (!res.ok) {
      memory.set(programName, null)
      return null
    }
    const snapshot = (await res.json()) as BtcMapSnapshot
    memory.set(programName, snapshot)
    return snapshot
  } catch {
    memory.set(programName, null)
    return null
  }
}