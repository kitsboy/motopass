/**
 * Resolve the playwright package for the source probe.
 * The repo install (npm ci) wins over the legacy /root/hq checkout.
 * An explicit PLAYWRIGHT_MODULE_DIR is tried first.
 */
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
