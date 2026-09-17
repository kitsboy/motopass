/**
 * HowProofWorks — MotoPass port (t_da054829 deliverable 3 / t_edc1bd27).
 *
 * The component file is the family artifact, copied byte-for-byte from
 * kitsboy/satohash (see HowProofWorks.d.ts for the sync note). These tests pin
 * the honesty rules it must keep:
 *   1. a chain-resolved verdict says so, and says HOW it was resolved
 *   2. a pending proof is never dressed up as confirmed
 *   3. a proof that does not resolve is reported plainly — never softened
 *   4. the "check it yourself" step is always offered (the user keeps the means
 *      to audit, not just our assurance)
 *   5. every string is overridable, so MotoPass can pass localized copy
 *
 * Vitest here is node-env and only collects `src/**\/*.test.ts`, and MotoPass
 * has no @testing-library/react — so assertions run against react-dom/server
 * markup via createElement. No new dependency for a port.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import HowProofWorks, { stateFromVerdict } from './HowProofWorks'

// The ported .jsx is compiled with the CLASSIC React runtime (React.createElement).
// Vitest here does not load @vitejs/plugin-react (standalone vitest.config.ts),
// so make `React` resolvable the way esbuild expects at render time.
import * as React from 'react'
beforeAll(() => {
  ;(globalThis as { React?: typeof React }).React = React
})

const ownNodeVerdict = {
  verified: true,
  verified_method: 'bitcoind',
  trust: 'self-sovereign',
  bitcoin_block_height: 967273,
  block_time: 1789556844,
  block_hash: 'a'.repeat(64),
  status: 'confirmed',
  ots_download_url: 'https://api.satohash.io/api/stamps/ff6830c2?download=true',
  explainer: "Verified against Satohash's own Bitcoin node — block 967273.",
}

const render = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(HowProofWorks as never, props as never))

describe('stateFromVerdict', () => {
  it('confirms only on verified:true', () => {
    expect(stateFromVerdict(ownNodeVerdict)).toBe('confirmed')
  })

  it('treats a bare registry status as not-proven, never confirmed', () => {
    expect(stateFromVerdict({ verified: false, status: 'confirmed', reason: 'no_proof_stored_yet' })).toBe('not-proven')
  })

  it('reports a not-yet-anchored proof as pending', () => {
    expect(stateFromVerdict({ verified: false, reason: 'no_block_attestation', status: 'pending' })).toBe('pending')
  })

  it('reports a forged proof as not proven', () => {
    expect(stateFromVerdict({ verified: false, reason: 'merkle_root_mismatch' })).toBe('not-proven')
    expect(stateFromVerdict({ verified: false, reason: 'block_does_not_exist' })).toBe('not-proven')
  })
})

describe('HowProofWorks (ported component)', () => {
  it('renders a chain-resolved verdict with its block height and method', () => {
    const html = render({ verdict: ownNodeVerdict })
    expect(html).toContain('data-testid="proof-state-badge"')
    expect(html).toContain('data-proof-state="confirmed"')
    expect(html).toMatch(/Anchored to Bitcoin/)
    expect(html).toMatch(/967,273|967273/)
    expect(html).toMatch(/no third party was trusted/i)
  })

  it('names the explorer when the own node could not answer', () => {
    const html = render({ verdict: { ...ownNodeVerdict, verified_method: 'esplora' } })
    expect(html).toMatch(/public bitcoin explorer/i)
  })

  it('shows a pending proof honestly', () => {
    const html = render({ verdict: { verified: false, reason: 'no_block_attestation', status: 'pending' } })
    expect(html).toContain('data-proof-state="pending"')
    expect(html).toMatch(/Waiting for Bitcoin/)
    expect(html).not.toMatch(/Anchored to Bitcoin/)
  })

  it('never softens a proof that does not resolve', () => {
    const html = render({
      verdict: {
        verified: false,
        reason: 'merkle_root_mismatch',
        explainer: 'The proof points at a Bitcoin block that does not commit to this file.',
      },
    })
    expect(html).toContain('data-proof-state="not-proven"')
    expect(html).toMatch(/Not proven/)
    expect(html).toMatch(/does not commit to this file/)
  })

  it('always offers the independent verification path and the .ots download', () => {
    const html = render({ verdict: ownNodeVerdict, variant: 'full' })
    expect(html).toContain('data-testid="independent-verify-command"')
    expect(html).toMatch(/ots verify/)
    expect(html).toContain('data-testid="ots-download"')
    expect(html).toContain(ownNodeVerdict.ots_download_url)
  })

  it('lets MotoPass replace every string', () => {
    const html = render({
      variant: 'compact',
      labels: { title: 'Comment ca marche ?', stateConfirmedTitle: 'Ancre a Bitcoin' },
      verdict: ownNodeVerdict,
    })
    expect(html).toMatch(/Comment ca marche \?/)
    expect(html).toMatch(/Ancre a Bitcoin/)
  })
})
