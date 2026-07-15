import { describe, it, expect } from 'vitest'
import { buildPageVerifyPayload, pageVerifyHref } from './pageVerify'

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
})