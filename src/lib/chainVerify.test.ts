/**
 * chainVerify — pins the honesty rules of the live verifier client:
 *   1. only `verified:true` is proof, and it must come with a method + height
 *   2. a registry status is never allowed to upgrade a verdict
 *   3. forged / unresolved proofs stay unresolved
 *   4. an unreachable API is "could not check", NOT "not proven"
 *   5. the .ots link we hand a user must be an allowlisted Satohash URL
 */
import { afterEach, describe, it, expect, vi } from 'vitest'
import { normalizeChainVerdict, verdictDetailLine, verifyHashOnChain } from './chainVerify'

const HASH = '1ce9eb8bd293fd5d759ff1f180dadb265c857abfd21020dbf8ca7967900b4f66'

/** Real live response, trimmed to the fields the UI reads. */
const liveOwnNode = {
  verified: true,
  verified_method: 'bitcoind',
  trust: 'self-sovereign',
  bitcoin_block_height: 967273,
  block_time: 1789556844,
  block_hash: '00000000000000000001aa2fb5e8de43f21b4194875f2e965907cd904ed76ce5',
  registry_status: 'confirmed',
  registry: { found: true, status: 'confirmed', note: 'Registry is not proof.' },
  ots_download_url: 'https://api.satohash.io/api/stamps/ff6830c2-d7a0-4e33-9564-afbb13219edb?download=true',
  explainer: "Verified against Satohash's own Bitcoin node — block 967273.",
  reason: null,
}

function stubFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fn = vi.fn(async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  }))
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('verifyHashOnChain', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns the chain-resolved verdict with method + height + .ots', async () => {
    const fetchMock = stubFetch(liveOwnNode)
    const res = await verifyHashOnChain(HASH)

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.verdict.verified).toBe(true)
    expect(res.verdict.verified_method).toBe('bitcoind')
    expect(res.verdict.bitcoin_block_height).toBe(967273)
    expect(res.verdict.ots_download_url).toContain('/api/stamps/')

    const [url, opts] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/api/verify')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(String(opts.body))).toEqual({ hash: HASH })
  })

  it('labels the explorer when the own node could not answer', async () => {
    stubFetch({ ...liveOwnNode, verified_method: 'esplora' })
    const res = await verifyHashOnChain(HASH)
    expect(res.ok && res.verdict.verified_method).toBe('esplora')
  })

  it('reports a forged hash as not proven and never manufactures a block', async () => {
    stubFetch({ verified: false, registry_check: true, registry: { found: false, status: null }, error: 'Hash not found in registry.' })
    const res = await verifyHashOnChain('0000000000000000000000000000000000000000000000000000000000000000')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.verdict.verified).toBe(false)
    expect(res.verdict.verified_method).toBeNull()
    expect(res.verdict.bitcoin_block_height).toBeNull()
    expect(res.verdict.ots_download_url).toBeNull()
    expect(verdictDetailLine(res.verdict)).toMatch(/^not proven/)
  })

  it('keeps a pending (un-anchored) proof pending', async () => {
    stubFetch({ verified: false, reason: 'no_block_attestation', status: 'pending', registry_status: 'confirmed' })
    const res = await verifyHashOnChain(HASH)
    expect(res.ok && res.verdict.verified).toBe(false)
    expect(res.ok && res.verdict.verified_method).toBeNull()
    expect(res.ok && verdictDetailLine(res.verdict)).toMatch(/^pending/)
  })

  it('never lets registry status stand in for proof', () => {
    const v = normalizeChainVerdict({ verified: false, registry_status: 'confirmed', status: 'confirmed' })
    expect(v.verified).toBe(false)
    expect(v.verified_method).toBeNull()
    expect(verdictDetailLine(v)).toMatch(/^not proven/)
  })

  it('drops an .ots link that is not an allowlisted Satohash URL', () => {
    const v = normalizeChainVerdict({ ...liveOwnNode, ots_download_url: 'https://evil.example/proof.ots' })
    expect(v.ots_download_url).toBeNull()
  })

  it('an unreachable verifier is "could not check", never "not proven"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))
    const res = await verifyHashOnChain(HASH)
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.offline).toBe(true)
    expect(res.error).toContain('network down')
  })

  it('a 5xx verifier is offline, a malformed hash is a user error', async () => {
    stubFetch({}, { ok: false, status: 503 })
    const down = await verifyHashOnChain(HASH)
    expect(down.ok).toBe(false)
    expect(!down.ok && down.offline).toBe(true)

    const bad = await verifyHashOnChain('not-a-hash')
    expect(bad.ok).toBe(false)
    expect(!bad.ok && bad.offline).toBe(false)
    expect(!bad.ok && bad.error).toMatch(/Invalid SHA-256/)
  })
})
