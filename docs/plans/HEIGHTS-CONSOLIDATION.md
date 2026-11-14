# Plan 1c — one source for stamp heights

**Problem (verified):** the block height behind a proof is stored two places that can drift
against each other. `research/proof-status.json` (mirrored to `src/data/proofStatus.json` for the
build) is the Satohash proof *snapshot* — it carries `chain_block_height` / `recorded_block_height`
and an `agrees` agreement flag, and it is what the build reads. Separately,
`scripts/stamp-changed.mjs` writes `proof.block_height` and `p.last_verified_block` **into
`research/countries.json`** (lines 102/134–137/149) after each re-stamp. Two writers, one number.

**Goal:** one source of truth for heights, read at build from the proof snapshot; watchdog
bookkeeping leaves `countries.json`.

## 10-step plan
1. **Snapshot = authority.** Build and all consumers read heights only from
   `src/data/proofStatus.json` (`chain/recorded_block_height`). `countries.json` stops carrying
   `block_height` / `last_verified_block` for proofs.
2. **`stamp-changed.mjs` shrinks.** After a successful POST it keeps writing `content_hash`,
   `proof_url`, `stamp_id`, `stamped_at` and the audit entry, but **removes** the two
   `block_height`/`last_verified_block` writes (and the block-backfill branch at 97–107 — that
   bookkeeping moves to the snapshot).
3. **Watchdog out of `countries.json`.** `freshness` (and probe state) move to a dedicated probe
   state file (`public/trust-state.json` / a new probe-state), so program records hold program data
   only. Keep the ring semantics fix (last_probed advances only on a successful read).
4. **Snapshot refresh owns the height.** The validation job that reads the Satohash API
   (`/api/stamps`) regenerates `proof-status.json` (as it does today); heights propagate from there,
   never from a stamp loop re-write into the corpus.
5. **One writer guard.** `validate-stamps.mjs` (or a new check) FAILS if any `countries.json`
   program still carries `block_height`/`last_verified_block`/`freshness` proof bookkeeping — so the
   drift can never come back.
6. **Consistency gate.** Keep/strengthen `verify-proofs.mjs`: snapshot `chain_block_height` and the
   stamp's `content_hash` must agree (`agrees: true`); a proof with no height may carry none (no
   hardcoded block).
7. **`audit:claims`/slice unchanged.** Height relocation must not change `canonicalSliceHash` input,
   stamp behaviour, or the nightly job's trigger. This is a data-layout change only.
8. **Deploy order.** Land the validator guard first (red if drifted), then the data move, then the
   `stamp-changed.mjs` shrink — each its own PR, CI green, preview verified.
9. **Stop point.** Any change to stamp behaviour or the nightly job: plan in a PR first, review,
   then implement. This PR is that plan only.
10. **Verify.** Two clean nightly runs in a row: heights in `proof-status.json` equal the Satohash
    API, `countries.json` clean of proof-bookkeeping, live build hash = main HEAD.

*Deferred: merged only once Cam's branch-protection / BOT_TOKEN / auto-merge clicks land.*
