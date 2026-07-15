import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  btcMapAddVenueUrl,
  btcMapCliRepoUrl,
  btcMapCountryUrl,
  btcMapMapUrl,
  btcMapMerchantUrl,
  btcMapPageUrl,
  getAreasAt,
  searchPlacesNearby,
} from './btcmap'
import { gridClusterPlaces } from './btcmapCluster'
import { placesToCsv } from './btcmapExport'
import { formatCacheAge, cacheFreshnessLevel } from './btcmapFreshness'
import { densityTier } from './btcmapDensity'
import { programCacheSlug } from './btcmapSlug'
import { loadLocalSavedIds, persistLocalSavedIds, syncSavedMerchantsNostr } from './btcmapSavedSync'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('btcmap urls', () => {
  it('builds merchant and country links', () => {
    expect(btcMapMerchantUrl(216)).toBe('https://btcmap.org/merchant/216')
    expect(btcMapCountryUrl('sv')).toBe('https://btcmap.org/country/sv')
    expect(btcMapMapUrl(13.69, -89.22, 10)).toBe('https://btcmap.org/map#10/13.69/-89.22')
    expect(btcMapAddVenueUrl(13.69, -89.22)).toBe('https://btcmap.org/add-location?lat=13.69&lon=-89.22')
    expect(btcMapCliRepoUrl()).toContain('btcmap-cli')
  })

  it('pre-fills program name in add-venue URL (627)', () => {
    expect(btcMapAddVenueUrl(13.69, -89.22, 'El Salvador')).toContain('name=El+Salvador')
  })

  it('builds btcmap page deep links (625)', () => {
    expect(btcMapPageUrl(42)).toBe('/btcmap?program=42')
    expect(btcMapPageUrl('42', 'directory')).toBe('/btcmap?program=42#directory')
  })
})

describe('btcmap helpers', () => {
  it('slugifies program names for cache paths', () => {
    expect(programCacheSlug('El Salvador')).toBe('el-salvador')
    expect(programCacheSlug('UAE (Dubai / Abu Dhabi)')).toBe('uae-dubai-abu-dhabi')
  })

  it('classifies density tiers', () => {
    expect(densityTier(0)).toBe('sparse')
    expect(densityTier(8)).toBe('moderate')
    expect(densityTier(42)).toBe('dense')
  })

  it('exports merchant directory CSV (621)', () => {
    const csv = placesToCsv(
      [{ id: 1, lat: 9, lon: -84, name: 'Cafe "BTC"', address: 'Main St' }],
      'Costa Rica',
    )
    expect(csv.split('\n')[0]).toContain('program,id,name')
    expect(csv).toContain('Costa Rica')
    expect(csv).toContain('"Cafe ""BTC"""')
  })

  it('formats cache freshness age (622)', () => {
    const now = new Date('2026-07-15T12:00:00Z')
    expect(formatCacheAge('2026-07-13T16:02:11.611Z', now)).toBe('1d ago')
    expect(cacheFreshnessLevel('2026-07-01T16:02:11.611Z', now)).toBe('fresh')
  })

  it('clusters pins at low zoom (623)', () => {
    const places = [
      { id: 1, lat: 9.93, lon: -84.09 },
      { id: 2, lat: 9.931, lon: -84.091 },
      { id: 3, lat: 10.5, lon: -84.5 },
    ]
    const clusters = gridClusterPlaces(places, 9)
    expect(clusters).not.toBeNull()
    expect(clusters!.length).toBeLessThan(places.length)
    expect(gridClusterPlaces(places, 12)).toBeNull()
  })

  it('persists saved merchants locally (624)', async () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v) },
      removeItem: (k: string) => { store.delete(k) },
    })
    persistLocalSavedIds([1, 2])
    expect(loadLocalSavedIds()).toEqual([1, 2])
    const stub = await syncSavedMerchantsNostr('npub1test', [1, 2])
    expect(stub.synced).toBe(false)
    expect(stub.reason).toBe('nostr_kind_event_stub')
  })
})

describe('btcmap api', () => {
  it('searchPlacesNearby calls v4 search endpoint', async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, lat: 1, lon: 2, name: 'Test Cafe' }],
    })
    vi.stubGlobal('fetch', mock)

    const places = await searchPlacesNearby({ lat: 13.69, lon: -89.22, radiusKm: 50, limit: 5 })
    expect(places).toHaveLength(1)
    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('/v4/places/search/'),
      expect.objectContaining({ headers: expect.any(Headers) }),
    )
    expect(mock.mock.calls[0][0]).toContain('radius_km=50')
  })

  it('getAreasAt resolves country areas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 600, name: 'El Salvador', type: 'country', url_alias: 'sv', icon: null, website_url: 'https://btcmap.org/country/sv' }],
    }))

    const areas = await getAreasAt(13.69, -89.22)
    expect(areas[0].url_alias).toBe('sv')
  })
})