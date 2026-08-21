# Paige — Vault & Document Stamping Guide

**Purpose:** teach Paige (and any future agent) exactly how the Vault, document
stamping, and the shared document registry work. This is the authoritative
reference for answering "how do I timestamp my documents?" and "what is the
Vault?"

**Version:** BUILD 72 · 2026-08-21

---

## 1. What the Vault does (the 30-second version)

The Vault (`/vault`) is MotoPass's **proof archive**. It does two things:

1. **Shows Bitcoin-anchored proofs** for all 50 programs — block numbers, hashes, verify links, and proof lineage
2. **Lets members timestamp their own documents** on Bitcoin via the Document Stamper

The document stamping workflow is simple: **hash it locally, stamp it on Bitcoin, keep the hash, verify later.** The original file never leaves your device.

**Ask Paige:** *"What is the Vault?"*
> The Vault is your proof archive — it shows Bitcoin-anchored proofs for all 50 countries and lets you timestamp your own documents the same way. You can verify any proof independently at satohash.io without trusting MotoPass.

---

## 2. The Document Stamper (stamp your own files)

The Document Stamper lives on `/vault` and lets members timestamp any file on Bitcoin.

### How it works

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCUMENT STAMPER                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Drop a file (passport scan, contract, creative work)    │
│                    ↓                                        │
│  2. SHA-256 computed LOCALLY (crypto.subtle)                │
│     The file never leaves your device                       │
│                    ↓                                        │
│  3. Hash posted to Satohash API (POST /api/stamp)           │
│     { hash: "a1b2c3...", filename: "passport.pdf" }        │
│                    ↓                                        │
│  4. Light poll for Bitcoin anchor                           │
│     GET /api/stamps/:id (3 attempts, 2s interval)          │
│                    ↓                                        │
│  5. Status determined:                                     │
│     • pending   → submitted, awaiting Bitcoin block         │
│     • confirmed → anchor seen (block_height present)        │
│     • error     → API failure; retry available              │
│                    ↓                                        │
│  6. Registry entry saved to localStorage                    │
│     Metadata + hash only — never the file                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The honest statuses

| Status | What it means | Is it proof? |
|--------|--------------|--------------|
| **Pending** | Submitted to Satohash, awaiting Bitcoin block | ❌ No — "awaiting anchor" |
| **Confirmed** | Anchor seen at block N | ✅ Yes — Bitcoin-verified |
| **Error** | Submission failed | ❌ No — retry available |

**Ask Paige:** *"How do I stamp my document?"*
> Drop any file into the Document Stamper on /vault. Its fingerprint (hash) is computed locally — the file never leaves your device — and anchored to Bitcoin via Satohash. You get a proof card showing the block number when it's confirmed.

### Privacy guarantee

- **The file never leaves your device** — only the SHA-256 hash is sent
- **Satohash never sees your document** — just the 64-character hex hash
- **The registry is device-local** — stored in localStorage, not on a server
- **You can verify independently** — open satohash.io/verify/<hash> without trusting MotoPass

**Ask Paige:** *"Is it safe to stamp my passport scan?"*
> Your file never leaves your device. Only the cryptographic fingerprint (SHA-256 hash) is sent to Satohash. Even Satohash never sees your document — just the hash. The hash itself doesn't reveal anything about the file's contents.

---

## 3. The shared document registry

The document registry is the **single source of truth** for all stamped documents. It's stored in localStorage (`motopass-vault-documents`) and shared across three pages:

| Page | What it shows | Actions available |
|------|--------------|-------------------|
| **Vault** (`/vault`) | Full registry with stamp/re-check/delete | Stamp new files, re-check anchors, delete entries |
| **Profile** (`/profile`) | Same registry + profile status derivation | View stamps, re-check, delete |
| **Dashboard** | Registry card with stamp/re-check quick actions | Re-check all, retry stamp, export/import |

**Key insight:** stamp from any page, same list everywhere. The registry is the hub.

### Registry entry structure

```typescript
interface StampedDocument {
  id: string          // Local registry id (not the Satohash stamp id)
  name: string        // Display name (never hashed on-chain)
  size: number        // File size in bytes
  type: string        // MIME type
  hash: string        // SHA-256 of raw file bytes — THE on-chain anchor
  stampId?: string    // Satohash API stamp id (uuid)
  status: 'pending' | 'confirmed' | 'error'
  blockHeight?: number  // Bitcoin block height (once confirmed)
  createdAt: string
  updatedAt: string
  note?: string       // Error message or status note
}
```

---

## 4. Applying with document proofs

When a member applies at `/apply`, they can **attach confirmed document stamps** to their application.

### The attach flow

1. Member visits `/apply` and sees the "Attach stamped documents" card
2. The registry is loaded — **only Bitcoin-confirmed stamps are selectable**
3. Pending/error rows show honest labels and are disabled:
   - "Awaiting anchor" (pending)
   - "Stamp error — restamp in Vault" (error)
4. `?proof=<hash>` deep-links auto-select a matching confirmed registry doc
5. On submit, doc hashes are included in the stamped payload
6. `docProofs` (hash, stamp_id, block height, stamped date) are stored on the application
7. Success card lists attached proofs with Satohash verify links

### What gets proved

The on-chain claim is: **"these exact files existed at block N"** — never identity claims. The hash covers the raw file bytes, so any modification produces a different hash.

**Ask Paige:** *"How do I attach documents to my application?"*
> When you apply on /apply, you can attach confirmed document stamps to your application. Only Bitcoin-confirmed stamps are selectable — pending stamps aren't proof yet. The attached proofs show the block number and verify link.

---

## 5. Export & import (portable backups)

The document registry can be exported as a portable JSON backup and restored on any device.

### Export

- **Where:** Dashboard registry card ("Export backup") or Profile document list
- **Format:** `motopass-document-registry/v1` JSON with every entry's hash, stamp_id, status, block_height, and **allowlisted verify URL**
- **File name:** `motopass-documents-<BUILD>.json`
- **Contains:** metadata + hash only — never the original files

### Import

- **Where:** Dashboard registry card ("Import") or Profile document list
- **Validation:** schema check, 64-hex hash format, duplicates merged (newer wins)
- **Post-restore:** Re-check all confirms anchors against the Satohash API
- **Honesty:** restored statuses are the backup's claim, not the API's — re-check to confirm

**Ask Paige:** *"How do I back up my stamped documents?"*
> Download your document registry as a portable JSON backup from the Dashboard or Profile. It includes verify links so you can audit against Bitcoin without MotoPass. On a new device, use the Import button to restore.

---

## 6. The Verify tool (independent verification)

The Verify tool (`/verify`) lets members:

1. **Paste a SHA-256 hash** and check if it's anchored on Bitcoin
2. **Upload a `.ots` file** (OpenTimestamps receipt) for browser-side verification
3. **Upload a `.txt` file** containing a hash for automatic verification

Verification checks:
- Is the hash anchored via Satohash/OTS?
- At which Bitcoin block?
- Is the content unchanged since anchoring?

**Ask Paige:** *"How do I verify a proof myself?"*
> Copy the hash from any proof card, open satohash.io/verify/<hash>, and see for yourself. You don't need to trust MotoPass.

---

## 7. Proof cards (what members see)

Each program in the Vault has a **proof card** showing:

```
🇨🇷 Costa Rica                      [Proof on file]
┌──────────────────────────────────────────────────┐
│ ⛓ Block #958093   📅 Last checked 2026-07-02     │
│ # e7f67a70…        🧾 OTS receipt /proofs/….ots  │
└──────────────────────────────────────────────────┘
[✓ Use this proof] [⧉ Copy verify URL] [Satohash ↗]
[⬇ .ots] [Apply →] [📻 Announce on Nostr] [⎇ Lineage]
```

Every item has an **education tooltip** (InfoTip) explaining what it means:
- **Block #** → "The Bitcoin block this proof is anchored in"
- **Content hash** → "SHA-256 fingerprint of the anchored data"
- **OTS receipt** → "OpenTimestamps receipt — download to verify independently"
- **Use this proof** → "Attach this proof to an application"
- **Copy verify URL** → "Copy the Satohash verify link"
- **Satohash** → "Open the proof on Satohash.io"
- **.ots** → "Download the OpenTimestamps receipt"
- **Apply** → "Start an application with this proof attached"
- **Announce on Nostr** → "Publish the proof hash to Nostr (gossip, not proof)"
- **Lineage** → "View the full proof history across data updates"

---

## 8. Honesty rules (non-negotiable for Paige)

1. **Only confirmed stamps are proofs.** Pending is "awaiting anchor" — not proof of anything.

2. **The file never leaves the device.** Only the SHA-256 hash is sent to Satohash.

3. **The on-chain claim is "this exact file existed at block N."** Never identity claims.

4. **Verify URLs are allowlisted.** Never fabricate or alter `satohash.io/verify` links.

5. **Badge vocabulary:** `Demo` / `Proof on file` / `Bitcoin-verified`. Never invent categories.

6. **Do not fabricate block numbers.** Only cite `bitcoin_block_height` from the API.

7. **The registry is device-local.** It doesn't sync across devices without export/import.

8. **A URL on file is never verification.** Always say "verify it at satohash.io/verify/<hash>."

---

## 9. What Paige should say (member-facing scripts)

### "What is the Vault?"

> The Vault is your proof archive — it shows Bitcoin-anchored proofs for all 50 countries and lets you timestamp your own documents the same way. You can verify any proof independently at satohash.io without trusting MotoPass.

### "How do I stamp my document?"

> Drop any file into the Document Stamper on /vault. Its fingerprint (hash) is computed locally — the file never leaves your device — and anchored to Bitcoin via Satohash. You get a proof card showing the block number when it's confirmed.

### "Is it safe to stamp my passport scan?"

> Your file never leaves your device. Only the cryptographic fingerprint (SHA-256 hash) is sent to Satohash. Even Satohash never sees your document — just the hash. The hash itself doesn't reveal anything about the file's contents.

### "What can I stamp?"

> Anything you want a tamper-evident record of: passport scans, contracts, proof-of-funds summaries, applications, wills, creative works, research notes. The pattern is always the same: hash it, stamp it, keep the hash, verify later.

### "How do I verify a proof myself?"

> Copy the hash from any proof card, open satohash.io/verify/<hash>, and see for yourself. You don't need to trust MotoPass.

### "How do I attach documents to my application?"

> When you apply on /apply, you can attach confirmed document stamps to your application. Only Bitcoin-confirmed stamps are selectable — pending stamps aren't proof yet. The attached proofs show the block number and verify link.

### "How do I back up my stamped documents?"

> Download your document registry as a portable JSON backup from the Dashboard or Profile. It includes verify links so you can audit against Bitcoin without MotoPass. On a new device, use the Import button to restore.

### "What's the difference between pending and confirmed?"

> Pending means your hash was submitted to Satohash but hasn't been included in a Bitcoin block yet — it's "awaiting anchor." Confirmed means it's anchored at a specific block number — that's your proof. You can re-check the status anytime.

---

## 10. For developers (technical reference)

### Key files

| File | Role |
|------|------|
| `src/lib/documentStamp.ts` | Core registry: stamp, refresh, restamp, upsert, formatBytes |
| `src/lib/documentRegistryExport.ts` | Export/import: schema validation, merge, backup bundle |
| `src/components/vault/DocumentStamper.tsx` | Drop-zone UI for stamping new files |
| `src/components/vault/VaultProofRow.tsx` | Program proof card with tooltips and actions |
| `src/components/vault/VaultEducationCard.tsx` | Education section explaining the workflow |
| `src/components/dashboard/DocumentRegistryCard.tsx` | Dashboard registry card with quick actions |
| `src/components/dashboard/RegistryImportButton.tsx` | Shared import button component |
| `src/pages/VaultPage.tsx` | Vault page: proof archive + stamper + verifier |
| `src/pages/ProfilePage.tsx` | Profile: same registry + status derivation |
| `src/pages/ApplyPage.tsx` | Apply: attach confirmed stamps to applications |
| `src/lib/satohash.ts` | Browser client: stampHash, getStamp, pollStamp, allowlisted URLs |
| `src/lib/timestampSecurity.ts` | Security gate: allowlisted origins, hash sanitization |
| `src/types/user.ts` | UserDocument type with status union |

### Storage

- **Registry:** `localStorage['motopass-vault-documents']` — `StampedDocument[]`
- **Paige history:** `localStorage['paige-history']` — conversation memory
- **Portfolio:** separate from document registry

### API endpoints used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://api.satohash.io/api/stamp` | POST | Submit hash for anchoring |
| `https://api.satohash.io/api/stamps/:id` | GET | Check stamp status + block height |
| `https://satohash.io/verify/<hash>` | GET | Independent verification page |

### The complete doc lifecycle

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Stamp from  │────▶│  One shared  │────▶│  Re-check   │
│  Profile,    │     │  registry    │     │  or retry   │
│  Vault, or   │     │  on Profile/ │     │  anytime    │
│  Dashboard   │     │  Vault/Dash  │     │             │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  Attach      │────▶│  Payload on  │
                    │  confirmed   │     │  Bitcoin     │
                    │  stamps to   │     │  (via Satohash)│
                    │  application │     │              │
                    └──────────────┘     └─────────────┘
```

---

## 11. Cross-references

- `docs/PAIGE-AI.md` — Paige AI specification (role, capabilities, constraints)
- `docs/PAIGE-SATOHASH-GUIDE.md` — Satohash technical guide (API, endpoints, headers)
- `docs/PAIGE-USER-GUIDE.md` — Satohash user guide (member-facing answers)
- `docs/PAIGE-INTEL-PIPELINE-GUIDE.md` — Intel pipeline & self-healing loop
- `docs/COUNTRY-INTEL.md` — Pipeline documentation (steps, schema, env)
- `research/paige/satohash-knowledge.json` — Machine-readable Satohash facts
- `research/paige/intel-pipeline-knowledge.json` — Machine-readable intel facts
- `research/paige/vault-stamping-knowledge.json` — Machine-readable Vault facts
- `docs/SECURITY-TIMESTAMP-NOSTR.md` — Attack vectors + verifier contract

---

**Truth You Can Verify — even when the answer comes from an AI.**

— Paige Vault & Stamping Guide, MotoPass
BUILD 72 · 2026-08-21
