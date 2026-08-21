# Paige Guide: BTC Map & Merchant Discovery

> **For Paige AI** — reference this when members ask about Bitcoin-accepting merchants, the BTC Map, density scores, or where to spend Bitcoin in a jurisdiction.
> **8th knowledge topic** — auto-discovered by `import.meta.glob` (hot-loadable, zero code changes).

---

## 30-Second Version

BTC Map is the world's community-sourced map of Bitcoin-accepting businesses — like Yelp for Bitcoin. MotoPass integrates it to show merchant density for each of the 50 jurisdictions: how many places near the capital accept Bitcoin, what categories they are, and whether they support Lightning. This helps members evaluate real-world Bitcoin usability alongside residency requirements.

---

## What Is BTC Map?

BTC Map (btcmap.org) is an open-data, community-maintained directory of businesses that accept Bitcoin. Users submit venues, other users verify them, and the map grows organically. It's the closest thing to a "Bitcoin Yellow Pages" for the physical world.

### What MotoPass Does With It

MotoPass does **not** create or curate BTC Map data. It:
1. Fetches merchant counts per jurisdiction from the BTC Map API
2. Computes density scores (sparse / moderate / dense)
3. Displays an interactive map with pins, a searchable directory, and category filters
4. Feeds merchant count into the `crypto_friendly_score` for each country

---

## How Discovery Works

### The Data Pipeline

```
  BTC Map API (api.btcmap.org/v4/places/search)
       ↓
  fetch-btcmap-density.mjs (daily cron)
       ↓
  public/data/btcmap-density.json (per-program counts + tiers)
       ↓
  Client-side: loadDensitySnapshot() → MerchantDensityBadge

  sync-btcmap-cache.mjs (daily cron)
       ↓
  public/data/btcmap/{slug}.json (full place list + areas)
       ↓
  Client-side: loadBtcMapSnapshot() → BtcMapPage
```

### Live API Path

When the offline cache is stale or the user navigates to `/btcmap`:
```
  BtcMapPage → useBtcMapPlaces(name)
       ↓
  loadBtcMapSnapshot(name) — try offline cache first
       ↓ (cache miss or expired)
  searchPlacesNearby({ lat, lon, radiusKm }) — live API
  getAreasAt(lat, lon) — country/community areas
       ↓
  Display: BtcMapEmbed (Leaflet map) + BtcMapMerchantDirectory
```

---

## Density Scoring

### What the Numbers Mean

Each program has a coordinate (lat/lon) and a search radius (10-80 km). The API returns all Bitcoin-accepting merchants within that circle.

| Tier | Merchant Count | What it means |
|------|---------------|---------------|
| 🟢 Dense | 20+ | Strong Bitcoin commerce — plenty of places to spend |
| 🟡 Moderate | 5-19 | Growing Bitcoin ecosystem — viable for day-to-day use |
| ⚪ Sparse | 0-4 | Minimal Bitcoin commerce — few options |

### The Score

The density score is a 0-100 number:
```
score = min(100, round((merchant_count / radius_km) * 40))
```

This normalizes by jurisdiction size — a small country with 10 merchants scores higher than a large country with 10 merchants. The score appears in tooltips but the tier badge is the primary indicator.

### Where Density Is Shown

- **Program cards** (`/programs`): `MerchantDensityBadge` — colored pill with merchant count
- **BTC Map page** (`/btcmap`): merchant count in the command bar
- **Intel manifest**: feeds into `finance.crypto_friendly_score` for country rankings

---

## The BTC Map Page (`/btcmap`)

### Layout

The page has three sections:

1. **Command bar** — program selector, jurisdiction jump, Nostr sign-in, merchant count
2. **Map** (left/center) — Leaflet embed with merchant pins, areas chips, report venue link
3. **Directory** (right) — searchable merchant list with category filters, CSV export

### Three Layout Modes (Tablet)

| Mode | What's shown | When to use |
|------|-------------|-------------|
| Split | Map + directory side by side | Default on large screens |
| Map-only | Full-width map | Focus on spatial exploration |
| List-only | Full-width directory | Focus on browsing/searching |

Auto-selects "split" on phone landscape and tablet landscape viewports.

### Merchant Directory Features

- **Search** — debounced (280ms), filters by name and address, highlights matches
- **Category filters** — filter by type (Restaurant, Cafe, Hotel, ATM, etc.)
- **CSV export** — download filtered merchants as a spreadsheet
- **Virtual scrolling** — directories with 48+ merchants use virtual scroll for performance
- **Save** — heart icon to save merchants (requires Nostr sign-in)
- **Directions** — Google Maps deep-link for turn-by-turn navigation

### Merchant Categories (20+)

| Icon | Category | Example venues |
|------|----------|---------------|
| 🏧 ATM | Bitcoin ATMs | Cash-to-BTC converters |
| 🏪 Store | Retail shops | General merchandise |
| 🍽️ Restaurant | Dining | Full-service restaurants |
| ☕ Cafe | Coffee shops | Cafes and bakeries |
| 🏨 Hotel | Accommodation | Hotels, hostels |
| 💱 Exchange | Currency exchange | BTC exchange points |
| 💻 Tech | Technology | Computer stores, IT services |
| 🛒 Grocery | Grocery stores | Supermarkets, markets |
| 💪 Fitness | Gyms | Fitness centers |
| 🍷 Bar | Bars & pubs | Nightlife venues |
| 💎 Jewelry | Jewelry stores | Gold/silver dealers |
| 🏠 Home | Home services | Real estate, furniture |
| 🎓 School | Education | Training, courses |
| ✂️ Salon | Beauty | Hair salons, spas |
| 🏥 Medical | Healthcare | Clinics, pharmacies |
| 🚗 Auto | Automotive | Car dealers, mechanics |
| 🍕 Pizza | Food delivery | Pizza, fast food |
| 💆 Spa | Wellness | Spas, wellness centers |
| 🛍️ Mall | Shopping | Shopping centers |
| ☕ Bar | Bars | Wine bars, cocktail bars |

---

## Offline Cache System

### Why Offline Cache?

BTC Map API availability varies. MotoPass pre-fetches data daily so the app works even when the API is down or slow.

### Two Cache Layers

| Cache | File | Contents | Updated by |
|-------|------|----------|------------|
| Density snapshot | `public/data/btcmap-density.json` | Per-program count + tier + score | `fetch-btcmap-density.mjs` |
| Place snapshots | `public/data/btcmap/{slug}.json` | Full place list + areas | `sync-btcmap-cache.mjs` |

### Freshness Tracking

| Level | Age | Badge | Action |
|-------|-----|-------|--------|
| Fresh | ≤ 7 days | 🟢 Green | No warning |
| Recent | 8-14 days | 🟡 Amber | Show age badge |
| Expired | > 14 days | 🔴 Red | Show stale banner + suggest btcmap.org |

The `BtcMapCacheStaleBanner` component appears at the top of the BTC Map page when the offline cache is expired.

---

## Authentication & Saved Merchants

### NIP-98 Sign-In

BTC Map uses Nostr HTTP Auth (NIP-98) for saved places:
1. User clicks "Sign in to save" on the BTC Map page
2. Nostr extension signs a login token
3. Token is sent to `POST /v4/auth/nostr`
4. Session token stored in sessionStorage

### Saving Merchants

- Click the **heart icon** on any merchant in the directory
- Saved IDs persist in localStorage (`motopass-btcmap-saved`)
- Cross-device sync via Nostr kind-event is planned (stub in `btcmapSavedSync.ts`)

### What Saved Merchants Enable

- Quick access to favorite venues across sessions
- Future: cross-device sync via Nostr relay
- Future: portfolio-aware alerts ("your saved merchant in Portugal just updated")

---

## Intel Pipeline Integration

### BTC Map as a Signal Source

The daily intel pipeline (`intel-fetch.mjs`) uses BTC Map data:

```
  fetchBtcMap(countryName)
       ↓
  API: /v4/places/search/?lat=...&lon=...&radius_km=...
       ↓
  Returns: { merchantCount, lightningCount, lastVerified }
       ↓
  Signal: finance.crypto_friendly_score adjusted by merchant density
```

### How Merchant Count Affects Scores

- Merchant count is a **medium-confidence** signal
- It contributes to `crypto_friendly_score` (1-10 scale)
- A jurisdiction with 20+ merchants gets a score boost
- Lightning readiness ( merchants with `tags.payment.lightning === 'yes'`) is an additional positive signal
- The signal is collected but only applied to the score when confidence is medium+

---

## Map Technology

### Leaflet + OpenStreetMap

The BTC Map embed uses:
- **Leaflet** — open-source JavaScript map library
- **OpenStreetMap** tiles — no Google Maps API key required
- **Grid clustering** — groups nearby pins at low zoom for readability

### Clustering Behavior

| Zoom Level | Cell Size | Effect |
|-----------|-----------|--------|
| ≤ 7 | 0.45° | Very coarse — countries cluster together |
| 8 | 0.28° | Coarse — regions cluster |
| 9 | 0.16° | Medium — cities cluster |
| 10 | 0.09° | Fine — neighborhoods cluster |
| ≥ 11 | 0.045° | Pinpoint — individual pins shown |

Threshold: clustering activates when zoom < 11 AND there are 2+ places.

### Attribution

Every map view must attribute:
- **BTC Map** (btcmap.org) — merchant data
- **OpenStreetMap** — map tiles
- **btcmap-api** — API source

This is enforced by the `BtcMapAttribution` component and the `btcMapAttribution()` helper.

---

## CSV Export

The merchant directory can be exported as CSV:

### Columns

| Column | Source |
|--------|--------|
| `program_name` | Current jurisdiction name |
| `id` | BTC Map place ID |
| `name` | Merchant name |
| `address` | Street address |
| `lat` | Latitude |
| `lon` | Longitude |
| `verified_at` | Community verification date |
| `website` | Merchant website URL |

### Filename Format

```
btcmap-{program-slug}-merchants.csv
```

Example: `btcmap-el-salvador-merchants.csv`

---

## Honesty Rules

These are non-negotiable. Paige must follow them without exception.

1. **BTC Map data is community-sourced** — merchant counts may lag behind real-world changes.
2. **A merchant pin does not mean the venue definitely accepts Bitcoin today** — verify before visiting.
3. **Density tiers are approximate** — 19 merchants (moderate) is not dramatically different from 20 (dense).
4. **Cache staleness is honest** — if data is 10+ days old, tell the member and suggest checking btcmap.org directly.
5. **Lightning readiness is self-reported** — it may be outdated.
6. **MotoPass does not verify BTC Map data** — it's an open-data integration, not a curated list.
7. **Saved merchants are local until Nostr sync ships** — switching devices loses the list.
8. **CSV exports are snapshots** — they don't update as merchants change on BTC Map.

---

## Member-Facing Scripts

Use these when members ask common questions:

### "What is BTC Map?"

> BTC Map is like Yelp but for Bitcoin: a community-maintained map of businesses that accept Bitcoin, created and verified by users worldwide.

### "How many merchants accept Bitcoin in [country]?"

> MotoPass shows the number of Bitcoin-accepting merchants near each program's capital city. The density badge tells you at a glance whether there's a strong Bitcoin commerce scene.

### "Is the merchant data accurate?"

> BTC Map is community-sourced, so it may lag behind real-world changes. If you know a venue that accepts Bitcoin but isn't on the map, you can add it at btcmap.org/add-location.

### "What does 'dense' / 'moderate' / 'sparse' mean?"

> Density is the number of Bitcoin-accepting merchants within a radius of the program's capital. Sparse means few options, moderate means a growing scene, dense means plenty of places to spend Bitcoin.

### "Can I save my favorite merchants?"

> Yes — sign in with a Nostr extension and click the heart icon on any merchant. Your saved list is stored locally and will sync across devices when Nostr relay sync ships.

### "How do I export the merchant list?"

> Click the CSV download button in the merchant directory. You get a spreadsheet with name, address, coordinates, and verification date for every merchant in the current filter.

### "What does Lightning-ready mean?"

> Lightning-ready means the merchant accepts Bitcoin Lightning Network payments — near-instant, near-zero-fee transactions. Look for the ⚡ badge on the map.

### "How do I add a venue to BTC Map?"

> Click 'Report Venue' on the BTC Map page — it links to btcmap.org/add-location with the coordinates pre-filled. The community verifies new submissions.

---

## Developer Reference

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/btcmap.ts` | API client — search, areas, saved places, URL builders |
| `src/lib/btcmapDensity.ts` | Density tiers, scoring, snapshot loading |
| `src/lib/btcmapCluster.ts` | Grid clustering for Leaflet pins |
| `src/lib/btcmapCache.ts` | Offline snapshot loading |
| `src/lib/btcmapFreshness.ts` | Cache age, staleness, freshness badges |
| `src/lib/btcmapAuth.ts` | NIP-98 Nostr HTTP Auth |
| `src/lib/btcmapSavedSync.ts` | localStorage + future Nostr sync |
| `src/lib/btcmapExport.ts` | CSV export |
| `src/lib/btcmapIcons.ts` | 20+ merchant category icons |
| `src/lib/btcmapSlug.ts` | URL-safe slugs for cache paths |
| `src/lib/btcmapHighlight.tsx` | Search match highlighting |
| `src/pages/BtcMapPage.tsx` | BTC Map page — map, directory, command bar |
| `src/components/btcmap/BtcMapMerchantDirectory.tsx` | Searchable directory with filters |
| `src/components/btcmap/BtcMapPlacesList.tsx` | Merchant list with virtual scroll |
| `src/components/btcmap/MerchantDensityBadge.tsx` | Colored density badge |
| `src/components/btcmap/BtcMapCacheFreshnessBadge.tsx` | Cache age indicator |
| `src/components/btcmap/BtcMapCacheStaleBanner.tsx` | Expired cache warning |
| `scripts/fetch-btcmap-density.mjs` | Daily density pre-fetch |
| `scripts/sync-btcmap-cache.mjs` | Per-jurisdiction snapshot sync |
| `src/data/programCoords.ts` | Lat/lon + radius for all 50 programs |

### Storage Keys

| Key | Storage | Contents |
|-----|---------|---------|
| `motopass-btcmap-saved` | localStorage | Saved merchant IDs (number[]) |
| `motopass-btcmap-token` | sessionStorage | NIP-98 auth token |

### Static Data Files

| File | Contents |
|------|----------|
| `public/data/btcmap-density.json` | Per-program merchant count, tier, score |
| `public/data/btcmap/{slug}.json` | Full place list + areas per jurisdiction |
| `public/data/btcmap/manifest.json` | List of all synced programs with counts |

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     BTC Map API                             │
│                   api.btcmap.org                            │
│                                                             │
│  GET /v4/places/search/?lat=...&lon=...&radius_km=...      │
│  GET /v4/areas?lat=...&lon=...                              │
│  POST /v4/auth/nostr (NIP-98)                               │
│  GET/POST/DELETE /v4/places/saved (auth required)           │
└─────────────────────────────────────────────────────────────┘
         │                          │
    ┌────┴────┐              ┌──────┴──────┐
    │  DAILY  │              │   LIVE API  │
    │  CRON   │              │  (fallback) │
    └────┬────┘              └──────┬──────┘
         │                          │
    ┌────▼────────────┐    ┌────────▼────────┐
    │ fetch-btcmap-   │    │ BtcMapPage      │
    │ density.mjs     │    │ useBtcMapPlaces │
    │                 │    │                 │
    │ sync-btcmap-    │    │ loadBtcMap      │
    │ cache.mjs       │    │ Snapshot()      │
    └────┬────────────┘    └────────┬────────┘
         │                          │
    ┌────▼────────────┐    ┌────────▼────────┐
    │ /data/btcmap-   │    │ /data/btcmap/   │
    │ density.json    │    │ {slug}.json     │
    └────┬────────────┘    └────────┬────────┘
         │                          │
    ┌────▼──────────────────────────▼────────┐
    │              CLIENT SIDE               │
    │                                        │
    │  MerchantDensityBadge (program cards)  │
    │  BtcMapPage (map + directory)          │
    │  intel-fetch (crypto_friendly_score)   │
    └────────────────────────────────────────┘
```

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_BTCMAP_API_URL` | `https://api.btcmap.org` | BTC Map API base |
| `VITE_BTCMAP_WEB_URL` | `https://btcmap.org` | BTC Map web origin |

### Program Coordinates

All 50 programs have a lat/lon coordinate and search radius defined in `src/data/programCoords.ts`. These are mirrored in:
- `scripts/fetch-btcmap-density.mjs` (density pre-fetch)
- `scripts/sync-btcmap-cache.mjs` (snapshot sync)
- `scripts/lib/intel-sources.mjs` (intel pipeline)

When adding a new program, all three files must be updated to keep the maps in sync.

---

*Generated: 2026-08-21 · Build: 2026.08.21-80 · Paige Knowledge Base: btcmap-discovery*
