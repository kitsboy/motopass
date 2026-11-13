# MotoPass — state at 2026-11-13, end of session

Handoff for the next session. Everything below is what is **live now**, what is
**not done**, and the decisions already made, so nobody re-litigates them.

## Live

`https://motopass.giveabit.io` at `6f678c20`, asset `index-BWu_eDWc-20261113-6f678c2.js`.
Repo `/root/motopass`, remote `kitsboy/motopass`. Branches + PRs only, merge on green.

Landed this session (main history): `54fe0a27` → `1e3f8532` → `9159edac` → `2664aa48`
→ `f2b0e6e4` → `507d5025` → `f7cf738d` → `6f678c20`.

- Cards (Programs): minimum in **USD** with its source page and the checker's read-back
  date, or "no source"; every clock marked `(no source)` where the record has no page;
  "N of M figures with a source" (ratings excluded from the denominator); no green
  freshness pills; "MotoPass rating".
- **Sats are withheld everywhere** until a live BTC price exists
  (`BTC_PRICE_IS_LIVE = false` in `src/data/btcPriceAtCapture.ts`).
- Proof cards: no bare amounts, count is the loud line, neutral "Timestamped record"
  badge, footer says the quote checker's date or "source cited, not re-read".
- Proof intro: two counts — "4 of 138 figures cite a source", "4 of those re-read in
  the last seven days" — plus the paragraph that quoting a page ≠ the figure being right.
- Rings count from the **probe timestamp** (`watch.urls[].last_probed`), never
  `last_checked`. Fixed a `freshnessFromDate` bug that turned ISO timestamps into NaN.
- `scripts/check-quotes.mjs` is the **only** quote checker: renders JS pages, curl
  fallback (short UA, `--http1.1`) for hosts that drop headless Chrome, writes
  `verified_on` dates into `src/data/quoteStatus.json` (outside the hashed slice).
  9 fixture tests in `src/lib/quoteMatch.test.ts` share the matcher in
  `scripts/lib/quote-match.mjs`. Today: 5 quotes checked, 5 pass.
- Legend: "Timestamp = this record has not changed since it was stamped in Bitcoin.
  It does not mean the figures are right." (10 locales)
- Vault-only files archived to `archive/vault-mirror-2026-08/` with a README; **nothing
  deleted**. The two 11 MB videos and three PNGs remain in the vault copy.

## Not done

1. **Dominica card**: third date line ("SOURCE PAGE LAST FETCHED") still renders; the
   routes sentence is still vague ("Primary routes on file: …") — list with sources or remove.
2. **Footer**: 1,671px tall at 390px; "Careers · 7 roles" tile. Folds into stage2 cleanup.
3. **3a** live BTC price (then sats return as secondary).
4. **3f** identical minimums: Portugal/Italy/St Kitts all $250k, Dominica/Barbados,
   Bahamas/Cayman. Route + source per record, or hide.
5. **Days fields**: `residency_day_count_target` stores years×365 for many records and
   contradicts `citizenship_eligibility_years` (Uruguay 1,095 vs 4y; El Salvador 365 vs 5y).
   `PresenceDays` chart now draws only rows with a receipt sentence, so it is hidden.
   Re-research per record is a separate task.
6. **Nightly status workflow** (do NOT build until told): nightly runs the checker, opens a
   PR with `BOT_TOKEN`, guard step fails unless the diff is only `quoteStatus.json`, JSON
   validates, no future dates; auto-merge on green; CODEOWNERS line leaving that file unowned.
7. **Branch protection**: still `404 Branch not protected` — Cam's click.
   **Machine account + `BOT_TOKEN`**: not present.
8. Remaining "traced to an official page" prose in some locales, meta and feeds.
9. Stage2 go-criteria; 2b/2c plan (block-height single source, bookkeeping out of the corpus).

## Decisions that stand

- A missing number is not zero: unknown renders "not on file"; a value without a
  citation reads "no source".
- "Traced" was renamed **"figures with a source"** because the quote gate never required
  the CI check to pass. Restore "traced" only when item 11's gate runs on a runner.
- A date appears only when the checker read the page back. No hand-typed dates.
- Bot jobs publish **branches**, never PRs under `GITHUB_TOKEN` (they go `action_required`
  and never report `build-test`).
- Proof state: 21 records, 138 facts, 4 cite a source, 4 re-read in the last 7 days.

## Traps hit this session (do not repeat)

- Playwright + long user-agent → `ERR_EMPTY_RESPONSE` from cbiu.gov.dm / imagrenada.gd.
  Short UA over curl works.
- Accent-insensitive matching is mandatory: `minimo` vs `mínimo` once made a real
  Argentina decree quote look absent, and the bad number was reported as a data fault.
- `freshnessFromDate` appends `T12:00:00Z`; a full timestamp input silently became NaN.
- React compiler lint: no `Date.now()` during render — read the clock once via `useState`.
- Bundle budget is tight (2,667 KB of 2,700). Importing `research/countries.json` into a
  page breaks CI; use `src/data/claimCoverage.json` / `quoteStatus.json`.
