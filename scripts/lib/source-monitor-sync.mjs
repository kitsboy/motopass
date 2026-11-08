/**
 * Project the catalog watch record onto the source-monitor census.
 * No network. Does not rewrite countries.json or last_checked.
 * generated_at is the newest program.watch.last_probe_at, never the sync clock.
 */

const DAY_MS = 24 * 60 * 60 * 1000

function toMs(now) {
  if (now instanceof Date) return now.getTime()
  if (typeof now === 'number') return now
  if (typeof now === 'string') return Date.parse(now)
  return NaN
}

/** Whole days from status_since to now. Missing or unreadable stamps are 0. */
function gapDays(since, nowMs) {
  if (since == null || since === '') return 0
  const start = typeof since === 'string' ? Date.parse(since) : NaN
  if (!Number.isFinite(start) || !Number.isFinite(nowMs)) return 0
  return Math.max(0, Math.round((nowMs - start) / DAY_MS))
}

function shortScopes(scopes) {
  if (!scopes || typeof scopes !== 'object' || Array.isArray(scopes)) return {}
  const out = {}
  for (const [key, value] of Object.entries(scopes)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const hash = typeof value.last_hash === 'string' ? value.last_hash.slice(0, 12) : null
    out[key] = {
      label: typeof value.label === 'string' && value.label.length > 0 ? value.label : key,
      last_hash: hash,
      changed: value.changed === true,
    }
  }
  return out
}

function ruleScope(entry) {
  if (typeof entry.rule_scope === 'string' && entry.rule_scope.length > 0) return entry.rule_scope
  const hash = entry.scopes?.rule?.last_hash
  return typeof hash === 'string' && hash.length > 0 ? 'present' : 'none'
}

function urlRow(entry, nowMs) {
  const u = entry && typeof entry === 'object' ? entry : {}
  return {
    url: typeof u.url === 'string' ? u.url : null,
    status: typeof u.status === 'string' ? u.status : null,
    mode: typeof u.mode === 'string' && u.mode.length > 0 ? u.mode : null,
    last_probed: u.last_probed ?? null,
    baselined_at: u.baselined_at ?? null,
    status_since: u.status_since ?? null,
    coverage_gap_days: gapDays(u.status_since, nowMs),
    scopes: shortScopes(u.scopes),
    rule_scope: ruleScope(u),
    extract_v: u.extract_v ?? null,
    last_error: typeof u.last_error === 'string' ? u.last_error : null,
  }
}

function countryGap(urls) {
  let max = 0
  for (const url of urls) {
    const gap = url.coverage_gap_days || 0
    if (gap > max) max = gap
  }
  return max
}

function countryRow(program, nowMs) {
  const watch = program && typeof program === 'object' ? program.watch : null
  const urlsIn = Array.isArray(watch?.urls) ? watch.urls : []
  const urls = urlsIn.map(entry => urlRow(entry, nowMs))
  return {
    program_id: program?.id ?? null,
    name: program?.name ?? null,
    changed: watch?.changed === true,
    coverage_gap_days: countryGap(urls),
    urls,
  }
}

function newestProbe(programs) {
  let best = null
  let bestMs = -Infinity
  for (const program of programs) {
    const stamp = program?.watch?.last_probe_at
    if (typeof stamp !== 'string' || stamp.length === 0) continue
    const ms = Date.parse(stamp)
    if (!Number.isFinite(ms) || ms <= bestMs) continue
    bestMs = ms
    best = stamp
  }
  return best
}

function countUrls(byCountry) {
  const counts = { total_urls: 0, ok: 0, changed: 0, unreachable: 0, cloudflare_blocked: 0 }
  for (const country of byCountry) {
    for (const url of country.urls) {
      counts.total_urls += 1
      if (url.status === 'ok') counts.ok += 1
      else if (url.status === 'changed') counts.changed += 1
      else if (url.status === 'unreachable') counts.unreachable += 1
      else if (url.status === 'blocked') counts.cloudflare_blocked += 1
    }
  }
  return counts
}

function scopeLabels(url) {
  const scopes = url?.scopes && typeof url.scopes === 'object' ? url.scopes : {}
  const labels = []
  for (const value of Object.values(scopes)) {
    if (!value || value.changed !== true) continue
    if (typeof value.label === 'string' && value.label.length > 0) labels.push(value.label)
  }
  return labels
}

/**
 * Drop summary rows whose URL is no longer in that status, and add rows the
 * catalog now has. Kept rows keep their probe scope labels and error text.
 */
function reconcileStatusList(existing, byCountry, status, shape) {
  const byUrl = new Map()
  for (const country of byCountry) {
    for (const url of country.urls) {
      if (url.url) byUrl.set(url.url, { country, url })
    }
  }
  const kept = []
  const seen = new Set()
  for (const row of Array.isArray(existing) ? existing : []) {
    const hit = row && typeof row.url === 'string' ? byUrl.get(row.url) : null
    if (!hit || hit.url.status !== status || seen.has(row.url)) continue
    seen.add(row.url)
    kept.push(row)
  }
  for (const country of byCountry) {
    for (const url of country.urls) {
      if (url.status !== status || !url.url || seen.has(url.url)) continue
      seen.add(url.url)
      kept.push(shape(country, url))
    }
  }
  return kept
}

/**
 * @param {object} catalog research/countries.json shape. Not mutated.
 * @param {object} existingMonitor previous public/data/source-monitor.json. Not mutated.
 * @param {Date | string | number} now clock for coverage_gap_days only.
 * @returns {object} monitor with census fields and by_country replaced.
 */
export function syncSourceMonitor(catalog, existingMonitor, now) {
  const base = existingMonitor && typeof existingMonitor === 'object' && !Array.isArray(existingMonitor)
    ? existingMonitor
    : {}
  const programs = Array.isArray(catalog?.programs) ? catalog.programs : []
  const nowMs = toMs(now)
  const by_country = programs.map(program => countryRow(program, nowMs))
  const counts = countUrls(by_country)
  const generatedAt = newestProbe(programs)
  const coverage_gap_count = by_country.filter(country => (country.coverage_gap_days || 0) > 0).length

  const next = {
    ...base,
    total_urls: counts.total_urls,
    ok: counts.ok,
    changed: counts.changed,
    unreachable: counts.unreachable,
    cloudflare_blocked: counts.cloudflare_blocked,
    by_country,
  }
  // Probe aliases of the same census. Only refresh a key the previous report stored.
  if ('ok_count' in base) next.ok_count = counts.ok
  if ('changed_count' in base) next.changed_count = counts.changed
  if ('coverage_gap_count' in base) next.coverage_gap_count = coverage_gap_count
  if ('changed_countries' in base) {
    next.changed_countries = reconcileStatusList(base.changed_countries, by_country, 'changed', (country, url) => ({
      program_id: country.program_id,
      name: country.name,
      url: url.url,
      scopes: scopeLabels(url),
    }))
  }
  if ('blocked_urls' in base) {
    next.blocked_urls = reconcileStatusList(base.blocked_urls, by_country, 'blocked', (country, url) => ({
      program_id: country.program_id,
      name: country.name,
      url: url.url,
      error: url.last_error,
    }))
  }
  if ('unreachable_urls' in base) {
    next.unreachable_urls = reconcileStatusList(base.unreachable_urls, by_country, 'unreachable', (country, url) => ({
      program_id: country.program_id,
      name: country.name,
      url: url.url,
      error: url.last_error,
    }))
  }
  if (generatedAt) next.generated_at = generatedAt
  return next
}
