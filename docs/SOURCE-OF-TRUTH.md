# SOURCE-OF-TRUTH — MotoPass

**Project:** MotoPass  
**Date:** 2026-07-14  
**BUILD:** 2026.07.14-32  
**Commit:** `41238c2` (feature) / `aaafb91` (handoff)

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
| React app | `src/` + `npm run dev` | BUILD-32 — 15 routes, dark mode, BTC Map, ₿-first pricing |
| Program data | `research/countries.json` | **50 programs** |
| BTC Map cache | `public/data/btcmap/` | **50 jurisdiction snapshots** |
| BTC Map density | `public/data/btcmap-density.json` | Merchant counts per program |
| Static demo | `website/index.html` | Luminous Sovereign light theme |
| Design system | `docs/DESIGN-CONTEXT.md`, `docs/DESIGN-TOKENS.md` | Canonical |
| Documentation | `docs/` | Full suite — see `docs/README.md` |
| Handoff | `docs/KIMI-HANDOFF.md` | Append each session |
| Updates | `docs/UPDATES-MAP.md` | Build history & queue |

## Current capabilities (shipped)

- Programs explorer (card + table, filters, breadcrumbs)
- Portfolio, Stack Simulator, Finance Compare, Vault, Blog, Agents
- **BTC Map layer** (`/btcmap`): Leaflet map, merchant list, area chips, program modal panel
- **Merchant density badges** on program cards (sparse / moderate / dense)
- **Nostr NIP-98** sign-in for BTC Map saved merchants (heart toggle)
- **Offline BTC Map cache** — cache-first, API refresh fallback
- **Report venue CTA** — btcmap.org/add-location + btcmap-cli bridge
- Nostr connect stub, Satohash verify UI, payment methods stub
- i18n (10 locales + page keys), SEO meta + hreflang, FAQ JSON-LD
- Luminous Sovereign light UI + Sovereign Night dark toggle
- Playwright e2e (16 tests), CI bundle budget, sitemap generator
- **Bitcoin-first pricing** — `BtcDualPrice` on pitch, programs, compare, portfolio, simulator; `research/pitch-anchor.json` via `npm run pitch:sync`

## Gaps & next priorities

1. **Data depth** — Expand all 50 countries to Uruguay flagship template
2. **Bitcoin core** — Real Satohash stamping, Lightning settlement
3. **Nostr** — Live MotoPass relay, full npub-native applications
4. **Paige AI** — Move from simulated to real concierge
5. **CI** — Generate `dist/` in pipeline; weekly `btcmap:sync` cron

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