# Country data coverage — 21 programs

Last run: 2026-11-09 after `scripts/apply-researched-fills.mjs`. Regenerate with `npm run coverage:data`.
It counts fields already in `research/countries.json`. It adds no facts.

## 22 of 23 facts are now on file in every program

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
| `banking_score` | 1/21 | every program except São Tomé and Príncipe |
| `tax_score` | 21/21 | — |
| `pathways` | 21/21 | — |
| `official_urls` | 21/21 | — |
| `watched_urls` | 21/21 | — |
| `sources_cited` | 21/21 | — |
| `pros` / `cons` | 21/21 | — |
| `red_flags` / `tips` / `questions` | 21/21 | — |
| `property_ownership` / `recent_changes` | 21/21 | — |

`renewal_months` counts as on file when citizenship is granted outright: there is no
permit to renew, and the clocks already print "None". Counting that as missing was a
defect in the earlier audit, now fixed in `scripts/data-coverage.mjs`.

## Record depth (thinnest first)

| Country | Facts | Details | Integration | Tax | Bitcoin | Src | URLs | Paths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cayman Islands | 21/23 | 170 | 490 | 489 | 414 | 7 | 5 | 3 |
| El Salvador | 22/23 | 387 | 819 | 672 | 325 | 7 | 5 | 3 |
| Portugal | 22/23 | 425 | 615 | 693 | 445 | 7 | 7 | 2 |
| Italy | 22/23 | 161 | 390 | 896 | 326 | 7 | 6 | 3 |
| Uruguay | 22/23 | 175 | 197 | 501 | 106 | 6 | 5 | 3 |
| Antigua and Barbuda | 22/23 | 401 | 246 | 242 | 177 | 6 | 5 | 3 |
| St. Kitts and Nevis | 22/23 | 490 | 235 | 291 | 181 | 5 | 4 | 3 |
| Dominica | 22/23 | 416 | 262 | 212 | 121 | 5 | 4 | 3 |
| St. Lucia | 22/23 | 165 | 194 | 229 | 102 | 5 | 4 | 3 |
| Grenada | 22/23 | 163 | 214 | 215 | 102 | 5 | 4 | 3 |
| Bahamas | 22/23 | 163 | 547 | 446 | 270 | 8 | 7 | 3 |
| Barbados | 22/23 | 164 | 539 | 564 | 252 | 9 | 5 | 3 |
| Spain | 22/23 | 161 | 457 | 595 | 343 | 7 | 7 | 3 |
| Ireland | 22/23 | 163 | 520 | 858 | 322 | 7 | 7 | 3 |
| Argentina | 22/23 | 549 | 230 | 300 | 190 | 8 | 7 | 4 |
| Brazil | 22/23 | 162 | 247 | 348 | 109 | 7 | 7 | 3 |
| Malta | 22/23 | 439 | 781 | 629 | 193 | 7 | 5 | 3 |
| Vanuatu | 22/23 | 335 | 661 | 737 | 273 | 8 | 5 | 3 |
| Panama | 22/23 | 482 | 943 | 585 | 338 | 7 | 3 | 3 |
| Mexico | 22/23 | 390 | 1041 | 575 | 383 | 7 | 7 | 3 |
| São Tomé and Príncipe | 23/23 | 1380 | 635 | 751 | 358 | 5 | 2 | 1 |

## What was filled, and from where

Every value below is in the catalog with a dated `audit_trail` row naming its source.
`last_checked` was not moved: it is the date of the last full human re-read, and that
is still 2026-11-08.

**Clocks**
- Bahamas — 90 days a year (Economic Permanent Residence, Immigration (Amendment) Act
  2021 s.17A(1)(b)) and 10 years to citizenship (legal PR for 10 years, 12 months
  immediately before applying, 6 years of actual residence). Source: Bahamas
  Immigration Department citizenship page; Higgs & Johnson.
- Barbados — 5 years to naturalisation (12 months plus 5 of the preceding 7, Citizenship
  Act Cap. 186) and a 0-day target, because the Special Entry and Residing Permit sets
  no codified minimum presence. Source: Barbados Immigration Department SEP page;
  Citizenship Act.
- Cayman Islands — 20 years to the right to be Caymanian, including 10 holding permanent
  residence, under the Caymanian Protection Act in force 1 May 2026 (was 15 and 5).
  BOTC naturalisation under UK law remains a separate, earlier step. Source: Cayman
  Government / MCEI reform guide.

**Vanuatu tax** — the 34-character "No personal income tax (Wikipedia)" became the full
position plus a `Crypto/Bitcoin tax:` sentence: no personal income, capital gains,
corporate, withholding, wealth or inheritance tax; VAT 15%, import duties, rent tax and
stamp duty are the revenue base; citizenship does not itself create tax residence.
Source: Vanuatu Foreign Investment Promotion Agency, "Low tax jurisdiction".

**Mobility score (20 countries)** — the September 2026 Henley Passport Index visa-free
destination count, scored `round(count / 20)`. Counts used: Portugal 184, Italy 185,
Spain 185, Ireland 185, Malta 184, El Salvador 131, Uruguay 155, Argentina 168, Brazil
168, Mexico 156, Panama 147, Bahamas 158, Barbados 163, Antigua and Barbuda 154,
St. Kitts and Nevis 157, Dominica 145, St. Lucia 144, Grenada 147, Vanuatu 87,
São Tomé and Príncipe 58. The count itself is recorded in each audit row, so the score
can be recomputed without re-reading anything.

**Tax score (8 countries)** — Italy 6, Spain 6, Ireland 6, Barbados 6, St. Lucia 8,
Grenada 8, Bahamas 9, Cayman Islands 10. Rubric: 10 = no direct taxes at all; 8–9 = no
capital gains tax or no personal income tax; 6–7 = material income tax with reliefs.
Applied to the tax sentence already on file.

## What is still missing, and why it was not filled

1. **Banking score — 20 of 21.** There is no comparable published measure: opening a
   personal account as a non-resident depends on the individual bank, the applicant's
   residence and source-of-funds file, not on a country-level rule. A number here would
   be an opinion dressed as a metric. It needs a stated method (which banks, which
   applicant profile, which documents) before any value is written. São Tomé's 3 came
   from agency-sourced facts and is still unstamped.
2. **Cayman Islands mobility score.** Henley ranks passports, and Cayman residents
   travel on a British Overseas Territories citizen passport, which the index does not
   score separately. The UK figure would be wrong for Cayman.
3. **Evidence floor.** Sources per country now run from 5 to 9 (was 4 to 7), official
   URLs 2 to 7. Panama still has 3 official URLs and São Tomé 2; no URL was added
   without reading it.

## How to read the gap now

Twenty programs show 22 of 23 and São Tomé shows 23 of 23. The one universal hole is
banking, and it is universal rather than country-specific — which is the honest picture
and the next research project, not a per-country failure.
