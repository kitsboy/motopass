/**
 * Quote matching, shared by the checker script and its tests.
 *
 * A quote counts as on the page when its words appear after both sides have
 * been normalised: case, accents, curly quotes, dashes, ellipses and runs of
 * whitespace are folded away. Anything stricter reports a real quote as missing
 * ("mínimo" vs "minimo" hid Argentina's decree); anything looser lets a
 * paraphrase pass as a quote.
 */

export function normaliseText(input) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A quote's regex: dashes and spaces interchangeable, dots optional. */
export function quotePattern(quote) {
  return new RegExp(
    escapeRe(normaliseText(quote))
      .replace(/[-\s]+/g, '[-\\s]+')
      .replace(/\\\./g, '\\.?'),
    'i',
  )
}

/** True when the quoted words are on the page. */
export function quoteOnPage(pageText, quote) {
  const page = normaliseText(pageText)
  if (!page || !String(quote ?? '').trim()) return false
  return quotePattern(quote).test(page)
}

/**
 * How a check result must be reported. A page we could not read is never a
 * missing quote: one is a network or bot-wall problem, the other is evidence
 * that drifted, and the two must not be confused in a public number.
 */
export function verdictFor(pageText, quote) {
  if (pageText === null || normaliseText(pageText).length < 200) return 'unreadable'
  return quoteOnPage(pageText, quote) ? 'found' : 'missing'
}
