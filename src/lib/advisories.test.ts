import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ukStatusKey, type AdvisoryFile } from './advisories'

const file = JSON.parse(readFileSync('public/data/advisories.json', 'utf8')) as AdvisoryFile

describe('travel advice file', () => {
  it('keeps the State Department title match, not the feed category code', () => {
    expect(Object.keys(file.by_iso)).toHaveLength(21)
    expect(file.by_iso.SV.us?.href).toContain('destination.slv.html')
    expect(file.by_iso.ES.us?.href).toContain('destination.esp.html')
    expect(file.by_iso.KN.us?.href).toContain('destination.kna.html')
    expect(file.by_iso.ST.us?.href).toContain('destination.stp.html')
    expect(file.by_iso.LC.us?.href).toContain('destination.lca.html')
    for (const row of Object.values(file.by_iso)) {
      expect(row.us?.level).toBeGreaterThanOrEqual(1)
      expect(row.us?.level).toBeLessThanOrEqual(4)
      expect(row.uk?.href).toContain('https://www.gov.uk/foreign-travel-advice/')
    }
  })

  it('does not treat the Argentine embassy name as a warning about Argentina', () => {
    expect(file.by_iso.AR.ar).toEqual([])
    const named = file.argentina_alerts.filter(alert => alert.matches.length > 0)
    expect(named.some(alert => alert.matches.includes('BR'))).toBe(true)
    expect(named.some(alert => alert.matches.includes('AR'))).toBe(false)
  })
})

describe('uk status phrases', () => {
  it('names the parts warning and leaves an unknown code unnamed', () => {
    expect(ukStatusKey('avoid_all_but_essential_travel_to_parts')).toBe('advice.ukAvoidEssentialParts')
    expect(ukStatusKey('something_new')).toBeNull()
  })
})
