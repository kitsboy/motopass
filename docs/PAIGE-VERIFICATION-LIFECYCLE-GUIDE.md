# Paige Guide: Verification Layer & Proof Lifecycle

> **For Paige AI** — reference this when members ask about verification, proofs, stamps, hashes, or how to confirm data integrity.
> **7th knowledge topic** — auto-discovered by `import.meta.glob` (hot-loadable, zero code changes).

---

## 30-Second Version

The verification layer proves that data existed unchanged at a point in time — without requiring trust in MotoPass. A SHA-256 fingerprint of the data is anchored into a Bitcoin transaction via Satohash (the family timestamp engine wrapping OpenTimestamps). Once confirmed, that anchor is immutably recorded on the Bitcoin blockchain. Anyone can verify it independently on satohash.io — no account needed.

---

## How Verification Works

### The Core Principle

```
  User data (text, file, application)
       ↓
  SHA-256 hash (local — data never leaves device)
       ↓
  Submit hash to Satohash API (POST /api/stamp)
       ↓
  Satohash anchors hash via OpenTimestamps calendars
       ↓
  Bitcoin block includes the OTS anchor
       ↓
  Block height = proof of existence
       ↓
  Anyone can verify: satohash.io/verify/<hash>
```

### The Hash Is Everything

The SHA-256 hash is the honest anchor. It:
- Is generated locally on the user's device (crypto.subtle.digest)
- Is the only thing sent to the Satohash API
- Is permanently recorded on Bitcoin once anchored
- Can be independently verified by anyone at any time

**What is NOT sent to the API:** the original file, the user's identity, the document name.

---

## Verification Modes

MotoPass supports four verification modes (the `mode` field in `VerifyResult`):

| Mode | What it means | Can it prove Bitcoin anchoring? |
|------|--------------|-------------------------------|
| `opentimestamps` | Full OTS verification (requires server or Node CLI) | ✅ Yes |
| `structural` | Browser-side structural check of .ots binary content | ❌ No — structural only |
| `hash-only` | Valid 64-hex SHA-256, not yet stamped or confirmed | ❌ No — format valid only |
| `failed` | Invalid input, parse error, or API rejection | ❌ No |

**Key distinction:** The browser can only do structural verification of .ots files. Full OpenTimestamps verification requires either the Satohash server or the `opentimestamps` Node.js CLI. This is an honest limitation — the browser cannot cryptographically verify the OTS merkle tree without Node.js.

---

## The Verify Page (`/verify`)

The Verify page is the main interface for hash-based verification. It supports:

### 1. Generate + Stamp Flow

1. Enter text (or paste from clipboard)
2. Click **Generate Hash** — creates a SHA-256 of the canonical JSON payload
3. Hash is displayed and copied to hash history
4. Click **Stamp via Satohash** — submits to POST /api/stamp
5. Polls GET /api/stamps/:id for Bitcoin anchor (4 attempts, 1.2s interval)
6. On confirmation: shows block height and confirmed_at
7. Optionally: **Announce on Nostr** — signs and publishes a kind 30078 event

### 2. OTS Paste / File Upload

1. Paste hex dump or base64 content from an .ots file
2. Or upload a .ots file directly
3. Browser parses the binary content (structural check)
4. Pairs with an expected SHA-256 hash (optional)
5. Reports structural validity — full verify requires Satohash server

### 3. Batch Verification

1. Paste multiple SHA-256 hashes (one per line)
2. Each hash is validated (64-hex format)
3. API health is checked once
4. Each hash gets a verify link to satohash.io/verify/<hash>
5. Results can be downloaded as JSON or all hashes copied
6. Progress bar shows batch completion

### 4. Hash History

- Last 5 verified hashes stored in localStorage
- Click **Re-verify** to check any previous hash
- Click **Satohash** to open the verify link directly

---

## Stamp Lifecycle

### The Three Honest Statuses

```
  ┌──────────┐     Satohash API      ┌──────────┐     Bitcoin Block     ┌──────────┐
  │  PENDING │ ──── POST /stamp ────→ │ (waiting)│ ──── confirmed ────→ │ CONFIRMED│
  └──────────┘                        └──────────┘                      └──────────┘
       │                                   │                                  │
       │              API failure          │           timeout                │
       └──────────→ ┌──────────┐ ←─────────┘                  ←──────────────┘
                    │  ERROR   │ (retry available)
                    └──────────┘
```

| Status | Meaning | What the UI shows |
|--------|---------|-------------------|
| `pending` | Submitted to Satohash API, awaiting Bitcoin block | 🟡 "Stamping..." / "Awaiting anchor" |
| `confirmed` | Bitcoin block height received — anchor is on-chain | 🟢 "Proof on file · Block #N" |
| `error` | API failure, polling timeout, or rejected | 🟠 "Stamp error — retry" |

### Terminal API Statuses

The Satohash API returns status strings. Terminal ones (no more polling needed):

- `confirmed`, `anchored`, `complete`, `completed` → **confirmed**
- `failed`, `error`, `rejected` → **error**
- Anything else → **pending** (keep polling)

### Re-stamping

When program data changes (daily intel pipeline), proofs are re-stamped:
- The old proof stays in `audit_trail` with its hash and source
- A new hash is computed from the updated canonical slice
- The new hash is submitted to Satohash API
- `proof.in_sync` in `intel.json` reflects current anchor state
- Pacing: 2-second delay, max 15 stamps per run (API rate limits)

---

## Document Stamping (Vault)

The Vault provides file-level stamping with a shared registry across the app.

### Workflow

```
  User selects file in Vault Document Stamper
       ↓
  File hashed locally (crypto.subtle.digest('SHA-256'))
       ↓
  Hash submitted to Satohash API (POST /api/stamp)
       ↓
  Stamp polled for Bitcoin anchor (3 attempts, 2s interval)
       ↓
  Registry entry created/updated in localStorage
       ↓
  Entry visible across Profile, Vault, and Dashboard
```

### What's Stored (and What's Not)

| Stored in localStorage | Never stored |
|----------------------|-------------|
| File name (display only) | File content |
| File size | File bytes |
| File type (MIME) | User identity |
| SHA-256 hash | |
| Satohash stamp ID | |
| Status (pending/confirmed/error) | |
| Block height | |
| Created/updated timestamps | |

### Registry Entry Fields

```typescript
{
  id: string              // Local registry ID (not the Satohash stamp ID)
  name: string            // Display name (never hashed on-chain)
  size: number            // File size in bytes
  type: string            // MIME type
  hash: string            // SHA-256 of file bytes (the on-chain anchor)
  stampId?: string        // Satohash API stamp ID (uuid)
  status: 'pending' | 'confirmed' | 'error'
  blockHeight?: number    // Bitcoin block height when confirmed
  createdAt: string       // ISO timestamp
  updatedAt: string       // ISO timestamp
  note?: string           // Error message or status note
}
```

### Registry Operations

| Operation | Function | What it does |
|-----------|----------|-------------|
| Load | `loadStampedDocuments()` | Read from localStorage |
| Save | `saveStampedDocuments()` | Write to localStorage |
| Add/Update | `upsertStampedDocument()` | Prepend new or update existing by ID |
| Delete | `deleteStampedDocument()` | Remove by ID |
| Re-check | `refreshStampStatus()` | Re-query Satohash API for current anchor |
| Re-stamp | `restampHash()` | Re-submit existing hash (no file needed) |
| Export | `downloadDocumentRegistry()` | JSON backup with verify URLs |
| Import | `parseDocumentRegistryBackup()` | Validate schema, merge into registry |

### Shared Registry

The document registry is shared across three pages:
- **Vault** (`/vault`) — stamp new documents, view list, export/import
- **Dashboard** (`/dashboard`) — registry card with stamp/re-check quick action
- **Profile** (`/profile`) — application status derived from registry

All three read/write the same localStorage key: `motopass-vault-documents`.

---

## Export & Import

### Export (Backup)

The export creates a JSON file (`motopass-document-registry/v1`) containing:
- Schema version and build info
- Export timestamp
- Per-document: id, name, size, type, hash, stamp_id, status, block_height, timestamps, **verify_url**

The verify URL is allowlisted and points to `satohash.io/verify/<hash>` — so the backup can be audited against Bitcoin without MotoPass.

### Import (Restore)

1. Parse the JSON
2. Validate schema (`motopass-document-registry/v1`)
3. For each document: validate hash is 64-hex, preserve status as the backup's claim
4. Merge into current registry: same-ID entries keep the newer `updatedAt`
5. Sort newest-first
6. Offer re-check to confirm anchors against the API (honest confirmation)

---

## Nostr Attestation

### What It Is

An optional, fire-and-forget announcement that a hash was stamped. Published as a kind 30078 replaceable event on Nostr relays.

### What It Is NOT

- It is NOT proof — the Bitcoin anchor is the proof
- It is NOT required for verification — satohash.io works independently
- It is NOT persistent — relays may discard old events

### The Flow

```
  buildTimestampAttestationEvent({ hash, satohashUrl, stampId, blockHeight, status })
       ↓
  validateTimestampTemplate() — all tags must be allowlisted
       ↓
  NIP-07 extension signs the event (window.nostr.signEvent)
       ↓
  signedEventMatchesTemplate() — signer cannot swap kind/tags/content
       ↓
  getEventHash() + verifyEvent() — validate NIP-01 hash + Schnorr signature
       ↓
  publishEvent() — send to configured relays
       ↓
  Result: { published, eventId, relaySummary, recovery }
```

### Recovery Statuses

| Status | Meaning |
|--------|---------|
| `published` | Signed and accepted by at least one relay |
| `signed-unpublished` | Signed locally but no relay accepted — keep the JSON |
| `stub` | No NIP-07 extension — unsigned copyable JSON |
| `rejected` | Template validation failed or signer returned different event |

### Security Guards

- **Allowlisted origins:** Only satohash.io, api.satohash.io, satohash.giveabit.io URLs are allowed in tags
- **Signed event matching:** The NIP-07 signer cannot mutate kind, tags, or content
- **Hash validation:** Only 64-hex SHA-256 hashes are accepted
- **Stamp ID sanitization:** Only `[a-zA-Z0-9._-]{1,128}` is allowed
- **Block height bounds:** Must be a non-negative integer under 20,000,000

---

## Page Verification

The `/verify` page supports deploy-integrity verification via URL params:

```
/verify?path=/programs&build=2026.08.21-80
```

This pre-fills the hash input with a canonical JSON payload:
```json
{
  "page": "/programs",
  "build": "2026.08.21-80",
  "platform": "MotoPass"
}
```

The payload is SHA-256 hashed, creating a fingerprint of the specific page + build. Anyone can verify that this exact build was served at this path.

---

## The Intel Manifest & Proof Freshness

### What `proof.in_sync` Reports

The intel manifest in `intel.json` contains per-program proof status:
- `proof.in_sync` = `true` — the program's hash matches its current canonical slice
- `proof.in_sync` = `false` — data has changed since the last stamp (re-anchoring in progress)

### Canonical Slice

The canonical slice is `JSON.stringify(program, Object.keys(program).sort())` — deterministic, sorted-key JSON. This is what gets hashed for the Bitcoin anchor.

### Re-Anchor Loop

```
  Daily intel pipeline detects data change
       ↓
  New canonical slice computed
       ↓
  SHA-256 of new slice computed
       ↓
  Hash submitted to Satohash API (paced: 2s, max 15/run)
       ↓
  Old proof preserved in audit_trail
       ↓
  proof.in_sync updated to true
```

---

## Honesty Rules

These are non-negotiable. Paige must follow them without exception.

1. **A hash alone is not proof** — it must be anchored on Bitcoin via Satohash/OTS.
2. **A .ots file uploaded to the browser is structurally checked only** — full verification requires the Satohash server or opentimestamps CLI.
3. **A Nostr post is an attestation, not proof** — the Bitcoin anchor is the proof.
4. **Demo proofs are placeholders** for testing — never present them as verified.
5. **The file never leaves the device** — only the SHA-256 hash is submitted to the API.
6. **Statuses are honest** — pending means not yet confirmed; error means something failed.
7. **Re-stamping after data change is expected** — the old proof is not invalidated, a new one is created.
8. **A stamp is cryptographic timestamp evidence**, not a legal document or binding proof.

---

## Member-Facing Scripts

Use these when members ask common questions:

### "What is verification?"

> Verification means checking that a SHA-256 hash matches its Bitcoin anchor on Satohash — proving the data existed unchanged since the stamp was created.

### "How do I stamp something?"

> Go to /verify, paste or type your data, click Generate Hash, then click Stamp via Satohash. The API anchors your hash into Bitcoin via OpenTimestamps.

### "What does 'pending' mean?"

> Pending means the hash has been submitted to the Satohash API but a Bitcoin block has not yet included the anchor. It usually confirms within the hour.

### "What does 'confirmed' mean?"

> Confirmed means a Bitcoin block height has been recorded — your hash is immutably anchored on the Bitcoin blockchain.

### "Can I verify without internet?"

> You can paste a hash and check format, or upload a .ots file for structural validation. But full proof verification requires the Satohash API to be online.

### "What is OpenTimestamps?"

> OpenTimestamps (OTS) is a protocol that batch-commits data hashes into Bitcoin transactions via calendar servers — Satohash wraps this into a simple API.

### "Is it legally binding?"

> A Satohash proof is cryptographic timestamp evidence proving data existed at a point in time. It is not a legal document — consult legal counsel for binding agreements.

### "How do I re-verify an old hash?"

> Your recent hashes are saved in the Hash History section on /verify. Click Re-verify to check any previous hash again, or visit satohash.io/verify/<hash> directly.

---

## Developer Reference

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/satohash.ts` | Satohash API client — hash, stamp, poll, health, URL builders |
| `src/lib/documentStamp.ts` | Vault document-stamping registry — stamp, restamp, refresh, derive status |
| `src/lib/verifyOtsPaste.ts` | Browser-side OTS paste parsing and structural verification |
| `src/lib/verifyHashHistory.ts` | localStorage-backed hash history (max 5 entries) |
| `src/lib/pageVerify.ts` | Page verification payload builder |
| `src/lib/timestampSecurity.ts` | Input guards — normalizeSha256, sanitizeStampId, allowlisted URLs |
| `src/lib/nostrEvents.ts` | Nostr event builders — timestamp attestation, program proof |
| `src/lib/nostrTimestamp.ts` | NIP-07 sign + publish with signedEventMatchesTemplate guard |
| `src/lib/documentRegistryExport.ts` | Registry export/import — bundle, parse, merge |
| `src/lib/seal/vaultVerify.ts` | Batch hash verify + OTS file upload helpers |
| `src/types/proof.ts` | VerifyResult type definition |
| `src/pages/VerifyPage.tsx` | Verify page UI |

### Storage Keys

| Key | Storage | Contents |
|-----|---------|---------|
| `motopass-verify-hash-history` | localStorage | Last 5 verified hashes with timestamps |
| `motopass-vault-documents` | localStorage | Shared document registry (Profile/Vault/Dashboard) |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | API liveness check |
| `/api/stamp` | POST | Submit hash for OTS anchoring |
| `/api/stamps/:id` | GET | Check stamp status + Bitcoin block height |
| `mempool.space/api/blocks/tip/height` | GET | Current Bitcoin block height |

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER DEVICE                          │
│                                                             │
│  File/Text → SHA-256 (crypto.subtle) → hash                 │
│                                         │                   │
│  ┌──────────────────────────────────────┤                   │
│  │                                      │                   │
│  │  ┌──────────────┐    ┌───────────────▼───────────────┐   │
│  │  │ Verify Page  │    │  Vault Document Stamper        │   │
│  │  │ /verify      │    │  /vault                        │   │
│  │  └──────┬───────┘    └───────────────┬───────────────┘   │
│  │         │                            │                   │
│  │         └──────────┬─────────────────┘                   │
│  │                    │                                     │
│  │         ┌──────────▼──────────┐                          │
│  │         │  Shared Registry    │                          │
│  │         │  localStorage       │                          │
│  │         │  (5 entries max)    │                          │
│  │         └──────────┬──────────┘                          │
│  │                    │                                     │
│  │         ┌──────────▼──────────┐                          │
│  │         │  DocumentRegistry   │ ← Dashboard              │
│  │         │  Card (quick action)│ ← Profile                │
│  │         └─────────────────────┘                          │
│  └──────────────────────────────────────────────────────────│
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │
                    hash only
                         │
              ┌──────────▼──────────┐
              │  Satohash API       │
              │  api.satohash.io    │
              │                     │
              │  POST /api/stamp    │
              │  GET /api/stamps/id │
              └──────────┬──────────┘
                         │
                    OTS calendar
                         │
              ┌──────────▼──────────┐
              │  Bitcoin Blockchain │
              │  Block #N           │
              │  = proof of time    │
              └─────────────────────┘
```

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_SATOHASH_URL` | `https://satohash.io` | Satohash web origin |
| `VITE_SATOHASH_API_URL` | `https://api.satohash.io` | Satohash API base |

---

## Quick Reference: Honest Badge Vocabulary

| Badge | What it means | Is it proof? |
|-------|--------------|-------------|
| 🟡 Pending | Submitted, awaiting Bitcoin block | No — in progress |
| 🟢 Proof on file | Hash recorded, verify on Satohash | Partial — verify the link |
| 🟢 Bitcoin-verified | Block height confirmed on-chain | ✅ Yes |
| 🟠 Stamp error | API failure or rejection | No — retry available |
| 🔵 Demo | Seed/placeholder for testing | No — not verification |

---

*Generated: 2026-08-21 · Build: 2026.08.21-80 · Paige Knowledge Base: verification-lifecycle*
