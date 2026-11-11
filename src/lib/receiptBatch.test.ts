import { describe, expect, it } from 'vitest'
import {
  buildReceiptShareLink,
  buildVerificationReceipt,
  encodeVerificationReceipt,
  parseReceiptShareHash,
} from './verificationReceipt'
import { parseReceiptBatch, serializeReceiptBatch } from './receiptBatch'

function receipt(title: string) {
  return buildVerificationReceipt(
    {
      tool: 'bolt11',
      title,
      steps: [{ label: 'checksum', state: 'pass' }],
      limits: ['Not proof of payment.'],
      fields: { amount: '1000' },
    },
    new Date('2026-11-10T12:34:56.000Z'),
  )
}

describe('receipt batch', () => {
  it('checks receipt objects and links without fetching anything', () => {
    const first = receipt('Invoice A')
    const link = buildReceiptShareLink(receipt('Invoice B'), 'https://motopass.example')
    expect(link.ok).toBe(true)
    if (!link.ok) return
    const result = parseReceiptBatch(JSON.stringify([first, link.url, 'not a receipt']))
    expect(result.verified).toBe(2)
    expect(result.errors).toBe(1)
    expect(result.rows[1].hashMatches).toBe(true)
    expect(result.rows[0].hashMatches).toBe(null)
  })

  it('marks a link whose payload no longer matches its digest as edited', () => {
    const original = receipt('Invoice A')
    const link = buildReceiptShareLink(original, 'https://motopass.example')
    expect(link.ok).toBe(true)
    if (!link.ok) return
    const params = new URLSearchParams(new URL(link.url).hash.slice(1))
    const edited = encodeVerificationReceipt({ ...original, title: 'Invoice A edited' })
    const tampered = `https://motopass.example/tools/receipt#r=${edited}&h=${params.get('h')}`
    expect(parseReceiptShareHash(new URL(tampered).hash).ok).toBe(true)
    const result = parseReceiptBatch(JSON.stringify({ receipts: [tampered] }))
    expect(result.edited).toBe(1)
    expect(result.rows[0].status).toBe('edited')
  })

  it('rejects malformed and oversized batches', () => {
    expect(parseReceiptBatch('{bad').errors).toBe(1)
    expect(parseReceiptBatch('{"rows":[]}').errors).toBe(1)
    const result = parseReceiptBatch(JSON.stringify([]))
    expect(result.verified).toBe(0)
    expect(serializeReceiptBatch(result)).toContain('verification-receipt-batch')
  })
})
