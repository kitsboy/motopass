# Design System: MotoPass

**Project ID:** motopass-20260610  
**Last Updated:** 2026-06-10 | BUILD-20260610-004  
**Source of Truth Folder:** /Users/cam/projects/motopass

## 1. Visual Theme & Atmosphere
Premium dark cyber-sovereign aesthetic with strong Bitcoin energy. The overall mood is luxurious, trustworthy, and empowering — evoking freedom, sovereignty, and high-net-worth jurisdictional stacking. Deep blacks and dark grays create a "night mode" passport dashboard feel. Vibrant Bitcoin orange (#F7931A) provides high-contrast accents that feel energetic and rebellious. The atmosphere is dense but elegant, with generous whitespace, subtle glassmorphic effects, and high-quality custom imagery (hero, sovereignty, passport, funding-flow). It feels like a private sovereign wealth command center rather than a simple tracker.

## 2. Color Palette & Roles
- **Sovereign Black** (#0a0a0a) — Primary background, page base
- **Deep Void Gray** (#111111) — Card surfaces, panels
- **Bitcoin Orange** (#F7931A) — Primary accent, buttons, active filters, Bitcoin signals, hover states
- **Sovereign Silver** (#a1a1aa) — Secondary text, borders, subtle icons
- **Freedom White** (#f4f4f5) — Primary headings and high-contrast text on dark backgrounds
- **Crypto Green** (#22c55e) — Positive metrics, acquired status, ROI indicators
- **Alert Amber** (#f59e0b) — Researching / pending statuses
- **Danger Red** (#ef4444) — High risk or caution signals (used sparingly)

## 3. Typography Rules
- **Display Font:** Space Grotesk (600–700 weight) — Used for hero headlines, section headers, and sovereignty scores. Tight letter-spacing (-0.025em) for modern premium feel.
- **Body Font:** Inter (300–600 weight) — Clean readability for all data, modals, filters, and finance details.
- Hierarchy: Large bold display for metrics and country names, medium weights for finance labels, lighter weights for supporting text and sources.

## 4. Component Stylings
- **Cards:** Generously rounded (16–20px), deep void gray background, subtle glassmorphic border (1px silver with slight opacity), soft elevation with whisper-soft diffused shadows. Hover lifts with stronger orange glow.
- **Buttons:** Pill-shaped or subtly rounded (12px), Bitcoin orange background with black text for primary actions. Secondary buttons use transparent background with silver border. Strong hover animation and orange glow.
- **Filters & Chips:** Rounded-full pills, dark background with silver text. Active state flips to Bitcoin orange background with black text.
- **Modals:** Large, centered, dark with glassmorphic overlay. Rich content layout with passport imagery on left or as background, detailed finance tables on right. Smooth pop-in animation.
- **Data Table:** Clean, high-contrast, with status pills (green for Acquired, amber for Researching). Sortable headers with subtle orange highlight on active column.
- **Metrics/Dashboard:** Large tabular-numeric font for numbers. Circular progress or flag-based "sovereignty score" indicators. Funding-flow and passport imagery used as hero backgrounds or section dividers.

## 5. Layout Principles
- Dark-first, full-bleed hero with sovereignty/passport imagery and strong orange overlay text.
- Sidebar or top navigation for "My Portfolio", "All Programs", "Stack Simulator", "Finance Compare".
- Responsive grid: cards on mobile, cards + table toggle on desktop.
- Generous whitespace (2–3rem padding) around major sections. Information density increases in modals and portfolio view.
- Visual hierarchy emphasizes Bitcoin integration first, then finance numbers, then legal/sovereignty details.
- Consistent use of custom images: hero.jpg for landing, passport.jpg for modals, funding-flow.jpg for finance views, sovereignty.jpg for background accents.

## 6. Bitcoin & Sovereignty Language
All copy and UI labels should reinforce sovereignty, jurisdictional stacking, Bitcoin-native identity, and freedom. Use terms like "Acquired", "Sovereign Score", "Stacking Synergy", "Lightning Ready", "Tax Sovereign".

This DESIGN.md is the single source of truth for all future UI generation, iterations, and hand-offs. It codifies the premium dark cyber-sovereign aesthetic (sovereign black + Bitcoin orange) that must be respected whether evolving the pristine single-file demo or building the modern Vite/React experience in the root dev environment.

The current working `website/index.html` uses an earlier but compatible navy/gold + orange variant — future iterations (per next-prompt.md) will converge on the exact palette and component rules defined here.

**Next:** Use this file + `next-prompt.md` with the `enhance-prompt`, `stitch-loop`, `react-components`, and `shadcn-ui` skills to generate the next evolution of the product.
