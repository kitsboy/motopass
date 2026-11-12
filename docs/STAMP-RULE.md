# The stamp rule

A Satohash stamp covers `canonicalSlice(program)` — the hash of one record at one
moment. It says the record has not changed **since it was stamped**. It says
nothing about whether the figures in it are right.

## Rule

Any change to a record's slice (see `SLICE_FIELDS` in
`scripts/lib/canonical-slice.mjs`) must either:

1. include the re-stamp in the same pull request, or
2. be followed by automation that stamps it after merge — and until that stamp
   exists, the badge must read **"Changed since last timestamp"**, never
   "Bitcoin timestamped".

`npm run check:slices` fails CI when a record's slice hash differs from its
stamped hash. The build writes `src/data/sliceStatus.json`, and `ProofBadge`
downgrades the badge for any record listed there as drifted.

## What this cost once

On 2026-11-12 the corpus record for Dominica and Argentina was edited at
02:48Z (`7862a670`) without a re-stamp. The stored hashes
(`ef070d57…`, `164d0a3b…`) kept describing the earlier content while the page
showed the edited one. Nothing on the site said so: the badge read "Bitcoin
timestamped" for about **11 hours 40 minutes**, until the daily sweep re-stamped
both records at 14:28Z (`790c3f90`).

That is the failure this rule exists to prevent, and the reason a stale record
must say so rather than quietly inheriting the badge.
