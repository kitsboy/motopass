# Directory Map — MotoPass

> **Superseded by [WORK-TREE.md](./WORK-TREE.md)** for the complete file map.  
> This file remains as a quick agent handoff index.

**BUILD:** 2026.07.07-26 · **Live:** https://motopass.giveabit.io

## Quick facts

- **Stack:** React 18 + TypeScript + Vite + Tailwind + Leaflet
- **Programs:** 50 in `research/countries.json`
- **BTC Map:** `src/lib/btcmap.ts` + `public/data/btcmap/`
- **Deploy:** Cloudflare Pages `motopass` only
- **Docs hub:** `docs/` (all canonical documentation)

## Entry points

1. `README.md` — Root quickstart
2. `docs/SOURCE-OF-TRUTH.md` — Canonical record
3. `docs/UPDATES-MAP.md` — Build history & queue
4. `docs/WORK-TREE.md` — Full file tree
5. `docs/KIMI-HANDOFF.md` — Latest session handoff

## Key paths

| Path | Purpose |
|------|---------|
| `src/` | React app (15 routes) |
| `src/lib/btcmap.ts` | BTC Map API v4 client |
| `src/components/btcmap/` | Leaflet map, places list, report CTA |
| `public/data/btcmap/` | Offline merchant snapshots |
| `research/countries.json` | Program data (50) |
| `website/index.html` | Static demo |
| `docs/DESIGN-CONTEXT.md` | UI direction |
| `scripts/verify-goal.sh` | Verification |

## Commands

```bash
npm run dev
npm run build && npm test && npm run test:e2e
npm run btcmap:density && npm run btcmap:sync
npm run deploy:safe
```

See [WORK-TREE.md](./WORK-TREE.md) for the complete map.

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*