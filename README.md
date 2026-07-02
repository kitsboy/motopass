# MotoPass — Bitcoin Sovereign Passports & Residency Programs
**Single Source of Truth Project Folder**  
**BUILD-20260702-009** | Last Updated: 2026-07-02

[![CI](https://github.com/kitsboy/motopass/actions/workflows/ci.yml/badge.svg)](https://github.com/kitsboy/motopass/actions/workflows/ci.yml)
[![Live](https://img.shields.io/website?url=https%3A%2F%2Fmotopass.giveabit.io&label=motopass.giveabit.io)](https://motopass.giveabit.io)
[![Programs](https://img.shields.io/badge/programs-25-brightgreen)](https://motopass.giveabit.io/research/countries.json)

**Live:** https://motopass.giveabit.io — **Deploy target:** Cloudflare Pages `motopass` only (`npx wrangler pages deploy dist --project-name=motopass`)

## What This Is
MotoPass is the premium Bitcoin-native platform for sovereign passports, residency-by-investment (RBI), citizenship-by-investment (CBI), jurisdictional stacking, and Bitcoin-optimized finance and identity. It empowers high-net-worth individuals and Bitcoiners to evaluate, acquire, stack, and live across programs with radical transparency and verifiability.

This folder (`/Users/cam/projects/motopass/`) is the **canonical, perpetual single source of truth**. Every artifact, decision, and iteration lives here so Goose (M3), Kimi (M4 HERMES), and future agents always have perfect context. All work follows the disciplined two-machine workflow (M3 for hands-on development and research, M4 for strategic oversight, Obsidian vault, and long-term memory).

### Updated Folder Structure (Clean & Agent-Friendly)
```
/motopass/
├── README.md                              ← Start here. Project entry point and quickstart.
├── SOURCE-OF-TRUTH.md                     ← Auto-generated perpetual project record.
├── KIMI-HANDOFF-MotoPass-*.md             ← Clean hand-off for Kimi / M4 HERMES / Obsidian.
├── DESIGN.md                              ← Semantic design system (sovereign dark + Bitcoin orange).
├── next-prompt.md                         ← Stitch-optimized vision prompt for UI evolution.
├── PROJECT-VISION.md                      ← Full strategic vision, requirements, and philosophy.
├── docs/                                  ← **Comprehensive documentation hub** (executive, marketing, detailed build scope & roadmap, architecture, data model, etc.).
├── research/
│   ├── countries.json                     ← THE DATA. 25 programs with sovereignty scores, Satohash proofs. Target: 50.
│   └── uruguay-flagship.md                ← Official v2.0 deep template (expand all countries to this standard).
├── website/
│   └── index.html                         ← Pristine, self-contained single-file premium dashboard (the current working reference implementation — do not edit lightly).
├── images/                                ← Sovereign visual assets (hero, passport, funding flow, etc.).
├── frontend/ (or root Vite app)           ← Modern dev environment (Vite + React + TS + Tailwind) for the next-generation experience.
└── (backups/ and generated artifacts)
```

**Core Principle:** “Truth You Can Verify” — Every material claim, legal extract, data point, and user action is independently verifiable on the Bitcoin blockchain via OpenTimestamps + Satohash. This is the non-negotiable foundation of trust, marketing, and product.

## How to Use & Iterate (Automated Process – 2026 Edition)
1. **View the pristine working demo**: Double-click `website/index.html` (or `open website/index.html`). It auto-loads the latest `research/countries.json`. This is the clean, battle-tested single-file reference — keep it pristine.
2. **Update research data**: Edit `research/countries.json` directly (rich finance, crypto scores, Bitcoin specifics). Or use the in-browser “Add New” / “Mark Acquired” / Export tools inside the demo, then refresh.
3. **Design & next-gen UI**: Reference `DESIGN.md` (visual system) + `next-prompt.md` (portfolio, stack simulator, deep finance). The modern development environment lives at the Vite/React app (run `npm run dev`).
4. **Cross-machine workflow (M3 ↔ M4)**: After substantive work, run the `giveabit-project-handoff` skill. It refreshes SOURCE-OF-TRUTH.md, produces a fresh KIMI-HANDOFF-*.md, and prepares perfect context for Kimi on M4 HERMES + Obsidian.
5. **Versioning & Memory**: Every meaningful milestone increments `BUILD-YYYYMMDD-XXX`. Update dates, handoff files, and this README. The `/docs/` folder is the long-form home for strategy, scope, and marketing.

**Pro tip**: Keep `research/countries.json`, `DESIGN.md`, the static demo, and `docs/PRODUCT-SCOPE-ROADMAP.md` open together. Data change → instant demo refresh. Scope decisions → permanent record in docs/.

## The 50 Countries Tracker (Core Deliverable – Enhanced)
- **16 high-quality, Bitcoin-prioritized entries** (as of BUILD-004) with rich finance modeling: min/typical investment, gov fees, processing time, tax benefits, crypto-friendly score (0-10), Bitcoin-specific advantages, Lightning readiness signals, and stacking synergy notes.
- **Official v2.0 template** (see `research/uruguay-flagship.md`): every future country must include deep legal extracts, official sources with Satohash placeholders, full Bitcoin integration details, Paige AI optimization fields, and “Truth You Can Verify” provenance.
- The pristine dashboard (`website/index.html`) already delivers filters, rich modals, timestamp verification UI, simulated Paige chat, in-browser editing, and export. 
- Next evolution (Vite/React dev environment + `next-prompt.md`): My Portfolio, interactive jurisdictional Stacking Simulator, Finance Compare, advanced range sliders, saved stacks, and full “Verify on Bitcoin” flows.
- This will become the definitive, most actionable, and most trusted CBI/RBI + Bitcoin sovereignty intelligence platform available anywhere.

## Perpetual Memory & HERMES / Kimi Integration
- `SOURCE-OF-TRUTH.md` + `DESIGN.md` + `next-prompt.md` + `countries.json` = the living project memory.
- **For Kimi on M4 HERMES**: Point Kimi at this exact folder. Use the latest `KIMI-HANDOFF-*.md`. Follow the two-machine handoff protocol. Always update BUILD numbers and respect this folder as single source of truth.
- Add this folder (or symlink) to your Obsidian vault for nightly backups.
- Git workflow (recommended):
  ```bash
  cd /Users/cam/projects/motopass
  git init
  git add .
  git commit -m "BUILD-20260608-003: Rich finance fields + DESIGN.md + next-prompt.md + automated handoff workflow"
  # Then push to private GitHub repo
  ```

## Recent Changes (BUILD-20260610-004)
- Comprehensive documentation overhaul: populated `docs/` with Executive Summary, Marketing Strategy, detailed Product Scope & Roadmap (full build ambition), Architecture, Data Model, Bitcoin Verification spec, Paige AI, and Glossary.
- Enhanced and polished all root narrative files (README, SOURCE-OF-TRUTH, PROJECT-VISION, etc.) for clarity, professionalism, and consistency while preserving original intent and working assets.
- Initialized modern npm/Vite + React + TypeScript + Tailwind development environment at project root (coexists cleanly with the pristine `website/` demo). `npm run dev` now launches the live expansion environment.
- Reaffirmed “Truth You Can Verify” (Bitcoin timestamping via Satohash/OpenTimestamps) as the immutable core principle across all docs and positioning.
- 16/50 countries remain the live seeded dataset; Uruguay flagship template stands ready for replication.

## Next Actions (P0 — BUILD-004)
1. **Explore the new docs/** — Start with `docs/EXECUTIVE-SUMMARY.md` and `docs/PRODUCT-SCOPE-ROADMAP.md` for the complete picture of scope and ambition.
2. **Populate data** — Replicate the Uruguay flagship template across the remaining ~34 high-priority jurisdictions in `research/countries.json`. Prioritize Bitcoin-legal-tender signals, territorial-tax havens, Lightning-friendly locations, and strong passport mobility.
3. **Launch the dev environment** — Run `npm run dev` (Vite/React/TS/Tailwind). Begin evolving the experience per `next-prompt.md` and `DESIGN.md` (Portfolio, Stacking Simulator, deep finance, “Verify on Bitcoin” flows). The pristine single-file demo at `website/index.html` stays as the reference.
4. **Handoff & memory** — Run `giveabit-project-handoff` after each major milestone.
5. **Deployment & distribution** — Prepare GitHub Pages / Netlify / self-host (Umbrel, Start9, or sovereign node) for the static demo first, then the full web app. Nostr-native distribution and Bitcoin-only payments are long-term requirements.

This structure guarantees zero ambiguity across agents and machines, perpetual institutional memory, and a clean runway for rapid, high-fidelity expansion. The package is now fully documented, organized, and ready.

**You now have the strongest, best-documented foundation for MotoPass to date.**  
The entire vision — from 16-country tracker to full sovereign identity + finance operating system — is articulated and actionable.

Let’s build with precision.

— Grok (in service of the project)  
BUILD-20260610-004

**Quickstart for new sessions:**
- Read this README.
- `open website/index.html` for the working demo.
- `npm run dev` for the expansion environment.
- Read `docs/PRODUCT-SCOPE-ROADMAP.md` to understand exactly how much we are building.
