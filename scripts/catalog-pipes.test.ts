/**
 * Live catalog pipes and the MVP weekly marker.
 * Loads the shipped JSON. Names come from research/countries.json, not a fixture.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { auditCatalogPipes } from './lib/catalog-pipes.mjs'
import { falseToolingSignals } from './lib/probe-failure.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function readJson(rel: string) {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf8'))
}

const catalog = readJson('research/countries.json')
const intel = readJson('public/data/intel.json')
const trustIndex = readJson('public/countries/index.json')
const density = readJson('public/data/btcmap-density.json')
const snapshots = readdirSync(resolve(root, 'public/data/btcmap'))
  .filter(file => file.endsWith('.json') && file !== 'manifest.json')
  .map(file => readJson(`public/data/btcmap/${file}`))

const now = new Date()

function audit() {
  return auditCatalogPipes({ catalog, intel, trustIndex, density, snapshots, now })
}

describe('catalog pipes', () => {
  it('connects every live program to intel, trust, density, and a snapshot', () => {
    const report = audit()
    console.log(`programs=${report.count} missing_pipes=${report.missingCount}`)
    for (const row of report.rows) {
      console.log(
        `${row.name} intel=${row.gaps.includes('intel') ? 'MISSING' : 'yes'} trust=${row.gaps.includes('trust') ? 'MISSING' : 'yes'} density=${row.gaps.includes('density') ? 'MISSING' : 'yes'} snapshot=${row.gaps.includes('snapshot') ? 'MISSING' : 'yes'}`,
      )
    }
    expect(report.count).toBe(21)
    expect(report.missing).toEqual({ intel: [], trust: [], density: [], snapshot: [] })
    expect(report.missingCount).toBe(0)
    const tooling = falseToolingSignals(catalog)
    console.log(
      `tooling_unreachable=${tooling.unreachable.length} tooling_latch_cleared=${tooling.latchCleared.length}`,
    )
    for (const row of tooling.unreachable) console.log(`TOOLING ${row.name} ${row.status} ${row.url}`)
    for (const name of tooling.latchCleared) console.log(`TOOLING_LATCH ${name}`)
    expect(tooling.unreachable).toEqual([])
    expect(tooling.latchCleared).toEqual([])
    expect(report.tooling).toEqual(tooling)
    const uruguay = catalog.programs.find((program: { name?: string }) => program.name === 'Uruguay')
    const interior = uruguay?.watch?.urls?.find(
      (url: { url?: string }) => url.url === 'https://www.minterior.gub.uy',
    )
    expect(interior?.status).toBe('changed')
    expect(uruguay?.watch?.changed).toBe(true)
    expect(intel.programs.Uruguay.watch.changed).toBe(true)
  })

  it('names a program that drops off one pipe', () => {
    const name = catalog.programs[0]?.name
    expect(typeof name).toBe('string')
    const brokenIntel = structuredClone(intel)
    delete brokenIntel.programs[name]
    const report = auditCatalogPipes({
      catalog,
      intel: brokenIntel,
      trustIndex,
      density,
      snapshots,
      now,
    })
    expect(report.missing.intel).toContain(name)
    expect(report.missingCount).toBeGreaterThan(0)
  })
})

describe('weekly location marker', () => {
  it('keeps every program inside the weekly probe window', () => {
    const report = audit()
    const runDay = now.toISOString().slice(0, 10)
    console.log(`programs=${report.count} outside_week=${report.outsideWeek.length} run_day=${runDay}`)
    for (const row of report.rows) {
      console.log(`${row.name} probe_at=${row.probe_at} marker=${row.marker} last_checked=${row.last_checked}`)
      expect(typeof row.probe_at).toBe('string')
      expect(typeof row.marker).toBe('string')
      const probeMs = Date.parse(row.probe_at as string)
      const markerMs = Date.parse(row.marker as string)
      expect(Number.isNaN(probeMs)).toBe(false)
      expect(Number.isNaN(markerMs)).toBe(false)
      expect(probeMs).toBeGreaterThanOrEqual(now.getTime() - WEEK_MS)
      expect(markerMs).toBeGreaterThanOrEqual(now.getTime() - WEEK_MS)
      // last_checked is the research page-read day. A real re-read may share
      // the probe's calendar day. The sync test still proves a probe does not
      // copy its timestamp into last_checked.
      expect(row.last_checked).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(row.last_checked <= runDay).toBe(true)
      expect(row.last_checked).not.toBe(row.probe_at)
    }
    expect(report.outsideWeek).toEqual([])
  })
})
