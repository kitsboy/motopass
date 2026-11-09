import { describe, expect, it } from 'vitest'
import { visitorLink, visitorUrlIsDead, waybackUrl } from './visitorLink'

describe('visitorLink', () => {
  it('keeps a bot wall on the live URL', () => {
    const link = visitorLink('https://www.rree.gob.sv/', { status: 'blocked' })
    expect(link.archived).toBe(false)
    expect(link.href).toBe('https://www.rree.gob.sv/')
    expect(link.title).toContain('walled')
  })

  it('sends an unreachable page to the archive and keeps the live URL in the title', () => {
    const url = 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html'
    const link = visitorLink(url, { status: 'unreachable', probed: '2026-11-08T12:24:29.059Z' })
    expect(link.archived).toBe(true)
    expect(link.href).toBe(waybackUrl(url, '2026-11-08T12:24:29.059Z'))
    expect(link.href).toContain('/web/20261108/')
    expect(link.title).toContain(url)
  })

  it('sends a confirmed dead official URL to the archive even when the probe said ok', () => {
    const url = 'https://www.uruguayxxi.gub.uy/en/invest/investors-guide/entry-requirements'
    expect(visitorUrlIsDead(url + '/')).toBe(true)
    const link = visitorLink(url, { status: 'ok' })
    expect(link.archived).toBe(true)
    expect(link.href.startsWith('https://web.archive.org/web/2/')).toBe(true)
  })

  it('leaves a healthy official URL alone', () => {
    const url = 'https://www.presidencia.gob.sv'
    const link = visitorLink(url, { status: 'ok' })
    expect(link).toEqual({ href: url, title: url, archived: false })
  })
})
