# Design System — MotoPass

**BUILD:** 20260702-012 · **Last updated:** 2026-07-02

> **Canonical docs for the React app:** [DESIGN-CONTEXT.md](./DESIGN-CONTEXT.md) and [DESIGN-TOKENS.md](./DESIGN-TOKENS.md). Read those first.

This file records design history and pointers. The active theme is **Luminous Sovereign** (light default) with optional **Sovereign Night** (dark toggle).

---

## Current theme: Luminous Sovereign

| Role | Light | Dark (Sovereign Night) |
|------|-------|------------------------|
| Canvas | `#F5F2EC` | `#121214` |
| Card | `#FFFFFF` | `#27272A` |
| Ink | `#18181B` | `#FAFAFA` |
| Accent | `#F7931A` | `#F7931A` |

- Surface ladder: canvas → section → card → card-elevated
- Orange reserved for CTAs and proof signals
- Motion hero: sovereignty.jpg @ 35% opacity (28s Ken Burns)

## Legacy: Dark cyber-sovereign (pre-BUILD-010)

The original direction used Sovereign Black `#0a0a0a`, Deep Void `#111111`, glassmorphic cards. This informed early `website/index.html` and `NEXT-PROMPT.md`. The React app moved to light for contrast; dark mode toggle restores a refined dark palette via CSS variables.

## Typography

- **Display:** Space Grotesk 600–700
- **Body:** Inter 400–600
- **Mono:** JetBrains Mono (eyebrows, proofs, block height)

## Imagery

`hero.jpg`, `sovereignty.jpg`, `passport.jpg`, `funding-flow.jpg`, `incubator.jpg`, `education.jpg`

## UI generation

Use [NEXT-PROMPT.md](./NEXT-PROMPT.md) with `enhance-prompt`, `stitch-loop`, `react-components` skills. Always apply tokens from DESIGN-TOKENS.md.

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*