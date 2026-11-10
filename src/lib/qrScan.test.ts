import { describe, expect, it } from 'vitest'
import { cleanScannedText } from './qrScan'

describe('QR input cleaning', () => {
  it('removes a lightning URI wrapper but preserves the invoice', () => {
    expect(cleanScannedText('  lightning:lnbc1pvjluezpp5  ')).toBe('lnbc1pvjluezpp5')
  })

  it('removes a BIP-21 scheme and query from an address', () => {
    expect(cleanScannedText('bitcoin:bc1qexample?amount=0.01&label=Test')).toBe('bc1qexample')
  })

  it('leaves PSBTs, JSON and bare addresses unchanged', () => {
    expect(cleanScannedText('cHNidP8BAH0CAAAA')).toBe('cHNidP8BAH0CAAAA')
    expect(cleanScannedText('{"kind":1059}')).toBe('{"kind":1059}')
    expect(cleanScannedText('sp1qq')).toBe('sp1qq')
  })
})
