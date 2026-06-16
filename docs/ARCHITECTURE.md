# MotoPass Technical Architecture (Initial)

**BUILD-20260610-004**

This is a living high-level architecture document. It will be expanded as implementation proceeds. For now it codifies the principles, current state, and intended evolution so that the Vite/React work, data pipeline, Nostr/Lightning integration, and self-hosting path all pull in the same direction.

## Guiding Principles

1. **Verifiability First** — “Truth You Can Verify” is a product requirement, not a marketing line. It shapes data model, UI, payments, updates, and deployment.
2. **Local-First / User Sovereignty** — User data (portfolios, stacks, notes, trackers) belongs to the user. Central servers are conveniences, not owners.
3. **Bitcoin Rails as Happy Path** — Lightning (BOLT12), Silent Payments, Liquid, on-chain, and on-chain timestamps are first-class. Fiat is fallback.
4. **Nostr as Identity & Coordination Layer** — Pubkeys over emails. Events for updates, alerts, and (sanitized) sharing. Private relays for sensitive context.
5. **Agent-Friendly & Auditable Process** — Single source of truth folder. BUILD numbering. Handoff skill. Documentation updated with (or before) code changes.
6. **Beauty is Non-Negotiable** — DESIGN.md is binding for all customer surfaces.
7. **Phased, Not Big-Bang** — The pristine static demo is valuable today. The modern app evolves it. Integrations come online when the data and UX are ready to support them.

## Current State (BUILD-004)

**Assets (No Build Required)**
- `website/index.html` — fully functional, self-contained reference dashboard.
- `research/countries.json` — data, loaded relatively by the demo.
- Images, DESIGN.md, next-prompt.md, vision docs.

**Process**
- Two-machine M3 (dev) / M4 (memory + strategy) with giveabit-project-handoff skill.
- This `docs/` package now exists.

**No Backend**
- Everything that can be static or local is. The demo proves the concept with zero server.

## Target High-Level Architecture (Phase 1–2+)

```
┌─────────────────────────────────────────────────────────────┐
│                        User Surfaces                         │
│  - Pristine static demo (website/index.html) — reference     │
│  - Modern SPA (Vite + React + TS + Tailwind) — primary       │
│  - PWA / future mobile companions                            │
│  - Self-hosted bundles (static + optional server components) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Client / Local State                     │
│  - IndexedDB / localStorage for Portfolio, Saved Stacks,     │
│    Application Trackers, Preferences                         │
│  - Data packs: fetched or bundled versioned JSON + proofs    │
│  - Optional: Nostr-published (sanitized) public artifacts    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────────┐   ┌───────────────┐
│   Nostr       │   │  Lightning / BTC  │   │  Timestamping │
│  (Identity,   │   │  (Payments,       │   │  (OTS +       │
│   Alerts,     │   │   Invoices,       │   │   Satohash)   │
│   Pub/Sub,    │   │   Receipts)       │   │               │
│   Paige DMs)  │   │                   │   │               │
└───────────────┘   └───────────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Optional Hosted / Coordination Layer            │
│  - Paige relay or hybrid (grounded responses + proactive)    │
│  - Stamping coordination (user pays small Lightning fee)     │
│  - Marketplace coordination (listings, reputation, escrow)   │
│  - Anonymized B2G data products                              │
│  - Public demo / marketing hosting                           │
│  - (All optional — self-hosters can bypass)                  │
└─────────────────────────────────────────────────────────────┘
```

## Data & Provenance Flow

1. Research (agents, humans, oracles) produces updates to `research/countries.json` or legal extracts.
2. Material changes are stamped (OpenTimestamps + Satohash).
3. A new data pack (or Nostr delta event) is published with proof references.
4. Clients fetch / receive the pack or events.
5. UI renders with visible “as of block X — verify” treatment.
6. User actions (acquire, save stack, pay) can themselves be stamped, producing portable receipts.

## Component & Code Organization (Modern App)

(Will be refined as the Vite app grows.)

- `src/data/` — loaders for countries.json, pack metadata, price feeds
- `src/components/` — sovereign-themed primitives + feature components (ProgramCard, StackSimulator, FinanceModal, ProofBadge, PaigeChat, etc.)
- `src/lib/` — stacking math, tax synergy models, filter logic, export generators, stamp helpers
- `src/stores/` or hooks — local state (portfolio, stacks, filters)
- `src/integrations/` — nostr (ndk or simple), lightning (webln / alby / btcpay), ots/satohash client
- `src/pages/` or routes — Portfolio, Explorer, Simulator, Compare, Vault, Settings
- `public/` or served assets — the research/ folder (or symlinked/copied at build for demo parity)

Use the DESIGN.md rules and the `next-prompt.md` structure as the source of truth for layout and interaction.

## Deployment Models

1. **Public Hosted (Convenience)** — Netlify / Cloudflare Pages / GitHub Pages for the SPA + static assets + research data. Fastest path to sharing the demo.
2. **Sovereign Static** — User downloads the built static bundle + a copy of the data pack. Runs entirely locally/offline after first load. Can be served from Umbrel/Start9/nginx.
3. **Sovereign with Rails** — Static bundle + local Lightning node (LND/CLN) + optional local Paige (via llama.cpp or similar) + local OTS calendar. Maximum independence.
4. **Hybrid** — Hosted intelligence + user’s own Nostr relays + own Lightning for payments.

Long-term goal: excellent experience at all three levels, with clear documentation and one-command (or one-click on Start9/Umbrel) self-host recipes.

## Security & Privacy Posture

- Minimize central collection of user data.
- Nostr private relays for anything sensitive (stacks, Paige context, notes).
- All high-value or auditable actions produce optional on-chain proofs.
- No central KYC for the core intelligence, simulation, and basic Paige features.
- Self-hosting is a first-class, documented path, not an afterthought.
- Dependencies are kept minimal and auditable (Vite ecosystem, small Nostr/Lightning libs, no heavy analytics).

## Integration Points (to be detailed in future revisions)

- **Satohash / OTS**: client-side stamping guidance + optional hosted coordination.
- **Nostr**: ndk or nostr-tools; defined event kinds for program updates, stack shares (sanitized), proof anchors, Paige interactions.
- **Lightning**: WebLN, Alby SDK, or BTCPay for invoices; BOLT12 offer support; Silent Payments address generation/display.
- **Price feeds**: simple BTC/USD (and sats conversion) for the real-time calculators. Self-hostable or user-configurable.
- **Paige**: retrieval over stamped corpus; Nostr bot interface; optional local LLM path.

## Risks & Constraints

- Reliance on external explorers/calendars/relays → provide fallbacks and clear “verify independently” paths.
- Lightning / Nostr ecosystem maturity → graceful degradation + clear happy-path guidance.
- Data update velocity → Nostr + stamping pipeline must be maintainable by a small agent + human team.
- Scope discipline → this document + the phased roadmap in PRODUCT-SCOPE-ROADMAP.md are the guardrails.

## Next Immediate Architecture Work (Post BUILD-004)

- Vite + React + Tailwind scaffold (this session).
- Basic data loader + ProgramCard + filter UI that respects DESIGN.md.
- Local portfolio + stack persistence.
- Proof badge component wired to the (initially manual) Satohash entries in the data.
- Documentation of the first Nostr event kinds and stamping helper.

This architecture is deliberately simple at the start and grows only where the product requirements (verifiability, sovereignty, Bitcoin rails, beauty) demand it.

**Truth You Can Verify — in the code, in the data, and in the deployment.**

— Architecture Layer, MotoPass  
BUILD-20260610-004

Cross-references: `docs/PRODUCT-SCOPE-ROADMAP.md`, root `PROJECT-VISION.md`, `DESIGN.md`, `DATA-MODEL.md`.