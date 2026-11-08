/**
 * Join the live catalog to the pipes the site serves.
 * Callers load the JSON. This module does not read the disk or the network.
 */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function asDate(value) {
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function newestIso(values) {
  let best = null
  let bestMs = -Infinity
  for (const value of values) {
    if (typeof value !== 'string' || value.length === 0) continue
    const ms = Date.parse(value)
    if (Number.isNaN(ms) || ms <= bestMs) continue
    bestMs = ms
    best = value
  }
  return best
}

/** Newest source-probe or intel-sweep time for one catalog program. */
export function weeklyMarker(program, intelEntry, sweep) {
  const stamps = []
  if (typeof program?.watch?.last_probe_at === 'string') stamps.push(program.watch.last_probe_at)
  const urls = Array.isArray(program?.watch?.urls) ? program.watch.urls : []
  for (const url of urls) {
    if (typeof url?.last_probed === 'string') stamps.push(url.last_probed)
  }
  if (intelEntry && sweep) {
    if (typeof sweep.swept_at === 'string') stamps.push(sweep.swept_at)
    if (typeof sweep.last_probe_at === 'string') stamps.push(sweep.last_probe_at)
  }
  return newestIso(stamps)
}

/**
 * @param {object} input
 * @param {object} input.catalog research/countries.json
 * @param {object} input.intel public/data/intel.json
 * @param {object} input.trustIndex public/countries/index.json
 * @param {object} input.density public/data/btcmap-density.json
 * @param {Array<{program?: string}>} input.snapshots parsed BTC Map snapshot files (not the manifest)
 * @param {Date | string | number} [input.now]
 */
export function auditCatalogPipes({ catalog, intel, trustIndex, density, snapshots, now }) {
  const clock = asDate(now)
  const nowMs = clock.getTime()
  const programs = Array.isArray(catalog?.programs) ? catalog.programs : []
  const intelPrograms = intel?.programs && typeof intel.programs === 'object' ? intel.programs : {}
  const trustNames = new Set(
    (Array.isArray(trustIndex?.countries) ? trustIndex.countries : [])
      .map(row => row?.name)
      .filter(name => typeof name === 'string'),
  )
  const densityPrograms = density?.programs && typeof density.programs === 'object' ? density.programs : {}
  const snapshotNames = new Set(
    (Array.isArray(snapshots) ? snapshots : [])
      .map(snap => snap?.program)
      .filter(name => typeof name === 'string'),
  )

  const missing = { intel: [], trust: [], density: [], snapshot: [] }
  const rows = []

  for (const program of programs) {
    const name = program?.name
    if (typeof name !== 'string' || name.length === 0) continue
    const gaps = []
    if (!Object.prototype.hasOwnProperty.call(intelPrograms, name)) {
      missing.intel.push(name)
      gaps.push('intel')
    }
    if (!trustNames.has(name)) {
      missing.trust.push(name)
      gaps.push('trust')
    }
    if (!Object.prototype.hasOwnProperty.call(densityPrograms, name)) {
      missing.density.push(name)
      gaps.push('density')
    }
    if (!snapshotNames.has(name)) {
      missing.snapshot.push(name)
      gaps.push('snapshot')
    }

    const marker = weeklyMarker(program, intelPrograms[name], intel?.sweep)
    const markerMs = marker ? Date.parse(marker) : NaN
    const probeAt = typeof program?.watch?.last_probe_at === 'string' ? program.watch.last_probe_at : null
    const lastChecked = typeof program.last_checked === 'string' ? program.last_checked : null
    rows.push({
      name,
      gaps,
      marker,
      probe_at: probeAt,
      withinWeek: !Number.isNaN(markerMs) && markerMs >= nowMs - WEEK_MS,
      last_checked: lastChecked,
    })
  }

  const missingCount =
    missing.intel.length + missing.trust.length + missing.density.length + missing.snapshot.length

  return {
    count: rows.length,
    missing,
    missingCount,
    outsideWeek: rows.filter(row => !row.withinWeek).map(row => row.name),
    rows,
  }
}
