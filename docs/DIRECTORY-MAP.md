# Directory Map — MotoPass

> **Superseded by [WORK-TREE.md](./WORK-TREE.md)** for the complete file map.  
> This file remains as a quick agent handoff index.

**BUILD:** 20260702-012 · **Live:** https://motopass.giveabit.io

## Quick facts

- **Stack:** React 18 + TypeScript + Vite + Tailwind
- **Programs:** 50 in `research/countries.json`
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
| `src/` | React app |
| `research/countries.json` | Program data (50) |
| `website/index.html` | Static demo |
| `docs/DESIGN-CONTEXT.md` | UI direction |
| `scripts/verify-goal.sh` | Verification |

## Commands

```bash
npm run dev
npm run build && npm test
npm run deploy:safe
```

See [WORK-TREE.md](./WORK-TREE.md) for the complete map.

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*