# Country data coverage — 21 programs

Last run: 2026-11-09, after `scripts/apply-researched-fills.mjs` and `scripts/apply-scorecard.mjs`.
Regenerate the counts with `npm run coverage:data`. Nothing here is inferred: a fact
counts only when its own field carries a value.

## Facts on file, by fact

| Fact | On file | Missing |
| --- | --- | --- |
| `processing_time` | 21/21 | — |
| `gov_fees` | 21/21 | — |
| `tax_sentence` | 21/21 | — |
| `crypto_tax_sentence` | 21/21 | — |
| `fee_in_bitcoin` | 21/21 | — |
| `days_in_country` | 21/21 | — |
| `years_to_citizenship` | 21/21 | — |
| `renewal_months` | 21/21 | — |
| `mobility` | 21/21 | — |
| `mobility_score` | 20/21 | Cayman Islands |
| `banking_score` | 11/21 | Antigua and Barbuda, St. Kitts and Nevis, Dominica, St. Lucia, Grenada, Bahamas, Barbados, Cayman Islands, Vanuatu, São Tomé and Príncipe |
| `tax_score` | 21/21 | — |
| `pathways` | 21/21 | — |
| `official_urls` | 21/21 | — |
| `watched_urls` | 21/21 | — |
| `sources_cited` | 21/21 | — |
| `pros` / `cons` | 21/21 | — |
| `red_flags` / `tips` / `questions` | 21/21 | — |
| `property_ownership` / `recent_changes` | 21/21 | — |

`renewal_months` counts as on file when citizenship is granted outright: there is no
permit to renew, and the clocks already print "None".

## Record depth (thinnest first)

| Country | Facts | Details | Integration | Tax | Bitcoin | Src | URLs | Paths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cayman Islands | 21/23 | 170 | 490 | 489 | 414 | 7 | 5 | 3 |
| Antigua and Barbuda | 22/23 | 401 | 246 | 242 | 177 | 6 | 5 | 3 |
| St. Kitts and Nevis | 22/23 | 490 | 235 | 291 | 181 | 6 | 4 | 3 |
| Dominica | 22/23 | 416 | 262 | 212 | 121 | 6 | 4 | 3 |
| St. Lucia | 22/23 | 165 | 194 | 229 | 102 | 6 | 4 | 3 |
| Grenada | 22/23 | 163 | 214 | 215 | 102 | 6 | 4 | 3 |
| Bahamas | 22/23 | 163 | 547 | 446 | 270 | 8 | 7 | 3 |
| Barbados | 22/23 | 164 | 539 | 564 | 252 | 9 | 5 | 3 |
| Vanuatu | 22/23 | 335 | 661 | 737 | 273 | 8 | 5 | 3 |
| São Tomé and Príncipe | 22/23 | 1380 | 635 | 751 | 358 | 6 | 2 | 1 |
| El Salvador | 23/23 | 387 | 819 | 672 | 325 | 8 | 5 | 3 |
| Portugal | 23/23 | 425 | 615 | 693 | 445 | 8 | 7 | 2 |
| Italy | 23/23 | 161 | 390 | 896 | 326 | 8 | 6 | 3 |
| Uruguay | 23/23 | 175 | 197 | 501 | 106 | 7 | 5 | 3 |
| Spain | 23/23 | 161 | 457 | 595 | 343 | 8 | 7 | 3 |
| Ireland | 23/23 | 163 | 520 | 858 | 322 | 8 | 7 | 3 |
| Argentina | 23/23 | 549 | 230 | 300 | 190 | 9 | 7 | 4 |
| Brazil | 23/23 | 162 | 247 | 348 | 109 | 8 | 7 | 3 |
| Malta | 23/23 | 439 | 781 | 629 | 193 | 8 | 5 | 3 |
| Panama | 23/23 | 482 | 943 | 585 | 338 | 8 | 3 | 3 |
| Mexico | 23/23 | 390 | 1041 | 575 | 383 | 8 | 7 | 3 |

## The three scored axes and their published methods

**Mobility (20/21).** September 2026 Henley Passport Index visa-free destination count,
scored `round(count / 20)`. The raw count is stored in the audit row, so the score can be
recomputed without re-reading anything.

**Tax (21/21).** Headline rubric applied to each program's existing tax sentence:
10 = no direct taxes at all; 8–9 = no capital gains tax or no personal income tax;
6–7 = material income tax with reliefs.

**Banking (11/21).** World Bank Global Findex `FX.OWN.TOTL.ZS` — account ownership at a
financial institution or mobile-money provider, % of adults 15+ — scored
`clamp(round(value / 10), 1, 10)`. Full method in
[`BANKING-SCORE-RUBRIC.md`](./BANKING-SCORE-RUBRIC.md). The score is arithmetic on a
published indicator; it measures domestic account access, **not** non-resident
onboarding, and every record says so in `scorecard.banking_note`.

## Evidence behind each fact

Each of the 23 facts can name the audit row that last wrote it and the URL that row
cites. `src/lib/factEvidence.ts` derives that from `audit_trail` — it never invents a
date: a fact with no audit row shows its date as missing. In the programs table the
`n/23` badge expands to the fact list with `date · hostname` links.

## What is still missing, and why it was not filled

1. **Banking — 10 programs.** The World Bank publishes no Findex observation for
   Antigua and Barbuda, St. Kitts and Nevis, Dominica, St. Lucia, Grenada, Bahamas,
   Barbados, Cayman Islands, Vanuatu or São Tomé and Príncipe. Borrowing a neighbour's
   figure would be a lie; the axis stays empty with a written reason.
2. **Cayman Islands mobility.** Cayman residents travel on a BOTC passport. GOV.UK says
   only "visa-free travel to many countries"; third-party trackers in November 2026 gave
   50, 157 and 169 destinations. A spread of 119 is not a measurement, so no score.
3. **Official URLs — Panama (3) and São Tomé (2).** Reaching the 4-URL floor needs pages
   that actually load. `migracion.gob.pa` closed the connection and `governo.st` did not
   resolve on 2026-11-09, so no URL was added.
4. **São Tomé's old banking score of 3** was withdrawn: it predated the rubric and could
   not be recomputed, and one method for every score beats a lone figure.

## Not started, and named honestly

- **Passport validity per program** needs a read of each passport authority's page; no
  bulk source exists and none was fabricated.
- **Tax-residency depth** (183-day thresholds, remittance basis) needs one tax-authority
  read per country.
- **Residence-card travel** (Schengen 90/180, CA-4, Mercosur) needs treaty-level reads.
- **Canada** was considered as a 22nd program and rejected for now: IRCC marks the
  Start-up Visa **paused and closed to new applicants** (page dated 2026-07-21), so it
  would be a dead entry rather than a live route.
