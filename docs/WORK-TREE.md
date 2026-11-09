# MotoPass Work Tree

**BUILD:** 2026.07.14-28 · **Last updated:** 2026-11-09

Programs can lead with one passport, copy one country's change note without sending it, and open a receipt under a day bar. `src/lib/probeNotHumanRead.ts` labels `cbiu.gov.dm` and `cnmv.es` as probe-only. `scripts/stamp-changed.mjs` retries a 429 and then continues. Intel fresh is ≤30 days.

**Live catalog:** **21 programs** in `research/countries.json`. Counts of 50 in older notes are pre-curation history (BUILD-33, 2026-07-14: 50 programs, 50 OTS files, 50 BTC Map snapshots). **MVP cadence:** every location updated at least once a week (source probe or intel sweep). **Later cadence:** every location every day. Daily is the next target, not a new scheduler.

Complete file map for any agent (Grok, Kimi, Claude, Hermes). **Canonical docs live in `docs/`** unless noted.

---

## Root (required outside docs/)

| Path | Purpose | Keep at root? |
|------|---------|---------------|
| `README.md` | Project entry point & quickstart | ✅ Yes |
| `AGENTS.md` | Cursor agent rules | ✅ Yes |
| `GROK-SESSION-PROTOCOL.md` | M3→M4 handoff protocol | ✅ Yes |
| `LATEST-UPDATE.md` | One-line last-session summary | ✅ Yes |
| `package.json` | npm scripts & deps | ✅ Yes (code) |
| `index.html` | Vite HTML shell | ✅ Yes (code) |

Root stubs (redirect only): `SOURCE-OF-TRUTH.md`, `DIRECTORY-MAP.md`, `DESIGN.md`, `PROJECT-VISION.md`, `next-prompt.md`, `CHANGELOG.md`, `CONTRIBUTING.md`

---

## `docs/` — Documentation hub

### Start here
| File | Read when |
|------|-----------|
| [README.md](./README.md) | First visit to docs |
| [UPDATES-MAP.md](./UPDATES-MAP.md) | What's shipped & what's next |
| [WORK-TREE.md](./WORK-TREE.md) | This file — where everything lives |
| [KIMI-HANDOFF.md](./KIMI-HANDOFF.md) | Latest M3 session handoff |
| [SOURCE-OF-TRUTH.md](./SOURCE-OF-TRUTH.md) | Canonical project record |

### Strategy & product
| File | Content |
|------|---------|
| [EXECUTIVE-SUMMARY.md](./EXECUTIVE-SUMMARY.md) | Investor/partner one-pager |
| [MARKETING.md](./MARKETING.md) | Positioning, messaging, channels |
| [MISSION.md](./MISSION.md) | Purpose, values, problem/solution |
| [PRODUCT-SCOPE-ROADMAP.md](./PRODUCT-SCOPE-ROADMAP.md) | Phased build scope |
| [PROJECT-VISION.md](./PROJECT-VISION.md) | Full vision & non-negotiables |
| [GLOSSARY.md](./GLOSSARY.md) | CBI, RBI, stacking, Satohash terms |

### Technical
| File | Content |
|------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture & deploy |
| [DATA-MODEL.md](./DATA-MODEL.md) | `countries.json` schema |
| [BITCOIN-VERIFICATION.md](./BITCOIN-VERIFICATION.md) | OTS + Satohash flows |
| [CLAUDE-RESEARCH-PIPELINE-PROMPT.md](./CLAUDE-RESEARCH-PIPELINE-PROMPT.md) | Source-trust engine blueprint |
| [COUNTRY-INTEL.md](./COUNTRY-INTEL.md) | Self-healing source pipeline for the live 21 (the old “50-jurisdiction” wording is pre-curation history) |
| [PAIGE-AI.md](./PAIGE-AI.md) | AI concierge spec |
| [I18N.md](./I18N.md) | Internationalization |

### Design
| File | Content |
|------|---------|
| [DESIGN-CONTEXT.md](./DESIGN-CONTEXT.md) | **Canonical** — Luminous Sovereign rationale |
| [DESIGN-TOKENS.md](./DESIGN-TOKENS.md) | **Canonical** — CSS/Tailwind tokens |
| [DESIGN-REFERENCE.md](./DESIGN-REFERENCE.md) | Cross-ref & evolution notes |
| [DESIGN.md](./DESIGN.md) | Legacy dark theme + pointers |
| [NEXT-PROMPT.md](./NEXT-PROMPT.md) | Stitch/UI generation prompt |

### SEO
| File | Content |
|------|---------|
| [SEO.md](./SEO.md) | English SEO strategy |
| [SEO-de.md](./SEO-de.md) … [SEO-zh.md](./SEO-zh.md) | Locale SEO |

### Process
| File | Content |
|------|---------|
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contributor guide |
| [DIRECTORY-MAP.md](./DIRECTORY-MAP.md) | Legacy quick index (see WORK-TREE) |

### Archive
| Path | Content |
|------|---------|
| [archive/](./archive/) | Superseded handoffs, templates, backups |

---

## `src/` — React application

```
src/
├── App.tsx              # Routes (15 pages)
├── main.tsx             # Entry
├── index.css            # Tailwind + CSS variables (light/dark) + Leaflet pins
├── components/
│   ├── btcmap/          # BtcMapLeaflet, PlacesList, ReportVenue, density badge
│   ├── programs/        # ProgramCard, ProgramModal, ProgramsTable
│   └── ui/              # PageHeader, ProofBadge, etc.
├── context/             # User, Theme, Programs, BlockHeight, BtcMapAuth, BtcMapDensity
├── pages/               # Pitch, Programs, Portfolio, BtcMap, Agents, Blog, etc.
├── hooks/               # useBtcMapPlaces, usePrograms, usePortfolio
├── lib/                 # btcmap, btcmapAuth, btcmapCache, satohash, programAdapter
├── i18n/                # Translations + pageKeys.ts
├── data/                # programCoords, blog, taxonomy, agents
└── types/               # Program, User types
```

---

## `research/` — Data (source of truth)

| File | Purpose |
|------|---------|
| `countries.json` | **21 programs** — live catalog for the app and the demo. The BUILD-33 “50 programs” line is pre-curation history. |
| `uruguay-flagship.md` | v2.0 deep template for expansion |
| `passes/2026-08-21/` | Batch 1–2 briefs (CAR, Bolivia, PY, PA, Portugal, Malta, SKN, Antigua, Dominica, Uruguay) |
| `passes/2026-08-22/` | Batch 3–5 briefs (El Salvador, CH, SG, UAE, GE, CR, HK, TH, MX, CY, Greece, Vanuatu, Turkey, Mauritius) |

---

## `website/` — Pristine static demo

| File | Purpose |
|------|---------|
| `index.html` | Zero-build reference dashboard (~2.3k lines) |

Served at https://motopass.giveabit.io/website/index.html

---

## `images/` — Visual assets

`hero.jpg`, `sovereignty.jpg`, `passport.jpg`, `funding-flow.jpg`, `incubator.jpg`, `education.jpg`, `logo.png`

---

## `public/data/` — Static data the app reads

| Path | Purpose |
|------|---------|
| `btcmap-density.json` | Merchant counts + density tiers per jurisdiction |
| `btcmap/{slug}.json` | Offline place/area snapshots for the **21** live programs. The earlier 50-snapshot cache was retired with the curation. |
| `btcmap/manifest.json` | Cache index (generated by sync script) |
| `advisories.json` | Snapshot of US, UK, and Argentine citizen-advice pages. Outside the Satohash slice. Refreshed by `npm run advisories:fetch` and the daily job. |
| `source-events.json` | Probe history, including the before-and-after text the sentence strip reads. |
| `source-monitor.json` | Latest probe status for the watched URLs. |

---

## `scripts/` — Automation

| Script | Purpose |
|--------|---------|
| `verify-goal.sh` | Auditable verification (`npm run verify:goal`) |
| `fetch-btcmap-density.mjs` | `npm run btcmap:density` |
| `sync-btcmap-cache.mjs` | `npm run btcmap:sync` |
| `generate-sitemap.mjs` | `npm run sitemap` |
| `check-bundle-size.mjs` | `npm run bundle:check` |
| `expand-countries.mjs` | Batch-add programs |
| `patch-website-light.mjs` | Align demo to light theme |
| `fetch-advisories.mjs` | `npm run advisories:fetch`. Writes `public/data/advisories.json`. A network miss keeps the previous copy. |
| `change-bell.mjs` | Prints the change-bell payload. Posts only when `MOTOPASS_CHANGE_WEBHOOK_URL` is public https. |

---

## `dist/` — Production build

Generated by `npm run build`. Copied to Cloudflare Pages. Includes `research/`, `website/`, `images/`, `data/btcmap/`.

---

## Quick commands

```bash
npm run dev              # Local preview
npm run build && npm test && npm run test:e2e
npm run btcmap:density && npm run btcmap:sync
npm run deploy:safe      # CF Pages → motopass only
SCRATCH=/tmp/mp npm run verify:goal
```

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*