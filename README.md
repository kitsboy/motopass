# MotoPass — Bitcoin Sovereign Passports & Residency

**BUILD 2026.07.15-64** · Last updated: 2026-07-15

[![CI](https://github.com/kitsboy/motopass/actions/workflows/ci.yml/badge.svg)](https://github.com/kitsboy/motopass/actions/workflows/ci.yml)
[![Live](https://img.shields.io/website?url=https%3A%2F%2Fmotopass.giveabit.io&label=motopass.giveabit.io)](https://motopass.giveabit.io)
[![Programs](https://img.shields.io/badge/programs-50-brightgreen)](https://motopass.giveabit.io/research/countries.json)

**Live:** https://motopass.giveabit.io

Bitcoin-native platform for CBI/RBI programs, jurisdictional stacking, and sovereign mobility. **Prime directive:** “Truth You Can Verify.”

---

## Quickstart

```bash
npm ci
npm run dev          # React app → http://localhost:5173
open website/index.html   # Static demo (zero-build reference)
```

```bash
npm run build && npm test && npm run test:e2e
npm run deploy:safe  # Cloudflare Pages → motopass only
```

### BTC Map data refresh

```bash
npm run btcmap:density   # Merchant counts → public/data/btcmap-density.json
npm run btcmap:sync      # Per-jurisdiction snapshots → public/data/btcmap/
```

---

## Documentation (all in `docs/`)

| Doc | Purpose |
|-----|---------|
| [docs/README.md](docs/README.md) | Documentation hub |
| [docs/UPDATES-MAP.md](docs/UPDATES-MAP.md) | Build history & work queue |
| [docs/WORK-TREE.md](docs/WORK-TREE.md) | Complete file map |
| [docs/SOURCE-OF-TRUTH.md](docs/SOURCE-OF-TRUTH.md) | Canonical project record |
| [docs/KIMI-HANDOFF.md](docs/KIMI-HANDOFF.md) | Latest agent handoff |
| [docs/DESIGN-CONTEXT.md](docs/DESIGN-CONTEXT.md) | UI design (canonical) |
| [docs/PRODUCT-SCOPE-ROADMAP.md](docs/PRODUCT-SCOPE-ROADMAP.md) | Full build scope |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture + BTC Map |

Root stubs (`SOURCE-OF-TRUTH.md`, `DESIGN.md`, etc.) redirect to `docs/`.

---

## Project layout

```
motopass/
├── README.md              ← You are here
├── docs/                  ← All documentation
├── src/                   ← React app (15 routes, dark mode, BTC Map)
├── public/data/           ← BTC Map density + offline cache JSON
├── research/countries.json ← 50 programs
├── website/index.html     ← Static demo
├── images/                ← Sovereign assets
└── scripts/               ← verify-goal, btcmap sync, sitemap
```

---

## Current state (BUILD 64)

- **Sovereign Night** default UI — glass cards, BTC grid/hash textures, orange accents
- **50/50 deep flagships** · Launch Engine 5/5 · applications open at `/apply`
- **Canonical nav** — Programs · Vault · Distressed · BTC Map · Simulator · Compare · Agents · Apply
- Vault (Seal), Distressed (Forge), Apply, Portfolio, Simulator, Compare, Agents, Blog
- **BTC Map** (`/btcmap`) — Leaflet, density badges, Nostr saves, offline cache
- **₿-first pricing** — `BtcDualPrice`, `pitch:sync`, `research/pitch-anchor.json`
- 36 unit + 19 e2e tests · `npm run deploy:all` · package **0.2.0**

**Next:** Live Nostr relay; real PSBT escrow; Paige concierge.

---

## Agents

- **M3 (Grok):** Code, build, push — read `GROK-SESSION-PROTOCOL.md` each session
- **M4 (Kimi):** Orchestration — read `docs/KIMI-HANDOFF.md`

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*


## Diligence / partner pack
Full disclosure for technical & financial partners: **[docs/diligence/](./docs/diligence/)**  
Portfolio map: [Family of 8](https://github.com/kitsboy/giveabit/blob/main/docs/diligence/PORTFOLIO-FAMILY-OF-8.md)

