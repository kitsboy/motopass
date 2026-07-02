# SOURCE-OF-TRUTH.md — MotoPass

**Project Name:** MotoPass  
**Date:** 2026-06-10  
**BUILD:** 20260702-009

## Project Overview (Simple Pitch)
MotoPass is the premium Bitcoin-native platform for sovereign passports, citizenship-by-investment (CBI), residency-by-investment (RBI), and jurisdictional stacking. It provides high-net-worth Bitcoiners and freedom-seekers with a verifiable, privacy-first command center to evaluate, compare, acquire, stack, and optimize across programs — with deep Bitcoin integration (legal tender nations, Lightning payments, favorable digital-asset tax regimes, government BTC reserves, and on-chain timestamping).

**Prime Directive:** “Truth You Can Verify.” Every material data point, legal extract, application step, and platform update must be independently verifiable on the Bitcoin blockchain (OpenTimestamps + Satohash). This is our core trust mechanism and competitive moat.

This folder (`/Users/cam/projects/motopass/`) is the **canonical, perpetual single source of truth**. All artifacts, decisions, research, and generated docs live here so Goose (M3), Kimi (M4 HERMES), and any future agent have perfect, unambiguous context at all times.

## Core Files
- `README.md` — Polished living entry point and quickstart (always read first).
- `docs/` — **The comprehensive documentation suite** (new in BUILD-004):
  - `EXECUTIVE-SUMMARY.md` — One-page strategic overview for partners, investors, governments.
  - `MARKETING.md` — Positioning, audience, value proposition, channels, messaging, launch plan.
  - `PRODUCT-SCOPE-ROADMAP.md` — Detailed explanation of exactly how much we are building: phases, features, integrations, data requirements, technical ambition.
  - Supporting: ARCHITECTURE.md, DATA-MODEL.md, BITCOIN-VERIFICATION.md, PAIGE-AI.md, DESIGN-REFERENCE.md, GLOSSARY.md, etc.
- `research/countries.json` — The living heart: structured program data (16/50 seeded with rich finance + Bitcoin modeling). Target 50 countries at flagship depth.
- `website/index.html` — The pristine, self-contained single-file premium dashboard (vanilla, zero-build, fully functional reference). Do not edit casually — it is the working demonstration of current scope.
- `DESIGN.md` — Semantic design system (sovereign black, Bitcoin orange #F7931A, glassmorphic cards, Space Grotesk + Inter typography).
- `next-prompt.md` — Stitch-optimized prompt capturing the full next UI vision (Portfolio, Stacking Simulator, deep finance modals, advanced filters).
- `PROJECT-VISION.md` — Complete strategic vision, non-negotiable technical requirements, master country template, and philosophy.
- `SOURCE-OF-TRUTH.md` — This file (maintained via handoff skill + manual updates).
- `images/` — Custom premium sovereign assets (hero.jpg, passport.jpg, funding-flow.jpg, sovereignty.jpg, etc.).

## Git & Deployment
- Git: Initialized at github.com/kitsboy/motopass (origin main). Commits on main include init, template propagation, wrangler deploy config, and URL fix.
- Current deployment: 
  - **Live URL:** https://motopass.giveabit.io (Cloudflare Pages custom domain)
  - **Pages.dev fallback:** 77a52b99.motopass.pages.dev
  - **Build:** `npm run build` (Vite) produces `dist/` with React app + copied `research/`, `website/`, `images/` — commit `dist/` and push to `main` for Cloudflare Pages auto-deploy.
  - **Pristine demo** live at https://motopass.giveabit.io/website/index.html
  - **Research data** live at https://motopass.giveabit.io/research/countries.json
- Sovereign hosting options: Umbrel, Start9, Citadel, or any Bitcoin/Lightning node with a web server. Long-term goal: fully verifiable, self-hostable by users.

## Mission Alignment (Give A Bit)
MotoPass directly advances Bitcoin sovereignty, financial privacy, and individual jurisdictional freedom. It embodies Give A Bit’s ethos: tools that are simple on the surface, profoundly powerful underneath, private by default, and joyful to use. Future phases explicitly include Lightning/BOLT12 + Silent Payments for all fees, Nostr as the primary identity + notification + update layer, community-contributed (timestamped) research, and open-source Safe Harbour legal templates for users and advisors.

## Current Gaps & Next Priorities
- **Distribution polish**: Vite build now bundles static assets into `dist/` for full live deployment. Next: CI build step so `dist/` is generated on push rather than committed manually.
- **Data completeness**: Expand all 50 countries to Uruguay-flagship v2.0 depth (legal extracts, Satohash placeholders, full Bitcoin fields, Paige AI tips). Focus high-Bitcoin-signal jurisdictions first.
- **Product experience**: Build My Portfolio, interactive jurisdictional Stacking Simulator, Finance Compare, and “Verify on Bitcoin” UI flows (using the new Vite/React dev environment + DESIGN.md + next-prompt.md).
- **Bitcoin core**: Visible timestamp proofs, Lightning payment rails (for fees and marketplace), Nostr-native updates and alerts.
- **Paige AI**: Move from simulated chat to real proactive concierge (prompts in docs/, integration via Nostr or local LLM).
- **Documentation & process**: This BUILD-004 documentation package (including the full PRODUCT-SCOPE-ROADMAP.md) is complete. Maintain it. Run the giveabit-project-handoff skill after every major cycle.
- **GitHub / Live URL**: Live at https://motopass.giveabit.io — repo at github.com/kitsboy/motopass.

## Hand-off Notes for Kimi (M4 HERMES)
See the latest `KIMI-HANDOFF-MotoPass-*.md`. Integrate the entire `/motopass/` tree (especially the new `docs/` suite) into MASTER-BRAIN.md, Kanban, and your Obsidian vault. Educate yourself and Hermes on the full vision, the “Truth You Can Verify” prime directive, the 50-country data ambition, and the phased product roadmap in `docs/PRODUCT-SCOPE-ROADMAP.md`.

Use `DESIGN.md` + `next-prompt.md` for all UI generation. The pristine `website/index.html` is the reference implementation — evolve the Vite/React environment alongside it. Always update BUILD numbers, SOURCE-OF-TRUTH, and relevant docs on substantive changes. Run or trigger the handoff skill on major milestones.

**This file + the docs/ folder are the perpetual source of truth. All agents and humans must respect and keep them current.**

**Git snapshot (2026-07-02):** Repo live at github.com/kitsboy/motopass, branch `main`, auto-deploys to Cloudflare Pages.

— Updated via giveabit-project-handoff skill BUILD-20260610-004 (full docs suite + modern Vite dev environment + build verification)
