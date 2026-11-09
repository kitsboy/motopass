import { describe, expect, it } from 'vitest'
import type { Program } from '../types/program'
import catalogJson from '../../research/countries.json'
import { toCinematicProgram } from './programAdapter'
import { buildDecisionPack } from './decisionPack'
import { sumKnownFamily, sumRouteMins, visibleRoutes } from './routeMix'

describe('route mix', () => {
  it('keeps Argentina’s announced route out until the switch is on', () => {
    const raw = (catalogJson as { programs: Program[] }).programs.find(program => program.name === 'Argentina')
    if (!raw) throw new Error('missing Argentina')
    const pack = buildDecisionPack(toCinematicProgram(raw))
    const hidden = visibleRoutes(pack, false)
    const shown = visibleRoutes(pack, true)
    expect(hidden.some(route => route.status === 'announced')).toBe(false)
    expect(shown.some(route => route.status === 'announced')).toBe(true)
    const announced = shown.find(route => route.status === 'announced')
    expect(sumRouteMins(announced ? [announced] : [])).toBe(350000)
    expect(sumKnownFamily(announced ? [announced] : [])).toBe(225000)
  })

  it('does not turn an included relative into a dollar', () => {
    const raw = (catalogJson as { programs: Program[] }).programs.find(program => program.name === 'El Salvador')
    if (!raw) throw new Error('missing El Salvador')
    const pack = buildDecisionPack(toCinematicProgram(raw))
    const visa = pack.routes.find(route => /freedom visa/i.test(route.label))
    expect(sumKnownFamily(visa ? [visa] : [])).toBe(0)
  })
})
