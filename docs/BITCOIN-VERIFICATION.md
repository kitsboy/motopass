# Bitcoin Verification & “Truth You Can Verify” Specification

**BUILD-20260610-004**

## Purpose
This document defines exactly how MotoPass implements and exposes independent verifiability on the Bitcoin blockchain. It is the technical and UX contract behind the Prime Directive: “Truth You Can Verify.”

Every material claim the platform makes — about programs, costs, laws, user actions, or platform state — must be independently auditable by anyone with access to a Bitcoin node or a block explorer + OpenTimestamps / Satohash tooling.

## Core Components

### 1. OpenTimestamps (OTS) + Satohash
- **OpenTimestamps**: The open protocol and calendar servers that allow anyone to timestamp arbitrary data (a file hash, a JSON object, a legal text) into the Bitcoin blockchain without trusted third parties.
- **Satohash (satohash.giveabit.io or equivalent friendly explorer)**: The human-friendly layer that makes proofs discoverable and verifiable. It provides nice URLs, block height references, and visual receipts.

MotoPass uses both: OTS for the cryptographic proof, Satohash for the usable interface and links.

### 2. What Must Be Timestamped (Minimum Bar)

**Program / Research Data**
- Entire program objects or critical field groups (finance, legal_extracts, bitcoin_native) on first publication and on every material change.
- Individual deep legal extracts (laws, decrees, gazette notices) — preferably at the granularity of the exact text the platform quotes.
- Data pack releases (the full `countries.json` snapshot at a point in time).

**User-Generated Artifacts (optional but strongly encouraged)**
- “I reviewed this program / stack on [date]” attestations.
- Saved stack reports and scenario exports.
- Application tracker milestones (e.g., “documents submitted”).
- Payments made for fees or premium access (the invoice + payment preimage or tx can be stamped or referenced).

**Platform / Process**
- Major UI or data releases (the build artifact or a manifest hash).
- Change detection events (when an agent or oracle detects an official source update).

### 3. Storage of Proofs

Proofs live alongside the data:
- In `countries.json`: optional `satohash_proofs` array on program and on field groups.
- In markdown templates (uruguay-flagship.md etc.): inline “Last stamped: block X — https://satohash...”
- In user exports: a `proofs/` folder or embedded receipt objects.
- In Nostr events: `satohash` or `ots` tags or content references.

The UI never claims “this is current” without also surfacing “as of block X (proof link)”.

### 4. UX Treatment (Required)

**Per-Program / Per-Modal**
- Prominent “Last verified: Block 897,441 — Verify on Satohash” line or badge.
- “Verify this field” or “View proof” affordances next to finance numbers, legal quotes, and Bitcoin integration statements.
- Hash or OTS file download where useful for advanced users.

**In the Timestamp / Research Vault Section**
- The existing “Verify on Bitcoin” UI (hash input + live stamps list) in the pristine demo is the reference. The modern app must reproduce and improve it.
- Global “Latest verified block” indicator in header or footer (the block height the platform considers authoritative for its current data view).

**For User Actions**
- After marking a program acquired or saving a stack, offer “Stamp this decision on Bitcoin” (one-click OTS + Satohash flow or guidance).
- Stamped user artifacts appear in the user’s local history with proof links and are exportable.

**Error & Graceful Degradation**
- If a proof is pending confirmation, show “Timestamp submitted — awaiting Bitcoin confirmation (est. 60–90 min)”.
- If verification fails or a link is broken, surface a clear “Proof unavailable — data last checked [date] from [source]. We recommend independent verification.” Never hide the underlying source.

### 5. Implementation Path (Phased)

**Phase 0–1 (Current → Modern Frontend)**
- Manual stamping of flagship countries and the Uruguay template via Satohash web UI or CLI.
- Record the resulting block heights and proof URLs in the JSON and markdown.
- Build the UI surfaces described above (many already exist in the pristine demo as stubs).
- Expose a “Stamp my stack” flow in the simulator (client-side hash of the scenario JSON → guide user to Satohash or call an API if/when available).

**Phase 2 (Bitcoin Rails)**
- Automated or semi-automated stamping pipeline (agent or service that takes a canonical JSON blob or file, runs `ots stamp`, and records the proof).
- Integration of real Lightning or on-chain payment for premium stamping services if desired (user pays small fee in sats to have the platform coordinate the stamp on their behalf).
- Nostr events carrying `satohash` references for program updates so that the network itself propagates verifiable deltas.

**Phase 3+**
- User-controlled stamping from self-hosted instances (local calendar or direct to Bitcoin via their own node).
- On-chain reputation graph seeded by repeated, verifiable stamped actions from the same Nostr pubkey.
- Verification as a first-class API / library that other tools can use.

### 6. Verification Experience for Third Parties

Any user, journalist, regulator, or competing advisor should be able to:
1. Take a MotoPass-exported JSON or report.
2. Recompute its hash.
3. Use OpenTimestamps tooling or Satohash to confirm that hash was committed to a specific Bitcoin block.
4. Compare the committed data against the live program page or legal source.
5. Reach the same conclusion the platform did — or discover a discrepancy.

This is the ultimate trust signal and the feature that no traditional CBI directory or advisor network can replicate without adopting the same discipline.

### 7. Non-Goals & Boundaries

- We do **not** claim that a Satohash stamp makes the underlying legal text correct or the tax advice sound. It only proves that a specific artifact existed at a specific time and has not been retroactively altered.
- We do **not** stamp every UI pixel or every transient price. We stamp the substantive research and user decisions.
- Stamping is a tool for transparency and audit, not a substitute for qualified legal/tax counsel.

## 8. Open Questions / Future Work

- Direct integration vs. user-guided stamping (trade-off between convenience and “the user did it themselves”).
- Calendar server diversity and resilience (don’t rely on a single OTS calendar).
- Cost and UX of stamping many small user actions at scale.
- Standardized event kinds for Nostr + OTS proof anchoring.

This specification is binding for all future development. Any feature that presents data or records decisions must answer: “Where is the proof, and how does a stranger verify it without trusting us?”

**Truth You Can Verify.** This document exists to make that sentence operational.

— Verification Layer, MotoPass  
BUILD-20260610-004

Cross-references: `docs/PRODUCT-SCOPE-ROADMAP.md` (Phase 2), root `PROJECT-VISION.md` (technical requirements), `website/index.html` (existing timestamp UI section).