import { describe, expect, it } from 'vitest'
import {
  buildVerificationReceipt,
  serializeVerificationReceipt,
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
})
