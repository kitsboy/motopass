# Freshness research pass — 2026-08-22 (batch 2)

**Scope:** 14 programs (ranks 11–24 by staleness, after the 2026-08-21 batch).
Filled with sourced findings, then `countries.json` updated and re-anchored.

| Rank | Program | Stale (days) | Brief |
|------|---------|--------------|-------|
| 1 | Switzerland | 78 | `switzerland-brief.md` |
| 2 | El Salvador | 77 | `el-salvador-brief.md` |
| 3 | Singapore | 76 | `singapore-brief.md` |
| 4 | UAE (Dubai / Abu Dhabi) | 75 | `uae-dubai-abu-dhabi-brief.md` |
| 5 | Georgia | 75 | `georgia-brief.md` |
| 6 | Costa Rica | 50 | `costa-rica-brief.md` |
| 7 | Hong Kong | 50 | `hong-kong-brief.md` |
| 8 | Thailand | 50 | `thailand-brief.md` |
| 9 | Mexico | 50 | `mexico-brief.md` |
| 10 | Cyprus | 50 | `cyprus-brief.md` |
| 11 | Greece | 50 | `greece-brief.md` |
| 12 | Vanuatu | 50 | `vanuatu-brief.md` |
| 13 | Turkey | 50 | `turkey-brief.md` |
| 14 | Mauritius | 50 | `mauritius-brief.md` |

## Method

Brave Search was rate-limited (429) for most of the session, so sourcing ran
through the `read_url` path that worked for the previous batch: the Wikipedia
article **“Legality of cryptocurrency by country or territory”** (revision
2026-08-22) plus **“Lump sum tax”** (for Switzerland), cross-checked with the
Reuters/IMF coverage surfaced by the one Brave query that did succeed
(El Salvador). All facts are dated and URL-backed — no fabricated rules.

## Findings applied to countries.json (all 2026-08-22)

- **El Salvador — MAJOR CORRECTION:** Bitcoin **lost legal-tender status in
  Feb 2025** as a condition of the IMF $1.4B program (Legislative Assembly
  amendment Jan 29–30, 2025: merchants no longer obligated to accept BTC,
  taxes no longer payable in BTC). Corpus still claimed active
  `legal_tender_bitcoin`. Corrected: `category` → `rbi_cbi` (same treatment
  as CAR), reframed across `bitcoin_integration`, `finance`, `details`,
  `pathways`, `critical_tests`, `legal_compliance`, `paige_fields` as
  historical pioneer with voluntary BTC use.
- **Switzerland:** lump-sum tax verified (living-expenses basis, no gainful
  activity required, ~5,000 payers, abolished in some cantons — Zurich 2010
  et al.; national abolition rejected by referendum 2014). Pathway + recent
  changes updated.
- **Singapore:** crypto legal under Payment Services Act 2019 (digital payment
  tokens) — recent changes updated; no threshold change claimed (GIP
  categories unverified this pass).
- **UAE:** regulator split confirmed (as of Oct 2025): VARA (Dubai incl.
  DMCC), DFSA (DIFC), FSRA (ADGM), CBUAE + SCA (onshore).
- **Georgia:** 2019 Ministry of Finance decision confirmed — crypto not
  “Georgia-sourced”, personal crypto gains taxed at 0%.
- **Costa Rica:** BCCR (Oct 2017) statement confirmed — crypto not considered
  currency, excluded from national payment system, use at own risk.
- **Hong Kong:** legal since 2013 (HKMA: virtual commodity); VATP regulations
  in force mid-2024 under the SFC “same activity, same risks, same
  regulation” principle — confirms corpus SFC framing.
- **Thailand:** legal to trade/hold, but **illegal as a payment tool since
  1 Apr 2022** (banks cautioned) — new fact added to corpus.
- **Mexico:** legal since 2017; FinTech Law regulates crypto as virtual
  assets with case-by-case taxation — confirms corpus.
- **Cyprus:** legal and unregulated for individual use; business activity
  falls under CySEC CASP licensing + EU MiCA (from 2025).
- **Greece:** legal — no specific bitcoin legislation; EU MiCA applies to
  CASPs from 2025; golden-visa 2024 thresholds unchanged.
- **Vanuatu:** crypto **legal since July 2021** (prior ban lifted); VCP
  donation route unchanged.
- **Turkey:** CBRT regulation (effective 30 Apr 2021) bans crypto as a
  payment tool; holding/trading legal under SPK oversight.
- **Mauritius:** legal — FSC regulates crypto as a Digital Asset under the
  Financial Services Act 2007 (Sep 2018 guidance).

## Result

`intel.json` regenerated — **24 fresh / 0 watch / 26 stale** (was 20 fresh).
All gates pass (`validate:data`, `validate:stamps`, `intel:check`).

Sources: `Legality of cryptocurrency by country or territory` (Wikipedia,
revision 2026-08-22) · `Lump sum tax` (Wikipedia) · Reuters (2025-01-30) ·
IMF Country Report 25/58 · CoinDesk · BCCR (2017-10-09).

```bash
npm run research:pass        # regenerate briefs
# fill each brief's “Sources found” table with dated, URL-backed findings
# then update last_checked + legal_compliance in research/countries.json
# the daily intel pipeline re-anchors the new state automatically
```
