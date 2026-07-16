# MotoPass Deployment Playbook

Production: **https://motopass.giveabit.io** · Cloudflare Pages project `motopass`.

## BUILD versioning

Single source of truth: `src/lib/buildInfo.ts` (`BUILD_ID`, `BUILD_DATE`, `BUILD_LABEL`).

Before every ship:

```bash
# 1. Bump BUILD_ID in src/lib/buildInfo.ts
# 2. Sync docs/README/changelog
npm run sync:build
npm run build
```

`BUILD_ID` format: `YYYY.MM.DD-N` (e.g. `2026.07.15-49`). Vite strips non-alphanumeric chars into **BUILD_SALT** (`20260715-49`) appended to every hashed asset filename.

## Salted filenames

`vite.config.ts` emits:

- `assets/[name]-[hash]-{BUILD_SALT}.js`
- `assets/[name]-[hash]-{BUILD_SALT}.css`

Each deploy gets unique asset URLs so stale CDN entries cannot serve `index.html` as JavaScript. The boot guard + `?b={BUILD_SALT}` query on `/assets/*` in `index.html` add a second layer until purge completes.

## No-cache headers

`public/_headers` (copied to `dist/_headers` on build):

| Path | Policy |
|------|--------|
| `/index.html` | `Cache-Control: no-store, must-revalidate` + `CDN-Cache-Control: no-store` |
| `/assets/*.js` | same — never `immutable` |
| `/assets/*.css` | same |
| `/research/*.json` | `max-age=3600, must-revalidate` |
| `/images/*` | `max-age=86400` |

Verify live headers after deploy:

```bash
npm run check:live-headers
# or: node scripts/check-live-headers.mjs https://motopass.giveabit.io
```

## Cache purge playbook

Deploy token needs **Zone · Cache Purge · Purge** on zone `motopass.giveabit.io` (zone ID in `scripts/purge-live-cache.mjs`).

```bash
export CLOUDFLARE_API_TOKEN=...   # from .env.local — never commit

npm run deploy          # sync → build → purge → wrangler → wait-live
npm run deploy:safe     # same minus wait-live (manual verify)
npm run deploy:all      # full gate + lint + test + e2e + deploy:safe + wait-live
```

`scripts/purge-live-cache.mjs`:

1. Lists every `/assets/*` URL from `dist/` + `dist/index.html`
2. POSTs file purge to Cloudflare API
3. Falls back to `purge_everything` if file purge fails
4. Exits 0 with WARN if token missing (local dev) or purge denied

Post-deploy verification:

```bash
npm run verify:live          # Playwright smoke on live site
npm run deploy:health        # lightweight BUILD_ID + bundle poison check
node scripts/wait-live-app.mjs   # poll verify until cache settles (8 attempts, exponential backoff)
node scripts/deploy-summary.mjs --out artifacts/deploy-summary.json
```

## Footer & mobile layout contract

Post–BUILD 59 (`min-h-svh` + `overflow: clip` on sovereign canvas). Do not regress without updating e2e `footer-gap.spec.ts`.

| Layer | Rule |
|-------|------|
| **Shell** | `.sovereign-canvas`: `min-h-svh flex flex-col overflow: clip` — short pages fill viewport; fixed parallax layers cannot extend `scrollHeight` past footer |
| **Main** | `flex-1` — grows on short pages; **no** shell-level bottom padding |
| **Footer** | `footer-glass mt-auto shrink-0` — sits at document end; mobile tab bar overlays footer glass |
| **Mobile nav** | `MobileBottomNav` `sticky bottom-0` with `safe-bottom`; overlays footer, does not reserve document space |
| **Viewport** | `viewport-fit=cover` in `index.html` for iOS safe-area; safe-area on nav sheets + Apply sticky submit only |

### BUILD 58 — parallax overflow root cause (fixed in 58–59)

Before BUILD 58, `.sovereign-canvas::before` and `::after` used `position: fixed` with `inset: -4%` / `-2%` and 3D parallax transforms. Those layers lived **outside** the normal footer flow and inflated `document.documentElement.scrollHeight` by ~16–80px on mobile — a scrollable void below the tab bar even when footer + nav were visually flush.

**Fix (BUILD 58):** `overflow: clip` on `.sovereign-canvas` clips fixed descendants from contributing to scrollable overflow past the footer.

**Regression lock (BUILD 59):** e2e `footer-gap.spec.ts` asserts `scrollHeight === body.offsetHeight` on desktop and `gapBelowDocument < 1px` on `/` + `/verify` mobile; `verify-live-app.mjs` fails when `scrollHeight − offsetHeight ≥ 16`.

**Verify locally:** `npm run test:e2e` (includes `footer-gap.spec.ts`). **Post-deploy:** `verify-live-app.mjs` captures `artifacts/footer-mobile-gap-live.png`, writes `artifacts/scroll-metrics-live.json`, and asserts footer `BUILD` + scroll void < 16px.

## Boot guard (client recovery)

Injected in `index.html` at build time (`vite.config.ts`):

1. On CDN poison (`Unexpected token '<'`, failed dynamic import), auto-retry with `?cb=` cache-bust after a **3s countdown**
2. Scroll position is saved to `sessionStorage` before `?cb=` reload and restored on the next paint
3. If retry fails, show recovery UI with manual reload + hard-refresh hints

## CI pipeline

`.github/workflows/ci.yml`:

- **build-test** — lint, validate, test, build, e2e; uploads `dist/` artifact (7-day retention)
- **deploy** — wrangler pages deploy on `main` push
- **live-health** — `npm run verify:live:ci` after deploy

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank page after 1s | CDN served `index.html` as `.js` | Boot guard auto-retry; run purge; hard-refresh |
| Footer amber dot | Local BUILD ≠ live BUILD | Wait for deploy or run `deploy:health` |
| Purge HTTP 403 | Token lacks Cache Purge scope | Re-create token with Zone.Cache Purge |
| `wait-live` timeout | Cache lag > 2 min | Manual purge in CF dashboard; re-run verify |

## Quick reference

```bash
npm run sync:build && npm run build
node scripts/purge-live-cache.mjs
npx wrangler pages deploy dist --project-name=motopass --branch=main
node scripts/wait-live-app.mjs
npm run check:live-headers
```