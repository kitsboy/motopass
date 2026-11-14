# MotoPass — what the gates are for

Every gate guards `main` from one specific lie. One page per gate: what it
protects, what a red result means, and how to fix it. These run in CI
(`ci.yml`, job `build-test`) on every push/PR to `main`. A red `build-test`
means **the deploy is refused** until it is green; fix the root, never the gate.

> Golden rule that gates exist to enforce: **a missing/unsourced number is not
> zero.** It renders "not on file"; a figure without a citation reads "no
> source". A date appears only when the checker read the page back.

---

## check:proofs — no hardcoded proof height

**Script:** `scripts/check-proof-fields.mjs` · CI `npm run check:proofs`

- **Protects:** that every block height in `research/countries.json` equals the
  chain value in `src/data/proofStatus.json` (regenerated from Satohash's API),
  and that a proof that does not resolve carries no height.
- **Red means:** someone typed a number into the corpus, or the status file is
  stale — the card would show a height that does not match the chain.
- **Fix:** regenerate stamps — `node scripts/verify-proofs.mjs` — then re-run.

## check:slices — the stamp still describes the record

**Script:** `scripts/check-slice-hashes.mjs` · CI `npm run check:slices`

- **Protects:** that each record's stamped slice hash (`canonicalSlice(program)`)
  still matches its content. The proof covers the record *as it was*.
- **Red means:** the record was edited after stamping without being re-stamped.
  The badge would claim "timestamped record" over changed content.
- **Fix:** `npm run check:slices -- --write` emits the drifted map the UI reads
  (so the badge correctly shows "changed since last timestamp"), or re-stamp the
  record so the hash is current again.

## check:routes — three route lists can never drift

**Script:** `scripts/check-routes.mjs` · CI `npm run check:routes`

- **Protects:** that the router (`src/App.tsx`), the Pages middleware allowlist
  (`functions/_middleware.js ROUTE_PATHS`), and the sitemap all agree. A page in
  the router but missing from the middleware 404s for anyone arriving from a
  link — that is how `/proof` was once dead.
- **Red means:** a route was added/removed in one list and not the others.
- **Fix:** add/remove the route in all three. `--live <host>` also fetches every
  sitemap route expecting a 200 and a 404 for a junk path.

## check:quotes — every claim is still sayable by its own source

**Script:** `scripts/check-quotes.mjs` · CI `node scripts/check-quotes.mjs`

- **Protects:** that the quoted words for each `claim_sources` entry still
  appear on the live source page (rendered in a real browser; short-UA curl
  fallback for hosts that drop headless Chrome). Writes `verified_on` dates into
  `src/data/quoteStatus.json` (outside the hashed slice). **This is the only
  quote checker** — its matcher lives in `scripts/lib/quote-match.mjs`, shared
  with 9 fixture tests so script and tests cannot drift.
- **Red means:** a quote drifted off its page. That is worse than no source — it
  looks like evidence.
- **Fix:** re-verify against the page; if the source changed, update the quote or
  mark the figure "no source". `--fix-miss` prints only misses without failing.

## audit:claims — unsourced figures never enter the maths

**Script:** `scripts/audit-claims.py` · ad-hoc + gate with `--fail-under N`

- **Protects:** that only TRACED figures (a record with a `claim_sources`
  entry — URL + quote + fetched date) may enter averages, comparisons, the
  simulator's maths, or a hero card. Anything else is UNSOURCED.
- **Red means:** a record has no `claim_sources`, or traced coverage is below the
  threshold — an unsourced number could be feeding a total/sort/marker.
- **Fix:** add a real `claim_sources` entry (source URL, exact quote, fetched
  date) or exclude the figure from aggregation. Counts are printed and written to
  `research/claim-audit.json` + `.md`.

## copy scan — no verification overclaim, no unrendered placeholder

**Script:** `scripts/scan-copy.mjs`

- **Protects:** every route × every locale (en/de/es/fr/it/ja/pt/sw/ar) against:
  (1) unrendered placeholders like `{count}` that reached the screen, and
  (2) banned verification phrases ("Truth You Can Verify", "Bitcoin-verified",
  "guarantee"/"guaranteed", "Bitcoin-anchored", etc.) plus an accounting list of
  single words (`verify`, `verified`, `traces`, `anchored`) so every use is
  justified.
- **Red means:** a banned claim is live in some locale, or a `{placeholder}` is
  showing raw — the site is overstating or broken. **Note:** build only runs the
  placeholder + banned sweep on the merged branch; the extended list is the
  stage2 + nightly go-criteria.
- **Fix:** reword the copy (a word like "verify proof" on a real button is fine
  and must be justified, not deleted) or fix the component to use `formatT()`
  instead of `t()`.

## Other gates in the same CI job (for completeness)

| Check | Protects | Red means / fix |
|---|---|---|
| `validate:data` / `validate:stamps` | corpus schema + per-program shape | data file malformed; fix `research/countries.json` |
| `check:security` (`check-secret-hygiene.mjs`) | no secrets / die-on-this tokens in repo | hardcoded key; remove it and rotate if it ever leaked |
| `pitch:check` | published pitch figures match `research/countries.json` | figures drifted; re-`sync-pitch-anchor` |
| `trust:check` | trust-envelopes self-consistency | envelope broken; regenerate |
| `tools:check` | 14 tool cards still render | a tool card regressed |
| `check:build-salt` / `check:bundle-size` | the `?v=` salt is current, bundle ≤ 2,700 KB | stale build or bundle over budget after an import |
| `lint` / `test` / `test:e2e` | compiler diagnostics, 633 unit tests, E2E | fix the failing test/diagnostic |
| `prettier:check` + `a11y:check` | — (warn-only now) | repo-wide reformat / a11y budget deliberately deferred, not blocking |

## How to run with real output

```bash
npm run check:proofs      # proofs vs chain
npm run check:slices      # stamped hash vs content
npm run check:routes      # router ↔ middleware ↔ sitemap
npm run check:quotes      # quotes still on their pages (needs Playwright)
python3 scripts/audit-claims.py --fail-under 90   # traced coverage gate
node scripts/scan-copy.mjs https://motopass.giveabit.io   # copy sweep vs live
npm run check:security     # secret hygiene
```

> Note: `check:security` verifies no secret is *in the repo tree*. It cannot see
> a secret that was force-pushed/rewritten out of history — those live in the
> object store. Run a real scanner (`gitleaks`/`trufflehog`, not grep) over a
> shallow clone's full history when you accept third-party or vault material.
