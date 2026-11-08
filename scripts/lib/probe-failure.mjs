/**
 * A failed probe is a fact about the source, unless the probe tool itself
 * failed to start. A missing Playwright module is the machine, not the page.
 */

const TOOLING_MODULE = /Cannot find module ['"]playwright['"]/

export function isProbeToolingFailure(error) {
  return typeof error === 'string' && TOOLING_MODULE.test(error)
}

/**
 * Record a failed probe on one watched URL.
 * A tooling failure returns without writing status, last_probed, last_error,
 * or status_since, so the previous real fetch stays the record.
 * A real failure still becomes `blocked` or `unreachable`.
 */
export function applyProbeFailure(entry, result, nowIso) {
  if (isProbeToolingFailure(result?.error)) {
    return { kind: 'tooling', changed: false }
  }
  const status = result?.cloudflare === true ? 'blocked' : 'unreachable'
  const previous = entry.status
  entry.status_since = entry.status_since || nowIso
  if (entry.status === status) return { kind: status, changed: false, previous }
  entry.status = status
  entry.last_probed = nowIso
  entry.last_error = result?.error
  return { kind: status, changed: true, previous }
}

/**
 * Watched URLs the catalog currently calls unreachable or blocked because
 * Playwright failed to load, and latches cleared while that error is still
 * on a URL. Both lists are empty when the catalog tells the truth.
 */
export function falseToolingSignals(catalog) {
  const unreachable = []
  const latchCleared = []
  const programs = Array.isArray(catalog?.programs) ? catalog.programs : []
  for (const program of programs) {
    const urls = Array.isArray(program?.watch?.urls) ? program.watch.urls : []
    for (const url of urls) {
      if (!isProbeToolingFailure(url?.last_error)) continue
      if (url.status === 'unreachable' || url.status === 'blocked') {
        unreachable.push({ name: program?.name, url: url.url, status: url.status })
      }
    }
    const trail = Array.isArray(program?.audit_trail) ? program.audit_trail : []
    let latest = null
    for (let i = trail.length - 1; i >= 0; i--) {
      if (trail[i]?.field === 'watch.changed') {
        latest = trail[i]
        break
      }
    }
    const cleared = typeof latest?.to === 'string' && latest.to.includes('Latch cleared')
    if (cleared && urls.some(url => isProbeToolingFailure(url?.last_error))) {
      latchCleared.push(program?.name)
    }
  }
  return { unreachable, latchCleared }
}
