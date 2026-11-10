/**
 * Source-monitor census follows the live catalog, not the last probe file.
 * Names and statuses come from research/countries.json, not a hardcoded list.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { syncSourceMonitor } from './lib/source-monitor-sync.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readJson(rel: string) {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf8'))
}

const catalog = readJson('research/countries.json')
const monitor = readJson('public/data/source-monitor.json')

describe('source monitor sync', () => {
  it('rebuilds the census from the live catalog', () => {
    const now = new Date('2026-11-08T18:00:00.000Z')
    const checked = catalog.programs.map((program: { last_checked?: string }) => program.last_checked)
    const next = syncSourceMonitor(catalog, monitor, now)

    expect(catalog.programs).toHaveLength(21)
    expect(next.by_country).toHaveLength(21)
    expect(next.by_country.map((country: { program_id: number }) => country.program_id)).toEqual(
      catalog.programs.map((program: { id: number }) => program.id),
    )
    expect(catalog.programs.map((program: { last_checked?: string }) => program.last_checked)).toEqual(checked)

    const uruguay = next.by_country.find((country: { name: string }) => country.name === 'Uruguay')
    const portugal = next.by_country.find((country: { name: string }) => country.name === 'Portugal')
    // The 9 Nov 2026 probe cleared Uruguay. The census follows that catalog, not the old open review.
    expect(uruguay.changed).toBe(false)
    expect(portugal.changed).toBe(false)
    expect(portugal.urls.find((url: { url: string }) => url.url === 'https://imigrante.sef.pt')?.status).toBe('ok')
    expect(uruguay.urls.find((url: { url: string }) => url.url === 'https://www.minterior.gub.uy')?.status).toBe(
      'ok',
    )

    for (const country of next.by_country) {
      for (const url of country.urls) {
        expect(url.last_error ?? '').not.toMatch(/playwright/)
      }
    }

    const probes = catalog.programs
      .map((program: { watch?: { last_probe_at?: string } }) => program.watch?.last_probe_at)
      .filter((stamp: string | undefined): stamp is string => typeof stamp === 'string' && stamp.length > 0)
    const newest = probes.reduce((best: string, stamp: string) => (Date.parse(stamp) > Date.parse(best) ? stamp : best))
    expect(next.generated_at).toBe(newest)
    expect(next.generated_at).not.toBe(now.toISOString())
    expect(next.schema).toBe(monitor.schema)
    expect(next.interval_hours).toBe(monitor.interval_hours)
    expect(next.extract_v).toBe(monitor.extract_v)
    expect(next.layout_changed_urls).toEqual(monitor.layout_changed_urls)
    expect(next.last_events).toEqual(monitor.last_events)
    expect(next.by_country.length).toBeGreaterThan(0)

    const changedUrls = catalog.programs.flatMap(
      (program: { watch?: { urls?: { status?: string }[] } }) => program.watch?.urls ?? [],
    ).filter((url: { status?: string }) => url.status === 'changed')
    expect(next.changed).toBe(changedUrls.length)

    const statusByUrl = new Map<string, string>()
    for (const country of next.by_country) {
      for (const url of country.urls) statusByUrl.set(url.url, url.status)
    }
    for (const row of next.changed_countries) expect(statusByUrl.get(row.url)).toBe('changed')
    for (const row of next.unreachable_urls) expect(statusByUrl.get(row.url)).toBe('unreachable')
    for (const row of next.blocked_urls) expect(statusByUrl.get(row.url)).toBe('blocked')
    const latchedNames = catalog.programs
      .filter(
        (program: { watch?: { changed?: boolean; urls?: { status?: string }[] } }) =>
          program.watch?.changed === true || (program.watch?.urls ?? []).some(url => url.status === 'changed'),
      )
      .map((program: { name: string }) => program.name)
    expect(next.changed_countries.map((row: { name: string }) => row.name)).toEqual(latchedNames)
    expect(next.changed_countries.map((row: { name: string }) => row.name)).not.toContain('Portugal')
  })

  it('copies a catalog tooling failure instead of inventing a status', () => {
    const error = "browser: Cannot find module 'playwright'"
    const fixture = {
      programs: [
        {
          id: 9,
          name: 'Fixture',
          last_checked: '2026-08-01',
          watch: {
            changed: false,
            last_probe_at: '2026-11-01T00:00:00.000Z',
            urls: [
              {
                url: 'https://example.test/source',
                status: 'unreachable',
                mode: 'browser',
                last_probed: '2026-11-01T00:00:00.000Z',
                status_since: '2026-11-01T00:00:00.000Z',
                last_error: error,
              },
            ],
          },
        },
      ],
    }
    const existing = {
      schema: 'gab.motopass.source-monitor.v1',
      interval_hours: 24,
      extract_v: 7,
      layout_changed_urls: [{ url: 'https://keep.example' }],
      events: [{ kind: 'rule', url: 'https://keep.example' }],
      by_country: [],
    }
    const next = syncSourceMonitor(fixture, existing, new Date('2026-11-08T00:00:00.000Z'))
    const url = next.by_country[0].urls[0]

    expect(url.status).toBe('unreachable')
    expect(url.last_error).toBe(error)
    expect(url.last_error).toMatch(/playwright/)
    expect(fixture.programs[0].watch.urls[0].status).toBe('unreachable')
    expect(fixture.programs[0].last_checked).toBe('2026-08-01')
    expect(next.total_urls).toBe(1)
    expect(next.ok).toBe(0)
    expect(next.changed).toBe(0)
    expect(next.unreachable).toBe(1)
    expect(next.cloudflare_blocked).toBe(0)
    expect(next.generated_at).toBe('2026-11-01T00:00:00.000Z')
    expect(next.schema).toBe(existing.schema)
    expect(next.events).toEqual(existing.events)
    expect(next.layout_changed_urls).toEqual(existing.layout_changed_urls)
    expect(next.by_country).toHaveLength(1)
  })
})
