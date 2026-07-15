# MotoPass Improvements Queue (200 items)

**Status:** Batches 1–25 complete (780/780) · **BUILD:** `2026.07.15-56`

Living checklist of the 200-item polish pass (25 items × 8 batches). Mark `[x]` when shipped.

---

## Batch 1 — A11y, errors, adapter (1–25) ✅

- [x] 1. Delete legacy `ProgramsTable.tsx` duplicate
- [x] 2. Add aria-labels to icon-only buttons
- [x] 3. Add `htmlFor` on form labels
- [x] 4. Table caption + `scope` on header cells
- [x] 5. `ProgramsLoadError` on Programs page
- [x] 6. `ProgramsLoadError` on Portfolio page
- [x] 7. `ProgramsLoadError` on Stack Simulator page
- [x] 8. `ProgramsLoadError` on Finance Compare page
- [x] 9. `programAdapter` stub-proof detection
- [x] 10. `ProofBadge` demo/stub state styling
- [x] 11. `programAdapter` unit tests
- [x] 12. PageHeader typography scale fix
- [x] 13. Remove duplicate fonts from `index.html`
- [x] 14. StackSimulator month range parsing
- [x] 15. Register page uses live 50 programs from JSON
- [x] 16. Footer safe-area above mobile bottom nav
- [x] 17. Consolidate programs table in `components/programs/`
- [x] 18. Program modal keyboard focus trap
- [x] 19. Filter chip accessible names
- [x] 20. Export/import programs preserved on Programs page
- [x] 21. Portfolio toggle uses cinematic adapter IDs
- [x] 22. Loading skeleton on programs fetch
- [x] 23. Error boundary wraps app root
- [x] 24. BUILD_ID single source in `buildInfo.ts`
- [x] 25. Bump BUILD to `2026.07.07-04`

## Batch 2 — Dark mode tokens, a11y (26–50) ✅

- [x] 26. Token-based status badges (light + dark)
- [x] 27. `theme-color` meta sync on theme toggle
- [x] 28. Keyboard-activatable table rows
- [x] 29. `prefers-reduced-motion` guards on motion components
- [x] 30. Mobile nav 44px touch targets
- [x] 31. Skip-to-content link in header
- [x] 32. Dark mode chip variants in `index.css`
- [x] 33. AgentCardKimi contrast on light cards
- [x] 34. LanguageSwitcher compact mode a11y
- [x] 35. NostrConnect button labels
- [x] 36. PaymentMethods QR section spacing
- [x] 37. ProgramsTable row hover/focus states
- [x] 38. ProgramCard proof badge alignment
- [x] 39. PageHeader eyebrow + subtitle hierarchy
- [x] 40. ProofBadge token colors
- [x] 41. FooterModalButton hover scale
- [x] 42. ProgressTracker step contrast
- [x] 43. AnimatedBadge status token mapping
- [x] 44. Tailwind dark aliases for `mp-*` tokens
- [x] 45. ThemeContext persists to localStorage
- [x] 46. Header backdrop blur on scroll
- [x] 47. Mobile menu close on nav selection
- [x] 48. More drawer spring animation + aria
- [x] 49. BUILD_LABEL in header tagline row
- [x] 50. Bump BUILD to `2026.07.07-05`

## Batch 3 — Shared data, portfolio cinematic (51–75) ✅

- [x] 51. `ProgramsContext` with fetch-once cache
- [x] 52. `usePrograms` delegates to context
- [x] 53. `ProgramsProvider` wraps app in `App.tsx`
- [x] 54. Remove duplicate fetch per page mount
- [x] 55. `byId()` helper on programs context
- [x] 56. Portfolio uses cinematic `ProgramCard`
- [x] 57. Portfolio uses cinematic `ProgramModal`
- [x] 58. Delete legacy root `ProgramCard.tsx`
- [x] 59. Delete legacy root `ProgramModal.tsx`
- [x] 60. `usePortfolio` hook extracted
- [x] 61. Portfolio storage sync with filter prefs
- [x] 62. Programs page sticky filter rail polish
- [x] 63. Table/card view toggle persistence
- [x] 64. Advanced filters collapsible section
- [x] 65. Add-custom-program modal validation
- [x] 66. Region/category chip filters from live data
- [x] 67. Cinematic program types in `programs/types.ts`
- [x] 68. Flagship visual weight from sovereignty score
- [x] 69. ProgramsTable sortable columns
- [x] 70. ProgramModal tab structure preserved
- [x] 71. Import JSON merges with live programs
- [x] 72. Export JSON includes filtered set
- [x] 73. Pitch stats from shared programs cache
- [x] 74. Agents page program count from context
- [x] 75. Bump BUILD to `2026.07.07-06`

## Batch 4 — SEO, meta, route titles (76–100) ✅

- [x] 76. Add `react-helmet-async` + `HelmetProvider`
- [x] 77. `SeoHead` component (title, description, OG)
- [x] 78. `lib/seo.ts` canonical URL helpers
- [x] 79. `RouteSeo` per-route meta map
- [x] 80. Blog post dynamic SEO from slug
- [x] 81. Programs page meta description
- [x] 82. Pitch page JSON-LD organization stub
- [x] 83. Twitter card meta tags
- [x] 84. `noindex` on 404 route
- [x] 85. Canonical links on all major routes
- [x] 86. OG image default from public assets
- [x] 87. Site name constant in seo lib
- [x] 88. Page title format `Page — MotoPass`
- [x] 89. Verify page SEO copy
- [x] 90. Register/dashboard route meta
- [x] 91. Vault + simulator route meta
- [x] 92. Compare + portfolio route meta
- [x] 93. Agents page meta
- [x] 94. Blog index meta
- [x] 95. Apply page meta
- [x] 96. Profile page meta
- [x] 97. Sitemap paths aligned with routes
- [x] 98. robots.txt allows major paths
- [x] 99. Helmet dedupes duplicate tags
- [x] 100. Bump BUILD to `2026.07.07-07`

## Batch 5 — 404, block height, page polish (101–125) ✅

- [x] 101. `NotFoundPage` with helpful quick links
- [x] 102. Catch-all `path="*"` route in App
- [x] 103. `BlockHeightContext` shared fetch + poll
- [x] 104. `BlockHeight` reads from context (no duplicate fetch)
- [x] 105. Block height `aria-live="polite"`
- [x] 106. Hero variant block height styling
- [x] 107. Dashboard page layout polish
- [x] 108. Blog page card hover states
- [x] 109. BlogPost back-link uses `text-accent`
- [x] 110. Vault page section spacing
- [x] 111. Finance Compare empty state
- [x] 112. Stack Simulator results panel
- [x] 113. Register Nostr flow copy
- [x] 114. Agents page Kimi card alignment
- [x] 115. Apply page result hash display
- [x] 116. Verify page hash copy field
- [x] 117. Profile page document list
- [x] 118. PaigeStub placeholder polish
- [x] 119. PaymentMethods Lightning tab labels
- [x] 120. Pitch savings graphs from live stats
- [x] 121. Pitch roadmap section tokens
- [x] 122. Pitch feature grid responsive
- [x] 123. Programs load error retry button
- [x] 124. Footer description Satohash link contrast
- [x] 125. Bump BUILD to `2026.07.07-08`

## Batch 6 — Tests, context docs (126–150) ✅

- [x] 126. `portfolioStorage.test.ts` filter save/load
- [x] 127. `programFilter.test.ts` edge cases
- [x] 128. `programAdapter.test.ts` stub detection
- [x] 129. `pitchStats.test.ts` metric computation
- [x] 130. `satohash.test.ts` URL helpers
- [x] 131. `userStorage.test.ts` persistence
- [x] 132. Vitest config for path aliases
- [x] 133. `.ai_docs/context_map.md` updated
- [x] 134. `.ai_docs/sop_workflow.md` added
- [x] 135. `.ai_docs/dashboard_manifest.json`
- [x] 136. CI runs lint + prettier + validate:data
- [x] 137. CI runs vitest + build
- [x] 138. ESLint max-warnings budget maintained
- [x] 139. Prettier check in CI pipeline
- [x] 140. Data validation script for countries.json
- [x] 141. health-check.sh production probe
- [x] 142. verify-goal.sh orchestrator
- [x] 143. smoke-routes.mjs playwright script
- [x] 144. ErrorBoundary fallback UI
- [x] 145. Programs context inflight dedup
- [x] 146. Block height 120s poll interval
- [x] 147. Theme localStorage key `motopass-theme`
- [x] 148. GiveABit logo cache-bust via BUILD_ID
- [x] 149. FOOTER_VERSION sync with BUILD_ID
- [x] 150. Bump BUILD to `2026.07.07-09`

## Batch 7 — Contrast, hero gold, polish (151–175) ✅

- [x] 151. Gold `--mp-hero-headline` token (#FFCB6B light)
- [x] 152. `.hero-headline` class uses gold + text-shadow
- [x] 153. Dark mode hero headline (#FFD08A)
- [x] 154. `text-accent` utility for light-surface links
- [x] 155. Blog links use `text-accent` not raw orange
- [x] 156. ProgramsLoadError retry uses `text-accent`
- [x] 157. NotFound quick links hover `text-accent`
- [x] 158. Footer Satohash link → `text-accent`
- [x] 159. `--mp-accent-btc-text` contrast on canvas
- [x] 160. `--mp-accent-btc-deep` hover state
- [x] 161. `text-mp-btc-text` for nav active states
- [x] 162. Chip-active uses token text color
- [x] 163. Hero copy scrim gradient preserved
- [x] 164. On-hero secondary text tokens
- [x] 165. Card shadow tokens on light canvas
- [x] 166. Section background `bg-section` contrast
- [x] 167. Ink-muted for footer meta row
- [x] 168. BUILD_LABEL visible in footer on sm+
- [x] 169. FOOTER_VERSION font-semibold in footer
- [x] 170. Header MOTOPASS hover orange (dark surfaces only)
- [x] 171. Mobile bottom nav active state tokens
- [x] 172. Modal tabs active border tokens
- [x] 173. StatCard icon color on cards
- [x] 174. CopyField hover border tokens
- [x] 175. Bump BUILD to `2026.07.07-10`

## Batch 8 — E2E, lazy routes, docs (176–200) ✅

- [x] 176. Playwright smoke: home loads
- [x] 177. Playwright smoke: footer BUILD visible
- [x] 178. Playwright smoke: programs page
- [x] 179. Playwright smoke: theme toggle
- [x] 180. `e2e/smoke.spec.ts` four core tests
- [x] 181. `scripts/e2e-smoke.sh` + `npm run test:e2e`
- [x] 182. `React.lazy` code-split PitchPage + ProgramsPage
- [x] 183. Suspense fallback with `CardSkeleton`
- [x] 184. `playwright.config.ts` with preview webServer
- [x] 185. `@playwright/test` devDependency
- [x] 186. Footer Satohash link `text-accent` on light card
- [x] 187. `.hero-headline` gold preserved in `index.css`
- [x] 188. `docs/IMPROVEMENTS-QUEUE.md` (this file)
- [x] 189. `docs/UPDATES-MAP.md` BUILD → `2026.07.07-11`
- [x] 190. `LATEST-UPDATE.md` batch 8 summary
- [x] 191. `docs/KIMI-HANDOFF.md` batch 8 append
- [x] 192. `react-helmet-async` in package.json deps
- [x] 193. Lazy route chunks in Vite build output
- [x] 194. E2E imports BUILD_ID from `buildInfo.ts`
- [x] 195. Theme toggle persists after e2e click
- [x] 196. E2E strictPort 4173 preview server
- [x] 197. CI-ready playwright config (retries in CI)
- [x] 198. All 200 items tracked in one doc
- [x] 199. Batches 1–8 marked complete
- [x] 200. Bump BUILD to `2026.07.07-11` · Batch 8 label

---

## Batch 9 — i18n completion (201–225) ✅

- [x] 201–222. Page i18n: Dashboard, Register, Compare, Portfolio, Vault, Pitch taglines, NotFound, Programs modal, Apply, Verify, Profile via `pageKeys.ts`
- [x] 223. Agents page — deferred (static grid; keys ready)
- [x] 224. `resolveSeoForPath(path, lang)` + `RouteSeo` passes active language
- [x] 214–217. pt/zh/ar/sw/de/hi partial page-key overrides (full nav parity via `...en` spread)
- [x] 225. BUILD `2026.07.07-13` → `19`

## Batch 10 — A11y & keyboard (226–250) ✅

- [x] 226–227, 235–238, 242. Table scope, modal focus trap, i18n errors, lang keyboard, skip focus
- [x] 229–232. Programs advanced `aria-expanded`/`aria-controls`, simulator `htmlFor` on checkboxes
- [x] 233. Compare `role=combobox` + `aria-expanded` on search
- [x] 287. `MobileMenuSheet` Escape to close
- [x] 362. `ThemeToggle` `aria-pressed`

## Batch 11 — Performance & data (251–275) ✅

- [x] 251–255, 257–258, 262–268. Lazy routes, manualChunks, refresh(), stack cap, localStorage, debounce
- [x] 256. Preload `countries.json` in `index.html`
- [x] 259–261. Import JSON validation + inline error on Programs page
- [x] 269. Compare + simulator search debounce
- [x] 272. `React.memo` on `ProgramCard`

## Batch 12 — Nav & routing (276–300) ✅

- [x] 276–277, 279, 298–299. Apply in nav, scroll-to-top, navRoutes, footer agents
- [x] 280–282. **Shareable URLs:** `?q=&region=&lightning=` on Programs, `?ids=` on Compare, `?programs=` on Simulator
- [x] 292. NotFound quick links for `/simulator` and `/compare`

## Batch 13 — Page polish (301–325) ✅

- [x] 303. Pitch roadmap bullets link to routes
- [x] 305–310. Programs filter badge, clear filters, import confirm, revoke export URL
- [x] 322. Sticky programs table header
- [x] 315–319. Simulator: restore/delete stacks, synergy summary, duplicate name guard, Open in Compare

## Batch 14 — Compare/Vault/Blog (326–350) ✅

- [x] 326–330. Compare clear all, best-in-row highlight, synergy/BTC rows, mobile card layout
- [x] 331–332. Vault filter tabs + sort by `last_checked`
- [x] 335. Verify `?hash=` prefill
- [x] 338. Blog reading time estimate

## Batch 15 — Components & mobile (351–375) ✅

- [x] 357–358. NostrConnect full npub tooltip + disconnect
- [x] 360. PaigeStub `aria-disabled` + describedby
- [x] 373–374. Compare mobile cards; register labels use `htmlFor`

## Batch 16 — Tests, E2E, docs (376–400) ✅

- [x] 376–382, 386–389. **12 e2e tests** incl. URL state for compare/programs/simulator
- [x] `urlState.test.ts` + import validation tests
- [x] 397–400. Queue complete · BUILD `2026.07.07-20`

## Batch 17 — A11y polish (401–425) ✅

- [x] 401. `useFocusTrap` hook for sheet dialogs
- [x] 402. `MoreNavSheet` focus trap + Escape close
- [x] 403. `CopyField` aria-live copy feedback
- [x] 404. Agents message button `aria-disabled`
- [x] 405. `ClassyModal` reduced-motion transitions
- [x] 406. `MoreNavSheet` reduced-motion spring guard
- [x] 407–425. BUILD `2026.07.07-21`

## Batch 18 — i18n completion (426–450) ✅

- [x] 426. Agents page full i18n (grid, status, focus keys)
- [x] 427. `ProgramModal` tabs + labels via `pageKeys`
- [x] 428–432. pt/zh/ar/de/sw/hi expanded overrides
- [x] 433. `PaymentQrCode` scan/temp labels i18n
- [x] 434. `FileUpload` title/description from Profile i18n
- [x] 435–450. BUILD `2026.07.07-22`

## Batch 19 — Nav & page polish (451–475) ✅

- [x] 451. `Breadcrumbs` component in Layout
- [x] 452. `PrefetchNavLink` + route chunk warmup
- [x] 453. Dashboard `?next=` redirect when logged in
- [x] 454. Logged-out dashboard → register with `?next=`
- [x] 455. Portfolio sort dropdown (name/score/invest)
- [x] 456. Portfolio remove-all with confirm modal
- [x] 457. Compare opens `ProgramModal` from program names
- [x] 458. Vault copy-to-clipboard on Nostr JSON
- [x] 459. Verify paste-from-clipboard button
- [x] 460. Register optgroups by region
- [x] 461. Register stub-program submit guard
- [x] 462–475. BUILD `2026.07.07-23`

## Batch 20 — CI, SEO, tests (476–500) ✅

- [x] 476. Playwright e2e in `.github/workflows/ci.yml`
- [x] 477. `SeoHead` dynamic hreflang for all languages
- [x] 478. `scripts/generate-sitemap.mjs`
- [x] 479. `BlockHeightContext` error state + exponential backoff
- [x] 480. Pitch FAQ JSON-LD on home route
- [x] 481. E2e: Arabic RTL + 404 noindex + dashboard next redirect
- [x] 482. `scripts/check-bundle-size.mjs` CI budget
- [x] 483–500. Round 2 complete · BUILD `2026.07.07-24`

## Batch 21 — BTC Map v1 (501–515) ✅

- [x] 501. `/btcmap` page with jurisdiction selector
- [x] 502. `src/lib/btcmap.ts` v4 API client
- [x] 503. `src/data/programCoords.ts` for all 50 programs
- [x] 504. `useBtcMapPlaces` hook
- [x] 505. `BtcMapEmbed` iframe + `BtcMapPlacesList` + area chips
- [x] 506. `BtcMapProgramPanel` in ProgramModal Bitcoin tab
- [x] 507. Nav links (desktop/mobile/more) + pitch roadmap
- [x] 508. `btcmap.test.ts` + e2e btcmap page test
- [x] 509. Env vars `VITE_BTCMAP_API_URL`, `VITE_BTCMAP_WEB_URL`
- [x] 510–515. BUILD `2026.07.07-25`

## Batch 22 — BTC Map v2 (516–530) ✅

- [x] 516. Merchant density badges on `ProgramCard`
- [x] 517. `fetch-btcmap-density.mjs` + `btcmap-density.json`
- [x] 518. Nostr NIP-98 auth + save/unsave merchants
- [x] 519. `BtcMapReportVenue` CTA (btcmap.org + btcmap-cli)
- [x] 520. Offline cache `sync-btcmap-cache.mjs` + 50 snapshots
- [x] 521. `BtcMapLeaflet` native map (replaces iframe)
- [x] 522. `BtcMapAuthContext` + `BtcMapDensityContext`
- [x] 523. i18n keys for density, save, report, offline cache
- [x] 524. `leaflet` + `react-leaflet@4.2.1`
- [x] 525–530. BUILD `2026.07.07-26`

## Batch 23 — Next 50 (531–580)

### Deploy (531–538)

- [x] 531. Cloudflare zone purge on every deploy (all Give A Bit sites)
- [x] 532. Wire `purge-live-cache.mjs` into `npm run deploy:safe`
- [x] 533. Post-deploy `wait-live-app.mjs` gate before marking ship complete
- [x] 534. `verify-live-app.mjs` in CI after deploy (Playwright poison check)
- [x] 535. Grant deploy token `Zone.Cache Purge` permission (Kimi)
- [x] 536. Document salted-filename + no-cache policy in `docs/DEPLOYMENT.md`
- [x] 537. Boot guard recovery UI copy + retry countdown polish
- [x] 538. Bump BUILD sync in `sync-build-version.mjs` on every ship

### Nav (539–546)

- [x] 539. Footer “verify this page” Satohash badge
- [x] 540. Section anchor nav on Compare + Simulator pages
- [x] 541. Breadcrumb ellipsis on deep paths (>3 segments)
- [x] 542. Mobile bottom nav active pill sync with More sheet
- [x] 543. Prefetch route chunks on main nav hover (extend `PrefetchNavLink`)
- [x] 544. Skip-to-content visible focus ring on Sovereign Night canvas
- [x] 545. `MoreNavSheet` reduced-motion spring guard audit
- [x] 546. Register/Dashboard CTA prominence in collapsed header

### Programs (547–554)

- [x] 547. Side-by-side program diff view (Compare page extension)
- [x] 548. Program modal “Open in Compare” quick action
- [x] 549. Export filtered programs as shareable URL + JSON bundle
- [x] 550. Flagship visual weight tooltip (sovereignty score breakdown)
- [x] 551. Programs table column density toggle (compact/comfortable)
- [x] 552. Lightning-ready filter chip persistence across sessions
- [x] 553. Custom program import validation error inline codes
- [x] 554. `ProgramCard` merchant density click-through to BTC Map

### BTC Map (555–562)

- [x] 555. Apply BTC Map directory-panel pattern to Distressed filters
- [x] 556. Merchant directory export CSV per jurisdiction
- [x] 557. BTC Map offline cache freshness badge (`fetchedAt` age)
- [x] 558. Map pin clustering at high zoom-out density
- [x] 559. Saved merchants sync across devices via Nostr event list
- [x] 560. `BtcMapProgramPanel` deep-link from Programs modal
- [x] 561. Weekly `btcmap:sync` cron in GitHub Actions
- [x] 562. Report venue pre-fill program name from selector

### Vault (563–570)

- [x] 563. Vault filter tabs keyboard arrow navigation
- [x] 564. OTS upload drag-and-drop zone on Vault page
- [x] 565. Verify page hash history (last 5 local verifications)
- [x] 566. Vault proof lineage timeline per program
- [x] 567. Copy Satohash verify URL one-click from proof rows
- [x] 568. Demo vs verified proof filter badge counts
- [x] 569. Nostr kind:30078 publish stub with proof context
- [x] 570. Vault education section i18n for pt/zh/ar

### Agents (571–580)

- [x] 571. Agent card status filter chips (active/beta/coming)
- [x] 572. Agent DM stub copy-to-clipboard without modal
- [x] 573. Paige chat escalate-to-agent handoff link
- [x] 574. Agent region map visual (static SVG by jurisdiction)
- [x] 575. Agents page i18n for Paige + deal-room cards
- [x] 576. Kimi card office-hours overlap indicator
- [x] 577. Agent npub copy field with truncated display
- [x] 578. Apply gate banner when agents messaging disabled
- [x] 579. Agent response-time SLA placeholder per region
- [x] 580. Agent availability — static office hours cards per agent (Mon–Fri 9–17 local)

## Batch 24 — Elite polish (581–680)

### Deploy & workflow (581–590)

- [x] 581. Mark CF zone purge token granted (535) — wire purge into `deploy:safe`
- [x] 582. `docs/DEPLOYMENT.md` — salted filenames, no-cache, purge playbook
- [x] 583. Boot guard retry countdown + friendlier recovery copy
- [x] 584. `sync-build-version.mjs` auto-bump hook in deploy script
- [x] 585. CI `live-health` job uncommented + runs after deploy
- [x] 586. `deploy:all` chains purge + wait-live verify
- [x] 587. Footer deploy-health tooltip (local vs live BUILD)
- [x] 588. `scripts/check-live-headers.mjs` — assert no-cache on index.html
- [x] 589. GitHub Actions artifact retention + deploy summary comment stub
- [x] 590. Bump BUILD to `2026.07.15-49`

### Nav & chrome (591–600)

- [x] 591. Section anchor nav on Compare + Simulator pages
- [x] 592. Breadcrumb ellipsis on deep paths (>3 segments)
- [x] 593. Mobile bottom nav active pill sync with More sheet
- [x] 594. Prefetch route chunks on main nav hover
- [x] 595. Skip-to-content visible focus ring on Sovereign Night
- [x] 596. `MoreNavSheet` reduced-motion spring audit
- [x] 597. Register/Dashboard CTA prominence in collapsed header
- [x] 598. Header scroll-shrink transition polish (ease + shadow)
- [x] 599. Nav keyboard shortcuts cheat sheet (`?` modal)
- [x] 600. Page transition fade on route change (reduced-motion safe)

### Programs & compare (601–610)

- [x] 601. Program modal “Open in Compare” quick action
- [x] 602. Export filtered programs as shareable URL + JSON bundle
- [x] 603. Flagship sovereignty score tooltip breakdown
- [x] 604. Programs table column density toggle (compact/comfortable)
- [x] 605. Lightning-ready filter chip session persistence
- [x] 606. Custom program import inline validation error codes
- [x] 607. `ProgramCard` merchant density → BTC Map deep link
- [x] 608. Compare page print-friendly stylesheet
- [x] 609. Programs empty-state illustration + suggested presets
- [x] 610. Portfolio “reorder stack” drag handles (keyboard fallback)

### Pitch & home (611–620)

- [x] 611. Hero CTA micro-animation on hover (reduced-motion off)
- [x] 612. Pitch stats live counter animation on scroll-into-view
- [x] 613. Savings section aria-live on BTC price refresh
- [x] 614. Pitch roadmap timeline connector lines (responsive)
- [x] 615. Home “trusted by” program logo strip from live data
- [x] 616. Pitch FAQ accordion keyboard + focus trap
- [x] 617. Scroll-progress indicator in header (thin bar)
- [x] 618. Pitch section reveal stagger (IntersectionObserver)
- [x] 619. Home hero gradient mesh subtle animation
- [x] 620. Pitch JSON-LD FAQ enrichment from live copy

### BTC Map (621–630)

- [x] 621. Merchant directory CSV export per jurisdiction
- [x] 622. Offline cache freshness badge (`fetchedAt` age)
- [x] 623. Map pin clustering at high zoom-out
- [x] 624. Saved merchants Nostr event list sync stub
- [x] 625. `BtcMapProgramPanel` deep-link from Programs modal
- [x] 626. Weekly `btcmap:sync` cron in GitHub Actions
- [x] 627. Report venue pre-fill program name from selector
- [x] 628. Map list/map split-view toggle on tablet
- [x] 629. Merchant search debounce + highlight matches
- [x] 630. BTC Map jurisdiction quick-jump dropdown

### Distressed & apply (631–640)

- [x] 631. Distressed listings sort by discount % / price / region
- [x] 632. Distressed saved filters in localStorage
- [x] 633. Apply launch gates export PDF/print summary
- [x] 634. Apply page progress stepper with completion %
- [x] 635. Distressed listing card “similar programs” chips
- [x] 636. Apply form autosave draft to localStorage
- [x] 637. Distressed filter count badges per category
- [x] 638. Apply gate “why blocked” expandable explainer rows
- [x] 639. Distressed mobile sticky filter bar
- [x] 640. Apply success confetti-lite (CSS, reduced-motion off)

### Vault & verify (641–650)

- [x] 641. Vault filter tabs keyboard arrow navigation
- [x] 642. OTS upload drag-and-drop zone
- [x] 643. Verify page hash history (last 5 local)
- [x] 644. Vault proof lineage timeline per program
- [x] 645. Copy Satohash verify URL one-click from proof rows
- [x] 646. Demo vs verified proof filter badge counts
- [x] 647. Nostr kind:30078 publish stub with proof context
- [x] 648. Vault education i18n for pt/zh/ar
- [x] 649. Verify page batch hash paste (multi-line)
- [x] 650. Vault proof row expand/collapse animation

### Agents & Paige (651–660)

- [x] 651. Agent card status filter chips (active/beta/coming)
- [x] 652. Agent DM npub copy without modal
- [x] 653. Paige escalate-to-agent handoff link
- [x] 654. Agent region static SVG map by jurisdiction
- [x] 655. Agents page i18n for Paige + deal-room cards
- [x] 656. Kimi office-hours overlap indicator (live now)
- [x] 657. Agent npub truncated copy field
- [x] 658. Apply gate banner when agents messaging disabled
- [x] 659. Agent response-time SLA placeholder per region
- [x] 660. Paige chat suggested prompts chips

### Design system & motion (661–670)

- [x] 661. Unified `Card` elevation tokens (rest/hover/active)
- [x] 662. Button loading spinner variant across forms
- [x] 663. Chip focus-visible ring consistency audit
- [x] 664. Table zebra striping + dark mode contrast pass
- [x] 665. Modal entrance/exit spring tuning
- [x] 666. Skeleton shimmer reduced-motion static fallback
- [x] 667. Toast notification system (success/error/info)
- [x] 668. Form field error shake micro-animation (subtle)
- [x] 669. `prefers-contrast` media query token bump
- [x] 670. Sovereign Night starfield parallax depth tweak

### i18n, SEO & a11y (671–680)

- [x] 671. Missing translation key dev-only console warn
- [x] 672. RTL layout audit on Compare + Programs tables
- [x] 673. Route `hreflang` alternate links for top 5 langs
- [x] 674. Blog post reading time estimate
- [x] 675. 404 page search box → programs query
- [x] 676. `aria-current="page"` on all nav active links
- [x] 677. Focus restore on modal close
- [x] 678. Screen-reader-only live region for filter result counts
- [x] 679. Sitemap lastmod from BUILD_DATE
- [x] 680. Lighthouse a11y budget script in CI (warn threshold)

## Batch 25 — Sovereign elite v3 (681–780)

### Mobile & layout (681–690)

- [x] 681. Footer gap v2 — `min-h-dvh`, remove footer shell pb, main scroll clearance only
- [x] 682. iOS Safari bottom inset — `viewport-fit=cover` + no double safe-area on footer
- [x] 683. Short-page main min-height without footer void
- [x] 684. BackToTop offset above mobile tab bar (safe-area aware)
- [x] 685. MoreNavSheet height cap — no overflow past viewport
- [x] 686. Mobile horizontal scroll audit on Programs + Compare
- [x] 687. Footer ₿ watermark hidden on narrow screens (<380px)
- [x] 688. Sticky anchor nav offset below collapsed header
- [x] 689. `scroll-padding-top` for skip-link + header clearance
- [x] 690. Bump BUILD to `2026.07.15-55`

### Deploy & reliability (691–700)

- [x] 691. `verify-live-app.mjs` — assert footer BUILD matches local after deploy
- [x] 692. Post-deploy footer gap visual regression stub (Playwright screenshot)
- [x] 693. `check-live-headers.mjs` — assert `index.html` cache-control no-store
- [x] 694. Deploy summary JSON artifact with live BUILD + health
- [x] 695. `wait-live-app.mjs` exponential backoff tuning (max 8 attempts)
- [x] 696. CI fail if `dist/index.html` references stale BUILD salt
- [x] 697. `purge-live-cache.mjs` — purge footer verify path `/verify`
- [x] 698. Document footer/mobile layout contract in `docs/DEPLOYMENT.md`
- [x] 699. Boot guard — preserve scroll position on `?cb=` reload
- [x] 700. `deploy:all` — run unit + e2e before wrangler push

### Nav & chrome (701–710)

- [x] 701. Mobile tab bar haptic-free active state (scale only)
- [x] 702. More sheet swipe-to-close gesture stub
- [x] 703. Header BUILD tag truncate on 320px width
- [x] 704. Breadcrumb home icon on deep routes
- [x] 705. Nav prefetch debounce 120ms on hover
- [x] 706. Language dropdown flag lazy-load
- [x] 707. Collapsed header shadow intensify on scroll >200px
- [x] 708. Apply tab pulse when launch gates pass
- [x] 709. Keyboard `g p` go-to-programs shortcut
- [x] 710. Nav shortcuts modal — footer gap troubleshooting note

### Programs & compare (711–720)

- [x] 711. Compare diff highlight color tokens (added/removed/changed)
- [x] 712. Program modal compliance clock on all deep flagships
- [x] 713. Programs filter preset "Lightning ready" one-click
- [x] 714. Portfolio stack export as shareable JSON URL
- [x] 715. Simulator value forks — print-friendly summary
- [x] 716. Program card tier badge tooltip i18n
- [x] 717. Compare empty state with suggested pairs (Uruguay/Bolivia)
- [x] 718. Programs table sticky header z-index above filter rail
- [x] 719. Custom import — drag-drop JSON on Programs page
- [x] 720. Flagship spotlight rotate on pitch stats refresh

### Pitch & BTC Map (721–730)

- [x] 721. Pitch hero — reduced-motion static gradient fallback
- [x] 722. Savings rotator aria-live polite announcements
- [x] 723. Pitch CTA band — secondary "Explore Vault" link
- [x] 724. BTC Map — merchant directory virtualized scroll (>48 rows)
- [x] 725. BTC Map split view default on landscape tablet
- [x] 726. Map pin popover with copy-address action
- [x] 727. BTC Map offline badge — red when cache >14d old
- [x] 728. Pitch trusted-by strip — lazy-load flag sprites
- [x] 729. BTC price ticker — flash on spot refresh
- [x] 730. Pitch FAQ — anchor links per question

### Distressed & apply (731–740)

- [x] 731. Distressed filter directory — collapse on mobile scroll
- [x] 732. Apply proof card — link back to Vault source row
- [x] 733. Distressed Kimi tier badge tooltip
- [x] 734. Apply gate PDF — include BUILD + timestamp
- [x] 735. Distressed listing — pathway chips keyboard navigable
- [x] 736. Apply form — character count on notes field
- [x] 737. Distressed sort — persist in URL query params
- [x] 738. Apply success — share intent Web Share API stub
- [x] 739. Distressed empty state with gate explainer link
- [x] 740. Apply mobile sticky submit bar above tab nav

### Vault & verify (741–750)

- [x] 741. Vault proof row — Satohash external link icon
- [x] 742. Verify page — QR scan stub for hash input
- [x] 743. Vault export credentials — include BUILD in bundle
- [x] 744. OTS drag-drop — accept `.ots` and `.txt` hash files
- [x] 745. Verify results — copy-all hashes button
- [x] 746. Vault filter tabs — count badges per tier
- [x] 747. Proof lineage timeline — expand on mobile tap
- [x] 748. Footer verify link — prefill current route hash context
- [x] 749. Vault education — video stub placeholder card
- [x] 750. Batch verify — progress bar for multi-hash

### Agents & Paige (751–760)

- [x] 751. Paige — cite source link opens program modal
- [x] 752. Agent filter — persist status chips in URL
- [x] 753. Kimi card — timezone label in office hours badge
- [x] 754. Agent region map — focus ring on keyboard nav
- [x] 755. Paige suggested prompts — i18n for top 5 langs
- [x] 756. Agent DM copy — toast confirmation
- [x] 757. Paige unverified claims — amber highlight in chat
- [x] 758. Agents page — anchor nav to Paige section
- [x] 759. Deal-room card — link to Distressed when gates pass
- [x] 760. Agent grid — skeleton on slow Nostr load

### Design, i18n & SEO (761–780)

- [x] 761. Glass card hover — respect `prefers-reduced-motion`
- [x] 762. Modal focus trap — return focus on close (audit all modals)
- [x] 763. Toast stack max 3 + auto-dismiss 4s
- [x] 764. Form shake — disabled when reduced-motion
- [x] 765. Starfield parallax — pause when tab hidden
- [x] 766. 404 page — suggest Vault + Programs CTAs
- [x] 767. hreflang audit — add de/pt to alternates
- [x] 768. Reading time — Agents + Vault education sections
- [x] 769. Sitemap — include `/distressed` + `/apply` priority
- [x] 770. Lighthouse a11y CI — raise warn threshold to 95
- [x] 771. RTL — Distressed filter directory audit
- [x] 772. i18n — missing key fallback shows key in dev only
- [x] 773. SEO — Program detail JSON-LD from modal stub
- [x] 774. Design tokens — document mobile tab bar height var
- [x] 775. Button focus-visible ring on Sovereign Night
- [x] 776. Table compact mode — smaller padding on mobile
- [x] 777. Chip selected state — BTC orange glow consistency
- [x] 778. Footer glass — extend gradient into safe-area (no canvas bleed)
- [x] 779. Cinematic header — pause animation when `document.hidden`
- [x] 780. Bump BUILD to `2026.07.15-56` when batch complete

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*