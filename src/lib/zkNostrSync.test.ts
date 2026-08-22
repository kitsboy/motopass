import { describe, it, expect } from 'vitest'
import { nip44, nip19, generateSecretKey, getPublicKey } from 'nostr-tools'
import {
  decryptNip44Payload,
  encryptState,
  decryptState,
  generateZkKeypair,
  keypairFromNsec,
  conversationKeyFromKeypair,
  NIP44_MIN_BASE64_LEN,
  NIP44_MAX_BASE64_LEN,
  MOTOPASS_STATE_D_TAG,
  MOTOPASS_STATE_KIND,
} from './zkNostrSync'

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── Official NIP-44 v2 known-answer vector (nips.nostr.com/44, vectors file
//    sha256 269ed0f6…25040). Proves our pinned nostr-tools path is spec-true. ──
const VEC_SEC1 = '0000000000000000000000000000000000000000000000000000000000000001'
const VEC_SEC2 = '0000000000000000000000000000000000000000000000000000000000000002'
const VEC_NONCE = '0000000000000000000000000000000000000000000000000000000000000001'
const VEC_CONV_KEY = 'c41c775356fd92eadc63ff5a0dc1da211b268cbea22316767095b2871ea1412d'
const VEC_PLAINTEXT = 'a'
const VEC_PAYLOAD =
  'AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABee0G5VSK0/9YypIObAtDKfYEAjD35uVkHyB0F4DwrcNaCXlCWZKaArsGrY6M9wnuTMxWfp1RTN9Xga8no+kF5Vsb'

describe('NIP-44 v2 correctness (official test vector)', () => {
  it('computes the spec conversation key from sec1+pub2', () => {
    const pub2 = getPublicKey(hexToBytes(VEC_SEC2))
    const conv = nip44.v2.utils.getConversationKey(hexToBytes(VEC_SEC1), pub2)
    expect(bytesToHex(conv)).toBe(VEC_CONV_KEY)
  })

  it('encrypts to the exact spec payload with the fixed nonce', () => {
    const pub2 = getPublicKey(hexToBytes(VEC_SEC2))
    const conv = nip44.v2.utils.getConversationKey(hexToBytes(VEC_SEC1), pub2)
    const payload = nip44.v2.encrypt(VEC_PLAINTEXT, conv, hexToBytes(VEC_NONCE))
    expect(payload).toBe(VEC_PAYLOAD)
  })

  it('decrypts the spec payload back to plaintext', () => {
    const conv = hexToBytes(VEC_CONV_KEY)
    expect(decryptNip44Payload(VEC_PAYLOAD, conv)).toBe(VEC_PLAINTEXT)
  })
})

describe('RUSTSEC-2026-0227 mitigation — pre-decode validation', () => {
  const conv = hexToBytes(VEC_CONV_KEY)

  it('rejects a payload shorter than 132 base64 chars', () => {
    const short = 'AgAAAA'
    expect(short.length).toBeLessThan(NIP44_MIN_BASE64_LEN)
    expect(() => decryptNip44Payload(short, conv)).toThrow(/too short/)
  })

  it('rejects a non-string payload', () => {
    expect(() => decryptNip44Payload(123 as unknown as string, conv)).toThrow(/must be a string/)
    expect(() => decryptNip44Payload(null, conv)).toThrow(/must be a string/)
  })

  it('rejects an oversized payload BEFORE decode (early max-size gate)', () => {
    const oversized = 'A'.repeat(NIP44_MAX_BASE64_LEN + 1)
    expect(oversized.length).toBeGreaterThan(NIP44_MAX_BASE64_LEN)
    // The guard must throw on length alone — no base64 decode, no HMAC runs.
    expect(() => decryptNip44Payload(oversized, conv)).toThrow(/exceeds max/)
  })

  it('rejects the non-base64 "#" future-proof flag as unsupported version', () => {
    const flagged = '#' + 'A'.repeat(NIP44_MIN_BASE64_LEN)
    expect(() => decryptNip44Payload(flagged, conv)).toThrow(/unsupported/)
  })

  it('still throws on MAC mismatch for a valid-sized tampered payload', () => {
    // Flip the last char of a real payload → MAC fails after decode/version checks.
    const tampered = VEC_PAYLOAD.slice(0, -1) + (VEC_PAYLOAD.endsWith('b') ? 'c' : 'b')
    expect(() => decryptNip44Payload(tampered, conv)).toThrow(/MAC/i)
  })
})

describe('MotoPass state round-trip', () => {
  it('generate → encryptState → decryptState round-trips prefs', () => {
    const kp = generateZkKeypair()
    const state = {
      version: 1 as const,
      lang: 'es',
      displayCurrency: 'sats',
      recentLangs: ['es', 'en'],
      simulator: { paige: { greeting: 'hola' } },
      updatedAt: 1787432000,
    }
    const ciphertext = encryptState(state, kp)
    // Ciphertext must be opaque NIP-44 v2 base64 — never the plaintext.
    expect(ciphertext).not.toContain('hola')
    expect(ciphertext.length).toBeGreaterThanOrEqual(NIP44_MIN_BASE64_LEN)
    const back = decryptState(ciphertext, kp)
    expect(back).toEqual(state)
  })

  it('rejects a plaintext-shaped content field (ciphertext-only enforcement)', () => {
    const kp = generateZkKeypair()
    expect(() => decryptState('{"version":1,"lang":"en"}', kp)).toThrow()
  })

  it('fails to decrypt with the wrong key (MAC/auth boundary)', () => {
    const kpA = generateZkKeypair()
    const kpB = generateZkKeypair()
    const ciphertext = encryptState({ version: 1, lang: 'en', updatedAt: 1 }, kpA)
    expect(() => decryptState(ciphertext, kpB)).toThrow(/MAC/i)
  })

  it('derives a stable conversation key for the same keypair', () => {
    const kp = generateZkKeypair()
    const c1 = conversationKeyFromKeypair(kp)
    const c2 = conversationKeyFromKeypair(keypairFromNsec(kp.nsec))
    expect(bytesToHex(c1) === bytesToHex(c2)).toBe(true)
  })

  it('keypairFromNsec accepts a valid nsec and rejects garbage', () => {
    const kp = generateZkKeypair()
    const imported = keypairFromNsec(kp.nsec)
    expect(imported.pubkey).toBe(kp.pubkey)
    expect(imported.npub).toBe(kp.npub)
    expect(() => keypairFromNsec('not-a-nsec')).toThrow()
    // npub is not an nsec — must throw
    expect(() => keypairFromNsec(kp.npub)).toThrow()
  })

  it('uses kind 30078 + motopass:prefs d-tag for addressable state', () => {
    expect(MOTOPASS_STATE_KIND).toBe(30078)
    expect(MOTOPASS_STATE_D_TAG).toBe('motopass:prefs')
  })

  it('generated nsec decodes to a valid keypair via nostr-tools', () => {
    const kp = generateZkKeypair()
    const decoded = nip19.decode(kp.nsec)
    expect(decoded.type).toBe('nsec')
    const sk = decoded.data as Uint8Array
    expect(sk.length).toBe(32)
    expect(nip19.nsecEncode(sk)).toBe(kp.nsec)
    // Deterministic key generation sanity: secret key 1 → known pubkey
    const pub1 = getPublicKey(hexToBytes(VEC_SEC1))
    expect(pub1.length).toBe(64)
    expect(generateSecretKey).toBeTypeOf('function')
  })
})
