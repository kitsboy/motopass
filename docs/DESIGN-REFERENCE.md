# Design System Reference — MotoPass

**BUILD-20260610-004**

This document is the promoted, cross-referenced companion to the root `DESIGN.md`. It exists so that all agents, Stitch generations, React component work, and marketing assets have a single, stable pointer plus evolution notes.

## Primary Source
**Always read and obey the root `DESIGN.md`** for the canonical rules.

Key excerpts (do not treat this as a substitute):

- **Theme**: Premium dark cyber-sovereign with strong Bitcoin energy. Luxurious, trustworthy, empowering. Deep blacks, generous whitespace, subtle glassmorphism, high-quality custom imagery.
- **Palette**:
  - Sovereign Black: #0a0a0a (primary background)
  - Deep Void Gray: #111111 (card surfaces, panels)
  - Bitcoin Orange: #F7931A (primary accent, buttons, active filters, Bitcoin signals, hover glows)
  - Sovereign Silver: #a1a1aa (secondary text, borders)
  - Freedom White: #f4f4f5 (primary headings, high-contrast text)
  - Crypto Green: #22c55e (positive metrics, acquired status, ROI)
  - Alert Amber: #f59e0b (researching / pending)
  - Danger Red: #ef4444 (high risk, used sparingly)
- **Typography**:
  - Display: Space Grotesk (600–700), tight letter-spacing (-0.025em)
  - Body: Inter (300–600)
- **Components**: Generously rounded cards (16–20px), pill or subtly rounded buttons with strong orange primary + black text, rounded-full filter chips, large centered glassmorphic modals, clean high-contrast data tables, large numeric metrics.
- **Imagery**: Heavy, intentional use of the six custom assets (`images/hero.jpg`, `sovereignty.jpg`, `passport.jpg`, `funding-flow.jpg`, `incubator.jpg`, `education.jpg`) as hero backgrounds, modal side panels, portfolio cards, section dividers.
- **Language**: Sovereignty, jurisdictional stacking, Bitcoin-native identity, Lightning Ready, Tax Sovereign, Acquired, Sovereign Score, Stacking Synergy.

## Current vs. Target Aesthetic

**Pristine Reference Implementation** (`website/index.html`)
- Uses a compatible but earlier navy/gold + Bitcoin orange variant (#060f1e navy, #c8a84b gold, #f7931a btc orange).
- Beautiful, premium, functional, and intentionally left largely untouched in BUILD-004.
- Many of the component patterns (glassmorphism, ticker, modals, timestamp UI, Paige chat surface) already demonstrate the desired density and luxury.
- Future work should converge the colors and typography toward the exact DESIGN.md values while preserving the soul of the existing implementation.

**Modern Development Target** (Vite + React + Tailwind)
- Must start from the exact DESIGN.md palette and rules.
- Use the `react-components` and `shadcn-ui` skills (with sovereign overrides) when porting high-fidelity designs or Stitch outputs.
- The `next-prompt.md` describes the exact page structure and interaction model that the component system must support.

## Imagery Usage Rules
- Do not stretch or heavily compress the custom assets.
- Use `hero.jpg` primarily for full-bleed hero / dashboard header backgrounds with strong overlay text.
- Use `passport.jpg` for program modals, acquired cards, and identity-focused surfaces.
- Use `funding-flow.jpg` for finance, simulator, and stacking sections.
- Use `sovereignty.jpg`, `incubator.jpg`, `education.jpg` for supporting accents, empty states, or thematic dividers.
- Always provide alt text or ARIA labels that reinforce sovereignty themes.

## Evolution Notes (BUILD-004 Onward)
- The documentation package (this file + root DESIGN.md) is now the mandatory reference for any UI generation or component work.
- Minor drift between the pristine demo and DESIGN.md is acceptable in the short term; convergence is required as the modern app becomes the primary surface.
- When using the `stitch-loop`, `enhance-prompt`, or `react-components` skills, always include both DESIGN.md and this reference (plus next-prompt.md for structure) in the prompt context.
- New components (filters, modals, simulator controls, proof badges, sovereignty score rings, etc.) must be added to the system rather than invented per-screen.

## Quick Checklist for Any New Screen or Component
- [ ] Background #0a0a0a or #111111 surfaces
- [ ] Bitcoin Orange #F7931A for primary actions and active states
- [ ] Space Grotesk for headlines / scores, Inter for data and body
- [ ] Glassmorphic 1px silver border + soft elevation on cards
- [ ] Generous padding (2–3rem around major sections)
- [ ] Custom imagery used meaningfully, not as decoration
- [ ] Sovereignty / Bitcoin-native language in all labels and microcopy
- [ ] “Verify on Bitcoin” / proof affordance present where data is shown
- [ ] Responsive: desktop-first with graceful mobile (cards first, then table toggle)

## Tooling Alignment
- Tailwind is the implementation vehicle in the Vite app.
- shadcn/ui primitives are welcome as a starting point for buttons, dialogs, tables, etc., but must be heavily themed to the sovereign system (colors, typography, rounding, glass effects).
- No light mode. No corporate blue. No generic fintech gradients unless they reinforce the dark sovereign Bitcoin aesthetic.

This reference, together with the root DESIGN.md, is the visual constitution of MotoPass. All future work is measured against it.

**Truth You Can Verify — and it should look unmistakably like MotoPass when you do.**

— Design System Layer, MotoPass  
BUILD-20260610-004

Cross-references: root `DESIGN.md`, root `next-prompt.md`, `docs/PRODUCT-SCOPE-ROADMAP.md` (Phase 1 UI requirements).