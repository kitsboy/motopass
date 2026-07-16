import { describe, it, expect, vi } from 'vitest'

describe('nostr relay config', () => {
  it('uses VITE_NOSTR_RELAY when set', async () => {
    vi.stubEnv('VITE_NOSTR_RELAY', 'wss://custom.relay.test')
    vi.resetModules()
    const { getPrimaryNostrRelay, MOTOPASS_RELAYS } = await import('./nostr')
    expect(getPrimaryNostrRelay()).toBe('wss://custom.relay.test')
    expect(MOTOPASS_RELAYS[0]).toBe('wss://custom.relay.test')
    vi.unstubAllEnvs()
  })
})