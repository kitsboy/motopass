/**
 * Batch 6 research pass — Europe golden-visa tier (Spain, Greece, Italy,
 * Turkey, Latvia, Estonia, Bulgaria, Croatia, Gibraltar, Andorra).
 * Applied 2026-09-10.
 *
 * Rules honored (docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md §3, §10):
 *  - Facts only: every applied change carries a dated source.
 *  - Confidence gating: applied = medium+; unverified items left untouched
 *    (HEPPS salary threshold: no crisp 2026 figure found — unchanged).
 *  - Never overwrite with null/empty; never downgrade on weak signals.
 *  - Every change appended to audit_trail (date, field, from, to, source).
 *  - freshness/watch/satohash_proofs untouched — the pipeline owns those.
 *
 * Run: node scripts/research-batch6-europe.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'research/countries.json'
const d = JSON.parse(readFileSync(FILE, 'utf8'))
const arr = Array.isArray(d) ? d : d.programs
const TODAY = '2026-09-10'
const SRC = 'Batch 6 research pass (Europe tier, docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md work order)'

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

function findPathway(p, type) {
  return (p.pathways || []).find(x => x.type === type)
}

// ─────────────────────────────────────────────────────────────
// SPAIN (id 42) — INDEX ANCHOR: 2026 SMI raised DNV threshold
// Verified 2026-09-10: DNV income = 200% SMI 2026 → EUR 2,849/mo =
// EUR 34,188/yr (greenback 2026-06-04 · movingtospain 2026-09 ·
// citizenremote 2026-02-17). Corpus carried the old ~EUR 2,160–2,646 band.
// NLV EUR 28,800 (400% IPREM) confirmed unchanged (spainnonlucrativevisa ·
// relocate.world). Golden-visa abolition (Organic Law 1/2025) already on
// file — re-verified.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 42)
  if (!p) throw new Error('Spain not found')

  const dn = findPathway(p, 'digital_nomad')
  if (dn) {
    const oldMin = dn.min_investment_usd
    dn.min_investment_usd = 37000
    audit(p, 'pathways.digital_nomad.min_investment_usd', oldMin, 37000,
      SRC + ' — 200% SMI 2026 = EUR 2,849/mo = EUR 34,188/yr (~$37k; greenback 2026-06-04)')

    const old = dn.notes
    dn.notes =
      'EUR 2,849/month foreign income (200% of the 2026 Spanish minimum wage; EUR 34,188/year) — remote work for non-Spanish employer or clients; max 20% Spanish-source income; 1-year renewable, popular Barcelona/Málaga nomad route.'
    audit(p, 'pathways.digital_nomad.notes', old, dn.notes,
      SRC + ' — greenback 2026-06-04 · movingtospain 2026-09 · citizenremote 2026-02-17')
  }

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes = (oldChanges ? oldChanges + ' ' : '') +
    '2026-09-10 verification: DNV threshold re-anchored to 200% SMI 2026 (EUR 2,849/mo); NLV EUR 28,800 confirmed; golden-visa abolition (Law 1/2025) stands.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes, SRC)

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — SMI 2026 index re-anchor')
}

// ─────────────────────────────────────────────────────────────
// GREECE (id 21) — MATERIAL: golden-visa tier structure corrected
// Verified 2026-09-10: zones are EUR 800k (high-density: Athens, Thessaloniki,
// Mykonos, Santorini + islands >3,100/km²), EUR 400k (rest of country),
// EUR 250k (listed-heritage buildings + NEW 2026 startup route). The
// "EUR 500k most regions" tier on file does not exist in the current
// structure (getgoldenvisa 2026 · buygreece 2026 · itciland 2026-01-19 ·
// IMI 2024-03-21). Also: planned 15% transfer tax on non-EU buyers from
// Jul 2027 (goldenvisas.com).
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 21)
  if (!p) throw new Error('Greece not found')

  const gv = findPathway(p, 'golden_visa')
  if (gv) {
    const oldMin = gv.min_investment_usd
    gv.min_investment_usd = 435000
    audit(p, 'pathways.golden_visa.min_investment_usd', oldMin, 435000,
      SRC + ' — Zone B EUR 400k is the general-country floor (~$435k); Zone A EUR 800k / heritage+startup EUR 250k')

    const old = gv.notes
    gv.notes =
      'Three-zone structure (2024 reform, current 2026): EUR 800k high-density zones (Athens, Thessaloniki, Mykonos, Santorini, islands >3,100/km²); EUR 400k rest of country; EUR 250k only for listed-heritage buildings OR the new 2026 startup-investment route. Short-term rental forbidden; 5-year renewable PR; family included.'
    audit(p, 'pathways.golden_visa.notes', old, gv.notes,
      SRC + ' — getgoldenvisa 2026 · buygreece.us 2026 · itciland 2026-01-19 (startup route) · IMI 2024-03-21')

    const oldChanges = p.legal_compliance.recent_changes
    p.legal_compliance.recent_changes =
      'September 2024 golden-visa reform: three zones EUR 800k / EUR 400k / EUR 250k (heritage + 2026 startup route only) — no EUR 500k tier exists. Planned: 15% transfer tax on non-EU real-estate buyers from July 2027 (adds up to ~EUR 96k on a golden-visa purchase). Crypto legal, unregulated by dedicated law; EU MiCA applies to CASPs from 2025.'
    audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
      SRC + ' — getgoldenvisa 2026 · goldenvisas.com (transfer-tax plan)')

    upsertCon(p,
      '15% transfer tax planned for non-EU property buyers from July 2027 — factor into golden-visa purchase economics',
      SRC + ' — goldenvisas.com (accessed 2026-09-10)')
  }

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — golden-visa tier structure corrected')
}

// ─────────────────────────────────────────────────────────────
// ITALY (id 43) — CORRECTION: HNW flat tax doubled
// Verified 2026-09-10: investor-visa tiers confirmed current via the
// official programme site (investorvisa.mise.gov.it) and 2026 firm guides:
// EUR 250k startup / EUR 500k company / EUR 1M philanthropy / EUR 2M bonds.
// The HNW new-resident flat tax is EUR 300,000/year per Fragomen
// (2026-04-28) — corpus carried the old EUR 100k figure.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 43)
  if (!p) throw new Error('Italy not found')

  const ct = p.critical_tests || {}
  const oldNotes = ct.notes
  if (oldNotes && oldNotes.includes('Flat €100k tax')) {
    p.critical_tests = {
      ...ct,
      notes: oldNotes.replace('Flat €100k tax', 'Flat EUR 300k/yr tax'),
    }
    audit(p, 'critical_tests.notes', oldNotes, p.critical_tests.notes,
      SRC + ' — Fragomen 2026-04-28 (EUR 300,000 flat-tax regime for HNW new residents)')
  }

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes = (oldChanges ? oldChanges + ' ' : '') +
    '2026-09-10 verification: investor tiers EUR 250k/500k/1M/2M confirmed current (investorvisa.mise.gov.it); HNW flat tax corrected EUR 100k -> EUR 300k/yr (Fragomen 2026-04-28); digital-nomad EUR 28k route unchanged.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes, SRC)

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — flat-tax correction + tier verification')
}

// ─────────────────────────────────────────────────────────────
// TURKEY (id 23) — CORRECTION: bank-deposit CBI route is ACTIVE at $500k
// Verified 2026-09-10: official invest.gov.tr property route + deposit route
// $500,000 held 3 years (globalresidenceindex 2026-01-16 · legal500 2026-03-09
// · serkalaw 2026 · goldenharbors 2026-07). The corpus "deposit route
// suspended" note was wrong. Property route $400k / 3-yr hold re-verified.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 23)
  if (!p) throw new Error('Turkey not found')

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    'CBRT regulation (2021) bans crypto as a payment tool; holding/trading legal, exchanges under SPK oversight. CBI thresholds current 2026: property $400k (3-yr hold, official invest.gov.tr) and bank deposit $500k (3-yr hold) — deposit route ACTIVE (was incorrectly marked suspended); other $500k alternatives include capital investment and government bonds.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
    SRC + ' — invest.gov.tr · globalresidenceindex 2026-01-16 · legal500 2026-03-09 · serkalaw 2026 · goldenharbors 2026-07')

  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 450000
  audit(p, 'finance.typical_investment_usd', oldTyp, 450000,
    SRC + ' — property $400k + costs; deposit alternative $500k (verified 2026)')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — deposit route status corrected')
}

// ─────────────────────────────────────────────────────────────
// LATVIA (id 44) — VERIFICATION + RISK SIGNAL
// Verified 2026-09-10: EUR 50k company-investment route active — lowest EU
// entry (immigrantinvest 2026 · ntltrust · globalresidenceindex 2026-03-16);
// EUR 10k state fee on top (ntltrust); DNV EUR 4,538/mo (bimaris.legal
// 2026-08-13); RE TRP for third-country nationals suspended since Sept 2022;
// bond/subordinated-capital route refused (LSM 2026-04-27) — all consistent
// with corpus. NEW RISK: FIU flagged 20+ companies in a EUR 10M golden-visa
// fraud probe (etias.com) — added as a con.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 44)
  if (!p) throw new Error('Latvia not found')

  const ci = findPathway(p, 'company_investment')
  if (ci) {
    const old = ci.notes
    ci.notes = old + ' Plus ~EUR 10,000 state fee (2026).'
    audit(p, 'pathways.company_investment.notes', old, ci.notes,
      SRC + ' — ntltrust (EUR 10k state fee)')
  }

  upsertCon(p,
    'EUR 10M golden-visa fraud probe: FIU flagged 20+ companies running fake investment schemes — vet any Latvian investment vehicle carefully',
    SRC + ' — etias.com (accessed 2026-09-10)')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — verified; fraud-probe risk signal added')
}

// ─────────────────────────────────────────────────────────────
// ESTONIA (id 45) — VERIFICATION PASS
// No crisp 2026 change found beyond the Aug-22 sweep: nomad EUR 3,504/mo
// baseline consistent with corpus; startup route active; e-Residency EUR
// state fee unchanged; VASP licensing regime unchanged. Honest no-change
// pass; thresholds marked verify-before-filing as usual.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 45)
  if (!p) throw new Error('Estonia not found')

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes = (oldChanges ? oldChanges + ' ' : '') +
    '2026-09-10 verification: no material change found — nomad EUR ~3,504/mo, startup route, e-Residency, VASP licensing all consistent with corpus.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes, SRC)

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — verification pass, no material change')
}

// ─────────────────────────────────────────────────────────────
// BULGARIA (id 46) — CORRECTION: bonds pathway mischaracterized + euro note
// Verified 2026-09-10: the CITIZENSHIP-by-investment scheme (incl. bond
// route) was abolished via the Feb 2021 Citizenship Act amendments and the
// 2022 closure (bulgarian-citizenship.com 2026-06-04 · aegirglobal 2026-08-07
// · bulgarian.llc 2025-09-10) — but residence-by-investment persists via the
// company/jobs route (BGN 1M ≈ EUR 511k, 10 jobs — corpus already correct).
// Bonds pathway notes updated to "closed for residence+citizenship purposes;
// do not plan around it." Bulgaria adopted the euro 1 Jan 2026.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 46)
  if (!p) throw new Error('Bulgaria not found')

  const bonds = findPathway(p, 'government_bonds')
  if (bonds) {
    const old = bonds.notes
    bonds.notes =
      'CLOSED: the bond-based investment route was cancelled by the Feb 2021 Citizenship Act amendments and subsequent reforms — no longer a residence or citizenship qualifying route (2026). Kept for historical reference only; do not plan around it.'
    audit(p, 'pathways.government_bonds.notes', old, bonds.notes,
      SRC + ' — bulgarian-citizenship.com 2026-06-04 · aegirglobal 2026-08-07 · bulgarian.llc 2025-09-10')
  }

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    'Investor PR (company route BGN 1M ≈ EUR 511k + 10 jobs in 2.5 yrs) remains the active investment-residence track; citizenship-by-investment schemes (incl. bonds) abolished 2021–2022. Parliament physical-residency proposal for golden visa still pending, not law. Bulgaria adopted the euro on 1 Jan 2026 — BGN pegged at 1.95583, thresholds now effectively EUR-denominated.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
    SRC + ' — bulgarian-citizenship.com 2026-06-04 · aegirglobal 2026-08-07 · UNCTAD monitor 2331')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — bonds route closed, euro adoption noted')
}

// ─────────────────────────────────────────────────────────────
// CROATIA (id 47) — CORRECTION: unsourced €300k real-estate pathway removed
// Verified 2026-09-10: DNV thresholds confirmed exactly (EUR 3,622.50/mo,
// EUR 43,470/12mo, EUR 65,205/18mo — official mup.gov.hr + taxesforexpats
// 2026-07-31). NO qualifying-property residency route exists: Croatian
// residence permits for non-EU nationals run via work, company, family, or
// independent-means grounds — property purchase alone grants no residence
// right. The €300k real_estate pathway (min $300k, page floor $300k) had no
// legal basis — removed; page floor re-anchored to DNV economics.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 47)
  if (!p) throw new Error('Croatia not found')

  const re = findPathway(p, 'real_estate')
  if (re) {
    const idx = p.pathways.indexOf(re)
    const removed = JSON.stringify(re)
    p.pathways.splice(idx, 1)
    audit(p, 'pathways.real_estate', removed, 'REMOVED — no qualifying-property residence route exists in Croatian law (2026 verification)',
      SRC + ' — mup.gov.hr residence grounds · taxesforexpats 2026-07-31')
  }

  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 44000
  audit(p, 'finance.min_investment_usd', oldMin, 44000,
    SRC + ' — re-anchored to DNV 12-month lump sum EUR 43,470 (official mup.gov.hr)')

  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 46000
  audit(p, 'finance.typical_investment_usd', oldTyp, 46000,
    SRC + ' — DNV EUR 43,470 + fees (2026)')

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    '2026 digital nomad income thresholds confirmed official (EUR 3,622.50/mo · EUR 43,470/12mo · EUR 65,205/18mo; mup.gov.hr). Property purchase alone does NOT confer residence — the previously-listed EUR 300k real-estate pathway was removed on 2026-09-10 verification as unsourced. Residency grounds: work permit, company (d.o.o.), family, independent means.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
    SRC + ' — mup.gov.hr (accessed 2026-09-10) · taxesforexpats 2026-07-31')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — phantom RE pathway removed, DNV anchor confirmed')
}

// ─────────────────────────────────────────────────────────────
// GIBRALTAR (id 48) — CORRECTION: Cat 2 figures re-anchored to official ITO
// Verified 2026-09-10: official Gibraltar Income Tax Office — Cat 2 gross
// assessable income capped at GBP 118,000 (not GBP 105k); MINIMUM annual tax
// GBP 37,000, maximum ~GBP 44,740 (gibraltar.gov.gi · gibraltarlaw.com ·
// gibro · npestates). Plus NEW 2026 residency-criteria overhaul ahead of the
// UK-EU treaty provisional application (sovereigngroup 2026-07-07 · lexology
// 2026-06-17). Cat 2 requires GBP 2M net worth + approved residential
// property (efpg-raine) — noted in pathway.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 48)
  if (!p) throw new Error('Gibraltar not found')

  const cat2 = findPathway(p, 'cat2')
  if (cat2) {
    const old = cat2.notes
    cat2.notes =
      'Capped-tax regime (official ITO 2026): tax on first GBP 118,000 assessable income — minimum GBP 37,000/yr, maximum ~GBP 44,740/yr. Requires GBP 2M+ net worth, approved residential property purchase/lease, and annual Hub/reports compliance. 2026 residency-criteria overhaul tightened requirements ahead of the UK-EU treaty.'
    audit(p, 'pathways.cat2.notes', old, cat2.notes,
      SRC + ' — gibraltar.gov.gi/income-tax-office · gibraltarlaw.com · npestates · sovereigngroup 2026-07-07')
  }

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    'GFSC DLT framework remains active for crypto firms. 2026: Gibraltar introduced new residency criteria and updated Cat 2 requirements ahead of the imminent provisional application of the UK-EU treaty (Sovereign 2026-07-07); Cat 2 tax bands re-anchored to official ITO figures (GBP 118k cap; GBP 37k min / ~GBP 44.7k max).'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
    SRC + ' — sovereigngroup 2026-07-07 · gibraltar.gov.gi (accessed 2026-09-10)')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — Cat 2 figures re-anchored, 2026 overhaul noted')
}

// ─────────────────────────────────────────────────────────────
// ANDORRA (id 50) — VERIFICATION + REFINEMENT (Jan 2026 reform already
// partially on file via Aug-22 sweep)
// Verified 2026-09-10: passive-residency general threshold EUR 1,000,000
// (raised from EUR 600k by the law approved 2026-01-22 — IMI; engage.ad
// 2026-08-04; livinginandorra 2026-08-14); the EUR 400k Housing Fund /
// "permanent and exceptional interest" reduced route persists; EUR 50k
// AFA deposit + EUR 10k/dependent; 90-day minimum stay. Pathway notes
// refined with the official deposit structure.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 50)
  if (!p) throw new Error('Andorra not found')

  const pr = findPathway(p, 'passive_residency')
  if (pr) {
    const old = pr.notes
    pr.notes =
      'Two routes after the Jan 2026 reform: general — EUR 1,000,000 invested in Andorran assets (real estate, company shares, bonds, funds, deposits; real-estate units >EUR 800k) ; reduced — EUR 400,000+ via the Housing Fund / exceptional-interest route. Plus EUR 50,000 AFA refundable deposit (+EUR 10,000/dependent) and 90-day minimum annual stay; no local employment permitted.'
    audit(p, 'pathways.passive_residency.notes', old, pr.notes,
      SRC + ' — IMI 2026-01-24 · engage.ad 2026-08-04 · livinginandorra 2026-08-14 · elysiumconsultingfirm (deposit structure)')

    const oldMin = pr.min_investment_usd
    pr.min_investment_usd = 440000
    audit(p, 'pathways.passive_residency.min_investment_usd', oldMin, 440000,
      SRC + ' — reduced Housing Fund route EUR 400k ≈ $440k remains the lowest entry; general route EUR 1M')
  }

  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 440000
  audit(p, 'finance.min_investment_usd', oldMin, 440000,
    SRC + ' — aligned to the reduced EUR 400k route floor')

  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 1180000
  audit(p, 'finance.typical_investment_usd', oldTyp, 1180000,
    SRC + ' — general route EUR 1M + deposits (2026 standard)')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — Jan 2026 reform details refined')
}

writeFileSync(FILE, JSON.stringify(d, null, 1) + '\n')
console.log('Batch 6 applied: Spain DNV re-anchor, Greece tier fix + transfer-tax signal, Italy flat-tax fix, Turkey deposit-route fix, Latvia fraud signal, Bulgaria bonds closure, Croatia phantom-pathway removal, Gibraltar Cat 2 re-anchor, Andorra refinement, Estonia verification pass. last_checked =', TODAY)
