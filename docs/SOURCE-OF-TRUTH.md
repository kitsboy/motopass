# SOURCE-OF-TRUTH — MotoPass

**Project:** MotoPass
**Date:** 2026.11.10
**BUILD:** `2026.11.10-6d4bb1b` (last verified live)
**Commit:** `a5226ba` (latest code, pushed to `main`)

## Project overview

MotoPass is the premium Bitcoin-native platform for sovereign passports, citizenship-by-investment (CBI), residency-by-investment (RBI), and jurisdictional stacking.

**Prime directive:** “Truth You Can Verify.” Every material data point must be independently verifiable on Bitcoin via OpenTimestamps + Satohash.

**Folder:** `/Users/cam/projects/motopass/` — canonical perpetual source of truth for M3 (Grok) and M4 (Kimi/HERMES).

## Live & deploy

| Item | Value |
|------|-------|
| **URL** | https://motopass.giveabit.io |
| **Repo** | https://github.com/kitsboy/motopass.git |
| **Branch** | `main` |
| **Deploy** | Cloudflare Pages project `motopass` only |
| **Demo** | https://motopass.giveabit.io/website/index.html |
| **Data** | https://motopass.giveabit.io/research/countries.json |
| **BTC Map** | https://motopass.giveabit.io/btcmap |

## Core assets

| Asset | Path | Status |
|-------|------|--------|
| React app | `src/` + `npm run dev` | BUILD-6d4bb1b — routes include `/tools` and `/tools/receipt`, dark mode, BTC Map, ₿-first pricing |
| Program data | `research/countries.json` | **21 programs** |
| BTC Map cache | `public/data/btcmap/` | **21 snapshot files** for the curated catalog |
| BTC Map density | `public/data/btcmap-density.json` | Merchant counts per program |
| Static demo | `website/index.html` | Luminous Sovereign light theme |
| Design system | `docs/DESIGN-CONTEXT.md`, `docs/DESIGN-TOKENS.md` | Canonical |
| Documentation | `docs/` | Full suite — see `docs/README.md` |
| Handoff | `docs/KIMI-HANDOFF.md` | Append each session |
| Updates | `docs/UPDATES-MAP.md` | Build history & queue |

## Current capabilities (shipped)

- Programs explorer (card + table, filters, breadcrumbs) — **21 deep flagships**
- **Verification tools** (`/tools`, `/tools/receipt`) — **14 tools · 12 local · 2 network**: BOLT11/BOLT12, Lightning, PSBT/address, Silent Payments, NIP-17, NIP-05, BIP-137/BIP-322, zaps, payment evidence and shared receipts. BIP-322 has bounded full/proof-of-funds support; unsupported scripts are inconclusive. Receipts travel in the URL fragment, can be handed off by QR, checked in batches, diffed against an independent copy and anchored by digest only.
- Portfolio, Stack Simulator, **Finance Compare** (BUILD-66 eager route — glass matrix, mobile scroll, immediate empty state), Blog, Agents
- **Seal** (`/vault`) — OTS upload, hash verify, proofs for the curated 21 on disk
- **Forge** (`/distressed`) — curated + permissionless marketplace, PSBT escrow stub
- **Apply** (`/apply`) — Launch Engine gated applications, 5/5 gate scorecard
- **Launch Engine** — `npm run launch:gate` → `public/launch-gates.json`
- **Canonical nav** — `src/lib/navRoutes.ts` (8 links, mobile bottom + More sheet)
- **Sovereign UI** — glass cards, BTC textures, dark default, motion polish
- **Country intel deepened** — **24/50 programs** re-verified/corrected across 5 batches (Aug 21–22): El Salvador legal-tender revocation (Feb 2025), Panama threshold corrections, Portugal nationality reform, Malta CBI termination, Thailand payment-tool ban, + 19 more (see `docs/KIMI-HANDOFF.md` top entry). The live catalog is now the curated 21.
- **Research-pipeline blueprint** — `docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md`: questionnaire, 50-country hot-button map (August snapshot; the live catalog is now the curated 21), source-criteria, free-first API table, build plan for the Satohash-anchored source-trust engine
- **BTC Map layer** (`/btcmap`): Leaflet map, merchant list, area chips, program modal panel
- **Merchant density badges** on program cards (sparse / moderate / dense)
- **Nostr NIP-98** sign-in for BTC Map saved merchants (heart toggle)
- **Offline BTC Map cache** — cache-first, API refresh fallback
- Nostr connect + **BUILD 68 timestamp attestations** (kind `30078` + Satohash tags; NIP-07 sign or copyable stub)
- Satohash API stamp + poll + health; honest “Proof on file” vs Bitcoin-verified badges
- Payment methods: live LN Address QR + on-chain donation; other rails labeled demo
- i18n (10 locales + page keys), SEO meta + hreflang, FAQ JSON-LD
- Playwright e2e (**33 tests**), Vitest (**631 passed / 2 skipped**), CI bundle budget, `npm run tools:check` and `npm run deploy:all`
- **Bitcoin-first pricing** — `BtcDualPrice`; `research/pitch-anchor.json` via `npm run pitch:sync`

## Gaps & next priorities

1. **Country intel** — research `last_checked` is 2026-11-08 from pages that actually loaded. Intel calls that fresh for 30 days, matching the trust envelope. Bahamas and Mexico stay unreachable. `cbiu.gov.dm` and `cnmv.es` can probe ok and still are not the 8 Nov human read. The 9 Nov probe left Uruguay unchanged. The human re-read URL stays `https://www.gub.uy/tramites/residencia-legal`.
2. **Source-trust engine** — Build the registry + discovery + Satohash-anchored source hashes from the Claude prompt spec
3. **Bitcoin core** — Live Satohash stamp and receipt digest anchoring are shipped; a real Satohash confirmation and camera QR pass remain to test, and the Lightning BOLT11 mint is still open
4. **Nostr** — Attestations ship (BUILD 68); live MotoPass relay + npub-native routing still open
5. **PSBT escrow** — Real 2-of-3 after legal sign-off
6. **Paige AI** — Move from simulated to real concierge
7. **CI** — Generate `dist/` in pipeline (not committed; weekly `btcmap:sync` already ships)

## Agent instructions

- **Session start:** `GROK-SESSION-PROTOCOL.md` → `docs/KIMI-HANDOFF.md` → `docs/UPDATES-MAP.md`
- **Session end:** Append handoff, update `LATEST-UPDATE.md`, push `main`
- **UI work:** Obey `docs/DESIGN-CONTEXT.md` + `docs/DESIGN-TOKENS.md`
- **Scope:** `docs/PRODUCT-SCOPE-ROADMAP.md`
- **BTC Map refresh:** `npm run btcmap:density && npm run btcmap:sync`
- **Pitch figures refresh:** `npm run pitch:sync` — updates anchor + `docs/pitch/ANCHOR-SNAPSHOT.md`
- **Pitch policy:** [PITCH-ANCHOR.md](./PITCH-ANCHOR.md) · [pitch/README.md](./pitch/README.md)

## Give A Bit alignment

MotoPass advances Bitcoin sovereignty, financial privacy, and jurisdictional freedom. Part of the Give A Bit family alongside Satohash, Giveabit.io, and Katoa.

---

*Maintained by M3 agents. See `docs/WORK-TREE.md` for complete file map.*