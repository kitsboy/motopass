import { afterEach, describe, it, expect, vi } from 'vitest'
import {
  hashApplicationPayload,
  satohashVerifyUrl,
  satohashStampGuideUrl,
  satohashProofVerifyUrl,
  SATOHASH_API_BASE,
  getApiHealth,
  stampHash,
  getStamp,
} from './satohash'

describe('satohash', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('hashes canonical JSON deterministically', async () => {
    const payload = { a: 1, b: 'test' }
    const h1 = await hashApplicationPayload(payload)
    const h2 = await hashApplicationPayload(payload)
    expect(h1).toBe(h2)
    expect(h1).toMatch(/^[a-f0-9]{64}$/)
  })

  it('builds verify and stamp URLs', () => {
    const hash = 'abc123'
    expect(satohashVerifyUrl(hash)).toContain(hash)
    expect(satohashStampGuideUrl(hash)).toContain(hash)
    expect(satohashStampGuideUrl(hash)).toContain('/stamp?hash=')
  })

  it('builds proof verify URL and exposes API base', () => {
    expect(satohashProofVerifyUrl('proof-id-1')).toContain('/verify/proof-id-1')
    expect(SATOHASH_API_BASE).toMatch(/^https?:\/\//)
  })

  it('getApiHealth returns ok when /health is healthy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', details: { version: '3.0.0-PRO' } }),
      }),
    )
    const result = await getApiHealth()
    expect(result.ok).toBe(true)
    expect(result.status).toBe(200)
    expect(result.data).toEqual({ status: 'ok', details: { version: '3.0.0-PRO' } })
    expect(fetch).toHaveBeenCalledWith(
      `${SATOHASH_API_BASE}/health`,
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('getApiHealth returns ok:false when network fails (no throw)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))
    const result = await getApiHealth()
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/Failed to fetch|unreachable/i)
  })

  it('stampHash rejects invalid hash without calling fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const result = await stampHash('not-a-hash')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/64 hex/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('stampHash posts hash and returns proof id on success', async () => {
    const hash = 'a'.repeat(64)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'uuid-1', hash, status: 'pending' }),
      }),
    )
    const result = await stampHash(hash, { filename: 'doc.pdf' })
    expect(result.ok).toBe(true)
    expect(result.id).toBe('uuid-1')
    expect(result.status).toBe('pending')
    expect(fetch).toHaveBeenCalledWith(
      `${SATOHASH_API_BASE}/api/stamp`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Satohash-Client': 'motopass',
        }),
      }),
    )
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string)
    expect(body).toEqual({ hash, filename: 'doc.pdf' })
  })

  it('stampHash sends X-Satohash-Key when apiKey provided', async () => {
    const hash = 'b'.repeat(64)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'uuid-2', status: 'pending' }),
      }),
    )
    await stampHash(hash, { apiKey: 'family-key' })
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Satohash-Key': 'family-key' }),
      }),
    )
  })

  it('stampHash returns ok:false on HTTP error without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' }),
      }),
    )
    const result = await stampHash('c'.repeat(64))
    expect(result.ok).toBe(false)
    expect(result.httpStatus).toBe(503)
    expect(result.error).toMatch(/unavailable|503/i)
  })

  it('stampHash returns ok:false when API is offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('NetworkError')))
    const result = await stampHash('d'.repeat(64))
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('getStamp returns stamp metadata on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'stamp-9',
          hash: 'e'.repeat(64),
          status: 'confirmed',
          filename: 'x.pdf',
          bitcoin_block_height: 900000,
        }),
      }),
    )
    const result = await getStamp('stamp-9')
    expect(result.ok).toBe(true)
    expect(result.id).toBe('stamp-9')
    expect(result.status).toBe('confirmed')
    expect(result.bitcoin_block_height).toBe(900000)
    expect(fetch).toHaveBeenCalledWith(
      `${SATOHASH_API_BASE}/api/stamps/stamp-9`,
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('getStamp returns ok:false when unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const result = await getStamp('missing')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/offline|unreachable/i)
  })
})
