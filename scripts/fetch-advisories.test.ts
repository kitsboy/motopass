import { describe, expect, it } from 'vitest'
import { matchUsIso, namesPlace, parseArgentinaAlerts, usRecord } from './fetch-advisories.mjs'

describe('state department titles', () => {
  it('does not read the category code as an ISO country', () => {
    expect(matchUsIso('El Salvador - Level 1: Exercise Normal Precautions')).toBe('SV')
    expect(matchUsIso('Spain - Level 2: Exercise Increased Caution')).toBe('ES')
    expect(matchUsIso('Saint Lucia - Level 2: Exercise Increased Caution')).toBe('LC')
    expect(matchUsIso('Sao Tome and Principe - Level 2: Exercise Increased Caution')).toBe('ST')
    expect(matchUsIso('Dominica - Level 1: Exercise Normal Precautions')).toBe('DM')
    expect(matchUsIso('Dominican Republic - Level 2: Exercise Increased Caution')).toBeNull()
    const row = usRecord({
      Title: 'Saint Lucia - Level 2: Exercise Increased Caution',
      Category: ['ST'],
      Summary: '<p>Crime.</p>',
      Link: 'https://travel.state.gov/example',
    })
    expect(row.iso).toBe('LC')
    expect(row.level).toBe(2)
  })
})

describe('argentine alerts', () => {
  it('keeps a Haiti notice off the Argentina program and keeps Brazil when the text names Brasil', () => {
    const html = `
      <article about="/es/servicios/alertas/haiti">
        <h2><a href="/es/servicios/alertas/haiti">Haití</a></h2>
        <div property="content:encoded"><p>La Embajada de la República Argentina aconseja reprogramar todo viaje a Haití.</p></div>
      </article>
      <article about="/es/servicios/alertas/fiebre">
        <h2><a href="/es/servicios/alertas/fiebre">Fiebre Amarilla</a></h2>
        <div property="content:encoded"><p>Nuevos casos de fiebre amarilla en Brasil.</p></div>
      </article>`
    const alerts = parseArgentinaAlerts(html)
    expect(alerts[0].matches).toEqual([])
    expect(alerts[1].matches).toEqual(['BR'])
    expect(namesPlace('ciudadanos argentinos', 'Argentina')).toBe(false)
  })
})
