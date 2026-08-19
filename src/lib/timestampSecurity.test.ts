import { describe, expect, it } from 'vitest'
import {
  isAllowedSatohashUrl,
  normalizeSha256,
  sanitizeOtsPath,
  sanitizeStampId,
  signedEventMatchesTemplate,
  validateTimestampTemplate,
} from './timestampSecurity'

describe('timestampSecurity', () => {
  it('accepts only 64-hex SHA-256', () => {
    expect(normalizeSha256('AA'.repeat(32))).toBe('aa'.repeat(32))
    expect(normalizeSha256('not-a-hash')).toBeNull()
    expect(normalizeSha256('ab'.repeat(31))).toBeNull()
  })

  it('allowlists Satohash HTTPS origins and rejects schemes', () => {
    expect(isAllowedSatohashUrl('https://satohash.io/verify/abc')).toBe(true)
    expect(isAllowedSatohashUrl('https://satohash.io/stamp?hash=' + 'aa'.repeat(32))).toBe(true)
    expect(isAllowedSatohashUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedSatohashUrl('https://evil.example/verify/x')).toBe(false)
    expect(isAllowedSatohashUrl('http://satohash.io/verify/x')).toBe(false)
    expect(isAllowedSatohashUrl('https://user:pass@satohash.io/verify/x')).toBe(false)
  })

  it('only allows relative /proofs/*.ots paths', () => {
    expect(sanitizeOtsPath('/proofs/uruguay.ots')).toBe('/proofs/uruguay.ots')
    expect(sanitizeOtsPath('proofs/uruguay.ots')).toBe('/proofs/uruguay.ots')
    expect(sanitizeOtsPath('../etc/passwd.ots')).toBeNull()
    expect(sanitizeOtsPath('https://evil/x.ots')).toBeNull()
    expect(sanitizeOtsPath('javascript:alert(1)')).toBeNull()
  })

  it('rejects stamp ids with injection characters', () => {
    expect(sanitizeStampId('stamp-9')).toBe('stamp-9')
    expect(sanitizeStampId('id\nLocation: evil')).toBeNull()
    expect(sanitizeStampId('a'.repeat(200))).toBeNull()
  })

  it('refuses templates without a hash tag', () => {
    const check = validateTimestampTemplate({
      kind: 30078,
      created_at: 1,
      tags: [['t', 'timestamp']],
      content: '{}',
    })
    expect(check.ok).toBe(false)
  })

  it('detects NIP-07 payload swap', () => {
    const template = {
      kind: 30078,
      created_at: 10,
      tags: [['hash', 'aa'.repeat(32)]],
      content: '{"ok":true}',
    }
    expect(
      signedEventMatchesTemplate(
        { ...template, tags: [['hash', 'bb'.repeat(32)]], content: '{"ok":false}' },
        template,
      ),
    ).toBe(false)
    expect(signedEventMatchesTemplate(template, template)).toBe(true)
  })
})
