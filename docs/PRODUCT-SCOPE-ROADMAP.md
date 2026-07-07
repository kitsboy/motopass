# MotoPass — Product Scope & Roadmap
## The Complete Answer to “How Much Are We Going to Build Here?”

**BUILD-2026.07.07-26** | 2026-07-07  
**Status:** Authoritative reference. Update only with corresponding changes to vision, data model, or architecture. Cross-reference with `docs/PROJECT-VISION.md`, `docs/DESIGN-CONTEXT.md`, `docs/NEXT-PROMPT.md`, and `docs/SOURCE-OF-TRUTH.md`.

---

## Executive Context for Scope

MotoPass is not a website that lists golden visas. It is the **sovereign identity and jurisdictional finance operating system** for the Bitcoin era.

The current pristine artifact (`website/index.html` + `research/countries.json`) is already a high-fidelity, zero-dependency, fully functional demonstration that would be impressive as a standalone product in most categories. It is, however, only the visible surface of Phase 0.

The full vision spans data depth, user experience, Bitcoin protocol integration, AI intelligence, marketplace dynamics, government interfaces, and self-sovereign deployment models. This document makes the total ambition explicit, phased, and measurable so that every agent, contributor, partner, and user understands exactly what we are signing up for and what “complete” looks like at each horizon.

**Prime Directive (non-negotiable):** “Truth You Can Verify.” Every material piece of information, legal text, cost, requirement, user action, and platform state change that matters must be independently verifiable on the Bitcoin blockchain (OpenTimestamps + Satohash.io, referencing a recent block height). This requirement influences data schema, UI treatment, payment flows, Nostr events, Paige responses, and long-term reputation systems.

---

## Current State (BUILD-26 Baseline)

### Data
- 16 programs seeded in `research/countries.json` (El Salvador, Central African Republic, Uruguay, St. Kitts & Nevis, Antigua & Barbuda, Dominica, UAE, Switzerland/Crypto Valley, Singapore, Portugal (policy shift note), Malta, Panama, Georgia, Paraguay, Bolivia placeholder, and one explicit “to be filled”).
- Rich finance modeling per program: min/typical investment USD, gov/processing fees, processing time months, tax benefits (territorial, crypto treatment, holidays), crypto-friendly score (0–10), Bitcoin-specific narrative.
- Uruguay documented as official flagship + v2.0 master template in `research/uruguay-flagship.md` (Basic Info, 3 Critical Tests, Investment/Financial, Process/Timeline, Legal & Compliance deep extracts, Lifestyle, Bitcoin-Native Features, Paige AI fields).
- **BTC Map layer shipped**: merchant density (`btcmap-density.json`), offline cache (50 snapshots), live btcmap-api v4 on `/btcmap`.
- Target: all 50 programs at Uruguay flagship depth + real Satohash stamps.

### Experience (React App — primary, BUILD-26)
- 15 routes: Portfolio, Programs, Simulator, Compare, Vault, **BTC Map**, Blog, Agents, Register/Dashboard.
- Leaflet merchant pins, density badges on cards, Nostr save merchants, offline cache, 30 unit + 16 e2e tests.

### Experience (Pristine Reference — still maintained)
- Self-contained single-file `website/index.html` (~2,362 lines of HTML/CSS/JS).
- Fixed sovereign header (logo with ₿, nav, wallet-style connect).
- Hero with animated grid, live Bitcoin block height, strong imagery.
- Scrolling ticker of live signals.
- Dedicated “Verify on Bitcoin” / timestamp section with hash input and live stamps list (UI stub ready for real Satohash integration).
- Simulated Paige AI chat interface (section + input).
- Programs explorer: filter chips, search, card grid + (implied) table toggle, rich modals with finance facts, checks, hash proofs, CTA.
- In-browser “Add New”, “Mark Acquired”, JSON export/import.
- Fully responsive, premium dark aesthetic (navy/gold + Bitcoin orange variant of the DESIGN.md system).
- Zero build step, zero external runtime deps for the demo itself. Loads `../research/countries.json` relative.

### Design & Vision System
- `DESIGN.md`: Sovereign Black (#0a0a0a), Deep Void Gray (#111111), Bitcoin Orange (#F7931A primary accent), Sovereign Silver, Freedom White, Crypto Green, Alert Amber. Typography: Space Grotesk (display) + Inter (body). Glassmorphic cards, pill buttons, generous rounding, custom imagery integration (hero.jpg, passport.jpg, funding-flow.jpg, sovereignty.jpg, etc.).
- `next-prompt.md`: Explicit next UI structure — Top Nav with Portfolio / All Programs / Stack Simulator / Finance Compare / Research Vault; Hero dashboard metrics; My Portfolio grid of acquired passports; All Programs explorer with advanced filters (region, investment slider, crypto score, Lightning toggle); Finance Deep Dive Modal (tabs: Overview, Detailed Finance, Bitcoin Integration, Legal & Risk, Sources + comparison); Jurisdictional Stacking Simulator (multi-select + combined tax/timeline/sovereignty uplift visuals); consistent sovereign language.

### Supporting Artifacts
- Full `PROJECT-VISION.md` with non-negotiable Bitcoin stack (Lightning BOLT12, Liquid, Silent Payments, OpenTimestamps), Nostr as primary comms/identity layer, master country template v2.0, Paige AI fields, two-sided marketplace, government partnership potential.
- `SOURCE-OF-TRUTH.md`, KIMI handoff files, operational discipline (BUILD numbering, two-machine workflow).
- This `docs/` package (executive, marketing, this scope document, and supporting specs).

**Assessment:** The current package is already one of the cleanest, most Bitcoin-aligned, and most actionable sovereign residency intelligence artifacts in existence. The work ahead is to make it production-grade, deeply integrated with Bitcoin rails, intelligent, multi-user, and eventually a full ecosystem.

---

## The Full Scope — Phased Breakdown

### Phase 0: Foundation & Reference (Current — BUILD-004)
**Goal:** Make the intelligence layer credible, beautiful, and usable today while establishing the permanent documentation and process foundation.

**Data**
- Maintain and expand the 16 → 25+ programs at v2.0 flagship depth (legal extracts with sources + Satohash placeholders, full finance, Bitcoin/Lightning signals, Paige fields).
- Replicate Uruguay template exactly for every new entry. No shortcuts.
- Add initial sovereignty score, stacking synergy, risk, and ROI projection fields (even if modeled simply at first).

**Experience**
- Keep `website/index.html` pristine (reference implementation, zero-build hero artifact).
- Minor polish only if it does not increase maintenance burden.
- Deploy publicly (simple static hosting) as the “see it working now” proof.

**Process & Docs**
- This documentation package (BUILD-004).
- Root README/SOURCE updates, handoff protocol solid.
- Design system and next-prompt locked as source of truth for all future generation.

**Bitcoin / Verification**
- UI stubs for timestamp verification and “last verified + block” already present.
- Begin manually stamping key data points and the Uruguay template via Satohash/OpenTimestamps. Record proofs.

**Success Criteria**
- 20+ countries at consistent flagship depth.
- Public demo URL that impresses on first open and clearly communicates “Truth You Can Verify.”
- Documentation suite complete and cross-referenced.

### Phase 1: Modern Product Experience (Immediate Next Horizon)
**Goal:** Evolve from beautiful static reference to a living, interactive, stateful web application that delivers the full vision described in `next-prompt.md` while preserving the ability to self-host or export the core experience.

**Frontend Platform**
- Root Vite + React + TypeScript + Tailwind (initialized in BUILD-004, `npm run dev` live).
- Component system aligned with DESIGN.md (glassmorphic cards, Bitcoin orange CTAs, Space Grotesk/Inter, sovereign imagery).
- Optional: shadcn/ui primitives + custom sovereign overrides (via the `shadcn-ui` and `react-components` skills when porting Stitch or high-fidelity designs).
- Data layer: fetch or import `research/countries.json` (later: versioned data packs + delta updates via Nostr).
- State: local-first (IndexedDB / localStorage + exportable JSON) for portfolios and stacks. Optional cloud sync later via Nostr.
- Routing / sections: My Portfolio, All Programs (grid + table + advanced filters), Stack Simulator, Finance Compare, Research Vault, Settings (data sources, stamps, export).

**Core Feature Expansions (from next-prompt + vision)**
- **My Portfolio**: Visual grid of “acquired” programs (passport imagery, flag, sovereignty highlights, tax summary, stacking synergy, Bitcoin integration badges). Drag-to-reorder, notes per program, “Simulate New Stack” entry point. Mark/unmark acquired with persistence.
- **Interactive Jurisdictional Stacking Simulator**: Multi-select programs → live calculation of:
  - Total capital required (min + typical + fees)
  - Combined timeline (parallel vs serial paths)
  - Aggregated tax benefits (territorial overlap, crypto treatment, holidays)
  - Sovereignty / freedom score uplift (visa-free count, Mercosur/EU/CARICOM access, dual-citizenship strength)
  - Bitcoin exposure / Lightning readiness of the stack
  - Visuals inspired by funding-flow.jpg and passport.jpg
  - Exportable “Stack Report” with timestamp proof.
- **Finance Deep Dive + Compare**: Modal or dedicated view with tabs (Overview, Detailed Finance with cost breakdown + ROI projections + tax scenarios, Bitcoin Integration, Legal & Risk with sources + Satohash links, Comparison matrix vs 1–3 other programs).
- **Advanced Filters & Views**: Region, category (CBI/RBI/Legal Tender/Special), investment range slider, crypto-friendly score slider, Lightning Ready toggle, tax optimization score, risk level, status (Acquired/Researching), search. Persisted filter sets. Toggle card grid ↔ high-density sortable table.
- **“Verify on Bitcoin” Production Flows**: Real Satohash/OpenTimestamps integration. For every program, every major data field, and every user-generated stack/report, surface a “Proof” button or badge that links to the timestamp or embeds the verification. Display block height at time of stamp. Allow user to stamp their own actions (e.g., “I reviewed this stack on [date]”).
- **Research Vault**: Versioned legal extracts, source links, change log (Nostr events will drive the live feed later).
- **Paige Chat Surface**: Upgrade the simulated chat to a grounded interface (initially prompt + retrieval over the local stamped corpus; later Nostr or backend-mediated).

**Data & Modeling Enhancements**
- Expand schema (see DATA-MODEL.md) with sovereignty score, stacking synergy matrix, risk flags. **Lightning merchant density** — partially shipped via BTC Map integration (`/btcmap`, density badges, `programCoords.ts`). Remaining: real-time BTC cost calculator (price feed + sats conversion).
- User-side models: Portfolio (array of acquired program IDs + personal notes + target dates), Saved Stacks (named combinations + computed metrics + proof), Application Tracker (step checklists per program with local status + optional stamps).
- In-app “Add / Edit / Export” parity with the pristine demo, plus better validation and history.

**Technical / Ops**
- Vite build + deploy to static hosts (Netlify, Cloudflare Pages, GitHub Pages, or sovereign static hosting).
- Asset pipeline for the custom images (optimize, responsive variants).
- Error boundaries, loading states, graceful degradation for the JSON data.
- Accessibility baseline (keyboard, contrast, labels) — premium does not mean inaccessible.
- Analytics: privacy-respecting (self-hosted Plausible or Nostr-native signals only; no Google).

**Success Criteria**
- Feature parity or better vs the pristine demo + the full next-prompt experience implemented and delightful.
- Local persistence of portfolios and stacks works offline.
- “Verify on Bitcoin” proofs are real and demonstrable for at least the flagship countries.
- Performance: sub-100ms filter interactions, instant simulator feedback.
- Deployed public beta reachable from the same branding as the pristine demo.

### Phase 2: Bitcoin Rails & Verifiability Layer (The Moat)
**Goal:** Make “Truth You Can Verify” a lived experience, not just a claim. Payments, identity, and updates move on Bitcoin + Nostr.

**Timestamping & Proofs (Deep)**
- Formal integration with Satohash (or direct OpenTimestamps) for:
  - All seeded program data and legal extracts (initial bulk stamp + update stamps).
  - User actions: marking a program acquired, saving a stack, exporting a report, reviewing a legal text.
  - Platform releases and data pack versions.
- UI treatment: every relevant number, source, and user artifact has a small “verified” or “proof” affordance. Clicking shows block height, timestamp tx, and verification instructions (or direct link to Satohash explorer).
- On-chain reputation seeds: repeated stamped actions by the same Nostr pubkey begin to form a lightweight, portable reputation graph.

**Payments (Lightning Native)**
- BOLT12 offers (preferred) or LNURL / on-chain fallback for:
  - Program fees (even if fulfillment is still manual at first — the payment itself is the signal).
  - Premium tier subscriptions (Sovereign / Command Center).
  - Later: marketplace purchases.
- Silent Payments (BIP352) support for maximum privacy donations or one-time payments.
- Liquid Network for larger or more private settlements where appropriate.
- UX: “Pay with Lightning” button in modals and checkout flows. Invoice generation (via BTCPay or direct node / Alby / LND). Payment confirmation updates local state and triggers a stamped receipt.
- Accounting: local ledger of payments made + proofs (for tax and audit).

**Nostr as Primary Identity, Notification, and Update Layer**
- Users authenticate / are represented by Nostr pubkeys (no email required for core flows).
- Private relays (or user-chosen) for sensitive stack data and Paige conversations.
- Public relay events for:
  - Program rule changes (government gazette → agent or oracle → signed Nostr event with Satohash proof of the source).
  - Deadline alerts and Paige proactive nudges.
  - Community research contributions (timestamped, optionally reputation-weighted).
- Event kinds defined for MotoPass (program update, stack share (sanitized), proof anchor, etc.).
- Paige lives primarily as a Nostr service: users DM or mention Paige pubkey; she replies with grounded answers + proof references.

**Data Pipeline & Freshness**
- Agent-driven or oracle-driven monitoring of official immigration sites + gazettes.
- Every detected material change → new Nostr event + new Satohash stamp on the delta.
- UI shows “Last verified: Block X (timestamp)” per program and per field group.
- Conflict resolution / human review queue for agent-proposed updates (future).

**Success Criteria**
- At least the flagship 5–10 countries have real, independently verifiable Satohash proofs attached to their core data.
- A user can pay a (simulated or real small) Lightning invoice inside the app for a premium feature or program fee and receive a stamped receipt.
- Nostr pubkey is the primary user identifier; at least basic DM or event-driven alerts work end-to-end.
- Change detection + stamping pipeline demonstrated on at least one real program update.

### Phase 3: Intelligent Concierge (Paige) & Personalization
**Goal:** Paige becomes a genuine force multiplier — proactive, personalized, and trustworthy because she operates only over the verified corpus and escalates cleanly.

**Paige Capabilities (Grounded)**
- Answers questions about specific programs or stacks using only the timestamped data + legal extracts (RAG over the verified corpus).
- Optimizes application strategies (“Given your current Uruguay + El Salvador stack and Bitcoin-heavy holdings, here is the order of operations for Georgia that minimizes capital at risk and maximizes Mercosur access within 18 months”).
- Monitors your saved stacks and Nostr activity for rule changes or optimization opportunities and proactively notifies (Nostr DM or in-app).
- Drafts document checklists, cover letters, or email templates to program authorities / lawyers (with clear “this is a starting point, verify yourself” disclaimers and source links).
- Red-flag detection and “when to escalate to human” routing.
- Multilingual from day one where data supports.

**Implementation Notes**
- Initial versions: local or Grok-mediated prompts with retrieval over the stamped JSON + markdown legal extracts. Full provenance in every response (“According to the extract stamped at block 89X,XXX…”).
- Production: Nostr-native service (or hybrid) with user-controlled relays for private context. Optional local LLM for maximum sovereignty.
- System prompt lives in `docs/PAIGE-AI.md` (and root artifacts); it must embed the Prime Directive and require citations to stamped sources.
- Every Paige response that references data should surface the relevant Satohash proof(s).

**Personalization & Memory**
- User profile (local + optional Nostr-published): current stack, target outcomes (tax, mobility, lifestyle, Bitcoin rails), risk tolerance, family composition, capital available, time horizon.
- Paige reads this profile (with explicit user consent) to tailor advice.
- Long-term: on-device or private relay memory of past conversations and decisions, all stampable.

**Success Criteria**
- Paige can answer 80%+ of common questions in the Uruguay flagship document correctly with citations.
- Proactive Nostr alerts fire for at least one simulated or real rule change affecting a user’s saved stack.
- Users report (qualitatively) that Paige surfaces insights they would have missed and reduces time spent cross-referencing sources.
- Escalation paths to human experts (future verified advisor network) are clear and low-friction.

### Phase 4: Marketplace, Ecosystem, and B2G (Two-Sided Flywheel)
**Goal:** Turn the trusted intelligence layer into a trusted coordination and transaction layer.

**Marketplace (BTC-Settled)**
- Services: Bitcoin-only law firms, relocation specialists, tax strategists, apostille services, real estate agents in target jurisdictions, Lightning infrastructure providers.
- Real assets: vetted properties (especially in Uruguay, Georgia, Panama, El Salvador, etc.) and businesses that can be acquired as part of investment pathways.
- Reputation: every completed transaction or review can be optionally stamped and linked to the service provider’s Nostr pubkey.
- Escrow / dispute primitives (Liquid or RGB smart contracts in later iterations; simple multisig or arbitrator-coordinated at first).
- MotoPass takes a small, transparent, BTC-denominated facilitation fee only on successful, completed, stamped transactions.

**Talent & Sponsorship Layer (Future)**
- Bitcoin-skilled individuals seeking residency/sponsorship matched to jurisdictions that want talent and capital.
- Government-facing “verified talent pipeline” products (anonymized aggregates + opt-in individual profiles with proofs).
- Skill attestations that can be stamped.

**Government & Institutional Interfaces (B2G)**
- Anonymized, timestamped data feeds and dashboards for program operators (what Bitcoiners are actually looking for, capital flows, common friction points).
- Licensed software tooling for application intake / tracking (white-label or co-branded).
- Joint research or “Sovereign Stack” pilots with Bitcoin-positive jurisdictions.
- Compliance-friendly export packs for users who need to demonstrate provenance to banks, tax authorities, or the programs themselves.

**Success Criteria**
- At least 5–10 verified service providers listed and receiving (even small) BTC volume through the platform.
- First government or CBI unit pilot (data or tooling).
- Marketplace GMV and fee revenue measurable (even if modest).
- Clear separation between the intelligence layer (trusted, relatively neutral) and the transactional layer (with reputation and optional stamps).

### Phase 5+: Self-Sovereign Deployment, Mobile, and Full OS
**Goal:** Users can run their own instance; the platform becomes a personal + family sovereignty OS that travels with them.

**Self-Hosting & Sovereign Deployment**
- Full static or lightweight server bundle that runs on Umbrel, Start9, Citadel, or any Linux box with a Lightning node.
- Local Paige (via local LLM or relay) with private data.
- Local stamping + verification (user’s own OpenTimestamps calendar or integrated node).
- Optional Tor / I2P or Nostr-native discovery for other sovereign instances.

**Mobile & On-Device**
- Progressive Web App (PWA) excellence for the web app.
- Native companion (React Native / Tauri / native) focused on offline access to your stacks, proofs, Paige chat (local or relay), and payment QR/invoice flows.
- Hardware security module / signing device integration for high-value actions and stamps.

**Advanced Modeling & Automation**
- Full tax scenario engine (with user-provided parameters + verified base data).
- Scenario comparison across dozens of stacks with Monte-Carlo or sensitivity analysis (future).
- Automated monitoring + rebalancing suggestions for residency timelines, renewal deadlines, and tax optimization.
- Integration with personal finance / Lightning treasury tools (balances, UTXO management, coinjoin coordination — all user-side).

**Success Criteria**
- Documented, reproducible self-host instructions that a competent Bitcoiner can follow in <30 minutes.
- At least one jurisdiction pilot using MotoPass tooling or data in production.
- Users are successfully running fully sovereign instances with their own Paige and stamp calendar.
- The “OS” framing is credible: one place where a sovereign manages identity, residency, tax surface, payments, and intelligence with Bitcoin rails and on-chain proofs.

---

## Data Scope — The 50-Country Program (Non-Negotiable Depth)

The heart of the product is not the UI. It is the dataset.

**Master Template v2.0** (from PROJECT-VISION + Uruguay flagship):
- A. Basic Information (official name, flag, government URLs with last-checked + Satohash, program names, type, treaty access)
- B. The 3 Critical Tests (Live & Work Rights, Scope of Freedom / passport strength / visa-free, Dual Citizenship)
- C. Investment / Financial Requirements (min/typical, types, all fees, ongoing/renewal, tax benefits with citations, real-time BTC calculator)
- D. Process & Timeline (step-by-step, min/avg/max, required docs checklist, background/interview, path to citizenship)
- E. Legal & Compliance (deep extracts from laws/decrees/gazettes with Satohash proofs, official sources, recent changes with Nostr alert triggers, property/banking rights)
- F. Lifestyle & Practical (cities, safety, speech, healthcare, education, local Bitcoin economy / btcmaps density, Paige living tips)
- G. Bitcoin-Native Features (direct acceptance? preferred method — BOLT12/Silent/etc., timestamping status)
- H. Paige AI Fields (common questions + optimized answers, red flags/gotchas, country-specific optimization, escalation triggers)

**Expansion Plan**
- Seed (current): 16
- Near-term target (Phase 1): 25–30 at full depth, prioritized by Bitcoin signal + tax attractiveness + mobility (El Salvador, Uruguay, UAE, Switzerland, Singapore, Georgia, Panama, Malta, St Kitts, Antigua, Dominica, Paraguay, Argentina, Spain/Portugal watch, Ireland, Vanuatu, etc.)
- Full target: 50 (include more Caribbean, Pacific, African, additional EU/EEA, Latin America, and emerging Bitcoin-positive jurisdictions).
- Ongoing: every program has a living “last verified” + change log driven by Nostr events.

**Quality Bar**
- No program entry is published without sources + Satohash placeholder (or real stamp).
- “To be filled” or low-confidence fields are explicitly marked.
- Tax and Bitcoin sections are written for Bitcoin holders, not generic investors.
- Paige fields are practical and tested against real questions.

This data work is the highest-leverage ongoing investment. The UI can be rebuilt; the verified corpus compounds.

---

## Technical Architecture Evolution (Summary)

See also future `ARCHITECTURE.md`.

**Phase 0–1**: Static assets + Vite SPA. Data as versioned JSON (or later data packs). Local state. Optional simple backend only for payments / Paige relay.

**Phase 2**: Nostr as identity + pub/sub backbone. Lightning node or BTCPay Server for invoices. Satohash/OpenTimestamps client or API calls. Optional minimal API for stamping coordination and proof serving.

**Phase 3+**: Paige service (Nostr bot or hybrid). Marketplace coordination layer (listings, reputation, optional escrow coordination). Analytics (privacy-first). Self-host bundles (static + optional lightweight server components + embedded Lightning).

**Privacy & Security Posture**
- Local-first by default.
- Nostr private relays for sensitive context.
- No central KYC for core intelligence and simulation features.
- All high-value actions produce optional on-chain proofs.
- User controls their own data export and can run their own instance.

**Deployment Options**
- Public hosted (convenience)
- Self-hosted static (high privacy)
- Self-hosted with local Lightning + Paige (maximum sovereignty)

---

## Non-Functional Requirements & Constraints

- **Verifiability over convenience**: If a feature would require hiding or softening the timestamping requirement, it is redesigned or deprioritized.
- **Bitcoin rails first**: Fiat fallbacks are allowed for onboarding or edge cases, but the happy path and the brand are Lightning/BTC.
- **Privacy as default**: Data minimization. User owns their stack and history.
- **Beauty as a feature**: The DESIGN.md system is mandatory for all customer-facing surfaces. Premium dark sovereign aesthetic is table stakes.
- **Agent-friendly process**: All major artifacts live in this folder. Handoff skill is used. BUILD numbers increment. Documentation is updated before or with the code.
- **No dark patterns**: Clear disclaimers that MotoPass provides intelligence and tools, not legal or tax advice. Escalation to qualified humans is encouraged for complex situations.

---

## Success Metrics (Across Phases)

- Data: % of 50 countries at v2.0 flagship depth with real Satohash proofs.
- Experience: Time-to-first-useful-insight for a new visitor; % of users who create and save at least one stack.
- Verifiability: Number of third-party verifications of MotoPass stamps; number of user-generated stamped artifacts.
- Bitcoin usage: Lightning volume (fees + marketplace); % of premium tier payments in BTC/Lightning.
- Intelligence layer: Paige answer quality + citation rate; reduction in user-reported research time.
- Ecosystem: Number of verified advisors/providers; government partnership pipeline; self-hosted instance count (later).
- Retention & reputation: Returning sovereigns; Nostr follower / engagement growth; qualitative “this changed how I think about sovereignty” feedback.

---

## Risks & Mitigations (Product View)

- **Data staleness / program changes**: Mitigation = Nostr-driven change events + visible last-verified + Satohash + human review queue. Never claim perfection; claim verifiability and freshness process.
- **Regulatory or perception risk**: Clear disclaimers everywhere. Focus on legal government programs. “Truth You Can Verify” + transparent sourcing is the best defense.
- **Bitcoin ecosystem immaturity** (BOLT12 adoption, Nostr relay reliability, OpenTimestamps UX): Build graceful fallbacks; make the ideal path visible and rewarding; contribute to the broader ecosystem where it helps MotoPass.
- **Scope creep**: This document + the phased structure exists precisely to make “what’s in / out” decisions legible. Use the phases as gates.
- **Agent / process drift**: Enforce the single-source-of-truth folder, handoff skill, and documentation updates as non-negotiable rituals.

---

## How to Use This Document

- **For new agents / contributors**: Read this after the root README and EXECUTIVE-SUMMARY. It is the map.
- **For prioritization**: Every proposed feature should map to a phase and success criterion here. If it doesn’t, articulate why the scope is expanding and update the doc.
- **For partners / governments**: The phased view + data depth + verifiability requirement explain why MotoPass is different and why the timeline is what it is.
- **For the team**: This is the reference that prevents “we’re just building a dashboard” underestimation of the real ambition — and the reference that keeps ambition grounded in executable phases.

---

## Closing

We are building the trusted, verifiable, Bitcoin-native command center for people who take sovereignty seriously.

The pristine demo proves the aesthetic, the data quality, and the immediate usefulness. The modern dev environment (`npm run dev`) is the bridge to the full interactive experience. The documentation you are reading makes the total scope, the non-negotiables, and the sequencing explicit.

From 16 countries to 50 at flagship depth. From a beautiful static file to a living, Nostr-native, Lightning-paying, Paige-assisted, self-hostable sovereign OS. From “here is some research” to “every claim you see, every action you take, and every sat you move is independently verifiable on the blockchain.”

That is how much we are going to build.

**Truth You Can Verify.**

Now we execute — phase by phase, with precision, beauty, and uncompromising Bitcoin alignment.

— Product & Scope Layer, MotoPass  
BUILD-2026.07.07-26

**Cross-references**  
- Docs: `docs/PROJECT-VISION.md`, `docs/DESIGN-CONTEXT.md`, `docs/NEXT-PROMPT.md`, `docs/SOURCE-OF-TRUTH.md`, `docs/UPDATES-MAP.md`, `README.md`  
- Research: `research/uruguay-flagship.md` + `countries.json`  
- This docs/ suite: EXECUTIVE-SUMMARY, MARKETING, DATA-MODEL (future), BITCOIN-VERIFICATION (future), PAIGE-AI (future), etc.