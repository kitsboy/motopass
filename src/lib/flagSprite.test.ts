import { describe, expect, it } from 'vitest'
import { FLAG_SPRITE_OFFSETS, FLAG_SPRITE_TILE } from './flagSprite'
import { programCountryCode } from './countryCode'

describe('flag sprite', () => {
  it('keeps the original tiles and adds São Tomé on a new row', () => {
    expect(FLAG_SPRITE_OFFSETS.uy).toEqual({ x: 320, y: 120 })
    expect(FLAG_SPRITE_OFFSETS.ae).toEqual({ x: 40, y: 0 })
    expect(FLAG_SPRITE_OFFSETS.st).toEqual({ x: 0, y: 150 })
    expect(FLAG_SPRITE_TILE).toEqual({ w: 40, h: 30, cols: 10, rows: 6 })
  })

  it('resolves agent and catalog names to sprite codes', () => {
    expect(programCountryCode('UAE')).toBe('AE')
    expect(programCountryCode('São Tomé and Príncipe')).toBe('ST')
    expect(FLAG_SPRITE_OFFSETS[programCountryCode('UAE').toLowerCase()]).toBeTruthy()
    expect(FLAG_SPRITE_OFFSETS[programCountryCode('São Tomé and Príncipe').toLowerCase()]).toBeTruthy()
  })
})
