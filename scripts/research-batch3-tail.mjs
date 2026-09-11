/**
 * Batch 3 research pass — 80–98d tail (Uruguay, Bolivia, Antigua,
 * St. Kitts, Dominica, Panama, Portugal, Paraguay, CAR). Applied 2026-09-10.
 *
 * Rules honored (docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md §3, §10):
 *  - Facts only: every applied change carries a dated source.
 *  - Confidence gating: applied = medium+; unverified items left untouched.
 *  - Never overwrite with null/empty; never downgrade on weak signals.
 *  - Every change appended to audit_trail (date, field, from, to, source).
 *  - freshness/watch/satohash_proofs untouched — the pipeline owns those.
 *
 * Run: node scripts/research-batch3-tail.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'research/countries.json'
const d = JSON.parse(readFileSync(FILE, 'utf8'))
const arr = Array.isArray(d) ? d : d.programs
const TODAY = '2026-09-10'
const SRC = 'Batch 3 research pass (docs/CLAUDE-RESEARCH-PROMPT work order, 80–98d tail)'

function audit(p, field, from, to, source) {
  p.audit_trail = p.audit_trail || []
  p.audit_trail.push({ date: TODAY, field, from, to, source })
}

function upsertCon(p, text, source) {
  p.cons = p.cons || []
  const i = p.cons.findIndex(x => x.text === text)
  if (i >= 0) p.cons[i] = { ...p.cons[i], source, verified_at: TODAY }
  else p.cons.push({ text, source, verified_at: TODAY })
}

// ─────────────────────────────────────────────────────────────
// URUGUAY (id 3) — MATERIAL: 2026 tax reform (Law 20.446 as amended)
// Verified 2026-09-10:
//  - PwC Tax Summaries: "Significant amendments to the taxation of
//    foreign-source income derived by resident individuals entered into
//    force as from 1 January 2026."
//  - IMI Daily (Feb 25 2026): tax-holiday RE threshold raised to ~US$2M;
//    most categories of foreign-sourced income now taxed at 12% AFTER the
//    holiday; holiday length preserved (11 years, citinavi).
//  - Greenback (Apr 2026): pensions/Social Security NOT investment income —
//    remain outside the 12%.
// Residency pathways (RE $100k, rentista ~$1,500/mo) unchanged — the $2M
// figure is the TAX-residency investment threshold, not general residency.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 3)
  if (!p) throw new Error('Uruguay not found')

  const oldTax = p.finance.tax_benefits
  p.finance.tax_benefits =
    'Territorial system, reformed 1 Jan 2026 (Law 20.446 as amended): 11-year tax holiday on foreign-source income for new tax residents preserved; after the holiday most foreign investment income is taxed at 12% (pensions and Social Security exempt). Tax-residency-via-RE threshold now ~US$2M.'
  audit(p, 'finance.tax_benefits', oldTax, p.finance.tax_benefits,
    'PwC Tax Summaries (accessed 2026-09-10) · IMI Daily 2026-02-25 · realestate-in-uruguay.com 2026-06-02 (Law 20.446) · greenbacktaxservices.com 2026-04-17')

  const conText =
    '2026 tax reform (Law 20.446): after the 11-year foreign-income holiday, most foreign investment income is taxed at 12%; RE tax-residency threshold raised to ~$2M (pensions exempt)'
  upsertCon(p, conText, SRC + ' — PwC Tax Summaries · IMI Daily 2026-02-25')

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    (oldChanges ? oldChanges + ' ' : '') +
    'Tax reform effective 1 Jan 2026 (Law 20.446 as amended): foreign-income holiday preserved at 11 years, then 12% on most foreign investment income; tax-residency real-estate threshold ~US$2M.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
    SRC + ' — PwC Tax Summaries (accessed 2026-09-10) · IMI Daily 2026-02-25')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — verification + tax-reform update')
}

// ─────────────────────────────────────────────────────────────
// ANTIGUA AND BARBUDA (id 6) — CORRECTION: NDF tier pricing
// Verified 2026-09-10 against the official CIU (cip.gov.ag/investment-options/ndf):
// NDF contribution is US$230,000 flat — for a single applicant OR a family
// of up to 4 (processing fees $10k single / $20k family). The corpus note
// speculating a lower ~$100k single tier is wrong and removed.
// Ancova (Jul 2026) and itciland (Aug 2026) corroborate $230k.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 6)
  if (!p) throw new Error('Antigua not found')

  const ndf = (p.pathways || []).find(x => x.type === 'ndf_donation')
  if (ndf) {
    const old = ndf.notes
    ndf.notes =
      'National Development Fund: $230,000 non-refundable contribution — flat for a single applicant or a family of up to 4 (official CIU); processing fees $10,000 single / $20,000 family of 4.'
    audit(p, 'pathways.ndf_donation.notes', old, ndf.notes,
      'Official CIU cip.gov.ag/investment-options/ndf (accessed 2026-09-10) · Ancova 2026-07-21 · itciland 2026-08-25')
  }

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — NDF tier correction')
}

// ─────────────────────────────────────────────────────────────
// ST. KITTS AND NEVIS (id 5) — STATUS UPDATE: 30-day visit rule
// Verified 2026-09-10:
//  - GetGoldenVisa (Aug 21 2026): 30-day residency requirement within 5
//    years "has not yet taken effect" — still proposed.
//  - IMI Daily (Jan 4 2026): 2026 CBI overhaul to introduce physical
//    residency + genuine-link rules; phase out donation-only citizenship.
//  - Mandatory interviews: in effect (passportivity Jun 2026, NTL).
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 5)
  if (!p) throw new Error('St. Kitts not found')

  const ct = p.critical_tests || {}
  const oldNotes = ct.notes
  p.critical_tests = {
    ...ct,
    notes:
      'Premium Caribbean passport (~150+ visa-free); no personal income, capital gains, or inheritance tax. No residency requirement in force today — the proposed 30-day visit within 5 years is NOT yet law (Aug 2026); mandatory interviews already apply; 2026 overhaul plans genuine-link rules and phasing out donation-only citizenship.',
  }
  audit(p, 'critical_tests.notes', oldNotes, p.critical_tests.notes,
    'getgoldenvisa.com 2026-08-21 · IMI Daily 2026-01-04 · passportivity.com 2026-06-30')

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    oldChanges.replace(
      'but a 30-day visit within 5 years is proposed under the 2026 framework — monitor.',
      'the proposed 30-day visit within 5 years is not yet law (verified Aug 2026); 2026 overhaul also plans genuine-link rules and phasing out donation-only citizenship.'
    )
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
    SRC + ' — getgoldenvisa.com 2026-08-21 · IMI Daily 2026-01-04')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — 30-day rule status verification')
}

// ─────────────────────────────────────────────────────────────
// BOLIVIA (id 4) — UPDATE: ban-lifting timeline + Paz government
// Verified 2026-09-10:
//  - BCB fully lifted the crypto transaction ban on 25 Jun 2024 (Reuters
//    Jun 2025: "outlawed until June last year"; rigobertoparedes.com:
//    "as of June 25, 2024, the Central Bank of Bolivia lifted the ban";
//    CoinMarketCap: operational ban lifted June 2024). The Dec 2020
//    resolution (Res. 144) was a partial authorization via regulated
//    entities — both kept, timeline clarified.
//  - Reuters (Jun 27 2025): crypto transaction volumes +530% to $430M+.
//  - Rodrigo Paz won the Oct 2025 runoff; floating exchange regime ~9–9.5
//    BOB/USD (IMI Daily May 2026); Investment Law bill sent to Assembly
//    Aug 11 2026 (Rio Times) — pro-investment direction, minority govt.
//  - Crypto still NOT legal tender; regulatory framework forming.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 4)
  if (!p) throw new Error('Bolivia not found')

  const oldInteg = p.bitcoin_integration
  p.bitcoin_integration =
    'Crypto is legal, not legal tender: 2014 ban partially relaxed Dec 2020 (BCB Res. 144, transactions via regulated entities) and fully lifted 25 Jun 2024 by the Central Bank. Volumes surged +530% to $430M+ amid the dollar crunch (Reuters, Jun 2025). President Rodrigo Paz (won Oct 2025 runoff) runs a market-oriented agenda: floating exchange rate (~9–9.5 BOB/USD), Investment Law bill sent to the Assembly Aug 2026, blockchain-government plans. Framework still forming — high-upside frontier leg.'
  audit(p, 'bitcoin_integration', oldInteg, p.bitcoin_integration,
    'Reuters 2025-06-27 · rigobertoparedes.com (BCB lifting, 25 Jun 2024) · CoinMarketCap Academy · IMI Daily 2026-05-05 · riotimesonline.com 2026-08-11')

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    '2014 crypto ban partially relaxed Dec 2020 (BCB Res. 144); fully lifted 25 Jun 2024 by the Central Bank — crypto legal, not legal tender; no dedicated framework yet. Post-election (Paz, Nov 2025): floating FX, Investment Law bill before the Assembly (Aug 2026) — monitor official gazette.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
    SRC + ' — Reuters 2025-06-27 · BCB lifting 25 Jun 2024 (rigobertoparedes) · riotimesonline 2026-08-11')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — crypto timeline + post-election update')
}

// ─────────────────────────────────────────────────────────────
// VERIFICATION-ONLY PASS — no material change found beyond the
// 2026-08-22 sweep already on file; recorded for the honesty trail.
// ─────────────────────────────────────────────────────────────
const verificationOnly = [
  { id: 7, name: 'Dominica', note: 'EDF $200k + ECCIRA 2026 harmonization confirmed current (ketencilaw 2026-09-10); no material change' },
  { id: 13, name: 'Panama', note: 'Friendly Nations $200k / QI $300k / pensionado $1k confirmed; 2025 draft crypto-provider bill still the latest on file (globalcitizensolutions, pfser 2026-09-10)' },
  { id: 11, name: 'Portugal', note: 'Golden-visa fund route €500k + Lei Orgânica 1/2026 naturalisation (7y EU-CPLP / 10y others) confirmed current (bitizenship 2026-09-10); no new golden-visa threshold change verified' },
  { id: 15, name: 'Paraguay', note: 'SUACE ~$70k/10yr, rentista ~$1,200/mo, Law 6984/2022 confirmed current (goldenharbors 2026-09-10); no material change' },
  { id: 2, name: 'Central African Republic', note: 'Legal-tender repeal (Apr 2023) framing confirmed; Sango still stalled; no formal framework since (africansecurityanalysis 2026-09-10)' },
]
for (const v of verificationOnly) {
  const p = arr.find(x => x.id === v.id)
  if (!p) throw new Error(v.name + ' not found')
  p.last_checked = TODAY
  audit(p, 'verification', 'corpus sweep 2026-08-22', 're-verified, no material change — ' + v.note, SRC)
}

writeFileSync(FILE, JSON.stringify(d, null, 1) + '\n')
console.log('Batch 3 applied: 4 updated (Uruguay, Antigua, St. Kitts, Bolivia) + 5 verification passes. last_checked =', TODAY)
