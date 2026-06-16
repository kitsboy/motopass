# MotoPass Documentation Hub

**BUILD-20260610-004** | Last Updated: 2026-06-10

This directory is the official, long-form documentation home for the MotoPass project. It contains the complete strategic, marketing, product, and technical record required to align all humans and agents (Goose, Kimi/HERMES, future contributors) and to make the full scope of what we are building unmistakably clear.

## Core Documents (Read in This Order)

1. **[EXECUTIVE-SUMMARY.md](./EXECUTIVE-SUMMARY.md)**  
   One-page strategic overview. Problem, solution, moat, market, traction, vision, and call to action. Suitable for investors, government partners, advisors, and high-level briefings.

2. **[MARKETING.md](./MARKETING.md)**  
   Full positioning, target audiences, value propositions, messaging architecture, taglines, channels, content strategy, pricing philosophy, launch sequencing, and competitive differentiation. “Truth You Can Verify” is the through-line.

3. **[PRODUCT-SCOPE-ROADMAP.md](./PRODUCT-SCOPE-ROADMAP.md)**  
   **The definitive answer to “how much are we going to build here?”**  
   Detailed, phased breakdown of the entire product ambition — from the current pristine 16-country static dashboard through the full sovereign identity + finance operating system. Includes feature depth, data requirements (the 50-country program), integrations (Bitcoin timestamping, Nostr, Lightning, Paige AI), technical architecture evolution, marketplace, B2G, and success metrics. This is the master reference for scope, sequencing, and what “done” looks like at each stage.

## Supporting Documentation

- `ARCHITECTURE.md` — Technical architecture, data flows, deployment models, sovereign self-hosting, security & privacy model (in progress / to be expanded).
- `DATA-MODEL.md` — Complete schema for `countries.json` (v2.0 master template), future user/portfolio/application/stamp models, and data pipeline requirements.
- `BITCOIN-VERIFICATION.md` — Deep specification for “Truth You Can Verify”: OpenTimestamps + Satohash flows, what gets stamped when, UI treatment of proofs, verification UX, and long-term on-chain reputation.
- `PAIGE-AI.md` — The intelligent concierge specification: system prompt principles, capabilities, Nostr integration, personalization, escalation rules, and training sources.
- `DESIGN-REFERENCE.md` — Promoted/enhanced reference to the root `DESIGN.md`. Visual system, component rules, imagery usage, and evolution notes (current static vs next-gen React).
- `GLOSSARY.md` — Precise definitions for CBI, RBI, jurisdictional stacking, territorial tax, Lightning readiness, sovereignty score, stacking synergy, Satohash proofs, Paige, etc.
- `ROADMAP-OVERVIEW.md` or individual phase briefs (future).

## How This Documentation Is Maintained

- Every substantive change to vision, scope, data model, or strategy must be reflected here.
- The root `SOURCE-OF-TRUTH.md` and `README.md` contain high-level summaries and point here for depth.
- After major milestones, run the `giveabit-project-handoff` skill (it will reference and can incorporate updates from `docs/`).
- Use clear, professional, yet Bitcoin-native language. “Truth You Can Verify” appears explicitly where appropriate.
- Dates and BUILD numbers are updated on every meaningful revision.

## Relationship to Working Assets

- The pristine, self-contained dashboard lives at `website/index.html`. It is the current working, zero-dependency reference implementation. Documentation describes both its current state and the planned evolution.
- Research data: `research/countries.json` + `research/uruguay-flagship.md` (the v2.0 template).
- Design system: root `DESIGN.md` + `next-prompt.md`.
- Modern expansion environment: root Vite + React + TypeScript + Tailwind (run `npm run dev`).

This documentation package was created in BUILD-20260610-004 to give the project a complete, professional, and expandable foundation without disturbing any working code or data.

**Prime Directive (repeated for emphasis):**  
“Truth You Can Verify.” — Every law, cost, requirement, document, user action, and data update must be verifiable on the Bitcoin blockchain via OpenTimestamps + Satohash.io (as of one Bitcoin block ago).

Welcome to the full picture. Now we build with precision and ambition.