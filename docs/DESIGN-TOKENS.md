# MotoPass Design Tokens

**Canonical token reference for the Vite/React app.** Use Tailwind classes or CSS variables — never hard-code hex in components.

## Color — surfaces

| Token | CSS variable | Hex | Tailwind | Use |
|-------|--------------|-----|----------|-----|
| canvas | `--mp-canvas` | `#F5F2EC` | `bg-canvas` | Page background |
| section | `--mp-section` | `#EDE9E3` | `bg-section` | Alternating bands |
| card | `--mp-card` | `#FFFFFF` | `bg-card` | Primary cards |
| card-muted | `--mp-card-muted` | `#FAFAF8` | `bg-card-muted` | Nested panels |
| overlay | `--mp-overlay` | `rgba(24,24,27,0.45)` | — | Modal scrim |

## Color — text

| Token | CSS variable | Hex | Tailwind |
|-------|--------------|-----|----------|
| ink | `--mp-ink-primary` | `#18181B` | `text-ink` / `text-mp-ink` |
| ink-secondary | `--mp-ink-secondary` | `#3F3F46` | `text-ink-secondary` |
| ink-muted / tertiary | `--mp-ink-tertiary` | `#52525B` | `text-ink-muted` / `text-mp-ink-tertiary` |
| ink-inverse | `--mp-ink-inverse` | `#FBF9F5` | `text-ink-inverse` |
| ink-on-accent | `--mp-ink-on-accent` | `#1A1208` | `text-mp-ink-on-accent` (on orange fills) |
| on-hero | `--mp-ink-on-hero` | `#FBF9F5` | `text-mp-on-hero` (cinematic hero) |
| on-hero-secondary | `--mp-ink-on-hero-secondary` | `rgba(251,249,245,0.9)` | `text-mp-on-hero-secondary` |
| on-hero-muted | `--mp-ink-on-hero-muted` | `rgba(251,249,245,0.75)` | `text-mp-on-hero-muted` |
| btc-text | `--mp-accent-btc-text` | `#9A4E12` | `text-mp-btc-text` (accent on light surfaces) |

## Color — brand & status

| Token | Hex | Tailwind |
|-------|-----|----------|
| btc-orange | `#F7931A` | `btc-orange` (fills, icons on dark — not small body text on light) |
| btc-orange-text | `#9A4E12` | `text-mp-btc-text` |
| btc-orange-deep | `#E07B0F` | `btc-orange-deep` |
| btc-orange-soft | `#FFF7ED` | `btc-orange-soft` |
| status-green | `#16A34A` | `status-green` |
| status-amber | `#D97706` | `status-amber` |
| status-red | `#DC2626` | `status-red` |
| nostr-violet | `#7C3AED` | `nostr-violet` |
| nostr-violet-soft | `#F5F3FF` | `nostr-violet-soft` |

## Color — borders

| Token | Hex | Tailwind |
|-------|-----|----------|
| border | `#D6D3D1` | `border-mp` |
| border-strong | `#A8A29E` | `border-mp-strong` |
| border-focus | `#F7931A` | `border-btc-orange` |

## Typography

| Role | Family | Weight | Class |
|------|--------|--------|-------|
| Display | Space Grotesk | 600–700 | `font-display` |
| Body | Inter | 400–600 | `font-body` (default) |
| Mono | JetBrains Mono | 400–500 | `font-mono` |
| Eyebrow | JetBrains Mono | 500 | `section-label` |

## Spacing & radius

| Token | Value | Tailwind |
|-------|-------|----------|
| radius-sm | 8px | `rounded-mp-sm` |
| radius-md | 12px | `rounded-mp-md` |
| radius-lg | 16px | `rounded-mp-lg` |
| radius-xl | 20px | `rounded-mp-xl` |
| radius-pill | 9999px | `rounded-full` |

## Elevation

| Token | Shadow | Class |
|-------|--------|-------|
| shadow-card | `0 1px 3px rgba(24,24,27,0.08), 0 1px 2px rgba(24,24,27,0.04)` | `shadow-card` |
| shadow-card-hover | `0 12px 32px rgba(24,24,27,0.12)` | `shadow-card-hover` |
| shadow-header | `0 1px 0 rgba(24,24,27,0.06)` | `shadow-header` |

## Dark mode (Sovereign Night)

Toggle via `ThemeToggle` in header. Class `.dark` on `<html>` swaps all `--mp-*` variables.

| Token | Light | Dark |
|-------|-------|------|
| canvas | `#F5F2EC` | `#121214` |
| section | `#EDE9E3` | `#1C1C1F` |
| card | `#FFFFFF` | `#27272A` |
| ink | `#18181B` | `#F5F2EC` |
| ink-tertiary | `#52525B` | `#A8A29E` |
| btc-text | `#9A4E12` | `#F0A050` |
| hero-image-opacity | `0.35` | `0.28` |

Persistence: `localStorage` key `motopass-theme`. Respects `prefers-color-scheme` on first visit.

## Motion

| Token | Value | Use |
|-------|-------|-----|
| hero-image-opacity | `0.35` (light) / `0.28` (dark) | Landing background image |
| hero-ken-burns-duration | `28s` | Slow pan/zoom loop |
| transition-fast | `150ms ease` | Hovers |
| transition-base | `220ms ease` | Cards, nav |

## Component aliases

```css
.card          → white surface + border-mp + shadow-card
.card-elevated → card + shadow-card-hover on hover
.btn-primary   → btc-orange fill, ink text
.btn-secondary → white fill, border-mp-strong
.chip          → pill filter inactive
.chip-active   → btc-orange-soft + orange border
.input-field   → white input, focus ring orange
```

## BTC Map (Leaflet)

| Element | Class / token | Use |
|---------|---------------|-----|
| Map pin | `.btcmap-pin` | 12px orange circle, white border, soft shadow |
| Map wrap | `.btcmap-leaflet-wrap` | Rounded card container for Leaflet canvas |
| Search radius | `#f7931a` at 8% fill | Circle overlay on jurisdiction hub |

*See `src/index.css` and `tailwind.config.js` for source of truth.*