# MotoPass — Session Summary (2026-07-15)

## Chat Topic

Stabilize motopass.giveabit.io after recurring blank-screen outages, ship nav/UX polish, and harden deploys against Cloudflare CDN cache poisoning.

## Key Things We Did

- Diagnosed “blank page / overlay” as **CDN cache poison** (browser cached `index.html` as `.js`), not a UI bug
- Shipped BUILD 42–47: salted asset filenames, `no-cache` headers, boot guard, auto-retry `?cb=` loader
- Fixed language dropdown z-index; delivered nav chrome pack (portal lang, collapse header, anchor nav, breadcrumbs, pill pulse, system locale)
- Improved error handling: static `ErrorFallback`, `ErrorBoundary` inside `I18nProvider`, eager home bundle
- Added `verify-live-app.mjs`, `wait-live-app.mjs`, `purge-live-cache.mjs` (purge blocked — token lacks Zone.Cache Purge)
- Provided 50-item improvement backlog; user approved items 1,4–10 for BUILD 45

## What We Finished

- Site **live and verified** — BUILD `2026.07.15-47` at https://motopass.giveabit.io
- Language dropdown fully visible above Members nav
- Nav chrome improvements 1, 4–10 deployed
- User confirmed “looks great now” after BUILD 47 cache-bust loader
- Handoff docs updated (`KIMI-HANDOFF.md`, `LATEST-UPDATE.md`)
- Git pushed: `f100da7` on `origin/main`

## What We Are Still Aiming to Finish

- **Cloudflare zone purge** on deploy — grant token `Zone.Cache Purge` for all Give A Bit sites; wire into `npm run deploy`
- **Polish queue:** BTC Map directory pattern on Distressed filters; program side-by-side diff; footer verify badge
- **Improvement backlog:** items 11–50 from session list (on demand)

## Update / Status

As of 2026-07-15, MotoPass production is healthy. Deploy pipeline uses salted filenames + no-cache asset headers + client-side auto-retry. Playwright live verify passes. Until CF purge is enabled, brief post-deploy cache glitches may require one `?cb=` reload — boot guard handles this gracefully.

## Key Decisions / Notes

- Never use `immutable` on hashed assets — poison can cache for a year
- `curl` alone is insufficient; production verify must use Playwright
- “Page disappears after 1s” = script load failure, not overlay
- Zone ID for giveabit.io purge: `52f656cdb5d38cfab3a34959331d63a1`
- Do not sync handoff to M4 until Cam or Kimi says so

## Mission Tie-in

MotoPass stays a verifiable, Bitcoin-native sovereignty platform — production reliability and truthful deploy artifacts matter as much as feature polish for Give A Bit’s Safe Harbour mission.