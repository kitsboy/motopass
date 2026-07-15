# MotoPass Updates Map

**BUILD:** 2026.07.14-33 · **Last updated:** 2026-07-14

Living record of what shipped, what's in progress, and where to find everything. Pair with [WORK-TREE.md](./WORK-TREE.md) for file locations.

---

## Current state (at a glance)

| Area | Status | Notes |
|------|--------|-------|
| **Live site** | ✅ Shipped | https://motopass.giveabit.io |
| **React app** | ✅ 2026.07.14-33 | Vite + React 18 + TS + Tailwind · 15 routes · 16 flagships |
| **BTC Map** | ✅ v2 | `/btcmap` — Leaflet, density badges, Nostr saves, offline cache |
| **E2E smoke** | ✅ Playwright | 16 tests — `npm run test:e2e` |
| **Unit tests** | ✅ Vitest | 30 tests |
| **Improvements** | ✅ 500/500 + BTC Map | Batches 1–20 + BTC Map v1/v2 |
| **Design system** | ✅ Warm Sovereign Cinematic | Luminous light + dark toggle |
| **Programs data** | ✅ 50 / 50 | `research/countries.json` |
| **BTC Map cache** | ✅ 50 snapshots | `public/data/btcmap/` |
| **CI** | ✅ Green | GitHub Actions + bundle budget |
| **Handoff** | ✅ Current | `docs/KIMI-HANDOFF.md` |

---

## Build history

| BUILD | Date | Commit | Summary |
|-------|------|--------|---------|
| **2026.07.14-33** | 2026-07-14 | `e5527fd` | sovereign UI · nav cleanup · glass dark + canonical menu |
| **2026.07.14-32** | 2026-07-14 | `0f75791` | applications open · v2.3 master · Seal + Forge + Launch Engine |
| **2026.07.14-29** | 2026-07-14 | `9b7fd9e` | 50/50 deep flagships · all templates researched · ₿-first |
| **2026.07.14-28** | 2026-07-14 | `963e014` | 50-item sprint: version sync + 16 flagships + deploy |
| **2026.07.07-26** | 2026-07-07 | `41238c2` | BTC Map v2: density badges, Nostr saves, Leaflet, offline cache, report venue |
| **2026.07.07-25** | 2026-07-07 | `8af1646` | BTC Map v1: `/btcmap` page, API client, program coords, nav |
| **2026.07.07-24** | 2026-07-07 | `44e7bb1` | Batches 17–20: a11y, i18n, CI/SEO, 16 e2e tests |
| **2026.07.07-11** | 2026-07-07 | — | Batch 8: Playwright e2e, lazy routes, IMPROVEMENTS-QUEUE 200/200 |
| **2026.07.07-05** | 2026-07-07 | `9a4f4a0` | Batch 2: dark mode tokens, skip link, reduced motion |
| **2026.07.02-02** | 2026-07-02 | `c5a5019` | Warm Sovereign Cinematic landing + programs |
| **012** | 2026-07-02 | `562f9b2` | Docs reorganized into `docs/` |
| **011** | 2026-07-02 | `4fe1bb9` | Dark mode toggle, 50 jurisdictions |
| **010** | 2026-07-02 | `9348111` | Luminous Sovereign light UI — 55+ design upgrades |
| **009** | 2026-07-02 | `0fd1748` | 55-upgrade backlog: routes, Nostr/Satohash stubs, CI |
| **004** | 2026-06-10 | — | Full `docs/` suite, Vite/React dev environment |

---

## Work queue (prioritized)

### P0 — Done recently
- [x] BTC Map merchant layer per jurisdiction (v1 + v2)
- [x] Round-2 polish batches 17–20 (500 items)
- [x] Playwright e2e in CI, sitemap, hreflang, bundle budget

### P1 — Next
- [ ] Deepen all 50 countries to Uruguay flagship template depth
- [ ] Live Nostr relay + real npub auth (beyond BTC Map saves)
- [ ] Satohash stamping pipeline (not stub URLs)
- [ ] Paige AI backend (beyond simulated chat)
- [ ] CI generates `dist/` on push (stop committing build artifacts)
- [ ] Weekly `btcmap:sync` cron in CI

### P2 — Later
- [ ] Lightning fee settlement
- [ ] B2G government partnership module
- [ ] Self-hostable sovereign bundle (Umbrel/Start9)

---

## Agent workflow map

```
Session start
  → Read root GROK-SESSION-PROTOCOL.md
  → Read docs/KIMI-HANDOFF.md (latest section)
  → Read docs/UPDATES-MAP.md (this file)

During work
  → Data: research/countries.json
  → BTC Map: src/lib/btcmap.ts, public/data/btcmap/
  → UI: src/ + docs/DESIGN-CONTEXT.md + docs/DESIGN-TOKENS.md
  → Scope: docs/PRODUCT-SCOPE-ROADMAP.md

Session end
  → Append docs/KIMI-HANDOFF.md
  → Update LATEST-UPDATE.md (root)
  → Append ~/projects/PROJECT-UPDATE-LOG.md
  → git push origin main
```

---

## Deployment map

| Target | Command | URL |
|--------|---------|-----|
| Cloudflare Pages | `npm run deploy:safe` | https://motopass.giveabit.io |
| Local dev | `npm run dev` | http://localhost:5173 |
| BTC Map refresh | `npm run btcmap:density && npm run btcmap:sync` | Updates `public/data/` |
| Verify | `SCRATCH=<dir> npm run verify:goal` | Artifact logs in `$SCRATCH` |

**Rule:** Deploy only to Cloudflare project `motopass` — never giveabit/tadbuy/sherpacarta.

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*