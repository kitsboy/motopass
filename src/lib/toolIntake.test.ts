import { describe, expect, it } from 'vitest'
import { detectTool } from './toolIntake'

const BOLT11 =
  'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpu9qrsgquk0rl77nj30yxdy8j9vdx85fkpmdla2087ne0xh8nhedh8w27ky0ke0nmw9wqj9d7c8qk786x8f7n0hq2f8h4z8k7wq3n0x8m0t'

describe('detectTool', () => {
  it('detects BOLT11, BOLT12, PSBT and address artifacts', () => {
    expect(detectTool(BOLT11)).toMatchObject({ id: 'bolt11' })
    expect(detectTool('lno1pqps7sjqpgtyzm3qv4uxzmtsd3jjqer9wd3hy6tsw35k7msjzfpy7nz5yqcnygrfdej82um5wf5k2uckyypwsrygh695rs0n9')).toMatchObject({ id: 'bolt12' })
    expect(detectTool('cHNidP8BAHUCAAAAAA==')).toMatchObject({ id: 'address-psbt' })
    expect(detectTool('bc1q9vza2e8x573nczrlzms0wvx3gsqjx7vavgkx0l')).toMatchObject({ id: 'address-psbt' })
  })

  it('routes receipt-shaped Nostr events to the matching card', () => {
    expect(detectTool('{"kind":9735,"tags":[]}')).toMatchObject({ id: 'zap' })
    expect(detectTool('{"kind":1059,"tags":[]}')).toMatchObject({ id: 'nip17' })
    expect(detectTool('{"kind":30078,"tags":[]}')).toMatchObject({ id: 'receipt' })
  })

  it('reports a Lightning address as both LNURL and NIP-05 rather than guessing', () => {
    const detection = detectTool('name@example.com')
    expect(detection).toMatchObject({ id: 'lnurl', label: 'Lightning address' })
    expect(detection?.alternates).toEqual([{ id: 'nip05', label: 'NIP-05 name' }])
  })

  it('detects signed-message proofs and returns null for unknown text', () => {
    expect(detectTool('smpAkcwRAIg')).toMatchObject({ id: 'message-signature' })
    expect(detectTool('fulAAAA')).toMatchObject({ id: 'message-signature' })
    expect(detectTool('pofAAAA')).toMatchObject({ id: 'message-signature' })
    expect(detectTool('hello, this is not an artifact')).toBe(null)
    expect(detectTool('   ')).toBe(null)
  })
})
