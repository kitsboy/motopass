/**
 * A missing Playwright module is not a dead source.
 */
import { describe, expect, it } from 'vitest'
import { applyProbeFailure, falseToolingSignals, isProbeToolingFailure } from './lib/probe-failure.mjs'

const MODULE_ERROR = "browser: Cannot find module 'playwright'\nRequire stack:\n- /root/hq/noop.js"

describe('applyProbeFailure', () => {
  it('leaves a changed URL untouched when Playwright fails to load', () => {
    const entry = {
      url: 'https://www.minterior.gub.uy',
      status: 'changed',
      last_probed: '2026-11-08T06:01:10.159Z',
    }
    const applied = applyProbeFailure(entry, { ok: false, error: MODULE_ERROR }, '2026-11-08T12:24:29.059Z')
    expect(applied).toEqual({ kind: 'tooling', changed: false })
    expect(entry).toEqual({
      url: 'https://www.minterior.gub.uy',
      status: 'changed',
      last_probed: '2026-11-08T06:01:10.159Z',
    })
    expect(isProbeToolingFailure(MODULE_ERROR)).toBe(true)
  })

  it('still records a real fetch failure as unreachable', () => {
    const entry = { url: 'https://example.test', status: 'ok', last_probed: '2026-11-08T06:01:10.159Z' }
    const applied = applyProbeFailure(entry, { ok: false, error: 'connect ECONNREFUSED' }, '2026-11-08T12:24:29.059Z')
    expect(applied.kind).toBe('unreachable')
    expect(applied.changed).toBe(true)
    expect(entry.status).toBe('unreachable')
    expect(entry.last_error).toBe('connect ECONNREFUSED')
    expect(entry.last_probed).toBe('2026-11-08T12:24:29.059Z')
  })

  it('names a catalog URL left unreachable by a Playwright load failure', () => {
    const catalog = {
      programs: [
        {
          name: 'Uruguay',
          watch: {
            changed: false,
            urls: [{ url: 'https://www.minterior.gub.uy', status: 'unreachable', last_error: MODULE_ERROR }],
          },
          audit_trail: [
            {
              date: '2026-11-08',
              field: 'watch.changed',
              from: 'true',
              to: 'Latch cleared — no watched URL is in status changed. Earlier review-required rows stay as history.',
            },
          ],
        },
      ],
    }
    const signals = falseToolingSignals(catalog)
    expect(signals.unreachable).toEqual([
      { name: 'Uruguay', url: 'https://www.minterior.gub.uy', status: 'unreachable' },
    ])
    expect(signals.latchCleared).toEqual(['Uruguay'])
  })
})
