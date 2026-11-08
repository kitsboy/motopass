/**
 * The intel strip names every program whose watch.changed latch is open.
 * A count with no country names fails this test.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { IntelWatchStripView, sourceChangeLabel } from './IntelWatchStrip'
import type { IntelManifest, IntelProgram } from '../../hooks/useIntel'

function program(id: number, changed: boolean): IntelProgram {
  return {
    id,
    freshness: { status: 'watch', days_stale: 40, last_checked: '2026-09-29' },
    watch: { changed, probed: 4, unreachable: 0 },
    proof: { hash: 'ab', in_sync: true, block: 1, stamped_at: null, stamp_id: null },
    recent_changes: [
      { date: '2026-11-08', field: 'watch.example', to: 'review required' },
    ],
  }
}

function manifest(): IntelManifest {
  return {
    generated_at: '2026-11-08T06:56:42.493Z',
    schema: 'motopass.country-intel.v1',
    sweep: {
      fresh: 0,
      watch: 3,
      stale: 0,
      swept_at: '2026-11-08T06:56:42.493Z',
      satohash_api: { status: 'up', version: '5.0.0-ELITE' },
    },
    programs: {
      Uruguay: program(1, true),
      Italy: program(2, true),
      Spain: program(3, false),
    },
  }
}

function render(variant: 'full' | 'ticker') {
  return renderToStaticMarkup(h(IntelWatchStripView, { intel: manifest(), variant }))
}

function sourceChangeText(html: string): string {
  const match = html.match(/data-testid="intel-source-changes"[\s\S]*?<\/(?:span|div)>/)
  expect(match, 'source-change element missing').not.toBeNull()
  return match![0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('IntelWatchStrip flagged countries', () => {
  it('names Italy and Uruguay on the ticker, not only a count', () => {
    const text = sourceChangeText(render('ticker'))
    expect(text).toContain(sourceChangeLabel(['Italy', 'Uruguay']))
    expect(text).toContain('Italy')
    expect(text).toContain('Uruguay')
    expect(text).not.toContain('Spain')
    expect(render('ticker')).toContain('daily')
  })

  it('names Italy and Uruguay on the full panel', () => {
    const html = render('full')
    const text = sourceChangeText(html)
    expect(text).toContain('2 source changes: Italy, Uruguay')
    expect(text).toContain('Italy')
    expect(text).toContain('Uruguay')
    expect(text).not.toContain('Spain')
    expect(html).toContain('daily')
  })

  it('renders no source-change label when nothing is flagged', () => {
    const quiet = manifest()
    quiet.programs.Italy.watch.changed = false
    quiet.programs.Uruguay.watch.changed = false
    const html = renderToStaticMarkup(h(IntelWatchStripView, { intel: quiet, variant: 'full' }))
    expect(html).not.toContain('data-testid="intel-source-changes"')
    expect(sourceChangeLabel([])).toBeNull()
  })

  it('names the countries flagged in the shipped intel manifest', () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
    const intel = JSON.parse(readFileSync(resolve(root, 'public/data/intel.json'), 'utf8')) as IntelManifest
    const flagged = Object.entries(intel.programs)
      .filter(([, entry]) => entry.watch?.changed === true)
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b))
    const html = renderToStaticMarkup(h(IntelWatchStripView, { intel, variant: 'full' }))
    console.log(`shipped_flagged=${flagged.join(', ') || 'none'}`)
    if (flagged.length === 0) {
      expect(html).not.toContain('data-testid="intel-source-changes"')
      return
    }
    const text = sourceChangeText(html)
    expect(text).toContain(sourceChangeLabel(flagged))
    for (const name of flagged) expect(text).toContain(name)
  })
})
