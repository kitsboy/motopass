/**
 * The probe must load Playwright from this repo when /root/hq has no module.
 */
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { playwrightRequire } from './lib/playwright-resolve.mjs'

const repoRoot = resolve(import.meta.dirname, '..')

describe('playwrightRequire', () => {
  it('resolves playwright from the repo when the legacy host directory is missing', () => {
    const req = playwrightRequire({
      repoRoot,
      moduleDir: null,
      legacyDir: '/tmp/motopass-no-such-hq',
    })
    expect(req.resolve('playwright')).toMatch(/playwright/)
  })

  it('skips a module dir that does not contain playwright and uses the repo', () => {
    const req = playwrightRequire({
      repoRoot,
      moduleDir: '/tmp/motopass-no-such-hq',
      legacyDir: '/tmp/motopass-no-such-hq-2',
    })
    expect(req.resolve('playwright')).toContain(repoRoot)
  })
})
