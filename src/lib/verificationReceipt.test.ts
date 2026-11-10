import { describe, expect, it } from 'vitest'
import {
  buildReceiptShareLink,
  buildVerificationReceipt,
  encodeVerificationReceipt,
  parseReceiptShareHash,
  parseVerificationReceipt,
  serializeVerificationReceipt,
  verificationReceiptDigest,
  verificationReceiptFilename,
} from './verificationReceipt'

describe('verification receipts', () => {
  it('records every step, its limit and a fixed timestamp', () => {
    const receipt = buildVerificationReceipt(
      {
        tool: 'psbt',
        title: 'PSBT signature check',
        steps: [
          { label: 'structure', state: 'pass' },
          { label: 'signatures', state: 'pass', detail: '2 valid' },
          { label: 'broadcast', state: 'unknown' },
        ],
        limits: ['A valid signature does not prove broadcast.'],
        fields: { inputs: 1, valid: 2, mainnet: true },
      },
      new Date('2026-11-10T12:34:56.000Z'),
    )
    expect(receipt).toMatchObject({
      version: 1,
      app: 'MotoPass',
      tool: 'psbt',
      generatedAt: '2026-11-10T12:34:56.000Z',
    })
    expect(receipt.steps).toHaveLength(3)
    expect(receipt.limits).toContain('A valid signature does not prove broadcast.')
    expect(receipt.fields).toMatchObject({ inputs: 1, valid: 2, mainnet: true })
    expect(serializeVerificationReceipt(receipt).endsWith('\n')).toBe(true)
  })

  it('does not leak caller arrays into the receipt', () => {
    const steps = [{ label: 'format', state: 'pass' as const }]
    const receipt = buildVerificationReceipt({ tool: 'x', title: 'X', steps, limits: ['limit'] })
    steps.push({ label: 'mutated', state: 'pass' })
    expect(receipt.steps).toHaveLength(1)
  })

  it('builds a filesystem-safe filename', () => {
    expect(verificationReceiptFilename('PSBT / signature', new Date('2026-11-10T12:34:56.000Z'))).toBe(
      'motopass-psbt-signature-2026-11-10T12-34-56.json',
    )
  })

  it('hashes a canonical receipt independently of field insertion order', () => {
    const base = buildVerificationReceipt(
      {
        tool: 'bolt11',
        title: 'Invoice decode',
        steps: [{ label: 'checksum', state: 'pass' }],
        limits: ['Not proof of payment.'],
        fields: { b: 2, a: 1 },
      },
      new Date('2026-11-10T12:34:56.000Z'),
    )
    const reordered = { ...base, fields: { a: 1, b: 2 } }
    expect(verificationReceiptDigest(base)).toBe(verificationReceiptDigest(reordered))
    expect(verificationReceiptDigest(base)).toMatch(/^[a-f0-9]{64}$/)
  })

  it('round-trips a share link and detects a payload edit against the carried digest', () => {
    const receipt = buildVerificationReceipt(
      {
        tool: 'message-signature',
        title: 'BIP-322 signed-message check',
        steps: [{ label: 'signature', state: 'pass' }],
        limits: ['Not proof of payment.'],
        fields: { addressType: 'P2TR' },
      },
      new Date('2026-11-10T12:34:56.000Z'),
    )
    const link = buildReceiptShareLink(receipt, 'https://motopass.example')
    expect(link.ok).toBe(true)
    if (!link.ok) return

    const parsed = parseReceiptShareHash(new URL(link.url).hash)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.receipt.title).toBe(receipt.title)
    expect(parsed.hashMatches).toBe(true)

    const params = new URLSearchParams(new URL(link.url).hash.slice(1))
    const edited = encodeVerificationReceipt({ ...parsed.receipt, title: 'Edited after sharing' })
    const tampered = parseReceiptShareHash(`#r=${edited}&h=${params.get('h')}`)
    expect(tampered.ok).toBe(true)
    if (tampered.ok) expect(tampered.hashMatches).toBe(false)
  })

  it('rejects malformed or oversized receipt shapes before rendering', () => {
    expect(parseVerificationReceipt({ version: 2 }).ok).toBe(false)
    expect(parseVerificationReceipt({ version: 1, app: 'MotoPass' }).ok).toBe(false)
    expect(parseReceiptShareHash('#h=abc').ok).toBe(false)
  })
})
