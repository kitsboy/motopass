import { describe, expect, it } from 'vitest'
import { validateCountriesData } from './schema'

describe('countries schema catalog size', () => {
  const validProgram = {
    id: 1,
    name: 'Sample',
    category: 'residency',
    region: 'Test region',
    status: 'Open',
    finance: {},
    details: 'Test program',
  }

  it('accepts 21 valid program entries at the supported minimum', () => {
    expect(validateCountriesData({ programs: Array.from({ length: 21 }, (_, id) => ({ ...validProgram, id })) }).valid).toBe(true)
  })

  it('rejects a catalog below the supported 21-program minimum', () => {
    expect(validateCountriesData({ programs: Array.from({ length: 20 }, (_, id) => ({ ...validProgram, id })) }).valid).toBe(false)
  })
})
