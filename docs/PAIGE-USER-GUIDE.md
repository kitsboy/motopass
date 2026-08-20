# Paige — Satohash User Guide (member-facing answers)

**Purpose:** the plain-language script Paige uses when explaining stamping to
members. Simple, calm, precise. Never legal advice; never overstate.

---

## What is Satohash?

> Satohash.io is the timestamp engine behind MotoPass. Think of it as a
> **Bitcoin birth certificate for information**. When a document or dataset is
> "stamped," a cryptographic fingerprint (hash) of it is committed into a
> Bitcoin transaction. From that moment on, anyone can prove the information
> existed exactly as it was — and that it hasn't been changed since.

## What gets stamped on MotoPass?

- Every material program claim (costs, legal extracts, pathway notes) — see
  the Vault and the `Bitcoin-verified` badges.
- Your application hash when you register interest at Apply.
- Your own documents when you use the Verify tool (files never leave your
  device — only the hash is sent).

## How much does it cost?

> Stamping a hash is lightweight. On the public Satohash API you can stamp
> for free and see the anchor progress. Bitcoin network fees apply to the
> underlying OpenTimestamps transaction — small and batched via calendars,
> which keeps it far cheaper than sending your own transaction.

## How long does it take?

> A stamp is created instantly (`pending`). It becomes `confirmed` once a
> Bitcoin block includes it — typically within the next blocks after the
> OpenTimestamps calendar commits, often under an hour, sometimes longer if
> the calendars are busy. You can poll the status with the proof ID.

## How do I verify a stamp myself?

1. Copy the hash or proof URL from the Vault / proof card.
2. Open `https://satohash.io/verify/<hash-or-id>`.
3. Satohash shows whether the hash is anchored and at which Bitcoin block.
4. That's it — you don't need to trust MotoPass.

## Honest vs demo — reading the badges

- **Demo** — a seed/placeholder proof used for testing. Not verification.
- **Proof on file** — a recorded proof URL exists; verify it before relying.
- **Bitcoin-verified** — the hash is anchored on Bitcoin (via Satohash/OTS).
- **Re-anchoring** — the proof is being re-stamped after a data update;
  converges on the next daily sweep.

## What can I timestamp on Bitcoin?

> Anything you want a tamper-evident record of: a contract, a passport scan's
> hash, a proof-of-funds summary, an application, a will's hash, a creative
> work, a research note. The pattern is always the same: **hash it, stamp it,
> keep the hash, verify later.** The original file stays with you.

## What Satohash is NOT

- Not a storage service — it holds hashes, never your files.
- Not a notary or legal opinion — it's cryptographic timestamp evidence.
- Not "private" — the hash is public by design; never stamp private content
  directly, hash a private copy locally instead and keep the hash private if
  you prefer.

## Where to go in the product

- **Vault** (`/vault`) — audit Satohash proofs, upload `.ots` files, view
  lineage.
- **Verify** (`/verify`) — generate a hash from your own data and stamp it.
- **Apply** (`/apply`) — register interest; your application hash is
  stamp-ready.
- **Intel tab** on any program — freshness, pros/cons, scorecard, and the
  Bitcoin-anchored change ledger.

Cross-references: `docs/PAIGE-SATOHASH-GUIDE.md` (technical),
`research/paige/satohash-knowledge.json` (machine-readable).
