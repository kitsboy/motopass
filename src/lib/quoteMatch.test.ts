import { describe, expect, it } from 'vitest'
// @ts-expect-error - plain ESM module shared with the checker script
import { quoteOnPage, verdictFor, normaliseText } from '../../scripts/lib/quote-match.mjs'

/**
 * These are the checker's own tests. Two checker bugs have already changed what
 * the site says — once calling a real quote missing (accents), once calling
 * four reachable pages unreadable (user-agent) — so the gate needs fixtures
 * before its verdicts can be believed.
 */
describe('quote matching', () => {
  const page =
    'Inversionista: Quien ingrese en esta subcategoría deberá realizar una inversión productiva ' +
    'por un mínimo de PESOS UN MILLON QUINIENTOS MIL ($ 1.500.000). El interesado presentará el proyecto ' +
    'de inversión ante la DIRECCION NACIONAL DE MIGRACIONES, que evaluará su viabilidad y su interés ' +
    'para el país antes de resolver la solicitud de residencia temporaria en esta subcategoría.'

  it('finds a quote that is on the page', () => {
    expect(quoteOnPage(page, 'por un mínimo de PESOS UN MILLON QUINIENTOS MIL')).toBe(true)
  })

  it('finds it when the accent is dropped, the way a hand-typed quote would', () => {
    expect(quoteOnPage(page, 'por un minimo de PESOS UN MILLON QUINIENTOS MIL')).toBe(true)
  })

  it('finds it when the page drops the accent instead', () => {
    expect(quoteOnPage('por un minimo de pesos un millon quinientos mil', 'por un mínimo de pesos')).toBe(
      true,
    )
  })

  it('rejects a paraphrase that is not on the page', () => {
    // The sentence this replaced was recorded as a quote and never existed.
    expect(quoteOnPage(page, 'The programme offers two pathways to citizenship')).toBe(false)
  })

  it('rejects a quote with a different figure', () => {
    expect(quoteOnPage(page, 'por un mínimo de PESOS DOS MILLONES')).toBe(false)
  })

  it('ignores curly quotes, dashes and ellipses', () => {
    expect(quoteOnPage('it typically takes 3 – 4 months…', 'it typically takes 3 - 4 months')).toBe(true)
  })

  it('treats a page it could not read as unreadable, never missing', () => {
    expect(verdictFor(null, 'anything')).toBe('unreadable')
    expect(verdictFor('', 'anything')).toBe('unreadable')
    expect(verdictFor('<html></html>', 'anything')).toBe('unreadable')
  })

  it('reports a readable page without the words as missing', () => {
    expect(verdictFor(page, 'not on this page at all')).toBe('missing')
    expect(verdictFor(page, 'por un mínimo de PESOS UN MILLON')).toBe('found')
  })

  it('normalises to a comparable form', () => {
    expect(normaliseText('  Mínimo—Quinientos  ')).toBe('minimo-quinientos')
  })
})
