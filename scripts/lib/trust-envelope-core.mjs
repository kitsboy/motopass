#!/usr/bin/env node
/**
 * Pure helpers for the gab.country-trust.v1 envelope generator.
 * Kept side-effect free so the honesty contract is unit-testable.
 */

/** FRESH <=30d · WATCH 31-45d · STALE >45d (spec scale). Green = verified recent, only. */
export function freshnessFromDate(lastChecked, now = new Date()) {
  if (!lastChecked) return { status: 'stale', days_stale: null, verified_at: null }
  const then = new Date(`${lastChecked}T12:00:00Z`)
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12))
  const days = Math.floor((today.getTime() - then.getTime()) / 86_400_000)
  if (days <= 30)
    return { status: 'fresh', days_stale: Math.max(days, 0), verified_at: lastChecked }
  if (days <= 45) return { status: 'watch', days_stale: days, verified_at: lastChecked }
  return { status: 'stale', days_stale: days, verified_at: lastChecked }
}

/** Classify a source string into an honest tier by keyword (based on real labels). */
const OFFICIAL_ORGS =
  /\b(MFA|MFN|IMF|CBI|GIP|VARA|MAS|SFC|BOI|EDB|MFSA|CIU|IMC|ministry|minister|government|govt|gazette|official|CIP unit|commission|central bank|regulator|authority)\b/i
const LEGAL_TERMS =
  /(legislation|act|law|decree|regulation|rules|guidelines|code|statute|circular|compliance|legal)/i

export function tierForSource(s, officialUrls = []) {
  if (officialUrls.some((u) => u?.hostname && s.toLowerCase().includes(u.hostname.toLowerCase())))
    return 'official'
  const lower = s.toLowerCase()
  if (/^official/i.test(lower) || OFFICIAL_ORGS.test(lower)) return 'official'
  if (LEGAL_TERMS.test(lower)) return 'legal'
  return 'secondary'
}

/** Pull real min-investment history from audit_trail when it actually carries a change. */
export function thresholdHistoryFromAudit(auditTrail, currentUsd) {
  const history = []
  if (Array.isArray(auditTrail)) {
    for (const e of auditTrail) {
      const field = e.field ?? ''
      if (!/invest|threshold|min_|finance/i.test(field)) continue
      const NUM = /(\d{1,3}(?:,\d{3})+|\d{4,})/
      const m = NUM.exec(`${e.to ?? ''}`) ?? NUM.exec(`${e.from ?? ''}`)
      if (m) {
        history.push({
          date: e.date ?? null,
          field,
          usd: parseInt(m[1].replace(/,/g, ''), 10),
          note: `${e.to ?? e.field}`.slice(0, 120),
        })
      }
    }
  }
  // Never fabricate a series: if no real history exists, seed nothing.
  if (history.length === 0 && typeof currentUsd === 'number') {
    history.push({
      date: null,
      field: 'current',
      usd: currentUsd,
      note: 'Current published minimum — no tracked change history yet.',
    })
  }
  return history.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
}
