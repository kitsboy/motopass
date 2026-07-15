# motopass — Context Map

> **Updated:** 2026-07-14 · **BUILD:** 2026.07.14-32
> **Domain:** [motopass.giveabit.io](https://motopass.giveabit.io)
> **Stack:** React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + Cloudflare Pages

---

## Directory Structure

```
motopass/
+-- src/                        # React application (TypeScript)
|   +-- main.tsx                # App entry point
|   +-- App.tsx                 # Root component with routing
|   +-- index.css               # Global styles
|   +-- vite-env.d.ts           # Vite type declarations
|   +-- components/             # Reusable components
|   |   +-- ui/                 # Base UI components (Chip, Modal, CopyField, etc.)
|   |   +-- beui/               # BE UI kit (AnimatedBadge, FileUpload, TiltCard)
|   |   +-- footer/             # Footer components (Legal, Careers, ServerCosts modals)
|   |   +-- pitch/              # Pitch page components (Hero, SavingsGraphs, Rotator)
|   |   +-- programs/           # Program card/modal/table with types
|   |   +-- *                   # Top-level: AgentCardKimi, BlockHeight, NostrConnect, etc.
|   +-- pages/                  # Page components (18 routes incl. vault, distressed, apply)
|   |   +-- VaultPage.tsx       # Seal — OTS verify
|   |   +-- DistressedPage.tsx  # Forge marketplace
|   |   +-- ApplyPage.tsx       # Launch Engine applications
|   +-- lib/launch/             # launch-gates.json fetch + useLaunchGates
|   +-- lib/                    # Utilities and business logic
|   |   +-- nostr.ts            # Nostr protocol integration
|   |   +-- satohash.ts         # Satohash/OTS verification
|   |   +-- payments.ts         # Payment utilities
|   |   +-- schema.ts           # JSON schemas
|   |   +-- storage.ts          # localStorage utilities
|   |   +-- *.test.ts           # Test files (4 test files)
|   +-- data/                   # Static data (blog, careers, legal, taxonomy)
|   +-- hooks/                  # Custom React hooks
|   +-- i18n/                   # Internationalization (context, languages, translations)
|   +-- context/                # React contexts (Theme, User)
|   +-- styles/                 # Design tokens (tokens.css)
|   +-- types/                  # TypeScript types (program, user)
+-- public/                     # Static assets (served by Vite)
|   +-- logo.png                # Site logo (24KB)
|   +-- _headers                # Cloudflare Pages headers config
|   +-- _redirects              # Cloudflare Pages redirect rules (SPA fallback)
|   +-- robots.txt              # Search engine rules
|   +-- sitemap.xml             # SEO sitemap
|   +-- images/                 # Public images
+-- research/                   # Research data (served as static JSON)
|   +-- countries.json          # 50 programs (CBI/RBI)
|   +-- countries_full.json     # Full data set
|   +-- uruguay-flagship.md     # Uruguay flagship document
+-- website/                    # Static demo site
|   +-- index.html              # Zero-build reference demo
+-- images/                     # Visual assets (8 images: hero, sovereignty, passport, etc.)
+-- scripts/                    # Build and validation scripts (8 scripts)
+-- docs/                       # Full documentation (35+ files)
|   +-- .ai_docs/               # Existing AI docs (legacy)
|   +-- ARCHITECTURE.md, DATA-MODEL.md, DESIGN.md, SEO.md, etc.
+-- dist/                       # Build output (git-committed for CF Pages)
+-- archive/                    # Deprecated content
+-- .github/                    # GitHub config
+-- .wrangler/                  # Wrangler local state
+-- index.html                  # Vite entry HTML
+-- package.json                # Dependencies & scripts
+-- wrangler.toml               # Cloudflare Pages config
+-- vite.config.ts              # Vite config + static asset plugin
+-- vitest.config.ts            # Test runner config
+-- tsconfig.json               # TypeScript config
+-- tailwind.config.js          # Tailwind CSS config (extensive custom theme)
+-- eslint.config.js            # ESLint flat config
+-- postcss.config.js           # PostCSS config
+-- .prettierrc                 # Prettier config
+-- .env.example                # Env var template
+-- .env.local                  # Local env vars (gitignored secrets)
+-- README.md                   # Project README
```

---

## Dependencies

### Runtime (`dependencies`)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | React DOM rendering |
| `react-router-dom` | ^7.18.1 | Client-side routing |
| `lucide-react` | ^0.511.0 | Icon library |
| `motion` | ^12.42.2 | Animation library |
| `nostr-tools` | ^2.23.9 | Nostr protocol (identity, events) |
| `qrcode.react` | ^4.2.0 | QR code generation (payments) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^5.4.0 | Build tool & dev server |
| `@vitejs/plugin-react` | ^4.3.1 | Vite React plugin |
| `typescript` | ^5.5.3 | TypeScript compiler |
| `typescript-eslint` | ^8.62.1 | TS ESLint integration |
| `eslint` | ^9.39.4 | Linter (flat config) |
| `tailwindcss` | ^3.4.19 | Utility CSS framework |
| `vitest` | ^3.2.6 | Unit test runner |
| `playwright` | ^1.61.1 | E2E browser testing |
| `ajv` | ^8.20.0 | JSON schema validator |
| `prettier` | ^3.9.4 | Code formatter |

---

## Build Chain

```
src/ (TSX/TS) --> Vite (esbuild + Rollup) --> dist/ (bundled JS/CSS/assets)
                                                    |
research/ ------------------------------------------+ (copied by custom plugin)
website/ -------------------------------------------+
images/ --------------------------------------------+
                                                    v
                                        wrangler pages deploy
                                                    |
                                                    v
                                        Cloudflare Pages (CDN)
                                        motopass.giveabit.io
```

**Toolchain details:**
- **Build:** Vite 5 with `@vitejs/plugin-react`
- **Bundler:** Rollup (production), esbuild (dev)
- **CSS:** PostCSS + Tailwind CSS 3
- **Type checking:** TypeScript 5.5 (via Vite)
- **Output:** `dist/` — JS, CSS, copied static assets
- **Custom plugin:** `motopassStaticAssets` — serves `research/`, `website/`, `images/` in dev + copies to `dist/` at build close
- **SPA fallback:** `_redirects` rule: `/* /index.html 200`

---

## Configuration

### Vite (`vite.config.ts`)
- Dev server port: **5173** (default)
- `fs.strict: false` — allows serving files outside project root
- Custom `motopassStaticAssets` plugin for research/website/images

### Wrangler (`wrangler.toml`)
```toml
name = "motopass"
compatibility_date = "2026-07-02"
pages_build_output_dir = "dist"

[vars]
VITE_SITE_URL = "https://motopass.giveabit.io"
```

### Tailwind (`tailwind.config.js`)
- Dark mode: `class` (toggle via ThemeContext)
- Extensive custom color tokens: `mp-*`, `btc-orange`, `nostr-violet`, `sovereign`, `freedom`
- Custom font families: display (Space Grotesk), body (Inter), chrome (IBM Plex Sans), mono (JetBrains Mono)
- Custom animations: ken-burns, fade-up, shimmer, rise-in, bar-grow
- Custom shadows: card, header, mp-1/2/3/4, mp-glow
- Custom gradients: hero, radial, scrim, seal, guilloche, grid

---

## Environment Variables

| Variable | Default | Required For |
|----------|---------|-------------|
| `CLOUDFLARE_API_TOKEN` | -- | Manual `wrangler pages deploy` |
| `VITE_SITE_URL` | `https://motopass.giveabit.io` | Runtime site URL |
| `VITE_SATOHASH_URL` | `https://satohash.io` | Satohash integration |
| `VITE_NOSTR_RELAY` | `wss://relay.motopass.giveabit.io` | Nostr relay endpoint |

---

## Routing (14 Pages)

All routes defined in `App.tsx` via `react-router-dom`:

| Route | Page Component |
|-------|---------------|
| `/` | PitchPage |
| `/programs` | ProgramsPage |
| `/apply` | ApplyPage |
| `/dashboard` | DashboardPage |
| `/portfolio` | PortfolioPage |
| `/vault` | VaultPage |
| `/verify` | VerifyPage |
| `/profile` | ProfilePage |
| `/register` | RegisterPage |
| `/simulator` | StackSimulatorPage |
| `/compare` | FinanceComparePage |
| `/blog` | BlogPage |
| `/blog/:slug` | BlogPostPage |
| `/agents` | AgentsPage |

---

## NPM Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Start dev server (:5173) |
| `build` | `vite build` | Production build to dist/ |
| `preview` | `vite preview` | Preview production build |
| `test` | `vitest run` | Run unit tests |
| `lint` | `eslint src --max-warnings 50` | TypeScript linting |
| `format` | `prettier --check src` | Code formatting check |
| `validate:data` | `node scripts/validate-data.mjs` | Validate countries.json schema |
| `health-check` | `bash scripts/health-check.sh` | Production endpoint check |
| `verify:goal` | `bash scripts/verify-goal.sh` | Full build -> test -> deploy pipeline |
| `deploy` | `build + wrangler pages deploy` | Build + deploy |
| `deploy:safe` | `build + echo + wrangler deploy` | Safe deploy with warning |
| `deploy:verify` | `npm run build` | Build-only verification |
| `deploy:check` | `test CLOUDFLARE_API_TOKEN` | Check deploy readiness |

---

## Ports & Services

| Service | Port | Notes |
|---------|------|-------|
| Vite dev server | 5173 | Local development only |
| Cloudflare Pages | 443 (HTTPS) | Production at motopass.giveabit.io |
| Nostr relay | 443 (WSS) | `wss://relay.motopass.giveabit.io` |
