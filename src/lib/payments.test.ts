import { describe, it, expect } from 'vitest'
import {
  createPaymentInvoice,
  hasLiveLightning,
  getLightningAddress,
  getOnchainDonationAddress,
} from './payments'

describe('payments', () => {
  it('exposes a Lightning Address with @', () => {
    const addr = getLightningAddress()
    expect(addr).toContain('@')
    expect(hasLiveLightning()).toBe(true)
  })

  it('creates a live Lightning invoice with QR payload', () => {
    const inv = createPaymentInvoice('lightning', 50_000, 'test')
    expect(inv.demo).toBe(false)
    expect(inv.lightningAddress).toContain('@')
    expect(inv.qrPayload).toMatch(/^lightning:/)
    expect(inv.qrPayload).toContain('amount=')
  })

  it('creates on-chain invoice from family donation address', () => {
    const inv = createPaymentInvoice('bitcoin', 100_000, 'test')
    expect(inv.onchainAddress).toBe(getOnchainDonationAddress())
    expect(inv.onchainAddress?.startsWith('bc1')).toBe(true)
    expect(inv.demo).toBe(false)
    expect(inv.qrPayload).toMatch(/^bitcoin:/)
  })

  it('marks bolt12 as demo stub', () => {
    const inv = createPaymentInvoice('bolt12', 10_000, 'test')
    expect(inv.demo).toBe(true)
    expect(inv.bolt12Offer).toBeTruthy()
  })
})
