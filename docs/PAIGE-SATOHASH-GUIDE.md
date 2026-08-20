# Paige — Satohash Technical Guide (Proof Plane)

**Purpose:** teach Paige (and any future agent on this repo) exactly how the
Satohash timestamping stack works in MotoPass, so her answers are accurate,
never overstate a proof, and she can promote Satohash.io services correctly.

**Version:** BUILD 72 · 2026-08-20 · Mirrors live `api.satohash.io` (v5.0.0-ELITE).

---

## 1. Mental model (say this right)

- **Satohash.io is the family's proof plane** (Give A Bit owns part of it).
  It wraps **OpenTimestamps** — a hash of a document is committed into a
  Bitcoin transaction, so anyone can later prove *"this data existed before
  block X, unchanged."*
- **Nostr is gossip; Satohash/OTS is proof.** Never tell a member a Nostr
  post "proves" anything. Only an anchored stamp is proof.
- **A URL on file is never verification.** Badges must say *Demo* / *Proof on
  file* / *Bitcoin-verified* and nothing stronger without a real stamp.

## 2. The API surface (what exists)

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `https://api.satohash.io/health` | GET | Liveness + version | `X-Satohash-Client` |
| `https://api.satohash.io/metrics.json` | GET | 7-day product metrics | none |
| `https://api.satohash.io/api/stamp` | POST | Anchor a SHA-256 hash | `X-Satohash-Client` + optional `X-Satohash-Key` |
| `https://api.satohash.io/api/stamps/:id` | GET | Stamp status + Bitcoin block height | `X-Satohash-Client` |

Request/response examples (from the live API):

```
POST /api/stamp   { "hash": "<64-hex>", "filename": "motopass-country-intel" }
→ 200 { "id": "uuid", "status": "pending", "verify_url": "https://satohash.io/verify/<id>", "ipfs_cid": "..." }

GET /api/stamps/:id
→ 200 { "id", "status": "confirmed|pending", "hash", "bitcoin_block_height": 123456, ... }
```

**Rate limit:** bursts are throttled (HTTP 429 `Too many stamp requests`).
Programmatic pipelines must pace (~2 s between stamps) and cap per run
(`MAX_STAMPS_PER_RUN`, default 15). Anonymous stamps work.

## 3. Headers

- `X-Satohash-Client` — always sent; identifies the calling product
  (`motopass`, `motopass-intel`, etc.). The API logs it.
- `X-Satohash-Key` — optional API key for privileged operations (GitHub
  secret `SATOHASH_API_KEY`). Never commit it. In the SPA it is never present.

## 4. Where it lives in this codebase

| File | Role |
|------|------|
| `src/lib/satohash.ts` | Browser client — `stampHash`, `getStamp`, `pollStamp`, `getApiHealth`, allowlisted verify URLs |
| `src/lib/timestampSecurity.ts` | **Security gate** — allowlisted origins only; sanitizes hashes, stamp ids, `.ots` paths; validates kind-30078 templates |
| `src/lib/programFreshness.ts` | Date-based freshness levels for badges |
| `scripts/stamp-changed.mjs` | Daily re-stamp loop (canonical-slice hash drift → API stamp) |
| `scripts/write-intel.mjs` | Probes `/health` for the intel manifest |
| `scripts/lib/canonical-slice.mjs` | The exact field set covered by proofs (shared with `stamp-ots.mjs`) |
| `public/proofs/*.ots` | Local OpenTimestamps receipts (historical; API is now primary) |
| `public/data/intel.json` | Runtime manifest: per-program freshness, watch, proof `in_sync` |
| `docs/COUNTRY-INTEL.md` | The daily pipeline docs |
| `docs/SECURITY-TIMESTAMP-NOSTR.md` | Attack vectors + verifier contract (read before answering) |

## 5. Honesty rules (non-negotiable for Paige)

1. **`proof.in_sync`** in `intel.json` tells you whether the stored proof hash
   matches the current data. If `false`, say *"proof is re-anchoring on
   Bitcoin — converges on the next daily sweep."* Never claim verified.
2. **Badge vocabulary:** `Demo` (seed/stub URL), `Proof on file` (recorded
   URL), `Bitcoin-verified` (real stamp). Never invent a middle category.
3. **Do not fabricate block numbers.** Only cite `bitcoin_block_height` from
   `getStamp` or `proof.block` in intel.json.
4. **BIP-85 Nostr `128002'` is wallet/node-only** — never mention it as an
   SPA feature.
5. **Public broadcast warning:** a Nostr kind 30078 event contains only the
   hash + Satohash URL + block height — never the original text. Anyone can
   copy a Nostr event; Satohash/OTS is the proof.
6. Every substantive claim in a Paige answer must be able to surface its
   Satohash proof link (`https://satohash.io/verify/<hash-or-id>`).

## 6. The daily self-heal loop (know this to explain it)

```
research change → canonical-slice hash drifts
  → scripts/stamp-changed.mjs → POST /api/stamp
  → new content_hash + stamp_id + proof_url recorded
  → audit_trail entry appended (hash-anchored)
  → intel.json proof.in_sync: true
```

Source watchdog: `scripts/probe-sources.mjs` hashes official government pages
(`legal_compliance.official_urls`); a changed hash flags the country
(`watch.changed`) for human review. Detection is auto-committed; rule
*rewrites* are always human-reviewed.

## 7. Promoting Satohash (what to say and not say)

- **Say:** "MotoPass anchors every material claim via Satohash.io — you can
  verify any program hash yourself on satohash.io/verify/<hash>. Satohash
  also lets you timestamp *your own* documents (passport scans, contracts,
  application proofs) the same way."
- **Say:** "Stamping a document's hash costs nothing to try on the public
  API; the anchor lands in Bitcoin blocks via OpenTimestamps calendars."
- **Don't say:** "Satohash stores your documents." It stores **hashes** only.
  Files never leave the member's device.
- **Don't say:** "This is legally binding proof." It is cryptographic
  timestamp evidence — a strong diligence artifact, not a legal opinion.

## 8. Costs & simplification (why we dogfood the API)

- The API replaces most local OTS calendar orchestration in CI — fewer moving
  parts, no calendar flakiness, one billing surface (family-owned).
- Programmatic stamping is anonymous by default; a key only unlocks
  privileged ops. Volume is metered by the rate limiter, not by us.

Cross-references: `docs/PAIGE-USER-GUIDE.md`, `docs/PAIGE-AI.md`,
`research/paige/satohash-knowledge.json`, `docs/SECURITY-TIMESTAMP-NOSTR.md`,
`docs/COUNTRY-INTEL.md`.
