---
title: Sovereign Stack — 4 Core Pillars
project: MotoPass
version: 1.0.0
last_updated: 2026-07-14
build: 2026.07.14-33
self_evolving: true
bitcoin_display_policy: Bitcoin-first — all figures via PITCH-ANCHOR + BtcDualPrice UI
pitch_anchor: docs/PITCH-ANCHOR.md
sync_command: npm run pitch:sync
tags: [pillars, architecture, pitch, btc]
---
# MotoPass Sovereign Stack — 4 Core Pillars Spec

**Date:** 2026-07-14  
**Build:** `2026.07.14-28`  
**Figures:** [PITCH-ANCHOR.md](./PITCH-ANCHOR.md) (₿ primary · USD secondary)  
**Status:** Pre-launch — intelligence MVP live; applications not yet accepted  
**Live:** https://motopass.giveabit.io  
**Prime directive:** Truth You Can Verify — Satohash + OpenTimestamps on every material claim

---

## Overall Smart Flow

One linear pipeline. No maze. Bitcoin operators move left-to-right; each stage feeds the next.

```
Discover → Prove → Track → Operate
   │          │        │         │
 Forge  →  Seal  →  Ledger  →  Nexus
```

| Stage | Pillar | One-liner |
|-------|--------|-----------|
| **Forge** | Sovereign Asset Forge | Find and structure the deal (program, asset, pathway). |
| **Seal** | Verifiable Investment Provenance Seal | Stamp claims on Bitcoin; issue portable credentials. |
| **Ledger** | Residency Intelligence Ledger | Track programs, compliance, timelines — Uruguay + Bolivia first, 50 expandable. |
| **Nexus** | Elite Sovereign Nexus | Club layer: Nostr identity, Kimi agents, orchestration, BTC/Lightning rails. |

**MotoPass today:** Forge + Ledger are partially live (`countries.json`, `/programs`, `/btcmap`, simulator). Seal and Nexus are stubbed (Satohash URLs, Nostr connect, Paige simulated). This spec is the map to wire all four.

---

## Pillar 1: The Sovereign Asset Forge

**Tagline:** *Where sovereign deals are discovered, modeled, and executed — before lawyers bill you for the same spreadsheet.*

### What it is

Discovery + deal execution layer: distressed assets, RBI/CBI pathways, jurisdictional stacking options, and BTC-denominated cost modeling — all in one forge, not scattered PDFs and Telegram groups.

### Key components

| Component | Role |
|-----------|------|
| **Program explorer** | 50 jurisdictions from `research/countries.json` — filters, cards, compare, simulator |
| **BTC Map layer** | Merchant density + `/btcmap` — real Bitcoin economy per jurisdiction (btcmap.org v4 + offline cache) |
| **Stack simulator** | Multi-program stacking: cost, timeline, sovereignty uplift |
| **Distressed / value plays** | Flag undervalued pathways (e.g. Bolivia low-solvency route, Uruguay Rentista vs RE fork) |
| **BTC cost rails** | `BtcDualPrice` + live spot — ₿ before USD on every amount; Lightning-ready markers |
| **Deal room (future)** | Encrypted Nostr threads per deal — counsel, agent, principal |

### Connection to flow + MotoPass

- **Entry point** of the pipeline: user picks *what* to pursue.
- Feeds **Seal** with artifacts to timestamp (term sheets, program snapshots, fee breakdowns).
- Feeds **Ledger** with chosen programs + target pathways.
- **Nexus** assigns Kimi liaison + escalations.

**Shipped:** `/programs`, `/portfolio`, `/simulator`, `/compare`, `/btcmap`, `ProgramModal`, density badges.  
**Gap:** Distressed-asset tagging, deal-room Nostr threads, real Lightning settlement.

### First steps (manual → agent)

| Phase | Action |
|-------|--------|
| **Manual (now)** | Deepen Uruguay + Bolivia in JSON using `research/uruguay-flagship.md` template; tag "value fork" fields (income vs investment vs company route). |
| **Manual (now)** | Add `pathway_type` enum per program: `rentista`, `real_estate`, `company_investment`, `solvency_proof`, `cbi_donation`, etc. |
| **Code** | Extend `src/lib/programAdapter.ts` + `ProgramModal` tabs: **Pathways**, **Distressed Notes**, **BTC Map link**. |
| **Agent** | Kimi weekly scrape of official immigration gazettes → Nostr `kind:30078` program-update events → Forge refresh queue. |
| **Agent** | Paige (later): "Which pathway minimizes capital lock-up?" using Forge data only — cite Satohash proof IDs. |

### Why it's smarter / easier

Traditional CBI/RBI = opaque lawyer gate + stale brochures. Forge gives **comparable, filterable, BTC-native modeling** in minutes. Stack simulator alone replaces weeks of spreadsheet work. BTC Map proves you're not moving to a Bitcoin desert.

---

## Pillar 2: The Verifiable Investment Provenance Seal

**Tagline:** *Every number, document, and claim gets a Bitcoin birth certificate — or it doesn't ship.*

### What it is

Credential engine: OpenTimestamps + Satohash proofs on program data, user milestones, fee quotes, and legal extracts. Portable, independently verifiable — MotoPass doesn't ask for trust.

### Key components

| Component | Role |
|-----------|------|
| **Satohash.io** | Human-readable proof URLs per field (`program_snapshot`, `legal_extract`, `fee_schedule`) |
| **OpenTimestamps** | `.ots` files for raw documents (PDFs, apostille scans) |
| **Block height anchor** | `last_verified_block` on every program — ties claim to chain time |
| **Proof badges** | UI: `ProofBadge`, footer block height, `/vault` verify paste |
| **Nostr attestations** | Signed `kind:1063` (or custom) events referencing proof hashes — social corroboration |
| **Credential export** | JSON-LD + npub-linked proof bundle for advisors / second opinion |

### Connection to flow + MotoPass

- Sits between **Forge** (what you chose) and **Ledger** (what you're tracking).
- Every Ledger state change should reference a Seal proof ID.
- **Nexus** members see proof lineage on club dashboards.

**Shipped:** Stub `satohash_proofs[]` in `countries.json`, `ProofBadge`, block height display, FAQ JSON-LD.  
**Gap:** Real stamping pipeline (replace `aaaaaaaa…` stub URLs), OTS file upload, Nostr attestation relay.

### First steps (manual → agent)

| Phase | Action |
|-------|--------|
| **Manual (now)** | Pick 5 flagship programs; hash canonical JSON slice → submit to Satohash; replace stub URLs in `countries.json`. |
| **Manual (now)** | Document proof schema in `docs/BITCOIN-VERIFICATION.md`: `field`, `content_hash`, `block_height`, `proof_url`, `ots_path`. |
| **Code** | `src/lib/satohash.ts` — stamp, verify, resolve; wire `ProgramModal` → "Verify on Bitcoin" opens real proof. |
| **Code** | `scripts/stamp-programs.sh` — batch stamp changed programs on `countries.json` diff. |
| **Agent** | CI gate: fail if `countries.json` changes without updated `last_verified_block` + proof URL. |
| **Agent** | Kimi monitors Satohash verify endpoint; Nostr alert on stamp failure or expiry policy. |

### Why it's smarter / easier

Lawyers sell confidence; MotoPass sells **verification**. One click to independent chain proof beats a letterhead. For Bitcoin operators, this is table stakes — and almost nobody in CBI/RBI does it.

---

## Pillar 3: The Residency Intelligence Ledger

**Tagline:** *Your jurisdictional stack, compliance clock, and program oracle — one ledger, fifty corridors, zero amnesia.*

### What it is

Program tracker + compliance oracle: CIV and residency-by-investment intelligence, renewal deadlines, pathway milestones, official rule changes, and stacking synergies — starting with **Uruguay** and **Bolivia**, expandable to all **50** jurisdictions in `countries.json`.

### Key components

| Component | Role |
|-----------|------|
| **Program registry** | `research/countries.json` — single source; Uruguay flagship template (`research/uruguay-flagship.md`) |
| **Critical Tests** | Live/work rights, scope of freedom, dual citizenship — pass/fail per program |
| **Compliance clock** | Residency day-count, renewal dates, citizenship eligibility windows |
| **Rule-change oracle** | Official source URLs + Nostr alerts when immigration rules shift |
| **Portfolio sync** | `/portfolio` acquired programs + stacking synergy scores |
| **BTC Map cross-ref** | Merchant density tier per jurisdiction — lifestyle + spend reality check |
| **Paige fields** | Common questions, red flags, optimization tips, escalation triggers |

### Connection to flow + MotoPass

- Receives selections from **Forge**; requires **Seal** proofs on every material update.
- Drives **Nexus** alerts (Kimi liaison, renewal nudges, club intel).
- Powers diligence pack honesty: "16/50 depth" → target "50/50 flagship depth."

**Shipped:** 50 programs (wide), portfolio route, simulator, Uruguay `.md` flagship, BTC Map cache for all 50.  
**Gap:** Deep fields not in JSON yet (`critical_tests`, `legal_compliance`, `pathways[]`); Bolivia placeholder; compliance clock not implemented.

### Flagship notes: Uruguay 🇺🇾

| Pathway | Threshold / notes |
|---------|-------------------|
| **Real estate investment** | ~USD $100,000 minimum; foreigners may own beachfront/rural with few restrictions |
| **Rentista / income proof** | ~$1,500/month sustained income; lower capital lock-up than RE route |
| **Bank deposit / bonds** | Equivalent passive investment routes; good for BTC→fiat structuring |
| **Gov + processing fees** | ~$15,000–$25,000 all-in (legal, DD, application) |
| **Timeline** | 4–8 months residency; cédula → Mercosur mobility (~10 countries) |
| **Citizenship path** | 3–5 years residency + basic Spanish; dual citizenship fully allowed |
| **Tax** | Territorial system — foreign/crypto gains often favorable; up to 11-year holiday in some regimes |
| **Bitcoin** | Growing Lightning in Montevideo/Punta; Lightning-ready flag in JSON |
| **3 Critical Tests** | ✅ Live/work ✅ Mercosur scope ✅ Dual citizenship — **flagship pass** |

**Ledger fields to add:** `pathways[]`, `critical_tests`, `legal_compliance`, `renewal_interval_months`, `citizenship_eligibility_years`, `paige_fields`.

### Flagship notes: Bolivia 🇧🇴

| Pathway | Threshold / notes |
|---------|-------------------|
| **Investor / company route** | Business establishment or capital investment — **no pure CBI** (no passport-for-donation program) |
| **Low solvency option** | Lower capital pathways via solvency proof / fixed deposit — attractive for budget stacking (verify current SUPREME DECREE thresholds) |
| **Land / property** | Foreign ownership restrictions apply in border/security zones; standard urban RE often viable — **flag for legal review** |
| **JSON placeholder today** | `status: "To be filled"` — min ~$80k stub; `crypto_friendly_score: 5`; research pending |
| **Bitcoin** | Emerging regulation; monitor policy; `lightning_ready: false` until verified |
| **Stacking synergy** | Low vs Uruguay — use as **value / distressed** candidate, not primary hub |
| **3 Critical Tests** | ⚠️ Research needed — dual citizenship policy, work rights scope, passport mobility weaker than Uruguay |

**Ledger priority:** Bolivia = proof-of-template for **non-CBI, company/solvency routes** and honest "to be filled" staging in the ledger.

### First steps (manual → agent)

| Phase | Action |
|-------|--------|
| **Manual (now)** | Migrate Uruguay flagship sections A–H into `countries.json` nested schema. |
| **Manual (now)** | Research Bolivia investor/solvency route from official Migración + INRA land rules; fill Critical Tests honestly. |
| **Code** | `src/types/program.ts` — add `Pathway`, `CriticalTests`, `ComplianceClock`, `PaigeFields` types. |
| **Code** | `ProgramModal` tabs: Overview · Pathways · Critical Tests · Legal · Compliance Clock · BTC Map |
| **Code** | `/portfolio` compliance widget: days-to-renewal, citizenship eligibility countdown |
| **Agent** | Kimi: weekly diff official sources → update Ledger → trigger Seal re-stamp |
| **Agent** | Expand 3 programs/week to flagship depth until 50/50 |

### Why it's smarter / easier

One JSON schema + one modal pattern scales to 50 countries. Uruguay proves the template; Bolivia proves the long tail (no CBI, solvency, land caveats). Users stop maintaining Notion spreadsheets; the ledger remembers renewals they will forget.

---

## Pillar 4: The Elite Sovereign Nexus

**Tagline:** *The cool club layer — Nostr identity, Kimi agents, BTC rails, and orchestration for operators who don't do bureaucracy.*

### What it is

Club + orchestration: npub-native identity, country liaison agents (Kimi), Paige concierge routing, Lightning/BTC payments, and multi-agent handoffs (M3 Grok code ↔ M4 Kimi/Hermes orchestration). Pre-launch = intel + coordination only; applications open when Seal + Ledger are deep enough.

### Key components

| Component | Role |
|-----------|------|
| **Nostr npub identity** | `/register` — user sovereign ID; separate from BTC Map NIP-98 session |
| **Kimi liaison agents** | `/agents` — per-jurisdiction guides; Kimi NIP-05 cross-agent awareness |
| **Paige AI** | Concierge Q&A routed to Ledger + Seal proofs; escalate to human counsel |
| **BTC / Lightning** | Fee quotes, deposit instructions, BOLT12-ready payment stubs |
| **Club access** | Future: gated Nostr relay, member kind events, sovereign stack leaderboard |
| **Hermes orchestration** | M4 MASTER-BRAIN, Obsidian vault, `docs/KIMI-HANDOFF.md` sync via Tailscale |
| **Agent mesh** | M3 (Grok/Cursor) ships code; M4 (Kimi) owns docs, audits, weekly SEO/program refresh |

### Connection to flow + MotoPass

- **Orchestrates** all three upstream pillars: Forge discoveries → Seal credentials → Ledger state.
- User's npub ties portfolio, saved BTC Map merchants (NIP-98), and club comms.
- Pre-launch messaging: "Intelligence + coordination; applications coming when proofs are real."

**Shipped:** `/agents`, `/register`, Nostr connect stub, BTC Map NIP-98 saves, Kimi cards, Paige simulated chat, `GROK-SESSION-PROTOCOL.md` handoff chain.  
**Gap:** Live MotoPass relay, real npub auth, Paige backend, Lightning settlement, club gating.

### First steps (manual → agent)

| Phase | Action |
|-------|--------|
| **Manual (now)** | Document Nexus member journey in `docs/PAIGE-AI.md`: anon browse → npub register → save portfolio → agent DM → proof verify. |
| **Manual (now)** | Kimi: add MotoPass to MASTER-BRAIN Kanban with 4-pillar tags. |
| **Code** | `src/lib/nostr.ts` — real relay list, nip-07 connect, encrypted DM stub for agent escalation |
| **Code** | Paige: RAG over `countries.json` + Uruguay flagship only; every answer cites `proof_url` or says "unverified" |
| **Agent** | Kimi weekly: SEO audit, program oracle diff, handoff append to `docs/KIMI-HANDOFF.md` |
| **Agent** | Hermes: Nostr relay deploy when npub DMs exceed stub threshold |

### Why it's smarter / easier

Bitcoin operators already have npubs. Nexus meets them where they are — no Salesforce, no "book a call" calendly hell. Kimi agents + Paige + proofs = elite club without velvet rope bullshit. Hermes keeps M3 honest and M4 current without chat log dumps.

---

## Next Steps

### Turn this spec into code/files

| Order | Deliverable | Path | Pillar |
|-------|-------------|------|--------|
| 1 | Program schema v2 (pathways, critical_tests, paige_fields) | `src/types/program.ts`, `research/countries.json` | Ledger |
| 2 | Uruguay full JSON migration | `research/countries.json` + stamp | Ledger + Seal |
| 3 | Bolivia research fill | `research/bolivia-flagship.md` → JSON | Ledger |
| 4 | ProgramModal depth tabs | `src/components/programs/ProgramModal.tsx` | Ledger |
| 5 | Satohash stamp script | `scripts/stamp-programs.sh`, `src/lib/satohash.ts` | Seal |
| 6 | Hero + SEO promote BTC Map | `src/pages/PitchPage.tsx`, `src/components/SeoHead.tsx` | Forge |
| 7 | Compliance clock component | `src/components/portfolio/ComplianceClock.tsx` | Ledger |
| 8 | Nexus journey + relay stub | `src/lib/nostr.ts`, `docs/PAIGE-AI.md` | Nexus |

### Incremental build advice

1. **One pillar per sprint week** — don't parallel all four; Ledger+Seal unlock everything else.
2. **5 flagships before 50** — Uruguay, Bolivia, UAE, El Salvador, Portugal; prove schema before mass migration.
3. **Real proofs before club gates** — Nexus membership means nothing without Seal integrity.
4. **BUILD bump + handoff every session** — append `docs/KIMI-HANDOFF.md`, update `LATEST-UPDATE.md`, push `main`.
5. **Pre-launch copy everywhere** — "Intelligence MVP; applications not yet accepted" until Seal pipeline is live.

### Hermes / Kimi integration

| Item | Owner | Action |
|------|-------|--------|
| This spec | M3 | Committed at `docs/SOVEREIGN-STACK-4-PILLARS.md` |
| Weekly program oracle | M4 Kimi | Diff official sources → handoff section → Cam approves JSON merge |
| SEO + schema | M4 Kimi | `docs/SEO.md` audit queue → M3 implements JSON-LD |
| MASTER-BRAIN | M4 | 4 pillars as Kanban swimlanes; link to BUILD 28 baseline |
| Sync trigger | Cam | Tailscale Obsidian sync when Kimi or Grok says "time to sync" |
| No raw chats | Both | Only `KIMI-HANDOFF.md` + `SESSION-SUMMARY-*.md` cross the wire |

### Success criteria (pre-launch → launch)

- [ ] Uruguay + Bolivia at full flagship depth in JSON with **real** Satohash proofs
- [ ] ProgramModal shows Critical Tests, Pathways, Compliance Clock for flagships
- [ ] Forge promotes BTC Map from hero; merchant density on pitch metrics
- [ ] Stamp CI gate on `countries.json` changes
- [ ] Nexus: npub register persists portfolio; Paige cites proofs on flagship Q&A
- [ ] Diligence pack + this spec aligned — honest stage, no application CTAs until ready

---

*Safe Harbour · Give A Bit family · motopass.giveabit.io · BUILD 2026.07.14-28*