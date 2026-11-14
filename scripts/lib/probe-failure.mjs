/**
 * A failed probe is a fact about the source, unless the probe tool itself
 * failed to start. A missing Playwright module is the machine, not the page.
 */

const TOOLING_MODULE = /Cannot find module ['"]playwright['"]/

/**
 * A hostname that does not resolve is not a WAF and not a flaky read: the
 * domain is gone. It must surface as a failure, never as a stale "ok".
 */
const DEAD_HOST = /NXDOMAIN|ENOTFOUND|ERR_NAME_NOT_RESOLVED|EAI_AGAIN|ECONNREFUSED|ERR_CONNECTION_REFUSED/i

export function isProbeToolingFailure(error) {
  return typeof error === 'string' && TOOLING_MODULE.test(error)
}

export function isDeadHostFailure(error) {
  return typeof error === 'string' && DEAD_HOST.test(error)
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
  // A dead domain outranks a "blocked" guess: if the name does not resolve,
  // there is no page to be blocked by.
  const dead = isDeadHostFailure(result?.error)
  const status = dead ? 'unreachable' : result?.cloudflare === true ? 'blocked' : 'unreachable'
  const previous = entry.status
  entry.status_since = entry.status_since || nowIso
  if (entry.status === status) return { kind: status, changed: false, previous }
  entry.status = status
  // Deliberately do NOT advance last_probed on failure: the ring and freshness
  // labels mean "how long since this page was actually read back". A blocked or
  // unreachable page was NOT read, so its last good read stays the timestamp the
  // ring shows. status_since (above) still records when the failure began.
  entry.last_error = result?.error
  if (dead) entry.dead_host = true
  else delete entry.dead_host
  return { kind: status, changed: true, previous, dead }
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
