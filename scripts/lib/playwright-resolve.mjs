/**
 * Resolve the playwright package for the source probe.
 * The repo install (npm ci) wins over the legacy /root/hq checkout.
 * An explicit PLAYWRIGHT_MODULE_DIR is tried first.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

function pushUnique(list, dir) {
  if (!dir || list.includes(dir)) return
  list.push(dir)
}

/**
 * @param {{ repoRoot: string, moduleDir?: string | null, legacyDir?: string }} opts
 * @returns {NodeRequire}
 */
export function playwrightRequire(opts) {
  const dirs = []
  pushUnique(dirs, opts.moduleDir || null)
  pushUnique(dirs, opts.repoRoot)
  pushUnique(dirs, opts.legacyDir === undefined ? '/root/hq' : opts.legacyDir)
  let last
  for (const dir of dirs) {
    try {
      const req = createRequire(resolve(dir, 'package.json'))
      req.resolve('playwright')
      return req
    } catch (err) {
      last = err
    }
  }
  throw last ?? new Error('playwright module not found')
}

/**
 * The module can resolve while the Chromium build is absent (THOR's
 * ~/.cache/ms-playwright missing the revision Playwright expects).
 * Install once into the repo's Playwright, then launch.
 */
export function ensureChromiumExecutable(pw, { repoRoot, skipInstall = false } = {}) {
  const fromEnv = process.env.PLAYWRIGHT_EXECUTABLE || ''
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  let executable = ''
  try {
    executable = pw.chromium.executablePath()
  } catch {
    executable = ''
  }
  if (executable && existsSync(executable)) return executable
  if (skipInstall || process.env.PLAYWRIGHT_SKIP_INSTALL === '1') {
    throw new Error(
      `Playwright Chromium is not installed${executable ? ` at ${executable}` : ''}. Run: npx playwright install chromium`,
    )
  }
  console.log('Playwright Chromium missing — installing with: npx playwright install chromium')
  const install = spawnSync('npx', ['playwright', 'install', 'chromium'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  })
  if (install.status !== 0) {
    throw new Error('npx playwright install chromium failed')
  }
  const installed = pw.chromium.executablePath()
  if (!existsSync(installed)) {
    throw new Error(`Playwright Chromium is still missing at ${installed}`)
  }
  return installed
}
