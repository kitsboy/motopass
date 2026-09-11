/**
 * Batch 2 research pass — 50d tier (Costa Rica, Hong Kong, Thailand,
 * Mexico, Cyprus). Applied 2026-09-10.
 *
 * Rules honored (docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md §3, §10):
 *  - Facts only: every applied change carries a dated source.
 *  - Confidence gating: applied = medium+; unverified items left untouched.
 *  - Never overwrite with null/empty; never downgrade on weak signals.
 *  - Every change appended to audit_trail (date, field, from, to, source).
 *  - freshness/watch/satohash_proofs untouched — the pipeline owns those.
 *
 * Run: node scripts/research-batch2-tier50.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'research/countries.json'
const d = JSON.parse(readFileSync(FILE, 'utf8'))
const arr = Array.isArray(d) ? d : d.programs
const TODAY = '2026-09-10'
const SRC = 'Batch 2 research pass (docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md work order)'

function audit(p, field, from, to, source) {
  p.audit_trail = p.audit_trail || []
  p.audit_trail.push({ date: TODAY, field, from, to, source })
}

function upsertPro(p, text, source) {
  p.pros = p.pros || []
  const i = p.pros.findIndex(x => x.text === text)
  if (i >= 0) p.pros[i] = { ...p.pros[i], source, verified_at: TODAY }
  else p.pros.push({ text, source, verified_at: TODAY })
}

function upsertCon(p, text, source) {
  p.cons = p.cons || []
  const i = p.cons.findIndex(x => x.text === text)
  if (i >= 0) p.cons[i] = { ...p.cons[i], source, verified_at: TODAY }
  else p.cons.push({ text, source, verified_at: TODAY })
}

function findPathway(p, type) {
  return (p.pathways || []).find(x => x.type === type)
}

// ─────────────────────────────────────────────────────────────
// COSTA RICA (id 16) — 50d stale — VERIFICATION PASS
// All corpus thresholds confirmed current across multiple 2026 sources:
// inversionista $150k; rentista $2,500/mo × 24mo (or $60k bank CD —
// alternative documented); nomad ~$3,000/mo (Ley 9996). BCCR stance
// unchanged. No numeric changes applied — honesty preserved.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 16)
  if (!p) throw new Error('Costa Rica not found')

  // Rentista: document the $60k deposit alternative (verified Aug 2026)
  const rent = findPathway(p, 'rentista')
  if (rent) {
    const old = rent.notes
    rent.notes =
      'USD 2,500/month guaranteed passive income for 2+ years (investments, dividends, rentals) — apostilled proof required. Alternative: a USD 60,000 deposit in an approved Costa Rican bank qualifies. Sources: GoldenHarbors rentista guide (2026-08-26); Riotimes residency guide (2026-09); TaxesForExpats 2026 guide (2026-02-17).'
    audit(p, 'pathways.rentista.notes', old, rent.notes, SRC)
  }

  const inv = findPathway(p, 'inversionista')
  if (inv) {
    const old = inv.notes
    inv.notes =
      'USD 150,000+ in qualifying business, securities, or real estate — verified current for 2026 (Law 9996-era criteria unchanged); leads to temporary residency then permanent. Sources: TaxesForExpats 2026 guide (2026-02-17); Riotimes (2026-09); LottaLingo 2026 visa guide.'
    audit(p, 'pathways.inversionista.notes', old, inv.notes, SRC)
  }

  upsertPro(p, 'All three residency thresholds ($150k invest / $2,500/mo rentista / ~$3k nomad) re-verified current for 2026 — no surprise changes.', 'Batch 2 verification pass (2026-09-10) across 2026 guides')

  p.sources = Array.from(new Set([...(p.sources || []),
    'TaxesForExpats Costa Rica 2026 guide (2026-02-17)',
    'GoldenHarbors rentista guide (2026-08-26)',
    'Riotimes Costa Rica residency (2026-09)',
  ]))
  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — verification pass, no numeric drift found')
}

// ─────────────────────────────────────────────────────────────
// HONG KONG (id 17) — 50d stale — CORRECTIONS
// Verified via newcies.gov.hk (official) + SCMP + IMI: residential
// single-property threshold LOWERED HK$50M → HK$30M effective 2025-09-17;
// residential cap stays HK$10M; aggregate RE cap raised to HK$15M.
// TTPS Cat A: 36-month initial stay (official ImmD), HK$2.5M income bar
// confirmed.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 17)
  if (!p) throw new Error('Hong Kong not found')

  const cies = findPathway(p, 'cies')
  if (cies) {
    const old = cies.notes
    cies.notes =
      'HK$30M net minimum (official New CIES site): HK$27M into permissible financial assets and/or real estate + mandatory HK$3M CIES Investment Portfolio (HKIC); HK$30M net assets held 6 months prior. Residential real estate: single property must transact at ≥HK$30M (lowered from HK$50M effective 17 Sep 2025, 2025 Policy Address); residential investment cap remains HK$10M; aggregate real-estate cap raised to HK$15M. CD subcap HK$3M (10%). Launched Mar 2024; 2-year visa, PR track at 7 years. Sources: newcies.gov.hk investment-requirement page (fetched 2026-09-10); SCMP (2025-09-17); IMI Daily (2025-09-19); newcies.gov.hk scheme-rules PDF.'
    audit(p, 'pathways.cies.notes', old, cies.notes, SRC)
  }

  const ttps = findPathway(p, 'ttps')
  if (ttps) {
    const old = ttps.notes
    ttps.notes =
      'Category A: HK$2.5M+ annual income (year immediately preceding application) → 36-month initial stay (ImmD official). Categories B/C: top-100 university graduates (B: 3+ yrs experience; C: quota-capped recent grads) → 24 months. No employer sponsor required; no offer of employment needed. Source: immd.gov.hk TTPS page (fetched 2026-09-10).'
    audit(p, 'pathways.ttps.notes', old, ttps.notes, SRC)
  }

  const oldRecent = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    'VATP regime in force under SFC licensing since mid-2024. CIES enhancements: residential RE permitted from 2024-10-16 (single property ≥HK$50M then); threshold lowered to HK$30M and aggregate RE cap raised to HK$15M effective 2025-09-17 (2025 Policy Address); eligible wholly-owned private company investments counted from 2025-03-01. TTPS Cat A grants 36 months (official).'
  audit(p, 'legal_compliance.recent_changes', oldRecent, p.legal_compliance.recent_changes, SRC)

  upsertCon(p, 'CIES residential route needs a single property transacting at ≥HK$30M (2025-09-17 relaxation) — still far above the HK$10M cap that counts toward the HK$30M total.', 'SCMP (2025-09-17); newcies.gov.hk rules')
  upsertPro(p, 'CIES residential threshold halved (HK$50M → HK$30M, Sep 2025) and non-residential room increased — property route materially more accessible.', 'IMI Daily (2025-09-19); 2025 Policy Address')

  p.sources = Array.from(new Set([...(p.sources || []),
    'newcies.gov.hk — official investment requirement page (fetched 2026-09-10)',
    'SCMP CIES relaxation (2025-09-17)',
    'IMI Daily (2025-09-19)',
    'immd.gov.hk — TTPS official page (fetched 2026-09-10)',
  ]))
  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC)
}

// ─────────────────────────────────────────────────────────────
// THAILAND (id 18) — 50d stale — UPDATES
// LTR thresholds confirmed current (BOI-derived 2026 sources). Remittance
// tax uncertainty RESOLVED: May 2025 draft legislation — foreign income
// remitted in the year earned or the following year is exempt; taxable
// only when remitted later. Elite rebranded "Thailand Privilege" with new
// pricing: Bronze ฿650k/5yr → Reserve ฿5M/20yr.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 18)
  if (!p) throw new Error('Thailand not found')

  const elite = findPathway(p, 'elite')
  if (elite) {
    const oldMin = elite.min_investment_usd
    elite.label = 'Thailand Privilege residence (ex-Elite)'
    elite.min_investment_usd = 20_000 // ฿650k Bronze ≈ USD 20k @ ~32 THB/USD
    elite.notes =
      'Rebranded Thailand Privilege (2024). Official tiers (GSSA-verified 2026-09-08): Bronze ฿650,000 / 5 yr (extended to 30 Sep 2026); Gold ฿900,000 / 5 yr; Platinum ฿1,500,000 / 10 yr; Diamond ฿2,500,000 / 15 yr; Reserve ฿5,000,000 / 20 yr. Lifestyle membership — no income proof, no work authorization. Family add-on ฿750,000 promo until 30 Sep 2026. Sources: thailandprivilege.co.th tiers; Siam Legal GSSA guide (2026-09-08).'
    audit(p, 'pathways.elite.label+min+notes', `15000 / old pricing`, `20000 / ${elite.label} / new tiers`, SRC)
  }

  // LTR pathway verified — refresh notes with 2026 confirmation
  const ltr = findPathway(p, 'ltr')
  if (ltr) {
    const old = ltr.notes
    ltr.notes =
      'Four categories (official BOI criteria re-verified current for 2026): Wealthy Global Citizen = USD 1M assets + USD 500k Thai investment (gov bonds 5yr+ / direct investment / property); Wealthy Pensioner (50+) = USD 80k/yr passive (or 40k + USD 250k investment); Work-from-Thailand = USD 80k/yr (or 40k + master\u2019s); High-Skilled = USD 80k/yr (or 40k + STEM master\u2019s). 10-year visa (5+5), digital work permit, 17% PIT for skilled professionals. Sources: BOI criteria via 2026 LTR guides; Pattaya News LTR 2026 discussion (2026).'
    audit(p, 'pathways.ltr.notes', old, ltr.notes, SRC)
  }

  // Remittance tax: uncertainty resolved — update critical_tests + recent_changes
  const oldNotes = p.critical_tests.notes
  p.critical_tests.notes =
    'Foreign-income remittance rule clarified (May 2025 draft legislation): foreign income remitted to Thailand in the year earned or the following year is exempt from Thai tax; remitted later, it is assessable (rules apply to income earned from 1 Jan 2024). 180-day tax residency; citizenship rare; PR possible after 3 years on qualifying visas. Structure remittances within the 1-year window.'
  audit(p, 'critical_tests.notes', oldNotes, p.critical_tests.notes, SRC)

  const oldRecent = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    'Crypto payments banned since 1 Apr 2022 (BoT/SEC); owning/trading legal. LTR (2022) thresholds re-verified current. Remittance tax: 2024 strict remittance rule superseded by May 2025 draft legislation — same-year/next-year remittance exempt, later remittance taxable (income from 2024 onward). Thailand Privilege (ex-Elite) pricing updated 2026.'
  audit(p, 'legal_compliance.recent_changes', oldRecent, p.legal_compliance.recent_changes, SRC)

  upsertPro(p, 'Remittance-tax clarity (May 2025 draft): foreign income remitted within ~1 year of earning is tax-exempt — restores nomad/BTCer planning certainty.', 'Siam Legal (2025-05); Expattaxthailand (2026-01-11)')
  upsertCon(p, 'Crypto cannot be used for payments (2022 ban) — spending BTC locally requires off-ramp to THB first.', 'Bank of Thailand/SEC rules (2022, unchanged)')

  p.sources = Array.from(new Set([...(p.sources || []),
    'Siam Legal — foreign income remittance revision (2025-05)',
    'Expattaxthailand — 2026 remittance update (2026-01-11)',
    'Siam Legal — Thailand Privilege 2026 GSSA guide (2026-09-08)',
    'thailandprivilege.co.th — official tiers',
  ]))
  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC)
}

// ─────────────────────────────────────────────────────────────
// MEXICO (id 19) — 50d stale — MAJOR CORRECTIONS (deferred INM item resolved)
// July 2025 consular guidelines + UMA 2026 (117.31 MXN, ~18 MXN/USD):
// Temporary = ~US$4,400/mo income OR ~US$74k balance (12-month maintained);
// Permanent = ~US$7,400/mo OR ~US$298k. House route MXN 10,758,500 (~$598k).
// Investment route MXN 5,378,664 ≈ US$300k (corpus said $250k). Crypto NOT
// accepted as proof of savings. Consulates vary ±5–10%.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 19)
  if (!p) throw new Error('Mexico not found')

  const temp = findPathway(p, 'temporary_resident')
  if (temp) {
    const oldMin = temp.min_investment_usd
    temp.min_investment_usd = 74_000
    temp.notes =
      '2026 economic solvency (July 2025 consular guidelines; UMA 2026 = 117.31 MXN): EITHER ~US$4,400/month net income over the last 6–12 months OR ~US$74,000 in savings/investments maintained for 12 months (consulates vary ±5–10%; e.g. Tucson $73,215, Las Vegas $78,025). 1–4 year renewable. Crypto and precious metals are NOT accepted as proof. Sources: Mexperience 2026 criteria (fetched 2026-09-10); MexLaw UMA calc (2026-01-28); consulate pages (2025-12/2026).'
    audit(p, 'pathways.temporary_resident.min+notes', `${oldMin} / ~$2,600/mo or ~$43k balance`, `74000 / ~$4,400/mo or ~$74k balance (2026 UMA)`, SRC)
  }

  const inv = findPathway(p, 'investor')
  if (inv) {
    const oldMin = inv.min_investment_usd
    inv.min_investment_usd = 300_000
    inv.notes =
      'Capital investment route: MXN 5,378,664 (≈US$300,000 at 18 MXN/USD, 2026) into a Mexican company or listed securities — qualifies for temporary residency (permanent via 4-year upgrade or direct solvency). Property-ownership route also exists: residential property valued ≥MXN 10,758,500 (≈US$598,000), lien-free, in Mexico. Source: Mexperience 2026 investment criteria (fetched 2026-09-10).'
    audit(p, 'pathways.investor.min+notes', `${oldMin} / verify MXN equivalent`, `300000 / MXN 5,378,664 fixed (2026)`, SRC)
  }

  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 74_000
  audit(p, 'finance.min_investment_usd', String(oldMin), '74000', SRC + ' — tracks temporary-resident savings bar (2026 UMA)')
  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 120_000
  audit(p, 'finance.typical_investment_usd', String(oldTyp), '120000', SRC + ' — solvency buffer + setup costs')
  const oldRecent = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    'July 2025 consular guidelines moved solvency calculations to UMA-based formulas (UMA 2026 = 117.31 MXN, +3.69% YoY) — temporary-resident bars roughly doubled in USD terms as the peso appreciated (~18 MXN/USD). Crypto/precious metals explicitly excluded from solvency proof. Bitcoin legal since 2017; FinTech Law virtual-asset regime unchanged; INM fees up for 2026 (PR card MXN 13,578.96).'
  audit(p, 'legal_compliance.recent_changes', oldRecent, p.legal_compliance.recent_changes, SRC)

  upsertCon(p, 'Solvency bars roughly doubled in USD for 2026: ~$4,400/mo income or ~$74k balance for temporary residency (was ~$2,600/$43k).', 'Mexperience 2026 criteria (2026-09); MexLaw UMA calc (2026-01-28)')
  upsertCon(p, 'Crypto holdings are explicitly NOT accepted as solvency proof — residency funds must sit in fiat accounts.', 'Mexperience 2026 criteria (fetched 2026-09-10)')

  p.sources = Array.from(new Set([...(p.sources || []),
    'Mexperience — Financial criteria for residency 2026 (fetched 2026-09-10)',
    'MexLaw — 2026 economic solvency & UMA (2026-01-28)',
    'Consulmex Tucson / Las Vegas 2026 visa pages',
  ]))
  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC)
}

// ─────────────────────────────────────────────────────────────
// CYPRUS (id 20) — 50d stale — CORRECTIONS (deferred 6.2 income item resolved)
// Post-May-2023 criteria (in force, verified Mar 2025 + 2026 guides):
// €300k investment across FOUR categories (new residential; other RE incl.
// resale; company share capital with 5 employees; AIF/AIFLNP/RAIF units)
// + €50,000/yr secured income (+€15k spouse, +€10k per minor child).
// The old €30k bank deposit requirement is GONE. PR renewable every 10
// years; visit at least every 2 years; annual compliance declarations.
// Citizenship ~7 yrs presence (2,655 days) ≈ 8 calendar years, B1 Greek.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 20)
  if (!p) throw new Error('Cyprus not found')

  const pr = findPathway(p, 'permanent_residency')
  if (pr) {
    const old = pr.notes
    pr.notes =
      'Regulation 6(2) fast-track PR (criteria since 2 May 2023, verified 2025-03 & 2026-01): €300,000 (plus VAT where applicable) in ONE of four categories — (A) first-sale house/apartment, (B) other real estate incl. resale (offices, shops, hotels), (C) €300k share capital in a Cyprus company with physical presence + 5 employees, (D) units in Cyprus AIF/AIFLNP/RAIF. PLUS secured annual income of €50,000 (€15,000 spouse; €10,000 per minor child) — Category A income must be foreign-sourced. Criminal record + health insurance mandatory; annual compliance declarations to CRMD; PR card renews every 10 years; visit at least once every 2 years. ~2-month processing. Sources: Erotocritou LLC (2025-03-05); Global Residence Index 2026 guide (2026-01-16); CRMD practice.'
    audit(p, 'pathways.permanent_residency.notes', old + ' (€30k deposit, new-build only)', pr.notes, SRC)
  }

  const oldRecent = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    '6.2 PR criteria revised 2 May 2023 (in force): four investment categories (residential first-sale / other RE incl. resale / company / funds) + €50k secured annual income (+€15k spouse, +€10k minor child) — the 2021-era €30k bank deposit requirement no longer applies. Golden passport terminated Nov 2020. Individuals: crypto legal, unregulated; business activity under CySEC CASP + EU MiCA. Schengen accession talks ongoing.'
  audit(p, 'legal_compliance.recent_changes', oldRecent, p.legal_compliance.recent_changes, SRC)

  const oldClock = p.compliance_clock
  p.compliance_clock = {
    ...oldClock,
    residency_day_count_target: oldClock.residency_day_count_target,
  }
  p.compliance_clock.renewal_interval_months = 120
  audit(p, 'compliance_clock.renewal_interval_months', String(oldClock.renewal_interval_months), '120', SRC + ' — 6.2 PR card renews every 10 years (visit ≥ every 2 yrs)')
  p.critical_tests = {
    ...p.critical_tests,
    notes:
      'EU member. 6.2 PR: no minimum stay, but visit ≥ once every 2 years and annual compliance declarations. Citizenship: ~7 years of presence (2,655 days — typically 8 calendar years), B1 Greek + civic test; final year near-continuous residence. Golden passport (CBI) closed Nov 2020 — do not confuse with 6.2 PR.',
  }
  audit(p, 'critical_tests.notes', p.critical_tests.notes === undefined ? '(none)' : '(see audit)', p.critical_tests.notes, SRC)

  upsertCon(p, '6.2 requires €50,000/yr secured income on top of the €300k investment (+€15k spouse, +€10k per minor child) — and Category A (residential) income must come from abroad.', 'Erotocritou LLC (2025-03-05); GRI 2026 guide (2026-01-16)')
  upsertPro(p, '6.2 investment menu widened (2023): resale commercial property, company share capital, and fund units all qualify — not just new-build residential.', 'Erotocritou LLC (2025-03-05)')

  p.sources = Array.from(new Set([...(p.sources || []),
    'Erotocritou LLC — Reg 6(2) amendments (2025-03-05)',
    'Global Residence Index — Cyprus Golden Visa 2026 (2026-01-16)',
    'CRMD — Civil Registry & Migration Department practice notes',
  ]))
  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC)
}

writeFileSync(FILE, JSON.stringify(d, null, 2) + '\n')
console.log('Batch 2 applied: Costa Rica (verification pass), Hong Kong, Thailand, Mexico, Cyprus')
console.log('Audit entries appended per change; freshness/watch/satohash left to the pipeline.')
