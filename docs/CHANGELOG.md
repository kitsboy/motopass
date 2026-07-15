# Changelog — MotoPass

All notable changes. BUILD numbers are the primary versioning scheme.

---



## [BUILD-2026.07.15-57] — 2026-07-15

### Changed
- Footer gap v3 — sticky tab bar after footer, remove bad preload

---

## [BUILD-2026.07.15-56] — 2026-07-15

### Changed
- Batch 25 complete — footer gap v2, 780/780 elite polish

---

## [BUILD-2026.07.15-54] — 2026-07-15

### Changed
- Footer flush — nav clearance inside footer glass, no void below

---

## [BUILD-2026.07.15-53] — 2026-07-15

### Changed
- Canvas +20% lift, footer gap fix — mobile-tight polish

---

## [BUILD-2026.07.15-52] — 2026-07-15

### Changed
- Elite Paradise Pass — cinematic header, glass depth, distressed proof-gate, credentials

---

## [BUILD-2026.07.15-51] — 2026-07-15

### Changed
- Elite sovereign — #0a0a0f design, clean nav, vault→apply proof, value forks

---

## [BUILD-2026.07.15-50] — 2026-07-15

### Changed
- Queue complete — pitch polish, distressed/apply UX, design motion, i18n/SEO

---

## [BUILD-2026.07.15-49] — 2026-07-15

### Changed
- Batch 24 — deploy playbook, purge wired, boot guard polish, live-health CI, footer deploy tooltip

---

## [BUILD-2026.07.14-33] — 2026-07-14

### Added
- `GlassCard` component — glassmorphism variants (default, elevated, interactive, banner, proof)
- `src/lib/navRoutes.ts` — `MAIN_NAV_ROUTES` single source of truth for all menus
- Sovereign canvas — BTC block-grid + hash monospace textures (`tokens.css`, `index.css`)
- `ApplyNavTab` — Apply in mobile bottom nav with launch-gate gating

### Changed
- **Default theme:** Sovereign Night (dark) unless user saved light preference
- **Nav:** Removed Explore/Tools/Pitch/Portfolio duplicates; canonical order Programs · Vault · Distressed · BTC Map · Simulator · Compare · Agents · Apply
- **Mobile:** Bottom tabs (Programs, Vault, Distressed, Apply, More) + 2-col hamburger grid
- **Footer:** `NavLink` active states; matches canonical nav order
- Polished Apply, Vault, Distressed pages — motion, shimmer skeletons, glass cards
- 36 unit + 19 e2e tests green · deployed to motopass.giveabit.io

---

## [BUILD-2026.07.14-32] — 2026-07-14

### Changed
- applications open · v2.3 master · Seal + Forge + Launch Engine

---

## [BUILD-2026.07.14-29] — 2026-07-14

### Changed
- 50/50 deep flagships · all templates researched · ₿-first

---

## [BUILD-2026.07.14-28] — 2026-07-14

### Changed
- 50-item sprint: version sync + 16 flagships + deploy

---

## [BUILD-2026.07.07-26] — 2026-07-07

### Added
- BTC Map v2: merchant density badges on `ProgramCard`, Nostr NIP-98 saved merchants, Leaflet pin map, offline per-jurisdiction cache, report-venue CTA
- `scripts/fetch-btcmap-density.mjs`, `scripts/sync-btcmap-cache.mjs` (`npm run btcmap:density`, `npm run btcmap:sync`)
- `public/data/btcmap-density.json` + `public/data/btcmap/{slug}.json` (50 jurisdictions)
- `BtcMapAuthContext`, `BtcMapDensityContext`, `BtcMapLeaflet`, `MerchantDensityBadge`, `BtcMapReportVenue`
- `leaflet` + `react-leaflet@4.2.1` dependencies

### Changed
- `BtcMapEmbed` now renders native Leaflet layer (replaces iframe)
- `useBtcMapPlaces` — cache-first with live API refresh
- Agents page — report venue CTA for community merchant tagging

---

## [BUILD-2026.07.07-25] — 2026-07-07

### Added
- `/btcmap` page — jurisdiction selector, v4 API merchant list, area chips, program panel in modal
- `src/lib/btcmap.ts` client, `src/data/programCoords.ts`, `useBtcMapPlaces` hook
- Nav links (desktop/mobile/more), pitch roadmap entry, e2e btcmap test
- Env: `VITE_BTCMAP_API_URL`, `VITE_BTCMAP_WEB_URL`

---

## [BUILD-2026.07.07-24] — 2026-07-07

### Added
- Batches 17–20 polish: a11y traps, expanded i18n, breadcrumbs, Playwright in CI, sitemap generator, FAQ JSON-LD, bundle budget

---

## [BUILD-20260702-012] — 2026-07-02

### Added
- `docs/UPDATES-MAP.md` — build history & work queue
- `docs/WORK-TREE.md` — complete file organization map

### Changed
- Consolidated root documentation into `docs/` (SOURCE-OF-TRUTH, DESIGN, DIRECTORY-MAP, PROJECT-VISION, NEXT-PROMPT, CHANGELOG, CONTRIBUTING)
- Archived superseded handoffs and template stubs to `docs/archive/`
- Updated docs hub README, SOURCE-OF-TRUTH, MISSION

---

## [BUILD-20260702-011] — 2026-07-02

### Added
- Dark mode toggle (ThemeContext, Sovereign Night palette)
- 25 new jurisdiction programs (50 total)
- `scripts/expand-countries.mjs`, `scripts/patch-website-light.mjs`

### Changed
- `website/index.html` aligned to Luminous Sovereign light theme
- RGB CSS token system for light/dark surfaces

---

## [BUILD-20260702-010] — 2026-07-02

### Added
- Luminous Sovereign light theme (55+ UI upgrades)
- `HeroMotionBackground`, `PageHeader`, `StatCard`
- `docs/DESIGN-CONTEXT.md`, `docs/DESIGN-TOKENS.md`

### Changed
- Full site migration from dark sovereign to light canvas + white cards

---

## [BUILD-20260702-009] — 2026-07-02

### Added
- Portfolio, Simulator, Compare, Vault routes
- 25 programs with Satohash proof stubs
- CI workflow, `verify-goal.sh`, Playwright smoke tests
- Nostr connect, payment methods, progress tracker stubs

---

## [BUILD-20260610-004] — 2026-06-10

### Added
- Full `docs/` documentation suite
- Vite + React + TypeScript + Tailwind dev environment
- PRODUCT-SCOPE-ROADMAP, ARCHITECTURE, DATA-MODEL, etc.

---

## [BUILD-20260608-003] — 2026-06-08

### Added
- Rich finance fields in countries.json
- DESIGN.md, next-prompt.md
- Pristine website/index.html dashboard

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*