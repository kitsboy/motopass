# Country Intel — daily self-healing pipeline (schema v3)

MotoPass keeps 50 jurisdictions honest and near-real-time. The pipeline detects
rule-page changes daily, records every data change in a Bitcoin-anchored audit
trail, and re-stamps changed programs via the Satohash API.

**Do not regress:** detection is auto-committed (facts); rule *rewrites* are
always human-reviewed (us / Kimi / Paige). `last_checked` is a human research
date — the pipeline never rewrites it, so daily sweeps never trigger re-stamps.

---

## Data flow

```
research/countries.json (schema v3)
  ├─ freshness     — status fresh(≤14d)/watch(≤45d)/stale(>45d) + days_stale
  ├─ watch         — official URLs (legal_compliance.official_urls) + probe state
  ├─ pros / cons   — structured claims, each {text, source, verified_at}
  ├─ scorecard     — 7 metrics (0–10; null = honest “research pending”)
  └─ audit_trail   — every change {date, field, from→to, source, hash}
        ↓
public/data/intel.json  — runtime manifest (SPA fetches for badges/tickers)
```## Daily run (`.github/workflows/daily-intel.yml`, 06:00 UTC)

| Step | Script | What it does |
|------|--------|--------------|
| 1 | `intel:migrate` | Seeds missing v3 blocks (idempotent, preserves edits) |
| 2 | `intel:freshness` | Recomputes freshness status from `last_checked` |
| 3 | `intel:fetch` | Auto-research: Wikipedia + BTC Map + CoinGecko → diff → apply verified changes |
| 4 | `intel:probe` | Probes `watch.urls`, hashes first 16 KB, flags changes |
| 5 | `intel:stamp` | Re-anchors changed programs via `POST /api/stamp` |
| 6 | `intel:write` | Regenerates `intel.json` + Satohash API health |
| 7 | `intel:check` + validate gates | Shape + 50/50 coverage + stamps intact |
| 8 | auto-commit | Commits detection + re-anchors + research changes (facts only) |

Run manually anytime: `npm run intel:run` (or step-wise `intel:migrate`, `intel:freshness`, `intel:fetch`, `intel:probe`, `intel:stamp`, `intel:write`, `intel:check`).

### intel:fetch — automated research layer

Fetches real-world data from three sources for every stale country, diffs against the corpus, and writes verified changes with audit trail:

| Source | What it provides | Confidence | |
|--------|-----------------|------------|---|
| Wikipedia REST API | Crypto mentions, tax regime, investment thresholds, processing times | medium–high | |
| BTC Map `/v4/places/search/` | Merchant count, Lightning readiness | high | |
| CoinGecko `/simple/price` | BTC local-currency price (crypto climate signal) | high | |

**Safety rules:** only medium+ confidence changes are applied; `last_checked` is never updated (human research date); every change is recorded in `audit_trail` with `source: intel-fetch:<adapter>` + canonical slice hash.

**Usage:** `npm run intel:fetch` (all 50) · `npm run intel:fetch -- --top=10` (stalest 10) · `npm run intel:fetch -- --country="El Salvador"` (single)

**Options:** `--dry-run` (preview without writing) · `--top=N` (limit to N stalest countries) · `--country=NAME` (single country)

## The self-heal loop (Satohash API)

`scripts/stamp-changed.mjs` compares each program's **canonical slice hash**
(`scripts/lib/canonical-slice.mjs` — the exact field set covered by proofs,
shared with `stamp-ots.mjs`) to its stored `content_hash`. On drift:

1. `POST https://api.satohash.io/api/stamp` `{hash, filename}` with
   `X-Satohash-Client: motopass-intel` (+ optional `X-Satohash-Key` secret).
2. Proof record updated: `content_hash`, `proof_url` (`/verify/<hash>`),
   `stamped_at`, `stamp_id`, `block_height` (synced to `last_verified_block`).
3. `audit_trail` entry appended with the new hash — the change is on-chain.

API down or rate-limited? Non-fatal — partial updates commit, remaining
re-stamps retry next run (paced 2 s, capped 15/run — the Satohash API throttles
bursts, so drift converges incrementally over days). `proof.in_sync` in
`intel.json` reports the honest per-program state until healed.

## Source watchdog (rule-change detection)

`scripts/probe-sources.mjs` probes each `watch.url` (concurrency 5, 10 s timeout,
16 KB hash window). First probe records a baseline. A later differing hash →
`status: 'changed'` + an audit entry (`source: source-probe`) — a **detection
fact**. Humans then review and update the corpus; the next re-stamp anchors it.

## Proof coverage fix (2026-08-20)

The original `canonicalSlice` used `JSON.stringify(slice, Object.keys(slice).sort())`.
An array replacer applies at **every** nesting level, so all nested objects
(`finance`, `pathways`, `legal_compliance`, `critical_tests`, `compliance_clock`)
serialized as empty `{}` — proofs covered only `id`/`name`/`last_checked`.
Replaced with a recursive stable stringify (`stableStringify`) that covers all
nested researched content with deterministic key order (regression test in
`scripts/intel-core.test.ts`). All 50 programs were re-anchored with the
corrected hashes (48/50 in-session; the remainder converge via the daily run).
The old `.ots` files in `public/proofs` predate the fix and cover the old slice
format — the API-issued `stamp_id` is now the authoritative anchor.

## Honesty rules

- Every seeded pro/cons/scorecard claim is derived from vetted corpus fields
  (`paige_fields`, `critical_tests`, `finance`, `risk_level`) and tagged with
  `source: MotoPass corpus (BUILD 72 research)` + `verified_at: last_checked`.
- Scorecard `mobility`/`banking` are `null` until real research lands (honest
  nulls, same pattern as uncertain-law fields).
- `validate-data.mjs` requires v3 blocks; staleness is a hard warning, not a
  deploy blocker — the pipeline exists to heal it.

## Env

| Var | Used by | Notes |
|-----|---------|-------|
| `SATOHASH_API_URL` | stamp/write | default `https://api.satohash.io` |
| `SATOHASH_API_KEY` | stamp | optional, sent as `X-Satohash-Key` (GitHub secret) |
| `PROBE_TIMEOUT_MS` | probe | default 10000 |
| `PROBE_CONCURRENCY` | probe | default 5 |
| `STAMP_DELAY_MS` | stamp | default 2000 (rate-limit pacing) |
| `MAX_STAMPS_PER_RUN` | stamp | default 15 (incremental self-heal) |
