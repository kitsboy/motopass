import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearVerificationHistory,
  loadVerificationHistory,
  recordVerification,
  verificationAnchor,
  verificationFingerprint,
  verificationHistoryStatus,
} from './verificationHistory'

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  })
})

const input = {
  tool: 'psbt',
  title: 'PSBT signature check',
  steps: [
    { label: 'structure', state: 'pass' as const },
    { label: 'signatures', state: 'pass' as const },
    { label: 'broadcast', state: 'unknown' as const },
  ],
  limits: ['A valid signature does not prove broadcast.'],
  fields: { inputs: 1, valid: 2, network: 'testnet' },
}

describe('verification history', () => {
  it('deduplicates the same check and moves it to the top', () => {
    recordVerification(input, new Date('2026-11-10T10:00:00.000Z'))
    recordVerification(
      { ...input, tool: 'nip05', title: 'NIP-05', steps: [{ label: 'domain', state: 'pass' }] },
      new Date('2026-11-10T10:01:00.000Z'),
    )
    recordVerification(input, new Date('2026-11-10T10:02:00.000Z'))

    const history = loadVerificationHistory()
    expect(history).toHaveLength(2)
    expect(history[0].tool).toBe('psbt')
    expect(history[0].generatedAt).toBe('2026-11-10T10:02:00.000Z')
  })

  it('fingerprints fields independent of object key order', () => {
    expect(verificationFingerprint(input)).toBe(
      verificationFingerprint({ ...input, fields: { valid: 2, network: 'testnet', inputs: 1 } }),
    )
    expect(verificationFingerprint(input)).not.toBe(
      verificationFingerprint({ ...input, fields: { inputs: 2 } }),
    )
  })

  it('reports the worst trail state and the card anchor', () => {
    const entry = recordVerification(input)
    expect(verificationHistoryStatus(entry)).toMatchObject({ pass: 2, unknown: 1, fail: 0, tone: 'unknown' })
    expect(verificationAnchor('psbt')).toBe('address-psbt')
    expect(verificationAnchor('bolt12-response')).toBe('bolt12-request')
    expect(verificationAnchor('nip17')).toBe('nip17')
  })

  it('clears persisted history', () => {
    recordVerification(input)
    clearVerificationHistory()
    expect(loadVerificationHistory()).toEqual([])
  })

  it('drops corrupt entries instead of rendering them', () => {
    store.set('motopass-verification-history', JSON.stringify([{ version: 1, app: 'MotoPass' }]))
    expect(loadVerificationHistory()).toEqual([])
  })
})
