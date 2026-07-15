import { describe, expect, it } from 'vitest'
import { getSovereigntyBreakdown } from './sovereigntyBreakdown'
import type { Program } from '../components/programs/types'

const flagship: Program = {
  id: '1',
  country: 'El Salvador',
  countryCode: 'SV',
  tier: 'Citizenship',
  region: 'Central America',
  minInvestment: 100000,
  timelineDays: 90,
  sovereigntyScore: 90,
  proofStatus: 'verified',
  summary: 'Bitcoin legal tender',
  cryptoFriendlyScore: 9,
  lightningReady: true,
  stackingSynergy: 'high',
  riskLevel: 'low',
}

describe('sovereigntyBreakdown', () => {
  it('returns flagship score components', () => {
    const items = getSovereigntyBreakdown(flagship)
    expect(items).toHaveLength(5)
    expect(items[0]).toMatchObject({ key: 'base', value: '9/10' })
    expect(items.find((i) => i.key === 'lightning')?.value).toBe('ready')
  })
})