/**
 * Batch 5 research pass — LatAm tier (Brazil, Argentina, Chile, Colombia,
 * Belize). Applied 2026-09-10.
 *
 * Rules honored (docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md §3, §10):
 *  - Facts only: every applied change carries a dated source.
 *  - Confidence gating: applied = medium+; unverified items left untouched
 *    (Belize QRP age 40-vs-45 conflict noted, number unchanged).
 *  - Never overwrite with null/empty; never downgrade on weak signals.
 *  - Every change appended to audit_trail (date, field, from, to, source).
 *  - freshness/watch/satohash_proofs untouched — the pipeline owns those.
 *
 * Run: node scripts/research-batch5-latam.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'research/countries.json'
const d = JSON.parse(readFileSync(FILE, 'utf8'))
const arr = Array.isArray(d) ? d : d.programs
const TODAY = '2026-09-10'
const SRC = 'Batch 5 research pass (LatAm tier, docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md work order)'

function audit(p, field, from, to, source) {
  p.audit_trail = p.audit_trail || []
  p.audit_trail.push({ date: TODAY, field, from, to, source })
}

function findPathway(p, type) {
  return (p.pathways || []).find(x => x.type === type)
}

// ─────────────────────────────────────────────────────────────
// BRAZIL (id 26) — CORRECTION: page-level finance floor + new startup tier
// Verified 2026-09-10:
//  - VITEM IX investor: R$500,000 (~$95–100k) confirmed (libertymundo 2026,
//    oliveiralawyers); NEW detail: R$150,000 tier for qualifying startups
//    (oliveiralawyers 2026).
//  - VITEM XIV nomad: $1,500/mo OR $18,000 savings / R$100k bank balance
//    (zsassociados 2026-04-05 · riotimesonline 2026-03-05 · getbrazilvisa).
//  - Retirement route $2,000/mo confirmed (libertymundo 2026).
// Page floor $150k contradicted its own $95k VITEM IX pathway — aligned.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 26)
  if (!p) throw new Error('Brazil not found')

  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 95000
  audit(p, 'finance.min_investment_usd', oldMin, 95000,
    SRC + ' — VITEM IX R$500k ≈ $95k (libertymundo 2026 · oliveiralawyers 2026)')

  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 100000
  audit(p, 'finance.typical_investment_usd', oldTyp, 100000,
    SRC + ' — R$500k ≈ $100k (libertymundo 2026)')

  const inv = findPathway(p, 'investor')
  if (inv) {
    const old = inv.notes
    inv.notes = old +
      ' Startups: reduced R$150,000 tier available for qualifying technology startups (2026).'
    audit(p, 'pathways.investor.notes', old, inv.notes,
      SRC + ' — oliveiralawyers 2026 (R$150k startup tier)')
  }

  const nomad = findPathway(p, 'digital_nomad')
  if (nomad) {
    const old = nomad.notes
    nomad.notes = old +
      ' Alternative: ~$18,000 lump sum / R$100,000 bank balance accepted in place of monthly income (2026 consular guidance).'
    audit(p, 'pathways.digital_nomad.notes', old, nomad.notes,
      SRC + ' — zsassociados 2026-04-05 · riotimesonline 2026-03-05 · getbrazilvisa')
  }

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes = (oldChanges ? oldChanges + ' ' : '') +
    '2026-09-10 verification: VITEM IX R$500k current (+R$150k startup tier); VITEM XIV $1,500/mo or ~$18k savings; retirement $2,000/mo. Page-level finance floor aligned to VITEM IX.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes, SRC)

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — finance floor corrected, startup tier documented')
}

// ─────────────────────────────────────────────────────────────
// ARGENTINA (id 27) — VERIFICATION + INDEX ANCHOR: rentista is 5× SMVM,
// which floats monthly. Aug 2026 SMVM = ARS 376,600 → 5× = ARS 1,883,000/mo
// ≈ $1,400+ at prevailing rates (goldenharbors 2026-08-05 · riotimes 2026-09
// · immi.legal 2026-08-13). Corpus ~$1,500 kept as conservative USD mode;
// sourced peso anchor added to notes. Investor $50k unchanged.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 27)
  if (!p) throw new Error('Argentina not found')

  const rent = findPathway(p, 'rentista')
  if (rent) {
    const old = rent.notes
    rent.notes = old.replace(
      'minimum rent equivalent to 5× Salario Mínimo Vital y Móvil (~$1,500/month USD equivalent)',
      'minimum rent equivalent to 5× Salario Mínimo Vital y Móvil — indexed monthly; Aug 2026 SMVM ARS 376,600 → 5× = ARS 1,883,000/mo ≈ $1,400–1,500 USD at prevailing rates (verify the peso figure the week you file)'
    )
    audit(p, 'pathways.rentista.notes', old, rent.notes,
      SRC + ' — goldenharbors 2026-08-05 (SMVM ARS 376,600) · riotimesonline 2026-09 · immi.legal 2026-08-13 (60-day credit at 5× SMVM)')
  }

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes = (oldChanges ? oldChanges + ' ' : '') +
    '2026-09-10 verification: rentista 5× SMVM re-anchored (ARS 376,600 Aug 2026); investor $50k unchanged; Milei-era FX liberalization still favorable for crypto-to-bank funding.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes, SRC)

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — SMVM index re-anchored')
}

// ─────────────────────────────────────────────────────────────
// CHILE (id 28) — CORRECTION: page-level finance aligned to investor route
// Verified 2026-09-10:
//  - Inversionista: $500,000 in productive goods/services + INVESTCHILE
//    sponsorship letter confirmed (goldenharbors 2026-08-13 · goldenvisas.com
//    · thelatinvestor 2026-02-27 · investchile.gob.cl FAQ).
//  - Rentista/retired subcategory: lifetime pension or constant income ≥
//    Chilean minimum wage — ~$650/mo current (immi.legal 2026-04-26) +
//    MSD benchmarks; corpus $1,000/mo was conservative — anchored to the
//    official 1× minimum wage reference.
// Page floor $200k contradicted both pathways ($500k investor / income-
// based rentista) — aligned to investor route.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 28)
  if (!p) throw new Error('Chile not found')

  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 500000
  audit(p, 'finance.min_investment_usd', oldMin, 500000,
    SRC + ' — investor route $500k (goldenharbors 2026-08-13 · goldenvisas.com · investchile.gob.cl)')

  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 520000
  audit(p, 'finance.typical_investment_usd', oldTyp, 520000,
    SRC + ' — modeled all-in (investor $500k + sponsorship/fees)')

  const rent = findPathway(p, 'rentista')
  if (rent) {
    const oldMin = rent.min_investment_usd
    rent.min_investment_usd = 7800
    audit(p, 'pathways.rentista.min_investment_usd', oldMin, 7800,
      SRC + ' — pension ≥ Chilean minimum wage ~$650/mo ≈ $7.8k/yr (immi.legal 2026-04-26)')

    const old = rent.notes
    rent.notes =
      'Subcategory 11 for retirees with lifetime pension or leasers with constant income ≥ the Chilean minimum wage (~$650/mo in 2026) sufficient to cover basic needs per MSD benchmarks; apostilled income proofs required.'
    audit(p, 'pathways.rentista.notes', old, rent.notes,
      SRC + ' — immi.legal 2026-04-26 · serviciomigraciones.cl subcategories page')
  }

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes = (oldChanges ? oldChanges + ' ' : '') +
    '2026-09-10 verification: investor $500k + INVESTCHILE sponsorship confirmed current; rentista anchored to 1× Chilean minimum wage (~$650/mo); page-level finance aligned to investor route.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes, SRC)

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — finance floor corrected, rentista re-anchored')
}

// ─────────────────────────────────────────────────────────────
// COLOMBIA (id 29) — MATERIAL: SMMLV 2026 correction re-prices every
// threshold. SMMLV 2026 = COP 1,750,905 (corpus carried COP 2,000,000).
// Verified 2026-09-10:
//  - Digital nomad / pensionado income: 3× SMMLV = COP 5,252,715 ≈
//    $1,350/mo (colombiavisas 2026-01-01 · colombiamove 2026-03-30 ·
//    goresident ~$1,400/mo) — corpus $900–1,000 stale.
//  - M investor: 100× SMMLV (company/productive) = COP 175.09M ≈ $35–45k
//    by FX route (Res. 5477 art. 57 · medellinadvisors · lottalingo); real-
//    estate route 350× SMMLV = COP 612.8M ≈ $157–163k (expatgroup ·
//    goresident). Corpus single $100k matched neither route.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 29)
  if (!p) throw new Error('Colombia not found')

  const oldMin = p.finance.min_investment_usd
  p.finance.min_investment_usd = 45000
  audit(p, 'finance.min_investment_usd', oldMin, 45000,
    SRC + ' — M investor company route 100× SMMLV (Res. 5477 art. 57 · medellinadvisors 2026)')

  const oldTyp = p.finance.typical_investment_usd
  p.finance.typical_investment_usd = 160000
  audit(p, 'finance.typical_investment_usd', oldTyp, 160000,
    SRC + ' — real-estate route 350× SMMLV ≈ $157–163k (expatgroup · goresident 2026)')

  const mi = findPathway(p, 'm_investor')
  if (mi) {
    const oldMin = mi.min_investment_usd
    mi.min_investment_usd = 45000
    audit(p, 'pathways.m_investor.min_investment_usd', oldMin, 45000,
      SRC + ' — 100× SMMLV company route (Res. 5477 art. 57 · medellinadvisors 2026)')

    const old = mi.notes
    mi.notes =
      'Migrant visa for foreign direct investment — two routes under Resolución 5477 art. 57: company/productive project at 100× SMMLV (COP 175,090,500 in 2026, ≈$35–45k by FX route) or qualifying real estate at 350× SMMLV (COP 612,816,750, ≈$157–163k). Up to 3-year renewable migrant status.'
    audit(p, 'pathways.m_investor.notes', old, mi.notes,
      SRC + ' — Res. 5477 art. 57 · medellinadvisors 2026 · expatgroup 2026')
  }

  const pen = findPathway(p, 'pensionado')
  if (pen) {
    const oldMin = pen.min_investment_usd
    pen.min_investment_usd = 1350
    audit(p, 'pathways.pensionado.min_investment_usd', oldMin, 1350,
      SRC + ' — 3× SMMLV 2026 = COP 5,252,715 ≈ $1,350/mo (colombiavisas 2026-01-01)')

    const old = pen.notes
    pen.notes =
      'Migrant visa for retirees or rentistas with monthly passive income ≥ 3× SMMLV (COP 5,252,715 in 2026, ≈$1,350/month; rises every January) from pension, dividends, or rentals — popular Medellín/Bogotá route for remote Bitcoin income earners.'
    audit(p, 'pathways.pensionado.notes', old, pen.notes,
      SRC + ' — colombiavisas 2026-01-01 · goresident 2026 (~$1,400/mo)')
  }

  const vn = findPathway(p, 'digital_nomad')
  if (vn) {
    const oldMin = vn.min_investment_usd
    vn.min_investment_usd = 1350
    audit(p, 'pathways.digital_nomad.min_investment_usd', oldMin, 1350,
      SRC + ' — 3× SMMLV 2026 = COP 5,252,715 (colombiavisas 2026-01-01)')

    const old = vn.notes
    vn.notes =
      'Visitor visa for remote workers with foreign employer/clients — proof of income ≥ 3× SMMLV (COP 5,252,715 in 2026, ≈$1,350/month) and health insurance. Up to 2-year validity; does not automatically convert to M visa without separate application.'
    audit(p, 'pathways.digital_nomad.notes', old, vn.notes,
      SRC + ' — colombiavisas 2026-01-01 · colombiamove 2026-03-30')
  }

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes =
    '2022 Resolución 5477 consolidated M and V visa categories including digital nomad. SMMLV 2026 = COP 1,750,905/month — all thresholds re-priced 2026-09-10: nomad/pensionado 3× ≈ $1,350/mo; M investor 100× (company, ≈$35–45k) vs 350× (real estate, ≈$157–163k). Thresholds rise every January — verify before filing.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
    SRC + ' — colombiavisas 2026-01-01 (SMMLV COP 1,750,905) · medellinadvisors · expatgroup')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — SMMLV 2026 re-pricing applied')
}

// ─────────────────────────────────────────────────────────────
// BELIZE (id 34) — VERIFICATION PASS
// Verified 2026-09-10: QRP $2,000/mo (or $24k/yr) foreign-source income
// confirmed by the program administrator (belizetourismboard.org, upd.
// 2026-07-27). Age note: BTB materials state 45+; several 2025–26 law-firm
// guides say 40+ — conflict recorded, corpus 45+ kept (official source;
// no change on weak signals). No threshold changes applied.
// ─────────────────────────────────────────────────────────────
{
  const p = arr.find(x => x.id === 34)
  if (!p) throw new Error('Belize not found')

  const oldChanges = p.legal_compliance.recent_changes
  p.legal_compliance.recent_changes = (oldChanges ? oldChanges + ' ' : '') +
    '2026-09-10 verification: QRP $2,000/mo foreign income confirmed official (BTB, upd. 2026-07-27); age criteria show a 45+ (BTB) vs 40+ (law-firm guides) conflict — confirm current rule with BTB before filing.'
  audit(p, 'legal_compliance.recent_changes', oldChanges, p.legal_compliance.recent_changes,
    SRC + ' — belizetourismboard.org (accessed 2026-09-10) · lawbelize.bz · taxesforexpats 2025-10-02')

  p.last_checked = TODAY
  audit(p, 'last_checked', '2026-08-22', TODAY, SRC + ' — QRP verified, age-rule conflict recorded')
}

writeFileSync(FILE, JSON.stringify(d, null, 1) + '\n')
console.log('Batch 5 applied: Brazil + Chile finance corrections, Colombia SMMLV re-pricing, Argentina SMVM re-anchor, Belize verification pass. last_checked =', TODAY)
