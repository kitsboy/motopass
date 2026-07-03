# SOURCE-OF-TRUTH — MotoPass

**Project:** MotoPass  
**Date:** 2026-07-02  
**BUILD:** 20260702-012  
**Commit:** `4fe1bb9` (feature) / `c170a35` (handoff)

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

## Core assets

| Asset | Path | Status |
|-------|------|--------|
| React app | `src/` + `npm run dev` | BUILD-011 — 14 routes, dark mode |
| Program data | `research/countries.json` | **50 programs** |
| Static demo | `website/index.html` | Luminous Sovereign light theme |
| Design system | `docs/DESIGN-CONTEXT.md`, `docs/DESIGN-TOKENS.md` | Canonical |
| Documentation | `docs/` | Full suite — see `docs/README.md` |
| Handoff | `docs/KIMI-HANDOFF.md` | Append each session |
| Updates | `docs/UPDATES-MAP.md` | Build history & queue |

## Current capabilities (shipped)

- Programs explorer (card + table, filters)
- Portfolio, Stack Simulator, Finance Compare, Vault
- Nostr connect stub, Satohash verify UI, payment methods stub
- i18n (10 locales), SEO meta, Playwright smoke tests
- Luminous Sovereign light UI + Sovereign Night dark toggle
- Landing motion hero (sovereignty.jpg @ 35% opacity)

## Gaps & next priorities

1. **Data depth** — Expand all 50 countries to Uruguay flagship template
2. **Bitcoin core** — Real Satohash stamping, Lightning settlement
3. **Nostr** — Live relay, npub-native applications
4. **Paige AI** — Move from simulated to real concierge
5. **CI** — Generate `dist/` in pipeline vs committing artifacts

## Agent instructions

- **Session start:** `GROK-SESSION-PROTOCOL.md` → `docs/KIMI-HANDOFF.md` → `docs/UPDATES-MAP.md`
- **Session end:** Append handoff, update `LATEST-UPDATE.md`, push `main`
- **UI work:** Obey `docs/DESIGN-CONTEXT.md` + `docs/DESIGN-TOKENS.md`
- **Scope:** `docs/PRODUCT-SCOPE-ROADMAP.md`

## Give A Bit alignment

MotoPass advances Bitcoin sovereignty, financial privacy, and jurisdictional freedom. Part of the Give A Bit family alongside Satohash, Giveabit.io, and Katoa.

---

*Maintained by M3 agents. See `docs/WORK-TREE.md` for complete file map.*