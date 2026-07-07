# MotoPass Updates Map

**BUILD:** 2026.07.07-11 · **Last updated:** 2026-07-07

Living record of what shipped, what's in progress, and where to find everything. Pair with [WORK-TREE.md](./WORK-TREE.md) for file locations.

---

## Current state (at a glance)

| Area | Status | Notes |
|------|--------|-------|
| **Live site** | ✅ Shipped | https://motopass.giveabit.io |
| **React app** | ✅ 2026.07.07-11 | Vite + React 18 + TS + Tailwind · lazy Pitch/Programs |
| **E2E smoke** | ✅ Playwright | `npm run test:e2e` — home, BUILD, programs, theme |
| **Improvements** | ✅ 200/200 | `docs/IMPROVEMENTS-QUEUE.md` batches 1–8 complete |
| **Design system** | ✅ Warm Sovereign Cinematic | Fraunces/Source Serif tokens + Luminous legacy aliases |
| **Programs data** | ✅ 50 / 50 | `research/countries.json` |
| **Static demo** | ✅ Light-aligned | `website/index.html` |
| **CI** | ✅ Green | GitHub Actions on `main` |
| **Handoff** | ✅ Current | `docs/KIMI-HANDOFF.md` |

---

## Build history

| BUILD | Date | Commit | Summary |
|-------|------|--------|---------|
| **2026.07.07-11** | 2026-07-07 | (this pass) | Batch 8: Playwright e2e smoke, lazy Pitch/Programs routes, IMPROVEMENTS-QUEUE 200/200 |
| **2026.07.07-09** | 2026-07-07 | — | Batch 6: unit tests, ProgramsContext, SEO, 404, contrast polish |
| **2026.07.07-05** | 2026-07-07 | `9a4f4a0` | Batch 2: dark mode tokens, skip link, reduced motion, touch targets |
| **2026.07.07-04** | 2026-07-07 | `e9cb75c` | Batch 1: a11y, ProgramsLoadError, adapter tests, footer safe-area |
| **2026.07.02-02** | 2026-07-02 | `c5a5019` | Warm Sovereign Cinematic: Landing + Programs batch, live countries.json adapter |
| **016** | 2026-07-02 | `1c0867f` | giveaBit wordmark in copyright; real BTC + LN QR codes |
| **013** | 2026-07-02 | — | Self-evolving pitch: live savings graphs, motion backgrounds @ 35% |
| **012** | 2026-07-02 | `562f9b2` | Docs reorganized into `docs/`; UPDATES-MAP + WORK-TREE created |
| **011** | 2026-07-02 | `4fe1bb9` | Dark mode toggle, 50 jurisdictions, light demo alignment |
| **010** | 2026-07-02 | `9348111` | Luminous Sovereign light UI — 55+ design upgrades, motion hero |
| **009** | 2026-07-02 | `0fd1748` | 55-upgrade backlog: routes, Nostr/Satohash stubs, CI, 25 programs |
| **004** | 2026-06-10 | — | Full `docs/` suite, Vite/React dev environment |
| **003** | 2026-06-08 | — | Rich finance fields, DESIGN, next-prompt, handoff workflow |

---

## Work queue (prioritized)

### P0 — Done recently
- [x] Light theme with card/background contrast
- [x] Motion hero (sovereignty.jpg @ 35% opacity)
- [x] Dark mode user toggle
- [x] 50-country program seed data
- [x] Design tokens + context docs

### P1 — Next
- [ ] Deepen all 50 countries to Uruguay flagship template depth
- [ ] Live Nostr relay + real npub auth
- [ ] Satohash stamping pipeline (not stub URLs)
- [ ] Paige AI backend (beyond simulated chat)
- [ ] CI generates `dist/` on push (stop committing build artifacts)

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
| Verify | `SCRATCH=<dir> npm run verify:goal` | Artifact logs in `$SCRATCH` |

**Rule:** Deploy only to Cloudflare project `motopass` — never giveabit/tadbuy/sherpacarta.

---

## Documentation change log (this pass)

| Action | Files |
|--------|-------|
| **Created** | `docs/UPDATES-MAP.md`, `docs/WORK-TREE.md` |
| **Moved to docs/** | SOURCE-OF-TRUTH, DIRECTORY-MAP, DESIGN, PROJECT-VISION, NEXT-PROMPT, CHANGELOG, CONTRIBUTING |
| **Archived** | `docs/archive/` — old KIMI handoffs, template stubs, backups |
| **Merged** | `motopass_MISSION.md` → `MISSION.md`; `motopass_SEO.md` superseded by `SEO.md` |
| **Root stubs** | Short pointers at former root doc paths |

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*