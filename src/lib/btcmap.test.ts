import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  btcMapAddVenueUrl,
  btcMapCliRepoUrl,
  btcMapCountryUrl,
  btcMapMapUrl,
  btcMapMerchantUrl,
  getAreasAt,
  searchPlacesNearby,
} from './btcmap'
import { densityTier } from './btcmapDensity'
import { programCacheSlug } from './btcmapSlug'

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