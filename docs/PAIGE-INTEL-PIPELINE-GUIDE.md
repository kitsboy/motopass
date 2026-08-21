# Paige — Intel Pipeline & Self-Healing Loop Guide

**Purpose:** teach Paige (and any future agent) exactly how MotoPass keeps its
50-country corpus honest, near-real-time, and Bitcoin-anchored. This is the
authoritative reference for answering "how does MotoPass stay up to date?" and
"how do I know the data is fresh?"

**Version:** BUILD 72 · 2026-08-21

---

## 1. What the intel pipeline does (the 30-second version)

MotoPass tracks **50 countries** with residency, citizenship, and Bitcoin
integration data. A daily automated pipeline runs at 06:00 UTC and does three
things:

1. **Researches** — fetches live data from Wikipedia, BTC Map, and CoinGecko
2. **Detects** — probes official government URLs for rule-page changes
3. **Anchors** — re-stamps changed programs to Bitcoin via the Satohash API

Every data change is recorded in an **audit trail** with a Bitcoin-anchored
hash. The pipeline never invents facts — it only applies changes it can
substantiate from a source.

**Ask Paige:** *"How does MotoPass keep its data fresh?"*
> MotoPass runs a daily research pipeline that fetches live data from Wikipedia,
> BTC Map, and CoinGecko for all 50 countries. When something changes, the new
> data is verified and anchored to Bitcoin via Satohash. You can check any
> program's freshness badge on /programs or verify proofs at /vault.

---

## 2. The 8-step pipeline (daily at 06:00 UTC)

The pipeline runs in `.github/workflows/daily-intel.yml` and executes these
steps in order:

| Step | Script | npm command | What it does |
|------|--------|-------------|--------------|
| 1 | `migrate-schema-v3.mjs` | `intel:migrate` | Seeds missing v3 blocks (idempotent, preserves edits) |
| 2 | `update-freshness.mjs` | `intel:freshness` | Recomputes freshness status from `last_checked` dates |
| 3 | `intel-fetch.mjs` | `intel:fetch` | **Auto-research:** fetches Wikipedia + BTC Map + CoinGecko, diffs against corpus, applies verified changes |
| 4 | `probe-sources.mjs` | `intel:probe` | Probes official government URLs, hashes content, flags changes |
| 5 | `stamp-changed.mjs` | `intel:stamp` | Re-anchors changed programs via Satohash API |
| 6 | `write-intel.mjs` | `intel:write` | Regenerates `intel.json` runtime manifest |
| 7 | `check-intel.mjs` | `intel:check` | CI gate: validates shape, 50/50 coverage, stamps intact |
| 8 | auto-commit | — | Commits detection + research changes + re-anchors |

Run locally anytime: `npm run intel:run` (or step-by-step).

---

## 3. The auto-research layer (intel:fetch)

This is the **new automated research step** that replaced manual brief-filling.
It fetches real-world data from three sources, diffs against the existing
corpus, and writes verified changes with audit trail.

### Sources

| Source | API | What it provides | Confidence |
|--------|-----|-----------------|------------|
| **Wikipedia** | REST API `/page/summary/` + `/page/html/` | Crypto mentions, tax regime, investment thresholds, processing times, residency pathways | medium–high |
| **BTC Map** | `/v4/places/search/` (lat/lon/radius_km) | Merchant count, Lightning readiness per country | high |
| **CoinGecko** | `/simple/price` | BTC local-currency price for crypto climate signal | high |

### How it works

1. **Fetch** — for each of the 50 countries, fetch all 3 sources (concurrency 5, paced 500ms)
2. **Diff** — compare fetched intel against the existing corpus:
   - Wikipedia: crypto keyword detection, tax signal extraction (no-income > territorial > favorable), investment threshold parsing
   - BTC Map: merchant count → Lightning-ready upgrade, crypto-friendly score boost
   - CoinGecko: BTC price signal (informational)
3. **Validate** — only `medium`+ confidence changes pass the gate; `low` signals collected but not written
4. **Apply** — write verified changes to `countries.json` with audit trail entry
5. **Report** — summary of changes, signals, and skipped items

### Safety rules

- **Only medium+ confidence changes applied** — weak signals collected but never written
- **`last_checked` never touched** — it's a human research date, preserved across all pipeline runs
- **Every change recorded** in `audit_trail` with `source: intel-fetch:<adapter>` + canonical slice hash
- **Never overwrites null/empty** — only upgrades existing values
- **Never downgrades** a researched value based on a weak signal

### Usage

```bash
npm run intel:fetch                          # All 50 countries
npm run intel:fetch -- --top=10              # Stalest 10 only
npm run intel:fetch -- --country="El Salvador"  # Single country
npm run intel:fetch -- --dry-run             # Preview without writing
```

---

## 4. The source watchdog (intel:probe)

This is the **rule-change detector**. It probes each program's official
government URLs (stored in `legal_compliance.official_urls`), hashes the first
16KB of the response body, and compares against the stored baseline.

- **First probe:** records baseline (status `ok`), no change entry
- **Later probe with different hash:** status `changed` + audit entry → flagged for human review
- **Unreachable host:** status `unreachable` (no spam, one entry max)

**Key rule:** detection is auto-committed (facts); rule *rewrites* are always
human-reviewed. The probe tells you *something changed* — a human decides *what
it means*.

---

## 5. The re-anchor loop (intel:stamp)

When research changes cause a program's **canonical slice hash** to drift from
its stored proof hash, the stamp loop re-anchors it:

```
research change → canonical-slice hash drifts
  → scripts/stamp-changed.mjs
  → POST https://api.satohash.io/api/stamp {hash, filename}
  → new content_hash + stamp_id + proof_url recorded
  → audit_trail entry appended (hash-anchored)
  → intel.json proof.in_sync: true
```

**Rate limiting:** paced ~2s between stamps, capped ~15 per run. If the API is
down or rate-limited, remaining re-stamps are deferred to the next daily run —
**incremental self-heal by design**.

**Ask Paige:** *"How does MotoPass self-heal?"*
> If a government changes its rules, the pipeline detects it (URL hash change),
> researches the update, applies verified changes, and re-anchors the proof to
> Bitcoin — all automatically. If the Satohash API is temporarily down, the
> remaining stamps are retried on the next daily run. Nothing is lost.

---

## 6. The canonical slice (what gets proved)

The **canonical slice** (`scripts/lib/canonical-slice.mjs`) defines the exact
set of fields covered by a Bitcoin proof. When any of these fields change, the
hash drifts and triggers a re-stamp.

The slice includes all researched content: `id`, `name`, `last_checked`,
`finance`, `pathways`, `legal_compliance`, `critical_tests`, `compliance_clock`,
and nested fields. It uses a recursive stable stringify (`stableStringify`) for
deterministic key order — so the same data always produces the same hash.

**Why this matters:** a proof covers the *content*, not just the metadata. If
investment thresholds change, the proof hash changes, and the pipeline
re-anchors automatically.

---

## 7. Freshness & badges

Freshness is computed from `last_checked` (the human research date):

| Status | Condition | Meaning |
|--------|-----------|---------|
| **Fresh** | ≤ 14 days since last checked | Recently verified by a human |
| **Watch** | 15–45 days since last checked | Aging — monitor for changes |
| **Stale** | > 45 days since last checked | Needs re-research |

The pipeline never updates `last_checked` — that's a human action. The auto-research
layer (`intel:fetch`) applies verified source updates but preserves the human
research date. Only a human researcher can move `last_checked` forward.

**Badge vocabulary (honest):**
- **Demo** — seed/placeholder proof for testing. NOT verification.
- **Proof on file** — a recorded proof URL exists. Verify before relying.
- **Bitcoin-verified** — hash is anchored on Bitcoin via Satohash/OTS.
- **Re-anchoring** — proof being re-stamped after a data update. Converges on next daily sweep.

---

## 8. The data flow (end to end)

```
research/countries.json (schema v3)
  ├─ freshness     — status fresh(≤14d)/watch(≤45d)/stale(>45d) + days_stale
  ├─ watch         — official URLs + probe state (ok/changed/unreachable)
  ├─ pros / cons   — structured claims, each {text, source, verified_at}
  ├─ scorecard     — 7 metrics (0–10; null = honest "research pending")
  ├─ audit_trail   — every change {date, field, from→to, source, hash}
  └─ satohash_proofs — content_hash, proof_url, stamp_id, block_height
        ↓
public/data/intel.json  — runtime manifest (SPA fetches for badges/tickers)
        ↓
/programs  — freshness badges, pros/cons, scorecard
/vault     — Bitcoin-anchored proof cards with verify links
/verify    — independent verification against Bitcoin
```

---

## 9. Honesty rules (non-negotiable for Paige)

1. **`proof.in_sync`** in `intel.json` tells whether the stored proof hash
   matches the current data. If `false`, say *"proof is re-anchoring on
   Bitcoin — converges on the next daily sweep."* Never claim verified.

2. **Badge vocabulary:** `Demo` / `Proof on file` / `Bitcoin-verified`. Never
   invent a middle category.

3. **Do not fabricate block numbers.** Only cite `bitcoin_block_height` from
   the API or `proof.block` in intel.json.

4. **`last_checked` is a human date.** The pipeline never rewrites it. Daily
   auto-research applies source updates but preserves the human research date.

5. **Detection ≠ rewrite.** A probe flagging `watch.changed` means "something
   changed" — a human decides what it means and updates the corpus.

6. **Confidence matters.** Intel:fetch only applies medium+ confidence changes.
   Low-confidence signals are collected but never written.

7. Every substantive claim must be able to surface its Satohash proof link
   (`https://satohash.io/verify/<hash-or-id>`).

---

## 10. What Paige should say (member-facing scripts)

### "How fresh is this data?"

> MotoPass runs a daily research pipeline that fetches live data from Wikipedia,
> BTC Map, and CoinGecko for all 50 countries. The freshness badge on each
> program tells you when it was last verified by a human. Green means fresh
> (within 14 days), yellow means aging (15–45 days), and red means it needs
> re-research.

### "How do I know this hasn't changed?"

> Every data change is recorded in an audit trail with a Bitcoin-anchored hash.
> You can verify any program's proof at satohash.io/verify/<hash> without
> trusting MotoPass. If the proof is "re-anchoring," the pipeline is
> automatically re-stamping after a data update — it converges on the next daily
> sweep.

### "What if a government changes its rules?"

> The pipeline detects rule-page changes by hashing official government URLs
> daily. When a change is detected, it's flagged for human review. The auto-research
> layer also fetches live data from Wikipedia and BTC Map to catch changes between
> official URL updates. Verified changes are anchored to Bitcoin via Satohash.

### "Can I verify this myself?"

> Yes. Copy the hash or proof URL from any program card, open
> satohash.io/verify/<hash>, and Satohash will show whether the hash is anchored
> on Bitcoin and at which block. You don't need to trust MotoPass.

### "What is the intel pipeline?"

> It's the automated system that keeps MotoPass's 50-country database honest and
> near-real-time. It runs daily: researching from live sources, detecting
> government rule changes, and re-anchoring data to Bitcoin. Every change is
> recorded in an audit trail you can verify.

---

## 11. For developers (technical reference)

### Running locally

```bash
# Full pipeline
npm run intel:run

# Individual steps
npm run intel:migrate
npm run intel:freshness
npm run intel:fetch           # Auto-research (Wikipedia + BTC Map + CoinGecko)
npm run intel:probe           # Official URL watchdog
npm run intel:stamp           # Satohash re-anchor loop
npm run intel:write           # Regenerate intel.json
npm run intel:check           # Validate intel.json

# Options
npm run intel:fetch -- --dry-run
npm run intel:fetch -- --top=10
npm run intel:fetch -- --country="El Salvador"
```

### Environment variables

| Variable | Used by | Default | Notes |
|----------|---------|---------|-------|
| `SATOHASH_API_URL` | stamp, write | `https://api.satohash.io` | Satohash API base URL |
| `SATOHASH_API_KEY` | stamp | — | Optional API key (GitHub secret) |
| `PROBE_TIMEOUT_MS` | probe | `10000` | Timeout for URL probes |
| `PROBE_CONCURRENCY` | probe | `5` | Parallel URL probes |
| `STAMP_DELAY_MS` | stamp | `2000` | Pace between Satohash stamps |
| `MAX_STAMPS_PER_RUN` | stamp | `15` | Cap per daily run |

### Key files

| File | Role |
|------|------|
| `research/countries.json` | The source of truth (schema v3) |
| `public/data/intel.json` | Runtime manifest (SPA reads this) |
| `scripts/intel-fetch.mjs` | Auto-research orchestrator |
| `scripts/lib/intel-sources.mjs` | Wikipedia + BTC Map + CoinGecko adapters |
| `scripts/lib/intel-diff.mjs` | Diff engine (fetched intel vs corpus) |
| `scripts/lib/canonical-slice.mjs` | The exact field set covered by proofs |
| `scripts/probe-sources.mjs` | Official URL watchdog |
| `scripts/stamp-changed.mjs` | Satohash re-anchor loop |
| `.github/workflows/daily-intel.yml` | GitHub Actions workflow (06:00 UTC) |
| `docs/COUNTRY-INTEL.md` | Pipeline documentation |
| `research/paige/intel-pipeline-knowledge.json` | Machine-readable facts for Paige |

### The self-heal loop (diagram)

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY at 06:00 UTC                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. intel:migrate ──→ seed missing v3 blocks                │
│  2. intel:freshness ──→ compute fresh/watch/stale            │
│  3. intel:fetch ──→ Wikipedia + BTC Map + CoinGecko          │
│       │                ↓ diff against corpus                 │
│       │                ↓ apply verified changes              │
│       │                ↓ audit trail entry                   │
│  4. intel:probe ──→ hash official URLs                       │
│       │                ↓ flag content changes                │
│  5. intel:stamp ──→ re-anchor changed programs               │
│       │                ↓ POST /api/stamp (Satohash)          │
│       │                ↓ record stamp_id + block_height      │
│  6. intel:write ──→ regenerate intel.json                    │
│  7. intel:check ──→ validate shape + coverage                │
│  8. auto-commit ──→ commit facts + re-anchors                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │  User visits  │
     │  /programs    │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐     ┌─────────────────┐
     │  SPA fetches  │────▶│  intel.json     │
     │  intel.json   │     │  (freshness,    │
     └──────┬───────┘     │   proof state)  │
            │              └─────────────────┘
            ▼
     ┌──────────────┐     ┌─────────────────┐
     │  Program card │────▶│  Satohash verify │
     │  shows badge  │     │  link            │
     └──────────────┘     └─────────────────┘
```

---

## 12. Cross-references

- `docs/PAIGE-AI.md` — Paige AI specification (role, capabilities, constraints)
- `docs/PAIGE-SATOHASH-GUIDE.md` — Satohash technical guide (API, endpoints, headers)
- `docs/PAIGE-USER-GUIDE.md` — Satohash user guide (member-facing answers)
- `docs/COUNTRY-INTEL.md` — Pipeline documentation (steps, schema, env)
- `research/paige/satohash-knowledge.json` — Machine-readable Satohash facts
- `research/paige/intel-pipeline-knowledge.json` — Machine-readable intel facts
- `docs/SECURITY-TIMESTAMP-NOSTR.md` — Attack vectors + verifier contract

---

**Truth You Can Verify — even when the answer comes from an AI.**

— Paige Intel Pipeline Guide, MotoPass
BUILD 72 · 2026-08-21
