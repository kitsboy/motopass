# MotoPass Design Context

**BUILD:** 20260702-010 · **Last updated:** 2026-07-02

## Why we moved to a lighter palette

The previous dark sovereign theme (`#0a0a0a` page + `#111111` cards) produced **insufficient contrast between surfaces** — cards blended into the background, especially on mobile. Users reported difficulty scanning program grids and reading finance data.

The upgraded direction is **Luminous Sovereign**: warm light backgrounds, crisp white elevated cards, strong typographic hierarchy, and Bitcoin orange reserved for action and proof signals.

## Brand atmosphere

- **Feel:** Premium travel + private wealth + Bitcoin verifiability — not a generic SaaS dashboard.
- **Mood:** Airy, confident, special; motion on the landing hero suggests global mobility.
- **Trust:** Green proof badges, monospace block height, Satohash links — unchanged in meaning, refreshed in presentation.

## Layout principles

1. **Surface ladder:** `canvas` → `section` → `card` → `card-elevated` — each step has visible separation (border + shadow).
2. **Motion sparingly:** Landing hero uses a slow Ken Burns loop on sovereignty imagery at **35% opacity** behind content.
3. **Mobile-first:** Bottom nav, touch targets ≥44px, readable 16px body on small screens.
4. **Orange discipline:** Primary CTAs and active nav only; never flood large backgrounds with orange.
5. **Data density:** Explorer and modals may be denser; marketing pages stay spacious.

## Page patterns

| Pattern | Usage |
|---------|--------|
| `HeroMotionBackground` | Landing `/` hero only |
| `PageHeader` | All interior pages — eyebrow, title, optional actions |
| `StatCard` | Portfolio, dashboard, simulator metrics |
| `card` / `card-elevated` | Content blocks |
| `chip` / `chip-active` | Filters, taxonomy |
| `input-field` | Forms, search |

## Imagery

| Asset | Role |
|-------|------|
| `/images/sovereignty.jpg` | Landing hero motion background (35% opacity) |
| `/images/hero.jpg` | OG + secondary sections |
| `/images/passport.jpg` | Modals, vault |
| `/images/funding-flow.jpg` | Finance compare |
| `/logo.png` | Header, footer, favicon |

## Implementation map

- **Tokens:** `docs/DESIGN-TOKENS.md` + `tailwind.config.js` + `src/index.css`
- **Components:** `src/components/ui/*`, updated `Layout`, `ProgramCard`, pages
- **Legacy:** Root `DESIGN.md` remains historical; this doc + tokens are canonical for the React app

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*