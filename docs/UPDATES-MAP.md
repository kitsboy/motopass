# MotoPass Updates Map

**BUILD:** 2026.07.15-63 · **Last updated:** 2026-07-15

Living record of what shipped, what's in progress, and where to find everything. Pair with [WORK-TREE.md](./WORK-TREE.md) for file locations.

---

## Current state (at a glance)

| Area | Status | Notes |
|------|--------|-------|
| **Live site** | ✅ Shipped | https://motopass.giveabit.io |
| **React app** | ✅ 2026.07.15-63 | Vite + React 18 + TS + Tailwind · 15 routes · 16 flagships |
| **Launch Engine** | ✅ 5/5 gates | Vault · Distressed · Apply · `launch-gates.json` |
| **Nav** | ✅ Canonical | `navRoutes.ts` — 8 links, no Explore/Tools dupes |
| **UI** | ✅ Sovereign Night | Glass cards · BTC textures · dark default |
| **BTC Map** | ✅ v2 | `/btcmap` — Leaflet, density badges, Nostr saves, offline cache |
| **E2E smoke** | ✅ Playwright | 19 tests — `npm run test:e2e` |
| **Unit tests** | ✅ Vitest | 36 tests |
| **Design system** | ✅ Warm Sovereign Cinematic | Sovereign Night default + light toggle |
| **Programs data** | ✅ 50 / 50 deep | `research/countries.json` |
| **BTC Map cache** | ✅ 50 snapshots | `public/data/btcmap/` |
| **CI** | ✅ Green | GitHub Actions + bundle budget |
| **Handoff** | ✅ Current | `docs/KIMI-HANDOFF.md` |

---

## Build history

| BUILD | Date | Commit | Summary |
|-------|------|--------|---------|
| **2026.07.15-63** | 2026-07-15 | `e3d85c7` | Presentation methodology disclaimer — illustrative, not promises |
| **2026.07.15-62** | 2026-07-15 | `a055f68` | Full-screen data-story dashboard presentation — animated metrics |
| **2026.07.15-61** | 2026-07-15 | `d020317` | Motion data-story presentation — sequenced charts |
| **2026.07.15-55** | 2026-07-15 | `5e78921` | Elite header v4 — mobile-friendly ship crop |
| **2026.07.15-60** | 2026-07-15 | `37d4ca7` | Design perf i18n — lazy flags, ja/de stubs, bundle warn |
| **2026.07.15-59** | 2026-07-15 | `37d4ca7` | Footer gap v5 — e2e scroll lock + deploy CI |
| **2026.07.15-58** | 2026-07-15 | `9e154fd` | Footer gap v4 — clip parallax overflow past footer |
| **2026.07.15-57** | 2026-07-15 | `1765ad3` | Footer gap v3 — sticky tab bar after footer, remove bad preload |
| **2026.07.15-56** | 2026-07-15 | `9e9e53c` | Batch 25 complete — footer gap v2, 780/780 elite polish |
| **2026.07.15-54** | 2026-07-15 | `9aeb3ce` | Footer flush — nav clearance inside footer glass, no void below |
| **2026.07.15-53** | 2026-07-15 | `0b13550` | Canvas +20% lift, footer gap fix — mobile-tight polish |
| **2026.07.15-52** | 2026-07-15 | `0cec992` | Elite Paradise Pass — cinematic header, glass depth, distressed proof-gate, credentials |
| **2026.07.15-51** | 2026-07-15 | `9eb8774` | Elite sovereign — #0a0a0f design, clean nav, vault→apply proof, value forks |
| **2026.07.15-50** | 2026-07-15 | `f907aaa` | Queue complete — pitch polish, distressed/apply UX, design motion, i18n/SEO |
| **2026.07.15-49** | 2026-07-15 | `4e9d748` | Batch 24 — deploy playbook, purge wired, boot guard polish, live-health CI, footer deploy tooltip |
| **2026.07.14-33** | 2026-07-14 | `03596d5` | sovereign UI · nav cleanup · glass dark + canonical menu |
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