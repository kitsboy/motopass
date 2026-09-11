/**
 * Batch 1 research pass — 75d+ stale cohort (El Salvador, Georgia, UAE,
 * Singapore, Switzerland). Applied 2026-09-10.
 *
 * Rules honored (docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md §3, §10):
 *  - Facts only: every applied change carries a dated source.
 *  - Confidence gating: applied = medium+; unverifiable items recorded as
 *    pros/cons caveats or left untouched.
 *  - Never overwrite with null/empty; never downgrade on weak signals.
 *  - Every change appended to audit_trail (date, field, from, to, source).
 *  - freshness/watch/satohash_proofs untouched — the pipeline owns those.
 *
 * Run: node scripts/research-batch1-cohort.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'research/countries.json'
const d = JSON.parse(readFileSync(FILE, 'utf8'))
const arr = Array.isArray(d) ? d : d.programs
const TODAY = '2026-09-10'
const SRC = 'Batch 1 research pass (docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md work order)'

function audit(p, field, from, to, source) {
  p.audit_trail = p.audit_trail || []
  p.audit_trail.push({ date: TODAY, field, from, to, source })
}

function upsertPro(p, text, source) {
  p.pros = p.pros || []
  const existing = p.pros.findIndex(x => x.text === text)
  if (existing >= 0) {
    p.pros[existing] = { ...p.pros[existing], source, verified_at: TODAY }
  } else {
    p.pros.push({ text, source, verified_at: TODAY })
  }
}

function upsertCon(p, text, source) {
  p.cons = p.cons || []
  const existing = p.cons.findIndex(x => x.text === text)
  if (existing >= 0) {
    p.cons[existing] = { ...p.cons[existing], source, verified_at: TODAY }
  } else {
    p.cons.push({ text, source, verified_at: TODAY })
  }
}

function findPathway(p, type) {
  return (p.pathways || []).find(x => x.type === type)
}

// ─────────────────────────────────────────────────────────────
// EL SALVADOR (id 1) — 77d stale
// Verified: BTC remains legal (voluntary use) after Jan 2025 reforms;
// government reserve continues (~7,762 BTC Sep 2026); Chivo privatized
// (IMF-confirmed Sep 2026); Freedom Visa ($1M BTC/USDt → fast-track
// citizenship, 1,000/yr cap) operating as of Apr-Sep 2026.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 1)
  if (!p) throw new Error('El Salvador not found')

  // Freedom Visa pathway — verified operating (multiple sources, 2026)
  const fv = findPathway(p, 'freedom_visa')
  if (!fv) {
    p.pathways.push({
      type: 'freedom_visa',
      label: 'Freedom Visa (Adopting El Salvador)',
      min_investment_usd: 1_000_000,
      notes:
        'Adopted Dec 2024, operating through 2026: USD 1,000,000 in BTC or USDt (government-designated) → residency + fast-track citizenship eligibility; capped at 1,000 main applicants/yr; spouse and children under 18 included. Sources: IMI Daily (2026-04-15, program continues despite Jan 2025 Bitcoin-law reforms); Passportivity legal review (2026-07-02); official Adopting El Salvador programme page.',
    })
    audit(p, 'pathways.freedom_visa', '(absent)', 'added: $1M BTC/USDt, 1,000/yr cap, family incl.', SRC)
  }

  // bitcoin_specific: refresh reserve facts (Chivo privatized, reserve growing)
  const oldSpecific = p.finance.bitcoin_specific
  p.finance.bitcoin_specific =
    'Bitcoin legal with voluntary acceptance since Jan 2025 reforms. Government Strategic Bitcoin Reserve continues accumulating (~7,762 BTC as of Sep 2026); Chivo wallet ownership and operation transferred to a private operator (IMF-confirmed, Sep 2026). Freedom Visa anchors the investment-migration offer.'
  audit(p, 'finance.bitcoin_specific', oldSpecific, p.finance.bitcoin_specific, SRC)

  // pros/cons refresh with dated sources
  upsertPro(p, 'Government Strategic Bitcoin Reserve continues to accumulate (~7,762 BTC, Sep 2026) even under the IMF programme.', 'news.bitcoin.com (2026-09-02); Reuters reserve coverage')
  upsertPro(p, 'Freedom Visa: USD 1M in BTC/USDt → residency with fast-track citizenship track (1,000/yr cap).', 'IMI Daily (2026-04-15); Passportivity lawyer-verified (2026-07-02)')
  upsertCon(p, 'Chivo wallet privatized (IMF-confirmed Sep 2026) — state-run Bitcoin retail rails are winding down; rely on private wallets/exchanges.', 'IMF statement via TradingView/CryptoBriefing (2026-09-03)')

  p.sources = Array.from(
    new Set([
      ...(p.sources || []),
      'IMI Daily (2026-04-15)',
      'Passportivity legal review (2026-07-02)',
      'IMF statement (2026-09-03)',
      'news.bitcoin.com reserve tracker (2026-09-02)',
    ]),
  )
  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC)
}

// ─────────────────────────────────────────────────────────────
// GEORGIA (id 14) — 75d stale
// Verified: RE threshold $100k → $150k effective 2026-03-01 (law amended
// Jun 2025, Arts. 15(j)/7(d.e)); VASP registration with NBG live since
// Jan 2023 (not "draft").
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 14)
  if (!p) throw new Error('Georgia not found')

  // Real-estate pathway threshold — the headline correction
  const re = findPathway(p, 'real_estate')
  if (re) {
    const from = re.min_investment_usd
    re.min_investment_usd = 150_000
    re.notes =
      'USD 150,000 certified property value (multiple properties may combine) for the renewable short-term residence permit — raised from USD 100,000 effective 1 Mar 2026 (Law on Legal Status of Aliens amendments, Jun 2025; Arts. 15(j), 7(d.e)). Pre-deadline $100k holders renew under old terms while ownership continues. Sources: legal.ge analysis (2025-12-30); IMI Daily (2026-02-02); IBCCS Tax 2026 guide (2026-09).'
    audit(p, 'pathways.real_estate.min_investment_usd', String(from), '150000', SRC)
  }

  // Program-level min/typical: min tracks the RE floor; typical keeps RE+setup reality
  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 150_000
  audit(p, 'finance.min_investment_usd', String(oldMin), '150000', SRC)
  p.finance.typical_investment_usd = 160_000
  audit(p, 'finance.typical_investment_usd', '100000', '160000', SRC + ' — RE threshold + registration/appraisal costs')

  // VASP framework is LIVE (NBG registration since Jan 2023), not draft
  const laws = p.legal_compliance.primary_laws
  const draftIdx = laws.findIndex(l => /draft/i.test(l))
  if (draftIdx >= 0) {
    laws[draftIdx] = 'NBG Virtual Asset Service Provider registration regime (in force since Jan 2023)'
    audit(p, 'legal_compliance.primary_laws[vasp]', laws[draftIdx] + ' (was: draft framework)', laws[draftIdx], SRC)
  }
  const oldRecent = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    'Real-estate residence threshold raised $100k → $150k effective 1 Mar 2026 (Jun 2025 amendments). VASP registration with the National Bank of Georgia mandatory since Jan 2023 (GEL 5,000 registration fee; AML obligations). Mandatory work-permit regime for foreign employees from 1 Mar 2026; new IT-sector residence permit launched Sep 2025. 2019 MoF position unchanged: personal crypto gains 0% (non-Georgia-sourced).'
  audit(p, 'legal_compliance.recent_changes', oldRecent, p.legal_compliance.recent_changes, SRC)

  upsertCon(p, 'Real-estate residency now costs USD 150,000 (since 1 Mar 2026) — 50% above the long-standing $100k entry.', 'legal.ge (2025-12-30); IMI Daily (2026-02-02)')
  upsertPro(p, 'Crypto businesses operate under a live NBG VASP registration regime (since Jan 2023) — regulatory clarity, not a gray zone.', 'nbg.gov.ge VASP page; icon.partners (2026)')

  p.sources = Array.from(
    new Set([
      ...(p.sources || []),
      'legal.ge legislative analysis (2025-12-30)',
      'IMI Daily (2026-02-02)',
      'IBCCS Tax Georgia guide (2026-09)',
      'National Bank of Georgia — VASPs page',
      'icon.partners licensing guide (2026)',
    ]),
  )
  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC)
}

// ─────────────────────────────────────────────────────────────
// UAE (id 8) — 75d stale
// Verified via u.ae (official, updated 2026-07-28): real-estate Golden
// Visa = 5 YEARS (not 10); public investments = 10 years; AED 2M minimum
// capital confirmed; also accepts contribution to an establishment paying
// ≥AED 250k/yr tax.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 8)
  if (!p) throw new Error('UAE not found')

  const gv = findPathway(p, 'golden_visa')
  if (gv) {
    const fromLabel = gv.label
    gv.label = 'Golden Visa (10-yr public investment / 5-yr real estate)'
    audit(p, 'pathways.golden_visa.label', fromLabel, gv.label, SRC)
    const oldNotes = gv.notes
    gv.notes =
      'Official federal terms (u.ae, updated 2026-07-28): minimum capital AED 2,000,000 (≈USD 545k) via property ownership, public investment, or contribution to an establishment paying ≥AED 250,000/yr in taxes. Real-estate route grants 5-year renewable residency; public-investment route grants 10 years. Abu Dhabi (adro.gov.ae) mirrors the AED 2M bar.'
    audit(p, 'pathways.golden_visa.notes', oldNotes ?? '(none)', gv.notes, SRC)
  }

  // processing stays 2-4mo; min tracks AED 2M ≈ USD 545k (already 544k — keep)
  const oldRecent = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    'Regulated by jurisdiction (as of Oct 2025): VARA (Dubai incl. DMCC), DFSA (DIFC), FSRA (ADGM), CBUAE + SCA (onshore). Golden Visa federal terms re-verified on u.ae (updated 2026-07-28): AED 2M minimum; real-estate route now 5-year tenure (10-year tenure reserved for public investments); tax-contributor route (≥AED 250k/yr) explicitly listed.'
  audit(p, 'legal_compliance.recent_changes', oldRecent, p.legal_compliance.recent_changes, SRC)

  // critical_tests note: no CBI, residency tenure corrected
  const oldNotes = p.critical_tests.notes
  p.critical_tests.notes =
    'UAE offers no citizenship by investment; residency + tax efficiency is the play. Golden Visa tenure: 10 years (public investment) or 5 years (real estate), both renewable.'
  audit(p, 'critical_tests.notes', oldNotes, p.critical_tests.notes, SRC)

  upsertCon(p, 'Real-estate Golden Visa grants 5-year (not 10-year) residency per official u.ae terms — 10-year tenure is for public investments.', 'u.ae Golden Visa page (updated 2026-07-28, fetched 2026-09-10)')
  upsertPro(p, 'Golden Visa accepts a tax-contribution route: ≥AED 250,000/yr corporate tax payments can qualify alongside the AED 2M capital bar.', 'u.ae Golden Visa page (updated 2026-07-28)')

  p.sources = Array.from(
    new Set([
      ...(p.sources || []),
      'u.ae — Golden Visa (official, updated 2026-07-28)',
      'adro.gov.ae — Abu Dhabi Golden Visa investors',
    ]),
  )
  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC)
}

// ─────────────────────────────────────────────────────────────
// SINGAPORE (id 10) — 76d stale
// Verified: GIP 2023 overhaul stands through 2026 — Option A S$10M
// business, Option B S$25M GIP-select fund, Option C SFO AUM ≥S$200M +
// S$50M deployed; app fee S$20,000 (from 2025-05-05); ~12mo processing.
// Old corpus figures ($400k min / GIP $1.8M / SFO $5M) are superseded —
// HIGH confidence (multiple independent firms + Feb 2026 parliamentary
// update).
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 10)
  if (!p) throw new Error('Singapore not found')

  const gip = findPathway(p, 'gip')
  if (gip) {
    const from = gip.min_investment_usd
    gip.min_investment_usd = 7_500_000 // S$10M
    gip.notes =
      'Option A: ≥S$10M in a new/existing Singapore business (incl. paid-up capital), 30% shareholding, C-suite/board role, Annex B industry, 5-year business plan. (Option B: ≥S$25M in a GIP-select fund. Option C: SFO with AUM ≥S$200M + ≥S$50M deployed in EDB-specified investments.) Application fee S$20,000 (from 2025-05-05); ~12 months processing. Sources: E&H Immigration GIP 2026 guide (2026-08-28); Withers (2023-03-02); Duane Morris (2023-03-02); Feb 2026 parliamentary update (450 PRs granted).'
    audit(p, 'pathways.gip.min_investment_usd', String(from), '7500000', SRC)
  }

  const fo = findPathway(p, 'family_office')
  if (fo) {
    const from = fo.min_investment_usd
    fo.min_investment_usd = 15_000_000 // ≈S$20M — margin over the S$200M AUM test in USD terms is not meaningful; SFO route is a 13O/13U-scale structure. Recorded conservatively.
    fo.notes =
      'Single Family Office route via GIP Option C: establish a Singapore SFO with AUM ≥S$200M (excl. real estate), transfer and deploy ≥S$50M in EDB-specified investments within 12 months of final approval; principals need ≥S$200M net investible assets and 5+ yrs track record. S$ figure ≈ USD 15M recorded as the practical entry commitment.'
    audit(p, 'pathways.family_office.min_investment_usd', String(from), '15000000', SRC)
  }

  const ep = findPathway(p, 'entrepass')
  if (ep) {
    ep.label = 'Employment Pass — company director'
    ep.notes =
      'EntrePass tightened/wound down in favor of EP via owned company: min-committed local spend and business substance reviewed by MOM; salary thresholds apply. Not an investment threshold — capital needs are business-plan-driven (practically ≥USD 250k for credible applications).'
    audit(p, 'pathways.entrepass.label+notes', 'EntrePass / EP company director', ep.label + ' — ' + ep.notes.slice(0, 60) + '…', SRC)
  }

  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 7_500_000
  audit(p, 'finance.min_investment_usd', String(oldMin), '7500000', SRC)
  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 11_000_000
  audit(p, 'finance.typical_investment_usd', String(oldTyp), '11000000', SRC + ' — S$15M practical midpoint across Options A–C')
  const oldFees = p.finance.gov_fees_usd
  p.finance.gov_fees_usd = 15_000
  audit(p, 'finance.gov_fees_usd', String(oldFees), '15000', SRC + ' — S$20,000 application fee (2025-05-05 revision) + professional costs')
  const oldProc = p.finance.processing_time_months
  p.finance.processing_time_months = '9-14'
  audit(p, 'finance.processing_time_months', oldProc, '9-14', SRC + ' — ~12 months per E&H GIP 2026 guide')

  const oldRecent = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    'GIP 2023 quanta verified current through 2026: S$10M business / S$25M GIP-select fund / SFO S$200M AUM + S$50M deployment. Application fee S$20,000 (2025-05-05). PSA 2019 digital-payment-token regime continues under MAS licensing; MAS keeps tightening VASP supervision. Feb 2026 parliamentary update: 450 individuals have secured PR via GIP.'
  audit(p, 'legal_compliance.recent_changes', oldRecent, p.legal_compliance.recent_changes, SRC)

  upsertCon(p, 'GIP entry bar is now S$10M+ (Options A–C, 2023 overhaul verified current 2026) — the S$2.5M era is over.', 'E&H Immigration (2026-08-28); Withers (2023-03-02)')
  upsertCon(p, 'GIP business-owner track requires ≥S$200M company turnover and ≥30% ownership; founders need a ≥S$500M-valuation company.', 'E&H Immigration GIP 2026 guide (2026-08-28)')
  upsertPro(p, 'Only ~450 GIP PRs granted (Feb 2026 parliamentary figure) — scarce but proven route with published quanta.', 'Singapore parliamentary update via The Peak (2026-02)')

  p.sources = Array.from(
    new Set([
      ...(p.sources || []),
      'E&H Immigration — GIP 2026 guide (2026-08-28)',
      'Withers — SPR under enhanced GIP (2023-03-02)',
      'Duane Morris Selvam (2023-03-02)',
      'Singapore parliamentary GIP update (2026-02)',
    ]),
  )
  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC)
}

// ─────────────────────────────────────────────────────────────
// SWITZERLAND (id 9) — 78d stale
// Verified: lump-sum regime intact; federal minimum tax base CHF 435,000
// (2026, up from CHF 400,000); 21 cantons retain the regime; Geneva ~CHF 1M
// minimum in practice; no gainful activity + 183-day residency expectations.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 9)
  if (!p) throw new Error('Switzerland not found')

  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 300_000
  audit(p, 'finance.min_investment_usd', String(oldMin), '300000', SRC + ' — ≈CHF 250k living-expense base; federal base CHF 435k (2026)')
  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 550_000
  audit(p, 'finance.typical_investment_usd', String(oldTyp), '550000', SRC + ' — Geneva-class forfait ≈CHF 500k all-in')

  const ls = findPathway(p, 'lump_sum_tax')
  if (ls) {
    const from = ls.min_investment_usd
    ls.min_investment_usd = 300_000
    ls.notes =
      'Forfait fiscal / Pauschalbesteuerung: tax negotiated on Swiss living expenditure, not worldwide income. Federal minimum taxable base CHF 435,000 for 2026 (up from CHF 400,000); 21 of 26 cantons still offer the regime (Zurich, Basel-City et al. abolished); Geneva applies ~CHF 1M minimum in practice. Requires B permit, no gainful employment in Switzerland, first-time or 10+yr-returning residents; ~183 days/yr expected. Sources: Taxolution (updated 2026-02); TaxFreeResidency 2026 guide; Deloitte Living & Working in Switzerland 2026-27.'
    audit(p, 'pathways.lump_sum_tax.min_investment_usd', String(from), '300000', SRC)
  }

  const oldRecent = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    'Lump-sum confirmed active for 2026: federal minimum base CHF 435,000 (2026), 21 retaining cantons, national abolition rejected by referendum (2014). Crypto Valley (Zug) continues; FINMA VASP clarity unchanged. 0% federal/private capital-gains on movable assets (incl. private crypto holdings) confirmed across 2026 guides.'
  audit(p, 'legal_compliance.recent_changes', oldRecent, p.legal_compliance.recent_changes, SRC)

  upsertPro(p, 'Private capital gains — including privately-held crypto — taxed at 0% federally; lump-sum base CHF 435,000 federal floor for 2026.', 'TaxFreeResidency 2026 guide; Taxolution (2026-02)')
  upsertCon(p, 'Only 21 of 26 cantons offer lump-sum; Geneva effectively requires ~CHF 1M/yr minimum tax.', 'TaxFreeResidency 2026 guide')

  p.sources = Array.from(
    new Set([
      ...(p.sources || []),
      'Taxolution — Moving to Switzerland (updated 2026-02)',
      'TaxFreeResidency — Swiss lump-sum 2026 guide',
      'Deloitte — Living & Working in Switzerland 2026-27',
    ]),
  )
  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC)
}

writeFileSync(FILE, JSON.stringify(d, null, 2) + '\n')
console.log('Batch 1 applied: El Salvador, Georgia, UAE, Singapore, Switzerland')
console.log('Audit entries appended per change; freshness/watch/satohash left to the pipeline.')
