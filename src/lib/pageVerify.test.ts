import { describe, it, expect } from 'vitest'
import { buildPageVerifyPayload, pageVerifyHref, routeHashFromSearch } from './pageVerify'

describe('pageVerify', () => {
  it('builds canonical page verify payload', () => {
    expect(buildPageVerifyPayload('/vault', '2026.07.15-48')).toEqual({
      page: '/vault',
      build: '2026.07.15-48',
      platform: 'MotoPass',
    })
  })

  it('builds verify href with path and build query params', () => {
    expect(pageVerifyHref('/programs', '2026.07.15-48')).toBe(
      '/verify?path=%2Fprograms&build=2026.07.15-48',
    )
  })

  it('includes hash in verify href when provided', () => {
    expect(pageVerifyHref('/apply', '2026.07.15-48', 'abc123')).toBe(
      '/verify?path=%2Fapply&build=2026.07.15-48&hash=abc123',
    )
  })

  it('extracts hash or proof from route search', () => {
    expect(routeHashFromSearch('?hash=deadbeef')).toBe('deadbeef')
    expect(routeHashFromSearch('?proof=beefdead')).toBe('beefdead')
    expect(routeHashFromSearch('')).toBeNull()
  })
})