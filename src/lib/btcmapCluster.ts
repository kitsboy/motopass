import type { BtcMapPlace } from './btcmap'

export type BtcMapCluster = {
  key: string
  lat: number
  lon: number
  count: number
  places: BtcMapPlace[]
}

/** Grid cell size in degrees — coarser cells at lower zoom (item 623). */
export function clusterCellDeg(zoom: number): number {
  if (zoom <= 7) return 0.45
  if (zoom <= 8) return 0.28
  if (zoom <= 9) return 0.16
  if (zoom <= 10) return 0.09
  return 0.045
}

/** Simple grid clustering for Leaflet pins at high zoom-out. */
export function gridClusterPlaces(places: BtcMapPlace[], zoom: number, threshold = 11): BtcMapCluster[] | null {
  if (zoom >= threshold || places.length < 2) return null

  const cell = clusterCellDeg(zoom)
  const buckets = new Map<string, BtcMapPlace[]>()

  for (const p of places) {
    const latKey = Math.floor(p.lat / cell)
    const lonKey = Math.floor(p.lon / cell)
    const key = `${latKey}:${lonKey}`
    const list = buckets.get(key) ?? []
    list.push(p)
    buckets.set(key, list)
  }

  return [...buckets.entries()].map(([key, group]) => {
    const lat = group.reduce((s, p) => s + p.lat, 0) / group.length
    const lon = group.reduce((s, p) => s + p.lon, 0) / group.length
    return { key, lat, lon, count: group.length, places: group }
  })
}