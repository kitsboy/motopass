/**
 * BTC Map API client — https://api.btcmap.org (v4 REST)
 * Docs: https://github.com/teambtcmap/btcmap-api/tree/master/docs/rest/v4
 */

import { getBtcMapToken } from './btcmapAuth'

const API_BASE = import.meta.env.VITE_BTCMAP_API_URL || 'https://api.btcmap.org'
const WEB_BASE = import.meta.env.VITE_BTCMAP_WEB_URL || 'https://btcmap.org'
const CLI_REPO = 'https://github.com/teambtcmap/btcmap-cli'

export type BtcMapPlace = {
  id: number
  lat: number
  lon: number
  name?: string
  icon?: string
  address?: string
  verified_at?: string
  website?: string
}

export type BtcMapArea = {
  id: number
  name: string
  type: string
  url_alias: string
  icon: string | null
  website_url: string
  description?: string
}

type SearchParams = {
  lat: number
  lon: number
  radiusKm?: number
  limit?: number
}

async function btcmapFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getBtcMapToken()
  const headers = new Headers(init?.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`BTC Map API ${res.status}: ${body.slice(0, 120)}`)
  }
  return res.json() as Promise<T>
}

/** Nearby Bitcoin-accepting merchants (v4 places search). */
export async function searchPlacesNearby({
  lat,
  lon,
  radiusKm = 40,
  limit = 24,
}: SearchParams): Promise<BtcMapPlace[]> {
  const q = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radius_km: String(radiusKm),
  })
  const places = await btcmapFetch<BtcMapPlace[]>(`/v4/places/search/?${q}`)
  return places.slice(0, limit)
}

/** Country + community areas containing a coordinate. */
export async function getAreasAt(lat: number, lon: number): Promise<BtcMapArea[]> {
  const q = new URLSearchParams({ lat: String(lat), lon: String(lon) })
  return btcmapFetch<BtcMapArea[]>(`/v4/areas?${q}`)
}

/** Resolve area by numeric id or url alias (e.g. "sv"). */
export async function getArea(idOrAlias: string | number): Promise<BtcMapArea | null> {
  try {
    return await btcmapFetch<BtcMapArea>(`/v4/areas/${idOrAlias}`)
  } catch {
    return null
  }
}

export function btcMapMerchantUrl(id: number): string {
  return `${WEB_BASE}/merchant/${id}`
}

export function btcMapCountryUrl(alias: string): string {
  return `${WEB_BASE}/country/${alias}`
}

export function btcMapCommunityUrl(alias: string): string {
  return `${WEB_BASE}/community/${alias}`
}

/** Deep-link into the live BTC Map web app centered on a jurisdiction. */
export function btcMapMapUrl(lat: number, lon: number, zoom = 11): string {
  return `${WEB_BASE}/map#${zoom}/${lat}/${lon}`
}

export function btcMapAttribution(): { map: string; data: string; api: string } {
  return {
    map: WEB_BASE,
    data: 'OpenStreetMap',
    api: 'https://github.com/teambtcmap/btcmap-api',
  }
}

/** btcmap.org web flow for community-submitted venues. */
export function btcMapAddVenueUrl(lat?: number, lon?: number): string {
  if (lat != null && lon != null) {
    return `${WEB_BASE}/add-location?lat=${lat}&lon=${lon}`
  }
  return `${WEB_BASE}/add-location`
}

export function btcMapCliRepoUrl(): string {
  return CLI_REPO
}

/** Saved places — requires Nostr sign-in (Bearer token). */
export async function getSavedPlaces(): Promise<BtcMapPlace[]> {
  return btcmapFetch<BtcMapPlace[]>('/v4/places/saved')
}

export async function addSavedPlace(placeId: number): Promise<number[]> {
  return btcmapFetch<number[]>('/v4/places/saved', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: String(placeId),
  })
}

export async function removeSavedPlace(placeId: number): Promise<number[]> {
  return btcmapFetch<number[]>(`/v4/places/saved/${placeId}`, { method: 'DELETE' })
}