import { describe, expect, it } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RouteStatusBanner } from './RouteStatusBanner'
import type { Program } from './types'

const base = { id: '999', country: 'Test' } as unknown as Program

const html = (program: Program) => renderToStaticMarkup(h(RouteStatusBanner, { program })).trim()

describe('RouteStatusBanner', () => {
  it('renders nothing for an open program', () => {
    expect(html({ ...base, routeStatus: 'open' } as Program)).toBe('')
  })
  it('renders nothing when no status is on file', () => {
    expect(html(base)).toBe('')
  })
  it('labels a closed program and shows the check date, note and source', () => {
    const out = html({
      ...base,
      routeStatus: 'closed',
      statusCheckedAt: '2026-11-14',
      statusNote: 'Golden Visa terminated 3 Apr 2025.',
      statusSource: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-76',
    } as Program)
    expect(out).toContain('Applications closed')
    expect(out).toContain('as of 14 Nov 2026')
    expect(out).toContain('Golden Visa terminated 3 Apr 2025.')
    expect(out).toContain('boe.es')
  })
  it('labels a changed program', () => {
    const out = html({ ...base, routeStatus: 'changed', statusNote: 'Residency-only route.' } as Program)
    expect(out).toContain('Program changed')
    expect(out).toContain('Residency-only route.')
  })
  it('labels an unknown program', () => {
    const out = html({ ...base, routeStatus: 'unknown' } as Program)
    expect(out).toContain('Status not confirmed')
  })
  it('omits the date and note when absent', () => {
    const out = html({ ...base, routeStatus: 'closed' } as Program)
    expect(out).toContain('Applications closed')
    expect(out).not.toContain('as of')
  })
})
