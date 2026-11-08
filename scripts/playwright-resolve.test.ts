/**
 * The probe must load Playwright from this repo when /root/hq has no module.
 */
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ensureChromiumExecutable, playwrightRequire } from './lib/playwright-resolve.mjs'

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

describe('ensureChromiumExecutable', () => {
  it('uses an executable that is already on disk', () => {
    const previous = process.env.PLAYWRIGHT_EXECUTABLE
    delete process.env.PLAYWRIGHT_EXECUTABLE
    const path = ensureChromiumExecutable(
      { chromium: { executablePath: () => '/bin/echo' } },
      { repoRoot, skipInstall: true },
    )
    if (previous === undefined) delete process.env.PLAYWRIGHT_EXECUTABLE
    else process.env.PLAYWRIGHT_EXECUTABLE = previous
    expect(path).toBe('/bin/echo')
  })

  it('refuses to launch when Chromium is missing and install is skipped', () => {
    const previousExec = process.env.PLAYWRIGHT_EXECUTABLE
    const previousSkip = process.env.PLAYWRIGHT_SKIP_INSTALL
    delete process.env.PLAYWRIGHT_EXECUTABLE
    process.env.PLAYWRIGHT_SKIP_INSTALL = '1'
    expect(() =>
      ensureChromiumExecutable(
        { chromium: { executablePath: () => '/tmp/motopass-no-chromium' } },
        { repoRoot },
      ),
    ).toThrow(/not installed/)
    if (previousExec === undefined) delete process.env.PLAYWRIGHT_EXECUTABLE
    else process.env.PLAYWRIGHT_EXECUTABLE = previousExec
    if (previousSkip === undefined) delete process.env.PLAYWRIGHT_SKIP_INSTALL
    else process.env.PLAYWRIGHT_SKIP_INSTALL = previousSkip
  })
})
