import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VeritasSourcePanel } from './VeritasSourcePanel'
import type { WatchUrl } from '../../types/program'

function panel(urls: WatchUrl[]) {
  return renderToStaticMarkup(h(VeritasSourcePanel, { urls }))
}

describe('VeritasSourcePanel links', () => {
  it('labels a blocked source and still links the live page', () => {
    const html = panel([
      { url: 'https://www.rree.gob.sv/', status: 'blocked', last_probed: '2026-10-01' },
    ])
    expect(html).toContain('Walled')
    expect(html).toContain('href="https://www.rree.gob.sv/"')
    expect(html).not.toContain('web.archive.org')
  })

  it('points an unreachable source at the archive', () => {
    const html = panel([
      {
        url: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html',
        status: 'unreachable',
        last_probed: '2026-11-08',
      },
    ])
    expect(html).toContain('web.archive.org/web/20261108/')
    expect(html).toContain('Live page did not load')
    expect(html).toContain('Down')
  })

  it('does not throw when a status is missing from the style map', () => {
    const html = panel([
      { url: 'https://example.com/source', status: 'mystery' as WatchUrl['status'] },
    ])
    expect(html).toContain('Pending')
    expect(html).toContain('href="https://example.com/source"')
  })
})
