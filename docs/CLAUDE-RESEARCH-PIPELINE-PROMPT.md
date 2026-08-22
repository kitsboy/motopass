# CLAUDE-RESEARCH-PIPELINE-PROMPT.md

> The master prompt to hand to Claude (or any capable agent) for the job of
> redesigning and upgrading the MotoPass country-research pipeline into a
> reliable, source-trusted, machine-verifiable data machine.
>
> Copy the entire fenced block below into a fresh Claude session (or use it
> as the system prompt for a dedicated research agent). The document is
> self-contained: it explains who we are, what we store, what we need, and
> what we want you to build.

---

```markdown
# MotoPass Country Research Pipeline — Redesign Prompt

You are being asked to design and build the next generation of MotoPass's
country-research pipeline: a reliable source-discovery and data-acquisition
system that produces the most trustworthy per-country dataset possible for
50 jurisdictions, then keeps it honest over time.

Work through every section. Where I ask for a decision (source choice,
architecture, schema, API), recommend ONE option with rationale, then list
the runner-ups. When you cannot verify a fact, say so explicitly — never
invent or guess.

---

## 1. WHO WE ARE: WHAT MOTOPASS IS TRYING TO DO

MotoPass (https://motopass.giveabit.io) is a Bitcoin-native "sovereign
stack" product. Think of it as the infrastructure layer for people who want
freedom of movement, residence, and citizenship — built by Bitcoiners for
Bitcoiners.

Our core promise: **the 50-jurisdiction oracle** — a living, honest,
machine-verified dataset of every meaningful way to obtain residency or
citizenship by investment (RBI / CBI), together with each country's Bitcoin
and crypto-law posture. The app lets users:

- Browse and compare 50 jurisdictions (program cards, filters, compare tool).
- Model stacking portfolios (residency + residency + passport combos).
- Run a cost simulator over each program's real thresholds.
- Ask "Paige", our on-site agent, questions grounded in the dataset.
- See an honest freshness score for every country (fresh / watch / stale).

The data lives in `research/countries.json` (the single source of truth,
schema v3). A daily self-healing pipeline (GitHub Actions) sweeps Wikipedia,
BTC Map, and CoinGecko, probes official source URLs for changes, and
re-anchors changed programs to the Bitcoin blockchain via the Satohash API.

The vision that motivates this prompt: **MotoPass wants to become the
most trusted migration-intelligence source on the internet.** That requires
(a) per-country sourcing from the most reliable, honest, updated primary
and authoritative sources, and (b) cryptographic, tamper-evident proof that
what we claim is what the sources said, when we claimed it.

---

## 2. HOW WE VERIFY: SATOHASH.IO + OPEN TIMESTAMPS (OTS)

Every program carries cryptographic proof of its content at a point in time.

- **Satohash.io** is our proof-anchoring service. For a program's "canonical
  slice" (a normalized JSON digest of its facts), we POST its SHA-256 hash
  to `https://api.satohash.io/api/stamp` and receive back a `proof_url`
  like `https://satohash.io/verify/<hash>`, a `stamp_id`, `stamped_at`, and
  the Bitcoin `block_height` the hash was anchored into. Anyone can verify
  the content hash on-chain.
- **Open Timestamps (OTS)** is the second layer. We generate `.ots` sideproof
  files (e.g. `public/proofs/switzerland-02caca688c68.ots`) via
  `scripts/stamp-ots.mjs`, submitting hashes to OTS calendars (e.g.
  `https://finney.calendar.eternitywall.com/ots`). OTS is decentralized and
  calendar-independent; it upgrades our proofs so they remain verifiable
  even if Satohash.io ever disappeared.
- Satohash is ALSO used for **passport-application verification**: an
  applicant's document set is hashed and anchored, giving a timestamped,
  tamper-evident record of what was submitted and when.

**The new idea you are helping build:** apply the same proof discipline to
the RESEARCH ITSELF. Every sourced fact in `countries.json` should be able
to cite *which source said it, when we fetched it, and a verifiable anchor
of that source's content at fetch time*. We want to be able to say: "This
threshold came from the official CBI unit page, fetched 2026-08-22, and the
page's content hash is anchored at Bitcoin block N — here is the link to
verify." That is the trust engine behind everything below.

---

## 3. THE DATA WE STORE TODAY (per country, schema v3)

Each of the 50 programs in `research/countries.json` carries these fields.
Your research design must produce, per country, evidence-grade answers for
every one of them:

| Field | What it is |
|---|---|
| `category` | `rbi_cbi` (residency/citizenship by investment) or `legal_tender_bitcoin` |
| `status` | e.g. "Acquired - Pioneer", "Researching" |
| `bitcoin_integration` | prose: crypto legality, Lightning adoption, banking climate |
| `finance` | `min_investment_usd`, `typical_investment_usd`, `gov_fees_usd`, `processing_time_months`, `tax_benefits`, `crypto_friendly_score` (0-10), `bitcoin_specific` |
| `details` | program summary + routes on file + tax notes |
| `sources` | list of sources used |
| `lightning_ready`, `sovereignty_score`, `stacking_synergy`, `risk_level` | scoring fields |
| `satohash_proofs` | array of `{field, block_height, proof_url, content_hash, ots_path, stamped_at, stamp_id}` |
| `pathways[]` | each route: `{type, label, min_investment_usd, notes}` — e.g. golden visa, CBI donation, real estate, digital nomad, non-dom |
| `critical_tests` | `live_and_work`, `scope_of_freedom`, `dual_citizenship`, `notes` |
| `legal_compliance` | `primary_laws[]` (statutes with year), `official_urls[]` (watch-probed), `property_foreign_ownership`, `recent_changes` |
| `compliance_clock` | `renewal_interval_months`, `citizenship_eligibility_years`, `residency_day_count_target` |
| `paige_fields` | `common_questions[]`, `red_flags[]`, `optimization_tips[]`, `escalate_when` |
| `freshness` | `status` (fresh/watch/stale), `days_stale` — stale = >45 days |
| `watch` | `urls[]` with `last_probed`, `last_hash`, `status` — the source-change watchdog |
| `pros[]`, `cons[]` | `{text, source, verified_at}` |
| `scorecard` | `crypto_friendly`, `freedom`, `stability`, `tax`, `cost`, `mobility`, `banking` |
| `audit_trail[]` | every change: `{date, field, from, to, source, hash}` |

Rules the pipeline lives by (non-negotiable):

1. **Facts, never invented rules.** If a number or law cannot be sourced,
   it does not enter the corpus.
2. **Confidence gating.** Only medium+ confidence changes are applied.
3. **Never overwrite with null/empty; never downgrade a researched value on
   weak signals.**
4. **Every change is audited** in `audit_trail` with date, field, from, to,
   source, and hash.
5. **Freshness is honesty.** If we can't verify, the country stays `stale`
   and the pipeline keeps flagging it. We prefer an honest "stale" over a
   confident-but-wrong "fresh".

---

## 4. THE QUESTIONNAIRE — WHAT WE ASK EVERY JURISDICTION

For EACH of the 50 countries, our research must answer these questions,
each with at least one authoritative source and a fetch date. Treat this as
the canonical per-country questionnaire:

### A. Legal status of Bitcoin / crypto (the "is it legal" section)
1. Is Bitcoin (and crypto generally) legal to hold and trade? Since when?
2. Is it legal as a payment tool? Any ban (e.g. Turkey 2021, Thailand 2022)?
3. Is it (or was it ever) legal tender? Status and revocation dates
   (e.g. El Salvador revoked Feb 2025; CAR repealed Apr 2023).
4. Are there VASP / exchange / CASP licensing regimes? Which regulator
   (e.g. UAE split: VARA/DFSA/FSRA/CBUAE+SCA; Singapore MAS; HK SFC)?
5. Is EU MiCA or an equivalent framework applicable, and from when?
6. Central bank position (e.g. Costa Rica BCCR 2017: not currency).
7. Tax treatment of crypto gains for (a) individuals, (b) businesses.

### B. Residency / citizenship pathways (the "how do I get in" section)
1. List every official route: investment, property, donation, funds,
   business, employment, retirement, digital nomad, family.
2. For each: exact minimum investment (in local currency AND USD),
   fees, processing time, renewal interval, and any stay requirement.
3. Which routes lead to permanent residency? Which to citizenship?
4. Citizenship: eligibility years, language/residence requirements,
   dual-citizenship rules, renunciation required?
5. Any route currently suspended/terminated (e.g. Cyprus golden passport
   2020, Malta CBI 2025, Turkey bank-deposit route)?
6. Recent threshold changes with dates (e.g. Panama Friendly Nations
   $5k→$200k 2021; Portugal naturalization 5→10 yrs 2026; SKN RE $325k).

### C. Tax posture (the "what do I keep" section)
1. Income tax: territorial vs worldwide; non-dom regimes and durations.
2. Capital gains tax (esp. on crypto), wealth tax, inheritance tax.
3. Property/transfer taxes for foreign buyers; any premium surcharges.
4. Tax treaty network relevance (double-taxation agreements).

### D. Legal & practical (the "what could bite me" section)
1. Primary laws governing immigration/citizenship (names + years +
   official gazette/official URLs).
2. Property ownership rules for foreigners (restrictions, concessions,
   fideicomiso, leasehold vs freehold).
3. Red flags: political risk, banking openness to crypto funds, AML/EDD
   intensity, sanctions watch, US visa restrictions (e.g. Caribbean CBI
   Proclamation 10998), EU visa-waiver suspensions (e.g. Vanuatu).
4. Watch-list URLs: the 2-4 official pages whose content changes signal a
   rule change (immigration dept, CBI unit, gazette, tax authority).

---

## 5. THE 50 COUNTRIES — FULL LIST (grouped by region)

For each country below, acquire the answers to Section 4 and the fields of
Section 3. **Known hot-button items** are noted where our current research
has already flagged something to verify or monitor — treat these as
starting points, not conclusions.

### Central America
1. **El Salvador** — Bitcoin legal-tender status REVOKED Feb 2025 (IMF $1.4B
   deal); verify current BTC reserve policy, any new reform, residency routes.
2. **Panama** — Bill 697 vetoed Jun 2022, struck down Jul 2023; 2025 draft
   bill still in National Assembly (re-verify status); Friendly Nations $200k;
   Qualified Investor modalities ($300k RE / $500k securities / $750k deposit).
3. **Costa Rica** — BCCR 2017 "not currency" stance; digital nomad Ley 9996
   thresholds; rentista/inversionista minimums; banking stance on crypto.
4. **Belize** — CBI program status, thresholds, recent due-diligence changes.

### Africa
5. **Central African Republic** — legal tender adopted Apr 2022, REPEALED
   Apr 2023 (Law 22.004); verify Sango initiative status, mining pilots,
   any 2024-2026 revival.
6. **Mauritius** — FSC regulates digital assets under FSA 2007; Premium Visa
   thresholds; Occupation Permit; IRS/PDS $375k property routes.
7. **Seychelles** — CBI program, thresholds, crypto stance, recent changes.

### South America
8. **Uruguay** — flagship template; verify residency thresholds, digital
   nomad/investor routes, crypto tax treatment.
9. **Bolivia** — 2014 ban REPEALED by Res. 144 (15 Dec 2020); verify 2025
   election crypto-fund proposal status; residency routes.
10. **Paraguay** — mining framework 2022-2024; Itaipu power ~$0.05/kWh;
    SUACE ~$70k/10yr (verify current); 2024 electricity-theft law.
11. **Brazil** — crypto income tax rules (15% on gains >R$35k), residency
    routes, any CBI/reform changes.
12. **Argentina** — crypto tax treatment under new administration, residency
    routes, wealth tax status.
13. **Chile** — crypto stance, residency via investment, recent law changes.
14. **Colombia** — crypto regulation status, investor/nomad visa routes.

### Caribbean
15. **St. Kitts and Nevis** — SGF renamed SISC ($250k); RE $325k (2024 OECS
    harmonization); 2026 framework (interviews, proposed 30-day visit); US
    visa restriction (Proclamation 10998).
16. **Antigua and Barbuda** — NDF $230k; business route $400k share of $5M+
    joint business; UWI $260k (families 6+); ECCIRA harmonization 2026.
17. **Dominica** — EDF $200k; ECCIRA harmonization; US visa restriction.
18. **St. Lucia** — CBI thresholds (donation $100k?/RE route), recent changes.
19. **Grenada** — CBI thresholds (donation $150k/RE $220k), ECCIRA.
20. **Barbados** — welcome stamp, real estate route, crypto stance.
21. **Bahamas** — digital nomad permit, real estate residency, crypto stance.
22. **Cayman Islands** — no direct CBI; verify residency/economic substance
    routes and crypto stance.

### Middle East
23. **UAE (Dubai / Abu Dhabi)** — VARA/DFSA/FSRA/CBUAE+SCA split (Oct 2025);
    Golden Visa property threshold (AED 2M+) verify; free-zone + residency;
    0% income/capital gains.

### Europe
24. **Switzerland** — lump-sum taxation verified (living-expenses basis, no
    gainful activity, ~5,000 payers, abolished in some cantons); Crypto
    Valley/FINMA; verify any lump-sum changes 2025-2026.
25. **Portugal** — Lei Orgânica 1/2026 (in force 19 May 2026): naturalization
    7/10 yrs from first residence card (was 5); golden visa fund €500k;
    D7; AIMA processing.
26. **Malta** — CBI TERMINATED (CJEU C-181/23, 29 Apr 2025; Act XXI/2025);
    MPRP active (~€99k + property); verify MPRP 2026 details.
27. **Cyprus** — 6.2 PR (€300k new-build + €30k deposit — verify income
    requirement); digital nomad; non-dom 17 yrs; MiCA/CySEC CASP; golden
    passport closed 2020.
28. **Greece** — golden visa zones (€250k/€500k/€800k — verify current);
    FIP; digital nomad; crypto legal, no specific legislation.
29. **Ireland** — verify: no active golden visa (closed 2023); IIF fund route
    status; crypto stance.
30. **Spain** — golden visa (verify status 2025-2026 — reform/abolition
    proposals); non-lucrative visa; crypto capital-gains treatment.
31. **Italy** — crypto tax (26% — verify any 2025-2026 rate changes); flat-tax
    for new residents; no CBI.
32. **Latvia** — investor residency (€250k real estate? verify), crypto stance.
33. **Estonia** — e-Residency, startup visa, crypto VASP stance (verify
    2025-2026 regulatory tightening).
34. **Bulgaria** — residency by investment (€500k+ — verify), 10% flat tax,
    crypto stance.
35. **Croatia** — digital nomad visa (€2,750/mo — verify), residency routes.
36. **Gibraltar** — EDP (exceptional dependency) residence, crypto stance.
37. **Andorra** — passive residence (investment thresholds), 10% tax, crypto
    stance.

### Asia
38. **Singapore** — GIP minimums (VERIFY — corpus says S$2.5M+, MAS may have
    raised; check S$10M business/S$25M fund categories); PSA 2019; family
    office route; ABSD.
39. **Hong Kong** — CIES HK$30M incl. HK$3M CIES-IP (HKIC), HK$30M net assets
    6mo prior, RE cap HK$10M, 800+ apps by Jan 2025; TTPS; VATP mid-2024.
40. **Thailand** — LTR 4 categories verified (Wealthy Global Citizen USD 1M
    assets + USD 500k Thai investment; others USD 80k/40k; 10-yr 5+5); Elite
    packages; payment-tool ban Apr 2022; remittance-tax uncertainty.
41. **Cambodia** — no CBI; verify long-stay/residency routes, crypto stance
    (banking ban per NBC).
42. **Philippines** — SIRV ($75k? verify), SRRV ($10k/$20k? verify), crypto
    stance (BSP Circular 944).
43. **Malaysia** — MM2H (revised thresholds — verify current), crypto stance.
44. **Indonesia** — second-home visa (verify 2024-2025 launch), crypto legal
    to trade (Bappebti), payment ban.
45. **Japan** — no CBI; verify business-manager visa thresholds, crypto tax
    (55% on other income? verify reform), FSA regime.

### Caucasus / North America / Oceania / Europe-Middle East
46. **Georgia** — 2019 MoF: crypto not Georgia-sourced, 0% personal gains;
    remote work permit; company route; VASP law status (verify passed?).
47. **Mexico** — temporary resident solvency (~$2,600/mo or ~$43k balance —
    VERIFY current INM figures); investor visa $250k; FinTech Law virtual
    assets; fideicomiso.
48. **Vanuatu** — crypto legal since Jul 2021; VCP $130k (verify current
    minimum + any 2025-2026 changes); EU visa-waiver status; leasehold.
49. **New Zealand** — active investor (NZ$5M+) / investor plus (NZ$15M)
    categories — VERIFY current; crypto stance.
50. **Turkey** — CBRT payment ban (30 Apr 2021); CBI property $400k (verify
    still current — possible 2025 changes); SPK exchange oversight; lira risk.

For EVERY country, deliver: (1) the Section-4 answers, (2) the schema v3
fields filled, (3) 2-4 watch-list official URLs, (4) source list with dates,
(5) confidence score per fact, and (6) what is NOT verifiable and why.

---

## 6. SOURCE SELECTION CRITERIA — "RELIABLE, HONEST, TRUSTED, UPDATED"

Rank every candidate source on these axes. Only sources that clear the bar
are used; everything else is listed as "candidate — needs vetting".

1. **Authority** — is it the official source (government, ministry, gazette,
   central bank, regulator, CBI unit, tax authority)? Primary beats
   secondary beats aggregator, always.
2. **Recency / update discipline** — does the page carry a visible last-updated
   date? Is the jurisdiction's law gazette published regularly?
3. **Machine-accessibility** — structured API > HTML page > PDF > scanned PDF.
   Does it block bots (403/429) or need JS? (We have hit 403 on gob.mx and
   429 on Brave — note these constraints.)
4. **Language** — English first, but official Spanish/French/Portuguese/
   German sources are acceptable when they are the primary authority;
   prefer official English versions where they exist.
5. **Independence/honesty** — for secondary sources: does the author have an
   incentive (agent commissions) or is it neutral (law firms, IMF, World
   Bank, OECD, FATF, academic, established legal publishers)?
6. **Stability** — can we deep-link and re-fetch for the watch probe?
7. **Cost** — free first; paid only when free sources cannot provide the
   authority we need.

---

## 7. WHAT WE WANT YOU TO BUILD — THE SOURCE-DISCOVERY & TRUST ENGINE

Design (and where possible implement) the following, in priority order:

### 7.1 A per-country SOURCE REGISTRY (data model + content)
A `sources.json` (or per-country records) mapping each jurisdiction to its
vetted sources, categorized:
- `primary_official` — gov/ministry/CBI/gazette/regulator/central-bank URLs
- `primary_legal` — law text repositories, official gazettes
- `secondary_trusted` — IMF Article IV, World Bank, OECD, FATF, major law
  firms' country guides, established publishers
- `watch_probe` — the 2-4 URLs the daily probe hashes for change detection
- `status` — vetted / needs-vetting / blocked-for-bots / paid-only

### 7.2 A SOURCE DISCOVERY TOOL
A search/curation workflow that, given a country + question, returns the
best sources. Requirements:
- Seed per-country candidate sources from the registry above.
- Rank by the Section-6 criteria (authority, recency, machine-access, cost).
- Detect dead/blocked/JS-only pages automatically (we already probe; extend
  it to classify failure modes).
- Log every discovery attempt in an audit trail.

### 7.3 A SOURCE-HONESTY / ANCHORING LAYER (the trust engine)
Every fetched source page should get:
- `fetched_at` timestamp
- content SHA-256 hash
- optional Satohash stamp (`POST /api/stamp`) + OTS `.ots` sideproof
- a citation format: `source · fetched_at · hash · proof_url`
That citation becomes the `source` field content in `audit_trail` and
`pros[]/cons[]` entries, replacing generic strings like "Our research".

### 7.4 PIPELINE INTEGRATION
- Wire the registry into `scripts/lib/intel-sources.mjs` as a fourth+
  adapter tier (after Wikipedia/BTC Map/CoinGecko): official-source fetch.
- Keep the safety rules (confidence gating, no null overwrite, audit trail,
  freshness honesty) intact.
- Ensure the watch probe uses registry URLs and flags
  `watch.changed = true` when a source page hash drifts.
- Keep the Satohash re-stamp loop paced/capped (incremental self-heal).

### 7.5 A FRESHNESS / TRUST DASHBOARD (nice-to-have)
Per country: source count by tier, last-fetched per source, proof status
(stamped / OTS / none), confidence score, staleness. Surfaced in the app
or a research view.

---

## 8. WHAT WOULD MAKE THIS EASIER — APIS, SOURCES, TOOLS

### 8.1 Free, reliable, machine-readable sources we already use or want
| Source | What it gives | Notes |
|---|---|---|
| Wikipedia REST API (`/api/rest_v1`) | country summaries + sections + revisions | free, stable, structured; revision IDs give us "as of" semantics |
| BTC Map API (`api.btcmap.org`) | merchant density + Lightning readiness | free; spatial queries per country |
| CoinGecko API | BTC/USD price for modeling | free tier |
| **RestCountries / geonames** | ISO codes, flags, currencies | free |
| **IMF eLibrary / Article IV** | economy + crypto position (e.g. El Salvador 25/58) | free PDFs; searchable |
| **World Bank API** | economic indicators | free |
| **Official gazettes** (e.g. DOF México, Gaceta Oficial Panama) | law text + dates | free; often PDF, sometimes bot-blocked |
| **Official CBI units** (ciu.gov.kn, cip.gov.ag, cbiu.gov.dm, etc.) | authoritative program terms | free HTML; verify bot-access per site |
| **BOI / EDB / immigration portals** (ltr.boi.go.th, edbmauritius.org, immd.gov.hk) | visa program rules | free HTML; ltr.boi.go.th worked well |
| **FATF / OECD** | AML/FATF posture per jurisdiction | free |

### 8.2 Paid sources (only when free cannot give authority)
| Source | What it gives | Rough cost class |
|---|---|---|
| **IBFD** (tax) | definitive per-country tax summaries | enterprise |
| **Thomson Reuters Practical Law / LexisNexis** | law guides + commentary | enterprise |
| **PwC / KPMG / Deloitte country tax & immigration portals** | high-quality summaries | free tier exists, paid for depth |
| **Henley & Partners / Arton Capital / Investment Migration Insider** | CBI program intel + rankings | paid research, free articles |
| **ComplyAdvantage / sanctions data** | sanctions & risk screening | paid |

### 8.3 Things that would make the whole job dramatically easier
1. **Official structured APIs** — any government API (gazette APIs, immigration
   APIs) eliminates scraping and hash-drift ambiguity.
2. **Official RSS/Atom feeds** on immigration and gazette sites — push-based
   change detection instead of polling.
3. **English versions of official portals** — many LatAm/EU portals are
   local-language only (Spanish/Portuguese/French/German); official English
   pages reduce translation risk.
4. **Updated-date metadata** on official pages — a visible "last updated" lets
   us distinguish "checked and unchanged" from "not checked".
5. **ETag / Last-Modified headers** — cheap change detection for the probe.
6. **Bot-access policy** — many governments 403/429 automated agents; we would
   pay for or prefer a sanctioned data license, or a polite, rate-limited,
   identifiable crawler with a public user-agent policy.
7. **PDF→text reliability** — gazettes are often scanned PDFs; OCR quality
   gates automated reading.
8. **Currency/law-fix updates** — a structured changelog per law (many gazettes
   now publish "as amended" consolidations; prefer those over base law text).
9. **OpenStreetMap/BTC Map growth** — already good; keep.
10. **Archive.org / Memento** — free historical snapshots for "what the page
    said when we first cited it" verification.

### 8.4 What we would like YOU to research and recommend
- For each of the 50 countries: the 3-5 highest-trust sources (free-first),
  with URLs, update cadence, language, bot-access, and API/PDF format.
- A ranked shortlist of paid data providers worth subscribing to for the
  gaps (esp. tax and CBI program intel) with cost estimates.
- Whether any official APIs exist per country (gazette/immigration/statistics)
  worth integrating.
- A concrete recommendation for the source-registry schema and the
  citation/proof format.

---

## 9. DELIVERABLES (what "done" looks like)

1. **Per-country source registry** — all 50 jurisdictions, vetted tiers,
   watch-probe URLs, bot-access notes, update cadence, format.
2. **Questionnaire answers** — the Section-4 answers for all 50 countries
   with dated, URL-backed sources and per-fact confidence.
3. **Source-discovery tool design** — architecture + implementation plan
   (or code) for the search/ranking/curation workflow.
4. **Trust-engine design** — the citation + Satohash/OTS anchoring format,
   and how it plugs into `audit_trail`, `pros[]`, and `watch`.
5. **API/provider recommendation** — free-first shortlist + paid options
   with costs, and which official APIs to integrate.
6. **Migration plan** — how to retrofit the current corpus and pipeline
   without breaking the safety rules.

## 10. HARD RULES

- Never fabricate a fact, threshold, law, or URL. Unverifiable = "unverified",
  recorded as such, country stays `stale`.
- Cite everything: source URL + fetched date + hash where possible.
- Prefer the official source; use trusted secondary only to corroborate.
- Free first; paid only for gaps free sources cannot fill.
- Preserve the pipeline safety rules (Section 3) — they are the product's
  honesty guarantee.
- When in doubt about a choice, recommend one option with rationale and
  list alternatives rather than leaving it open.
```

---

## How to use this document

1. **For a one-off deep pass:** paste the fenced block into Claude with any
   scope overrides (e.g. "start with the Caribbean CBI group and Brazil").
2. **For a persistent research agent:** use the fenced block as the system
   prompt, then send per-country work orders referencing Section 4.
3. **For pipeline work:** Sections 3, 7.4, 8, and 10 are the engineering
   contract — hand them to a coding agent alongside the repo.
4. The country list and "hot-button items" in Section 5 are a living
   snapshot (2026-08-22 research state) — update them as the corpus heals.
