# Directory Map — MotoPass

> **Superseded by [WORK-TREE.md](./WORK-TREE.md)** for the complete file map.  
> This file remains as a quick agent handoff index.

**BUILD:** 2026.07.14-33 · **Live:** https://motopass.giveabit.io · **Commit:** `0ce5e12`

## Quick facts

- **Stack:** React 18 + TypeScript + Vite + Tailwind + Leaflet + Motion
- **Theme:** Sovereign Night default · glass cards · BTC orange accents
- **Programs:** 50 in `research/countries.json` · 50/50 deep flagships
- **Nav:** `src/lib/navRoutes.ts` — canonical 8-link menu
- **BTC Map:** `src/lib/btcmap.ts` + `public/data/btcmap/`
- **Launch:** `scripts/launch-gate-check.mjs` → `public/launch-gates.json`
- **Deploy:** `npm run deploy:all` → Cloudflare Pages `motopass` only
- **Docs hub:** `docs/` (all canonical documentation)

## Entry points

1. `README.md` — Root quickstart
2. `docs/SOURCE-OF-TRUTH.md` — Canonical record
3. `docs/UPDATES-MAP.md` — Build history & queue
4. `docs/WORK-TREE.md` — Full file tree
5. `docs/KIMI-HANDOFF.md` — Latest session handoff
6. `.ai_docs/context_map.md` — Agent context map

## Key paths

| Path | Purpose |
|------|---------|
| `src/lib/buildInfo.ts` | BUILD_ID single source of truth |
| `src/lib/navRoutes.ts` | Canonical nav routes + active-state helpers |
| `src/components/ui/GlassCard.tsx` | Glassmorphism card primitive |
| `src/styles/tokens.css` | Design tokens (glass, BTC textures) |
| `src/` | React app (18 routes) |
| `src/pages/VaultPage.tsx` | Seal — OTS verify UI |
| `src/pages/DistressedPage.tsx` | Forge — distressed marketplace |
| `src/pages/ApplyPage.tsx` | Launch Engine — applications |
| `public/launch-gates.json` | Gate scorecard (CI-generated) |
| `scripts/launch-gate-check.mjs` | 5-gate Launch Engine validator |
| `src/lib/btcmap.ts` | BTC Map API v4 client |
| `src/components/btcmap/` | Leaflet map, places list, report CTA |
| `public/data/btcmap/` | Offline merchant snapshots |
| `research/countries.json` | Program data (50) |
| `research/oracle-seed.json` | G4 Ledger oracle seed |
| `website/index.html` | Static demo |
| `docs/DESIGN-CONTEXT.md` | UI direction |
| `docs/ARCHITECTURE.md` | System architecture |
| `scripts/verify-goal.sh` | Verification |

## Commands

```bash
npm run dev
npm run build && npm test && npm run test:e2e
npm run btcmap:density && npm run btcmap:sync
npm run launch:gate
npm run sync:build && npm run pitch:sync
npm run deploy:all
```

See [WORK-TREE.md](./WORK-TREE.md) for the complete map.

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*