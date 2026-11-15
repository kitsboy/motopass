import { describe, expect, it } from 'vitest'
import { auditDisplayed } from './check-displayed-values.mjs'
import type { Program } from '../src/components/programs/types'

const baseProgram: Program = {
  id: 1,
  name: 'Freedonia',
  category: 'rbi_cbi',
  region: 'Test',
  finance: { min_investment_usd: 200000 },
  pathways: [],
  critical_tests: {},
  legal_compliance: {},
  compliance_clock: {},
  last_checked: '2026-11-14',
} as unknown as Program

describe('A4 displayed-value gate (check-displayed-values)', () => {
  it('passes a program with no extension', () => {
    const r = auditDisplayed([baseProgram], {})
    expect(r.failed).toHaveLength(0)
    expect(r.checked).toBe(1)
  })

  it('passes an extension that enriches a non-money stamped field (re-stamp-scoped)', () => {
    const r = auditDisplayed([baseProgram], {
      Freedonia: { legal_compliance: { primary_laws: 'Extra content' }, flagship_depth: true },
    })
    expect(r.failed).toHaveLength(0)
    // enriching legal_compliance is a note, not a failure
    expect(r.warnings).toHaveLength(1)
  })

  it('HARD-FAILS an extension that overrides finance (the displayed minimum)', () => {
    const r = auditDisplayed([baseProgram], {
      Freedonia: { finance: { min_investment_usd: 999999 } },
    })
    expect(r.failed).toHaveLength(1)
    expect(r.failed[0].name).toBe('Freedonia')
    expect(r.failed[0].fields).toContain('finance')
  })

  it('passes the real corpus (0 finance overrides today)', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const root = resolve(import.meta.dirname, '..')
    const corpus = JSON.parse(readFileSync(resolve(root, 'research/countries.json'), 'utf8'))
    const ext = JSON.parse(readFileSync(resolve(root, 'research/flagship-extensions.json'), 'utf8'))
    const r = auditDisplayed(corpus.programs, ext)
    expect(r.failed).toHaveLength(0)
    expect(r.checked).toBe(corpus.programs.length)
  })
})
