# Country data coverage — 21 programs

Last run: 2026-11-09. Regenerate with `npm run coverage:data`.
It counts fields already in `research/countries.json`. It adds no facts.

## The schema is not the problem

All 59 leaf paths exist on all 21 programs: finance, pathways, critical tests, legal,
compliance clock, Paige fields, freshness, watch, pros/cons, scorecard, audit trail.
Every program therefore renders the same slots. What differs is how many of those
slots are filled.

## Facts on file, by fact

| Fact | On file | Missing |
| --- | --- | --- |
| `processing_time` | 21/21 | — |
| `gov_fees` | 21/21 | — |
| `tax_sentence` | 21/21 | — |
| `crypto_tax_sentence` | 20/21 | Vanuatu |
| `fee_in_bitcoin` | 21/21 | — |
| `days_in_country` | 19/21 | Bahamas, Barbados |
| `years_to_citizenship` | 18/21 | Bahamas, Barbados, Cayman Islands |
| `renewal_months` | 14/21 | Antigua and Barbuda, St. Kitts and Nevis, Dominica, St. Lucia, Grenada, Vanuatu, São Tomé and Príncipe |
| `mobility` | 21/21 | — |
| `mobility_score` | 1/21 | every program except São Tomé and Príncipe |
| `banking_score` | 1/21 | every program except São Tomé and Príncipe |
| `tax_score` | 13/21 | Italy, St. Lucia, Grenada, Bahamas, Barbados, Cayman Islands, Spain, Ireland |
| `pathways` | 21/21 | — |
| `official_urls` | 21/21 | — |
| `watched_urls` | 21/21 | — |
| `sources_cited` | 21/21 | — |
| `pros` / `cons` | 21/21 | — |
| `red_flags` / `tips` / `questions` | 21/21 | — |
| `property_ownership` / `recent_changes` | 21/21 | — |

Six of these are real gaps a reader will hit. Everything else is complete.

## Record depth, by country (thinnest first)

| Country | Facts | Details | Integration | Tax | Bitcoin | Src | URLs | Paths | Pros | Cons | Flags | Tips | Q |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bahamas | 18/23 | 163 | 547 | 446 | 270 | 5 | 7 | 3 | 5 | 4 | 3 | 2 | 3 |
| Barbados | 18/23 | 164 | 539 | 564 | 252 | 6 | 5 | 3 | 5 | 3 | 3 | 2 | 3 |
| St. Lucia | 19/23 | 165 | 194 | 229 | 102 | 4 | 4 | 3 | 5 | 3 | 3 | 2 | 3 |
| Grenada | 19/23 | 163 | 214 | 215 | 102 | 4 | 4 | 3 | 5 | 3 | 3 | 1 | 3 |
| Cayman Islands | 19/23 | 170 | 490 | 489 | 414 | 6 | 5 | 3 | 5 | 3 | 3 | 2 | 3 |
| Vanuatu | 19/23 | 335 | 661 | 34 | 273 | 6 | 5 | 3 | 5 | 5 | 4 | 3 | 3 |
| Italy | 20/23 | 161 | 390 | 896 | 326 | 6 | 6 | 3 | 5 | 3 | 3 | 2 | 3 |
| Antigua and Barbuda | 20/23 | 401 | 246 | 242 | 177 | 5 | 5 | 3 | 5 | 4 | 3 | 1 | 3 |
| St. Kitts and Nevis | 20/23 | 490 | 235 | 291 | 181 | 4 | 4 | 3 | 5 | 3 | 3 | 1 | 3 |
| Dominica | 20/23 | 416 | 262 | 212 | 121 | 4 | 4 | 3 | 5 | 4 | 3 | 1 | 3 |
| Spain | 20/23 | 161 | 457 | 595 | 343 | 6 | 7 | 3 | 5 | 3 | 3 | 2 | 3 |
| Ireland | 20/23 | 163 | 520 | 858 | 322 | 6 | 7 | 3 | 5 | 3 | 3 | 2 | 3 |
| El Salvador | 21/23 | 387 | 819 | 672 | 325 | 6 | 5 | 3 | 7 | 2 | 1 | 1 | 2 |
| Portugal | 21/23 | 425 | 615 | 693 | 445 | 6 | 7 | 2 | 5 | 3 | 2 | 1 | 3 |
| Uruguay | 21/23 | 175 | 197 | 501 | 106 | 5 | 5 | 3 | 5 | 2 | 1 | 1 | 3 |
| Argentina | 21/23 | 549 | 230 | 300 | 190 | 7 | 7 | 4 | 5 | 5 | 5 | 3 | 3 |
| Brazil | 21/23 | 162 | 247 | 348 | 109 | 6 | 7 | 3 | 5 | 5 | 5 | 3 | 3 |
| Malta | 21/23 | 439 | 781 | 629 | 193 | 6 | 5 | 3 | 5 | 3 | 3 | 1 | 3 |
| Panama | 21/23 | 482 | 943 | 585 | 338 | 6 | 3 | 3 | 5 | 3 | 3 | 1 | 3 |
| Mexico | 21/23 | 390 | 1041 | 575 | 383 | 6 | 7 | 3 | 5 | 6 | 3 | 1 | 3 |
| São Tomé and Príncipe | 22/23 | 1380 | 635 | 751 | 358 | 4 | 2 | 1 | 3 | 2 | 3 | 2 | 3 |

## What this corrects

Uruguay and El Salvador are not the longest records. São Tomé and Príncipe has the
longest `details` (1,380 characters), Mexico the longest `bitcoin_integration`
(1,041), Argentina the most sources (7) and the most pathways (4).

They look richest because they fill 21 of 23 facts and carry three priced pathways.
Depth of prose and completeness of slots are different things, and the board should be
read that way.

The programs that look thin are Bahamas (18/23), Barbados (18/23), and St. Lucia,
Grenada, Cayman Islands and Vanuatu (19/23). Their missing facts are the six below,
not missing prose.

## What is missing, and what filling it costs

1. **Renewal interval — 7 countries.** Antigua and Barbuda, St. Kitts and Nevis,
   Dominica, St. Lucia, Grenada, Vanuatu, São Tomé and Príncipe. Source: the
   immigration act or the CBI regulations page for each. No copywriting needed — one
   number per country, and the renewal clock appears on seven cards.
2. **Days in country — 2 countries.** Bahamas, Barbados. Source: permanent-residence
   conditions (physical presence). Today their day bar is absent from the days panel.
3. **Years to citizenship — 3 countries.** Bahamas, Barbados, Cayman Islands. Source:
   naturalisation statute. Zero is a valid value ("at grant"), so a sourced zero is
   better than null.
4. **Mobility score — 20 countries, banking score — 20.** Only São Tomé has them.
   The scorecard note still says "mobility & banking pending research". Filling these
   requires a stated method (visa-free count, account-opening rules for non-residents)
   and one pass of real reads; otherwise leave them null and say so.
5. **Tax score — 8 countries.** Italy, St. Lucia, Grenada, Bahamas, Barbados, Cayman
   Islands, Spain, Ireland. The tax *sentence* is on file for all eight; only the 0–10
   score is blank.
6. **Crypto tax sentence — Vanuatu.** Its `tax_benefits` is 34 characters and has no
   `Crypto/Bitcoin tax:` line, so the fee invoice and the decision pack have nothing to
   quote. Every other country has one.

Also worth levelling, though not counted above: sources per country (4 minimum,
7 maximum) and official URLs (2 minimum, 7 maximum). A floor of six sources and four
official URLs per country would make the Sources tab read the same everywhere.

## What the page now does

The `SelectionBoard` card sits immediately above Advice and carries the live match
count, the region split with counts, jurisdiction and flagship counts, sources on file,
and four `facts on file` counts (days in country, years to citizenship, fee in Bitcoin,
mobility). The counts are of the filtered set, so narrowing to the Caribbean shows how
much of that slice is complete instead of hiding the gap.

No values were invented and `research/countries.json` was not edited.
