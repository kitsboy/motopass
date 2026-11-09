import { describe, expect, it } from 'vitest'
import type { Program } from '../types/program'
import catalogJson from '../../research/countries.json'
import { presenceRows, presenceScale } from './presenceDays'

describe('presence days', () => {
  it('orders the days already on file and leaves a missing count empty', () => {
    const rows = presenceRows((catalogJson as { programs: Program[] }).programs)
    const uruguay = rows.find(row => row.name === 'Uruguay')
    const salvador = rows.find(row => row.name === 'El Salvador')
    const sao = rows.find(row => row.name === 'São Tomé and Príncipe')
    const bahamas = rows.find(row => row.name === 'Bahamas')
    expect(uruguay?.days).toBe(1095)
    expect(salvador?.days).toBe(365)
    expect(sao?.days).toBe(0)
    expect(bahamas?.days).toBeNull()
    expect(rows.findIndex(row => row.name === 'Uruguay')).toBeLessThan(rows.findIndex(row => row.name === 'El Salvador'))
    expect(presenceScale(rows)).toBe(3650)
  })
})
