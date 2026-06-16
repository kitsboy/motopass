# MotoPass Data Model & Schema

**BUILD-20260610-004** | 2026-06-10

This document is the authoritative reference for all data structures in MotoPass. It describes the current `research/countries.json` schema (v2.0 master template), user-side models (portfolio, stacks, trackers), future data pack and delta formats, and the requirements for timestamping and provenance.

## 1. Master Program Schema (countries.json)

The single source file `research/countries.json` contains the global catalog of programs. It is loaded by both the pristine static demo and the evolving modern frontend.

### Root Structure
```json
{
  "project": "MotoPass",
  "last_updated": "2026-06-10",
  "description": "...",
  "total_programs_target": 50,
  "acquired_count": 8,                 // illustrative / demo-only
  "bitcoin_focus": "Prioritize programs with strong Bitcoin/crypto friendliness...",
  "programs": [ /* array of Program objects */ ]
}
```

### Program Object (v2.0 — Flagship Template)

Every program **must** be populated to the depth of the Uruguay flagship (`research/uruguay-flagship.md`) before it is considered complete.

```json
{
  "id": 3,                              // stable integer or slug
  "name": "Uruguay",
  "category": "rbi_cbi",                // legal_tender_bitcoin | rbi_cbi | special_visa | digital_nomad | other
  "region": "South America",
  "status": "Acquired - Researching",   // Acquired - * | Researching | To be filled | Approved | etc.
  "bitcoin_integration": "Growing crypto-friendly environment. ...",
  "finance": {
    "min_investment_usd": 100000,
    "typical_investment_usd": 150000,
    "gov_fees_usd": 15000,
    "processing_time_months": "3-8",
    "tax_benefits": "Territorial tax system attractive for high-net-worth. ...",
    "crypto_friendly_score": 8,         // 0-10
    "bitcoin_specific": "Stable jurisdiction for Bitcoin holders. ...",
    "lightning_ready": true,            // future
    "stacking_synergy": "Strong Mercosur complement to El Salvador or Georgia.",
    "risk_level": "low",                // low | medium | high (with notes)
    "roi_notes": "..."                  // optional modeled projections
  },
  "details": "Popular for residency. ...",
  "last_checked": "2026-06-01",
  "sources": [
    "Official immigration sites",
    "Our detailed research"
  ],
  "satohash_proofs": [                  // future / current stub
    {
      "field": "core",
      "block_height": 897441,
      "proof_url": "https://satohash.giveabit.io/..."
    }
  ],
  "treaty_access": ["Mercosur"],
  "dual_citizenship": "Fully allowed with no restrictions.",
  "live_work_rights": "Yes — full legal residency allows living and working immediately.",
  "passport_strength": "~170 visa-free after naturalization",
  "legal_extracts": [                   // deep extracts (markdown or structured)
    {
      "title": "Ley de Migraciones / Decreto 394/022",
      "text": "...",
      "source_url": "https://...",
      "satohash": "..."
    }
  ],
  "paige": {                            // optimization & gotchas for the AI
    "common_questions": [...],
    "red_flags": [...],
    "optimization_tips": [...],
    "escalate_when": "..."
  },
  "bitcoin_native": {
    "accepts_direct": true,
    "preferred_methods": ["BOLT12", "Silent Payments"],
    "local_economy_notes": "Growing Lightning adoption in Montevideo and Punta del Este."
  }
}
```

**Expansion Rules**
- Duplicate the last complete object as a template for new countries.
- Never publish a program with “To be filled” in critical sections (finance, bitcoin_integration, legal) without explicit status.
- `crypto_friendly_score` is subjective but must be justified in `bitcoin_specific` and consistent across similar jurisdictions.
- All monetary values in USD for comparability; BTC equivalents are computed client-side with a price feed.
- `last_checked` + `satohash_proofs` are the provenance anchors.

## 2. User-Side Models (Local-First + Exportable)

These live in browser storage (IndexedDB / localStorage) in the modern app and are exportable as JSON for backup / self-host / import.

### Portfolio
```json
{
  "version": 1,
  "owner_npub": "npub1...",           // optional Nostr identity
  "acquired": [
    {
      "program_id": 3,
      "acquired_date": "2025-11-03",
      "capital_invested_usd": 165000,
      "notes": "Used real estate pathway. Mercosur access activated.",
      "personal_satohash": "..."        // optional stamp of the acquisition event
    }
  ],
  "target_stack": [1, 3, 14],          // program ids the user is actively modeling
  "risk_tolerance": "medium",
  "family_size": 2,
  "capital_available_usd": 1200000,
  "time_horizon_months": 24,
  "priorities": ["tax_optimization", "bitcoin_rails", "mobility"]
}
```

### Saved Stack / Scenario
```json
{
  "id": "stack_uruguay_el_salvador_georgia_001",
  "name": "LatAm + Signal Core",
  "programs": [3, 1, 14],
  "computed": {
    "total_min_capital_usd": 180000,
    "total_typical_capital_usd": 320000,
    "combined_timeline_months": "4-12 (parallel possible)",
    "sovereignty_score": 87,
    "tax_synergy": "Strong territorial + legal tender signal",
    "bitcoin_readiness": 9,
    "freedom_of_movement": "Mercosur + strong global + EU-adjacent options"
  },
  "created_at": "2026-06-09T14:22:00Z",
  "satohash_proof": "..."               // stamp of the saved scenario
}
```

### Application Tracker (per program, local)
```json
{
  "program_id": 3,
  "status": "in_progress",             // planning | gathering | submitted | approved | citizenship_path
  "checklist": [
    {"step": "Apostille passport", "done": true, "date": "..."},
    {"step": "Proof of income / investment docs", "done": false}
  ],
  "target_submit_date": "2026-08-01",
  "lawyer_contact": "...",
  "notes": "...",
  "last_stamp": "..."
}
```

## 3. Data Packs & Versioning (Future)

- **Full pack**: `motopass-programs-2026-06-10.json` (the entire countries array + root metadata + a top-level Satohash of the pack).
- **Delta / Update events** (Nostr): small signed events describing only changed fields + reference to previous pack version + Satohash of the source change (gazette, official announcement).
- **User export bundle**: portfolio + saved stacks + personal stamps + (optionally) the program subset used.

All packs and deltas carry provenance. The UI must surface “this view is based on data pack stamped at block X”.

## 4. Timestamping & Provenance Requirements

- **What gets stamped** (minimum):
  - Entire program objects or critical field groups on first publish and on material change.
  - Legal extracts (individual or grouped).
  - Data pack releases.
  - User actions that constitute “I reviewed / decided / paid based on this” (optional but encouraged for reputation and audit).
- **How**:
  - OpenTimestamps (calendar or local) + Satohash.io (or equivalent friendly explorer) for human-readable links.
  - The proof (or at minimum the block height + tx / OTS file reference) is stored alongside the data and displayed in UI.
- **UI Treatment**:
  - Every program modal and finance table shows “Last verified: Block 89X,XXX (timestamp link)”.
  - “Verify this” button performs or links to independent verification.
  - User-generated artifacts (saved stacks, reports) offer one-click stamping + receipt.

See `BITCOIN-VERIFICATION.md` (to be expanded) for exact flows and error handling.

## 5. Paige / AI Corpus

Paige operates primarily over:
- The stamped program JSON + legal_extracts.
- The Uruguay (and future) flagship markdown templates.
- Publicly stamped Nostr events about rule changes.
- (Future) verified advisor notes or community contributions that carry their own stamps.

Responses must cite sources + proof references. The system prompt (see `PAIGE-AI.md`) explicitly forbids hallucinating legal or financial facts and requires escalation language for high-stakes situations.

## 6. Schema Evolution Rules

- Additive changes only for backward compatibility with the pristine demo (which has a simpler expectation).
- New required fields must be backfilled for all published programs before a new “flagship” release of the dataset.
- Breaking changes require a new major version of the data pack and migration notes.
- The pristine `website/index.html` should continue to render usefully even if it ignores newer optional fields.

## 7. Privacy & Sovereignty Notes

- User models (portfolio, stacks, trackers) are local-first by default. They are never sent to a central server unless the user explicitly chooses Nostr publish or cloud sync.
- When shared (e.g., sanitized stack for Nostr), sensitive personal capital numbers and notes are stripped or redacted by default.
- Self-hosters can run with their own copy of the program data and their own stamp calendar.

## 8. Implementation Checklist for New Fields

When extending the model:
1. Update this document.
2. Update the TypeScript interfaces in the Vite app (when present).
3. Backfill or mark incomplete for all 50 target programs.
4. Add UI treatment (filters, display, simulator impact, Paige prompt impact).
5. Add Satohash stamping guidance for the new field or group.
6. Update the pristine demo gracefully (or document that newer fields are ignored by the reference implementation).

This data model is the permanent foundation. UI and integrations come and go; the verified corpus compounds in value.

**Cross-references**  
- `research/countries.json` (live data)  
- `research/uruguay-flagship.md` (narrative depth example)  
- `docs/PRODUCT-SCOPE-ROADMAP.md` (why this depth matters)  
- `PROJECT-VISION.md` (master template v2.0)  

— Data Layer, MotoPass  
BUILD-20260610-004