import { describe, it, expect } from 'vitest'
import { SimplePool } from 'nostr-tools'
import {
  generateZkKeypair,
  saveEncryptedState,
  loadEncryptedState,
  MOTOPASS_STATE_KIND,
  MOTOPASS_STATE_D_TAG,
} from './zkNostrSync'

/**
 * LIVE end-to-end verification against the MotoPass relay on THOR
 * (ws://127.0.0.1:7447). Auto-skips when the relay is not reachable
 * (e.g. CI runners), so the committed suite never flakes on network.
 */
const LOCAL_RELAY = 'ws://127.0.0.1:7447'
const LOCAL_RELAY_HTTP = 'http://127.0.0.1:7447/'

async function isRelayUp(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 2000)
    const res = await fetch(LOCAL_RELAY_HTTP, { signal: ctrl.signal })
    clearTimeout(t)
    return res.ok
  } catch {
    return false
  }
}

const relayUp = await isRelayUp()

describe.skipIf(!relayUp)('MotoPass ZK sync — live relay integration', () => {
  it('publishes + loads encrypted state end-to-end on the local relay', async () => {
    const kp = generateZkKeypair()
    const state = {
      version: 1 as const,
      lang: 'fr',
      displayCurrency: 'EUR',
      recentLangs: ['fr', 'en'],
      updatedAt: Date.now(),
    }
    const id = await saveEncryptedState(state, kp, [LOCAL_RELAY])
    expect(id).toMatch(/^[0-9a-f]{64}$/)
    await new Promise(r => setTimeout(r, 400))
    const loaded = await loadEncryptedState(kp, [LOCAL_RELAY])
    expect(loaded).not.toBeNull()
    expect(loaded?.lang).toBe('fr')
    expect(loaded?.displayCurrency).toBe('EUR')
    expect(loaded?.updatedAt).toBe(state.updatedAt)
  })

  it('stores ciphertext-only on the relay — no plaintext, NIP-44 v2 envelope', async () => {
    const kp = generateZkKeypair()
    const secret = `paige-memory-${Math.random()}`
    const state = {
      version: 1 as const,
      lang: 'en',
      simulator: { note: secret },
      updatedAt: Date.now(),
    }
    await saveEncryptedState(state, kp, [LOCAL_RELAY])
    await new Promise(r => setTimeout(r, 400))

    const pool = new SimplePool()
    try {
      const events = await pool.querySync([LOCAL_RELAY], {
        kinds: [MOTOPASS_STATE_KIND],
        authors: [kp.pubkey],
        '#d': [MOTOPASS_STATE_D_TAG],
      })
      expect(events.length).toBeGreaterThan(0)
      const raw = events[events.length - 1].content
      expect(raw).not.toContain(secret) // plaintext must never reach the relay
      expect(raw).not.toContain('paige-memory')
      expect(raw.length).toBeGreaterThanOrEqual(132) // NIP-44 v2 min base64 length
      // Version byte 0x02 is the FIRST byte → always base64 char 'A'. The second
      // char varies with the random nonce ('g'..'v'), so only assert the version.
      expect(raw[0]).toBe('A')
      expect(raw).toMatch(/^[A-Za-z0-9+/]+={0,2}$/) // valid base64 shape
    } finally {
      pool.close([LOCAL_RELAY])
    }
  })
})
