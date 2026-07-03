# Design System Reference — MotoPass

**BUILD:** 20260702-012 · **Last updated:** 2026-07-02

Cross-reference companion for agents, Stitch, and React work.

## Canonical sources (read these)

| Doc | Purpose |
|-----|---------|
| [DESIGN-CONTEXT.md](./DESIGN-CONTEXT.md) | Rationale, layout patterns, imagery map |
| [DESIGN-TOKENS.md](./DESIGN-TOKENS.md) | CSS variables, Tailwind classes |
| [DESIGN.md](./DESIGN.md) | History + legacy dark theme notes |

## Implementation files

- `tailwind.config.js` — RGB token colors, darkMode: `class`
- `src/index.css` — Component utilities (`.card`, `.btn-primary`, etc.)
- `src/context/ThemeContext.tsx` — Light/dark toggle
- `src/components/ui/HeroMotionBackground.tsx` — Landing motion

## Current vs. reference implementations

| Surface | Theme | Location |
|---------|-------|----------|
| **React app (primary)** | Luminous Sovereign + dark toggle | `src/` |
| **Static demo** | Light-aligned (BUILD-011) | `website/index.html` |
| **Legacy vision** | Dark cyber-sovereign | `docs/NEXT-PROMPT.md` (update when generating) |

## Component rules (summary)

- Cards: white/dark elevated surfaces, `border-mp`, `shadow-card`
- Buttons: `.btn-primary` (orange), `.btn-secondary` (outlined)
- Chips: `.chip` / `.chip-active` for filters
- Forms: `.input-field` with orange focus ring
- Proof badges: `.proof-badge` (green mono)

## Language

Sovereignty, jurisdictional stacking, Lightning Ready, Satohash proofs, stacking synergy, acquired status.

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*