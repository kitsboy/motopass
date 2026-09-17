/**
 * ProofStatusBadge — pins the "proven then vs valid now" split (t_edc1bd27).
 * The badge must never let a Bitcoin anchor imply present-tense validity.
 */
import { describe, it, expect } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProofStatusBadge } from './ProofStatusBadge'
import type { ChainVerdict } from '../../lib/chainVerify'

const anchor: ChainVerdict = {
  verified: true,
  verified_method: 'bitcoind',
  bitcoin_block_height: 967273,
  block_time: 1789556844,
  block_hash: 'a'.repeat(64),
  ots_download_url: 'https://api.satohash.io/api/stamps/abc?download=true',
  explainer: null,
  reason: null,
  error: null,
  registry_status: 'confirmed',
  source: 'own bitcoind',
}

const render = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(ProofStatusBadge as never, props as never))

describe('ProofStatusBadge', () => {
  it('never claims current validity from the anchor alone', () => {
    const html = render({ verdict: anchor })
    expect(html).toContain('data-testid="proof-status-proven"')
    expect(html).toMatch(/Anchored to Bitcoin/)
    expect(html).toContain('data-validity="unconfirmed"')
    expect(html).toMatch(/not checked yet/)
    expect(html).not.toMatch(/Current as of/)
  })

  it('dates an unconfirmed live check instead of guessing', () => {
    const html = render({ verdict: anchor, checkedAt: '2026-09-16T12:00:00.000Z' })
    expect(html).toMatch(/Unconfirmed as of 2026-09-16 12:00 UTC/)
    expect(html).not.toMatch(/Current as of/)
  })

  it('says current only when a live check said current', () => {
    const html = render({ verdict: anchor, live: 'current', checkedAt: '2026-09-16T12:00:00.000Z' })
    expect(html).toContain('data-validity="current"')
    expect(html).toMatch(/Current as of 2026-09-16 12:00 UTC/)
  })

  it('shows a revoked record without deleting the historical proof', () => {
    const html = render({ verdict: anchor, live: 'revoked' })
    expect(html).toContain('data-validity="revoked"')
    expect(html).toMatch(/Revoked \/ expired/)
    expect(html).toMatch(/Anchored to Bitcoin/)
  })

  it('renders the proof half honestly for a forged hash', () => {
    const html = render({
      verdict: { ...anchor, verified: false, verified_method: null, bitcoin_block_height: null },
      live: 'unconfirmed',
    })
    expect(html).toContain('data-proof-state="not-proven"')
    expect(html).toMatch(/Not proven/)
  })
})
