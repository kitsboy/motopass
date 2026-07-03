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
| ink | `--mp-ink` | `#18181B` | `text-ink` |
| ink-secondary | `--mp-ink-secondary` | `#3F3F46` | `text-ink-secondary` |
| ink-muted | `--mp-ink-muted` | `#71717A` | `text-ink-muted` |
| ink-inverse | `--mp-ink-inverse` | `#FAFAFA` | `text-ink-inverse` |

## Color — brand & status

| Token | Hex | Tailwind |
|-------|-----|----------|
| btc-orange | `#F7931A` | `btc-orange` |
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

## Motion

| Token | Value | Use |
|-------|-------|-----|
| hero-image-opacity | `0.35` | Landing background image |
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

*See `src/index.css` and `tailwind.config.js` for source of truth.*