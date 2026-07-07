# Changelog — MotoPass

All notable changes. BUILD numbers are the primary versioning scheme.

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