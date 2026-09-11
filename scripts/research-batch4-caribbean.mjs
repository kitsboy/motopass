/**
 * Batch 4 research pass — Caribbean CBI cluster (St. Lucia, Grenada,
 * Barbados, Bahamas) + cross-cluster Proclamation-10998 refinement for
 * Antigua and Dominica. Applied 2026-09-10.
 *
 * Rules honored (docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md §3, §10):
 *  - Facts only: every applied change carries a dated source.
 *  - Confidence gating: applied = medium+; unverified items left untouched.
 *  - Never overwrite with null/empty; never downgrade on weak signals.
 *  - Every change appended to audit_trail (date, field, from, to, source).
 *  - freshness/watch/satohash_proofs untouched — the pipeline owns those.
 *
 * Run: node scripts/research-batch4-caribbean.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'research/countries.json'
const d = JSON.parse(readFileSync(FILE, 'utf8'))
const arr = Array.isArray(d) ? d : d.programs
const TODAY = '2026-09-10'
const SRC = 'Batch 4 research pass (Caribbean CBI cluster, docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md work order)'

function audit(p, field, from, to, source) {
  p.audit_trail = p.audit_trail || []
  p.audit_trail.push({ date: TODAY, field, from, to, source })
}

function findPathway(p, type) {
  return (p.pathways || []).find(x => x.type === type)
}

// ─────────────────────────────────────────────────────────────
// ST. LUCIA (id 30) — CORRECTION: page-level finance floor
// Verified 2026-09-10: NEF $240,000 (single or family of up to 4), RE
// $300,000, bonds $300,000 (+$50k admin) — multiple 2026 sources agree.
// Pathways were already correct; finance.min_investment_usd ($100k) and
// typical ($150k) contradicted the $240k NEF floor — aligned.
// Proclamation 10998 coverage names Antigua + Dominica — St. Lucia not
// listed as restricted (CitizenX, Aug 2026).
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 30)
  if (!p) throw new Error('St. Lucia not found')

  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 240000
  audit(p, 'finance.min_investment_usd', oldMin, 240000,
    SRC + ' — globallawexperts 2026-07-11 · NTL Trust 2026 · directcitizenship 2026-08-09 (NEF $240k single/family-of-4)')

  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 250000
  audit(p, 'finance.typical_investment_usd', oldTyp, 250000,
    SRC + ' — modeled all-in single applicant (NEF $240k + DD/admin)')

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    (oldChanges ? oldChanges + ' ' : '') +
    '2026-09-10 verification: NEF $240k (single or family of up to 4), RE $300k, bonds $300k + $50k admin — all current; page-level finance floor aligned to NEF. US Proclamation 10998 partial restrictions name Antigua and Dominica — St. Lucia not listed (CitizenX, Aug 2026).'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
    SRC + ' — globallawexperts · NTL · CitizenX 2026-08-03')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — thresholds verified, finance floor corrected')
}

// ─────────────────────────────────────────────────────────────
// GRENADA (id 31) — MATERIAL: NTF donation raised $150k -> $235k
// Verified 2026-09-10: NTF minimum $235,000 for a single applicant or a
// family of up to 4 (GIS Grenada 2026 announcement, cited by globallawexperts;
// corroborated by ImmigrantInvest Sep 2025, FlyingColour Jan 2026, Global
// Citizen Solutions, GoldenHarbors Jul 2026, Passportivity Aug 2026).
// All-in single ≈ $242.5k (imin-caribbean). RE share $270k unchanged.
// Proclamation 10998 does not name Grenada.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 31)
  if (!p) throw new Error('Grenada not found')

  const ntf = findPathway(p, 'ntf_donation')
  if (ntf) {
    const oldMin = ntf.min_investment_usd
    ntf.min_investment_usd = 235000
    audit(p, 'pathways.ntf_donation.min_investment_usd', oldMin, 235000,
      SRC + ' — GIS Grenada 2026 (via globallawexperts) · immigrantinvest 2025-09-07 · globalcitizensolutions · goldenharbors 2026-07-01')

    const oldNotes = ntf.notes
    ntf.notes =
      '$235,000 non-refundable contribution — flat for a single applicant or a family of up to 4 (2026 GIS announcement); processing fees additional; single applicant all-in ≈ $242.5k incl. due diligence.'
    audit(p, 'pathways.ntf_donation.notes', oldNotes, ntf.notes,
      SRC + ' — imin-caribbean 2026 (all-in breakdown)')
  }

  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 235000
  audit(p, 'finance.min_investment_usd', oldMin, 235000,
    SRC + ' — GIS Grenada 2026 announcement (multi-source corroborated)')

  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 245000
  audit(p, 'finance.typical_investment_usd', oldTyp, 245000,
    SRC + ' — modeled all-in single applicant ≈ $242.5k (imin-caribbean)')

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    (oldChanges ? oldChanges + ' ' : '') +
    'NTF donation raised $150k -> $235k (single or family of up to 4; GIS Grenada 2026, multi-source corroborated 2025-09 through 2026-08). US Proclamation 10998 partial restrictions name Antigua and Dominica — Grenada not listed; E-2 treaty differentiator unaffected.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
    SRC + ' — GIS Grenada 2026 · CitizenX 2026-08-03')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — NTF $235k hike applied')
}

// ─────────────────────────────────────────────────────────────
// BARBADOS (id 32) — VERIFICATION PASS (watch probes flagged both
// official URLs "changed"; rule review found no threshold change)
// Verified 2026-09-10: Welcome Stamp $50,000/yr income proof, 12-month
// permit, fees $2,000 individual / $3,000 family (official visitbarbados.org,
// accessed 2026-09-10) — matches corpus. SEP/SERP thresholds remain
// non-standardized (counsel-dependent) — no verified number to apply.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 32)
  if (!p) throw new Error('Barbados not found')

  const ws = findPathway(p, 'welcome_stamp')
  if (ws) {
    const old = ws.notes
    ws.notes =
      '$50,000/year remote income proof over the 12-month permit period; fees $2,000 individual / $3,000 family (official visitbarbados.org); 12-month renewable permit for location-independent workers — not a path to citizenship.'
    audit(p, 'pathways.welcome_stamp.notes', old, ws.notes,
      'Official visitbarbados.org Welcome Stamp page (accessed 2026-09-10) · taxesforexpats 2026-09')
  }

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY,
    SRC + ' — verification pass: both watch URLs flagged changed; rule review found no threshold change (Welcome Stamp $50k/yr + fees confirmed official)')
}

// ─────────────────────────────────────────────────────────────
// BAHAMAS (id 33) — CORRECTION: page-level finance fields aligned to
// the corrected EPR threshold. EPR = $1.0M (official immigration.gov.bs;
// RE or Central Bank zero-coupon bonds, 10-yr hold; raised from $750k
// eff. 1 Jan 2025 — already corrected in the Aug-22 sweep). The page-level
// min ($500k) / typical ($750k) and two Paige remnants ($750k+) still
// carried the old figure — aligned.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 33)
  if (!p) throw new Error('Bahamas not found')

  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 1000000
  audit(p, 'finance.min_investment_usd', oldMin, 1000000,
    SRC + ' — official immigration.gov.bs/residence/permanent-residence ($1.0M, accessed 2026-09-10) · dupuchrealestate 2026-07-18 (raised from $750k eff. 2025-01-01)')

  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 1200000
  audit(p, 'finance.typical_investment_usd', oldTyp, 1200000,
    SRC + ' — modeled all-in (EPR $1.0M + fees/DV processing)')

  const tipIdx = (p.paige_fields?.optimization_tips || []).findIndex(t => t.includes('$750k+'))
  if (tipIdx >= 0) {
    const oldTip = p.paige_fields.optimization_tips[tipIdx]
    p.paige_fields.optimization_tips[tipIdx] = oldTip.replace('$750k+', '$1M+')
    audit(p, 'paige_fields.optimization_tips', oldTip, p.paige_fields.optimization_tips[tipIdx], SRC)
  }

  const escIdx = (p.paige_fields?.escalate_when || '').indexOf('$750k+')
  if (escIdx >= 0) {
    const oldEsc = p.paige_fields.escalate_when
    p.paige_fields.escalate_when = oldEsc.replace('$750k+', '$1M+')
    audit(p, 'paige_fields.escalate_when', oldEsc, p.paige_fields.escalate_when, SRC)
  }

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — page-level finance aligned to corrected EPR $1.0M')
}

// ─────────────────────────────────────────────────────────────
// CROSS-CLUSTER REFINEMENT — Proclamation 10998 mechanism confirmed for
// Antigua (id 6) and Dominica (id 7): partial entry restriction implemented
// as a B-1/B-2 visa-VALIDITY cut for their nationals (10-yr reduced),
// effective 1 Jan 2026. Resolves the "monitor US access" open item on both.
// ─────────────────────────────────────────────────────────────
for (const { id, demonym } of [
  { id: 6, demonym: 'Antiguan and Barbudan' },
  { id: 7, demonym: 'Dominica' },
]) {
  const p = arr.find(x => x.id === id)
  if (!p) throw new Error(`id ${id} not found`)

  const oldNotes = p.critical_tests?.notes
  if (!oldNotes) throw new Error(`critical_tests.notes missing for id ${id}`)
  p.critical_tests = {
    ...p.critical_tests,
    notes:
      oldNotes +
      ' US Proclamation 10998 (eff. 1 Jan 2026): partial restriction implemented as a B-1/B-2 visa-validity cut for ' +
      demonym + ' nationals (10-year visas reduced) — entry not banned.',
  }
  audit(p, 'critical_tests.notes', oldNotes, p.critical_tests.notes,
    SRC + ' — CitizenX 2026-08-03 · State Dept travel.state.gov (P-10998, 39-country partial list)')
}

writeFileSync(FILE, JSON.stringify(d, null, 1) + '\n')
console.log('Batch 4 applied: St. Lucia + Grenada + Bahamas finance corrections, Barbados verification pass, Antigua/Dominica P-10998 refinement. last_checked =', TODAY)
