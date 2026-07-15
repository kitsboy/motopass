# motopass — Context Map

> **Updated:** 2026-07-14 · **BUILD:** 2026.07.14-33 · **Commit:** `0ce5e12`
> **Domain:** [motopass.giveabit.io](https://motopass.giveabit.io)
> **Stack:** React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + Cloudflare Pages

---

## Directory Structure

```
motopass/
├── src/
│   ├── lib/
│   │   ├── buildInfo.ts          # BUILD_ID source of truth
│   │   ├── navRoutes.ts          # MAIN_NAV_ROUTES — canonical menu
│   │   ├── launch/               # launch-gates.json fetch
│   │   ├── btcmap.ts             # BTC Map API v4 client
│   │   ├── seal/                 # vaultVerify.ts
│   │   └── distressed/           # buildListings.ts
│   ├── components/
│   │   ├── ui/GlassCard.tsx      # Glassmorphism card primitive
│   │   ├── nav/                  # DesktopNav, MobileMenuSheet, MoreNavSheet, ApplyNavLink
│   │   ├── footer/               # FooterApplyLink, modals
│   │   ├── btcmap/               # Leaflet, places list, density badge
│   │   └── programs/             # ProgramCard, Modal, Table
│   ├── pages/
│   │   ├── VaultPage.tsx         # Seal — OTS verify
│   │   ├── DistressedPage.tsx    # Forge marketplace
│   │   ├── ApplyPage.tsx         # Launch Engine applications
│   │   └── … (18 routes total)
│   ├── styles/tokens.css         # Design tokens + glass + BTC textures
│   └── index.css                 # Global styles, nav chrome, sovereign canvas
├── public/
│   ├── launch-gates.json         # 5-gate scorecard (applications_open)
│   └── data/btcmap/              # 50 jurisdiction snapshots
├── research/
│   ├── countries.json            # 50 programs (50/50 deep flagships)
│   ├── oracle-seed.json          # G4 Ledger seed
│   └── pitch-anchor.json         # ₿-first pitch figures
├── scripts/
│   ├── launch-gate-check.mjs     # Launch Engine validator
│   ├── sync-build-version.mjs    # npm run sync:build
│   └── sync-pitch-anchor.mjs     # npm run pitch:sync
└── docs/                         # Full knowledge base
```

---

## Canonical Navigation

**Source:** `src/lib/navRoutes.ts` → `MAIN_NAV_ROUTES`

Programs · Vault · Distressed · BTC Map · Simulator · Compare · Agents · Apply

| Surface | Implementation |
|---------|----------------|
| Desktop | `DesktopNav.tsx` — flat row + Register/Dashboard |
| Mobile menu | `MobileMenuSheet.tsx` — 2-col grid, all 8 |
| Bottom bar | `MobileBottomNav.tsx` — Programs, Vault, Distressed, Apply, More |
| More sheet | `MoreNavSheet.tsx` — BTC Map, Simulator, Compare, Agents |
| Footer | `Footer.tsx` — same order + NavLink active states |

---

## Sovereign Stack v2.3 (Launch Engine)

| Pillar | Route / Asset | Gate |
|--------|---------------|------|
| Seal | `/vault` · 50 OTS on disk | G1 |
| Forge | `/distressed` | G2 |
| Nexus | Nostr relay · `/apply` | G3 |
| Ledger | `oracle-seed.json` · 50 programs | G4 |
| Ops | validate:* · build · e2e | G5 |

Run: `npm run launch:gate` · Ship: `npm run deploy:all`

---

## Design System (BUILD-33)

- **Default theme:** Sovereign Night (`#0A0A0C`) — `ThemeContext` + `index.html` flash
- **Glass cards:** `.glass-card`, `GlassCard` component — blur, orange edge glow
- **Textures:** BTC block-grid + hash monospace patterns on `.sovereign-canvas`
- **Typography:** Fraunces display · Source Serif body · IBM Plex chrome/mono
- **Tokens:** `src/styles/tokens.css` · Tailwind `mp-*` namespace

---

## Routing (18 pages)

| Route | Page |
|-------|------|
| `/` | PitchPage |
| `/programs` | ProgramsPage |
| `/vault` | VaultPage |
| `/distressed` | DistressedPage |
| `/btcmap` | BtcMapPage |
| `/simulator` | StackSimulatorPage |
| `/compare` | FinanceComparePage |
| `/agents` | AgentsPage |
| `/apply` | ApplyPage |
| `/portfolio` | PortfolioPage |
| `/dashboard` | DashboardPage |
| `/register` | RegisterPage |
| `/profile` | ProfilePage |
| `/verify` | VerifyPage |
| `/blog` | BlogPage |
| `/blog/:slug` | BlogPostPage |
| `*` | NotFoundPage |

---

## Tests & Deploy

| Check | Count / Command |
|-------|-----------------|
| Unit | 36 — `npm test` |
| E2E | 19 — `npm run test:e2e` |
| Gates | 5/5 — `npm run launch:gate` |
| Bundle | 877 KB / 2500 KB budget |
| Deploy | `npm run deploy:all` → Cloudflare Pages `motopass` |
| Health | `npm run health-check` |

---

## Knowledge Base Index

| Doc | Purpose |
|-----|---------|
| `docs/SOURCE-OF-TRUTH.md` | Canonical project record |
| `docs/UPDATES-MAP.md` | Build history & queue |
| `docs/ARCHITECTURE.md` | System architecture + Launch Engine |
| `docs/DIRECTORY-MAP.md` | Quick agent path index |
| `docs/KIMI-HANDOFF.md` | Session handoffs for Kimi/M4 |
| `docs/PITCH-ANCHOR.md` | ₿-first pitch figures policy |
| `docs/CHANGELOG.md` | Version history |
| `LATEST-UPDATE.md` | Last Grok ship summary |

---

## Environment

| Variable | Default |
|----------|---------|
| `CLOUDFLARE_API_TOKEN` | Manual wrangler deploy |
| `VITE_SITE_URL` | `https://motopass.giveabit.io` |
| `LAUNCH_FAKE_RELAY` | `1` (QA) — set `0` for production G3 |