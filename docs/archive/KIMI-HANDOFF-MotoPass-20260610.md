# KIMI-HANDOFF-MotoPass-20260610.md

You are Kimi, running on the M4 HERMES machine (Master Brain). This is a clean hand-off for the **MotoPass** project from Goose on the M3 Mac.

## Two-Machine Setup Reminder
- **M3 Mac (Goose)**: Main coding, research, and iteration.
- **M4 Mac (You + HERMES)**: Permanent Obsidian vault, MASTER-BRAIN.md, Kanban, architecture docs, and strategic oversight. This is the long-term memory and single source of truth for all Give A Bit projects.
- Connect via Tailscale. Sync the entire `/motopass/` folder after each hand-off.
- Working style: Explain everything simply (like to a 16-year-old). One clear step at a time. Always explain before changes and ask for confirmation. End completed tasks with “Done ✅”. Be encouraging.

## Project Pitch (Remember This Exactly)
MotoPass is the premium Bitcoin-native platform for sovereign passports, residency-by-investment (RBI), citizenship-by-investment (CBI), jurisdictional stacking, and Bitcoin-optimized finance and identity. It empowers high-net-worth individuals and Bitcoiners to evaluate, acquire, stack, and live across programs with radical transparency and verifiability.

**Core Principle / Prime Directive:** “Truth You Can Verify.” Every material claim, legal extract, data point, and user action is independently verifiable on the Bitcoin blockchain via OpenTimestamps + Satohash. This is the non-negotiable foundation of trust, marketing, and product.

The goal is true sovereignty through diversified identity, residency, and wealth optimization — with deep Bitcoin integration (legal tender nations, Lightning payments, favorable digital-asset tax regimes, government BTC reserves, and on-chain timestamping).

## Current State (as of BUILD-20260610-004)
- Single source of truth folder: `/Users/cam/projects/motopass/` (or synced equivalent on M4).
- Core data in `research/countries.json` (16 high-quality, Bitcoin-prioritized seeded programs with rich finance modeling + Bitcoin details; target 50 countries at flagship depth). Official v2.0 deep template in `research/uruguay-flagship.md`.
- Pristine working reference: `website/index.html` — self-contained single-file premium dashboard (vanilla, zero-build, ~2,362 lines). Delivers filters, rich modals with finance + timestamp sections, simulated Paige chat, in-browser add/edit/export, animated hero/ticker. Fully functional today. **Keep this pristine** as the living demo of current scope.
- **Comprehensive documentation suite** (major new deliverable in this cycle, located in `docs/`):
  - `EXECUTIVE-SUMMARY.md` — One-page strategic overview (problem, solution, moat, market context, traction, vision).
  - `MARKETING.md` — Full positioning, audiences, value props, messaging (“Truth You Can Verify” through-line), channels (Nostr-first), pricing philosophy, launch sequencing.
  - `PRODUCT-SCOPE-ROADMAP.md` — **The definitive detailed explanation of exactly how much we are building.** Phased plan from current pristine tracker through full sovereign identity + finance operating system (My Portfolio, interactive Stacking Simulator, Finance Compare, real Bitcoin rails, Paige AI, marketplace, B2G, self-hosting, 50-country data depth at v2.0 template, etc.). This is the master reference for scope and ambition.
  - Supporting: `ARCHITECTURE.md`, `DATA-MODEL.md`, `BITCOIN-VERIFICATION.md` (Satohash/OpenTimestamps flows), `PAIGE-AI.md`, `DESIGN-REFERENCE.md`, `GLOSSARY.md`, plus `docs/README.md` (hub).
- Modern development environment (new in BUILD-004): Vite + React + TypeScript + Tailwind at project root (coexists cleanly with the pristine `website/` demo). 
  - `npm run dev` launches the live expansion environment (currently a functional sovereign-styled preview that loads the same `research/countries.json`).
  - `npm run build` produces `dist/` (verified working in this cycle).
  - The Vite app is where future UI evolution happens (per `DESIGN.md` + `next-prompt.md`).
- Design & vision system: `DESIGN.md` (sovereign black #0a0a0a + Bitcoin orange #F7931A, glassmorphic cards, Space Grotesk + Inter), `next-prompt.md` (full vision for Portfolio, Stacking Simulator, deep finance modals, advanced filters), `PROJECT-VISION.md` (strategic vision, master country template v2.0, non-negotiable Bitcoin stack: Lightning BOLT12, Nostr, timestamping, Paige, marketplace, etc.).
- Other: `SOURCE-OF-TRUTH.md` (this handoff’s companion), custom sovereign images in `images/`, `README.md` (polished entry point + quickstart).
- Git: Not initialized yet on this machine. No remotes. Recommended to `git init`, commit the BUILD-004 work, then push to a private GitHub (or sovereign self-hosted git).
- Live URL / Deployment: None yet. 
  - Pristine demo ready for immediate static deploy (`website/index.html` + `research/` served together) to GitHub Pages, Netlify, Cloudflare Pages, or sovereign host (Umbrel/Start9/etc.).
  - Modern app: deploy from `dist/` after `npm run build`.
- The entire package is now fully documented, organized, and ready to expand without disturbing the clean working assets.

## Your Tasks on M4
1. **Ingest the full updated folder into your Obsidian vault** under the MotoPass project. At minimum copy:
   - All files in `docs/` (especially `PRODUCT-SCOPE-ROADMAP.md` — study the complete phased build plan, `EXECUTIVE-SUMMARY.md`, `MARKETING.md`, `DATA-MODEL.md`, `BITCOIN-VERIFICATION.md`, `PAIGE-AI.md`).
   - Latest `SOURCE-OF-TRUTH.md`, `README.md`, `KIMI-HANDOFF-MotoPass-20260610.md`.
   - `DESIGN.md`, `next-prompt.md`, `PROJECT-VISION.md`.
   - `research/countries.json` + `research/uruguay-flagship.md` (the data + template).
   - `website/index.html` (as the pristine reference implementation).
   - Note the new root dev environment: `package.json`, `vite.config.ts`, `src/` (App.tsx etc.), `dist/`, `index.html` (Vite entry), `public/`, `tailwind.config.js`, etc. This is the home for the next-gen UI work.
2. Update `MASTER-BRAIN.md`, your Kanban, project maps, and architecture docs with this hand-off. Treat the `docs/` folder (especially the roadmap) as the new authoritative scope reference.
3. **Educate yourself and Hermes to stay current:** 
   - Read and internalize the full vision in `PROJECT-VISION.md` and the detailed phased roadmap in `docs/PRODUCT-SCOPE-ROADMAP.md` (Phase 0 current pristine demo + data → Phase 1 modern frontend with Portfolio + Stacking Simulator + Finance Compare + proofs → Phase 2 real Nostr/Lightning/Satohash integrations → Phase 3 Paige production → Phase 4+ marketplace/B2G/self-host OS).
   - Understand “Truth You Can Verify” as the prime directive that must appear in all marketing, UI, Paige responses, and data.
   - The 50-country data target at Uruguay-flagship v2.0 depth (deep legal extracts, Satohash placeholders, Bitcoin/Lightning fields, Paige optimization).
   - The new Vite/React dev environment is where you (or future agents) will implement the UI evolution described in `next-prompt.md` and `DESIGN.md`. The pristine `website/index.html` stays as the clean, shareable reference.
4. Continue autonomous iteration using `DESIGN.md` + `next-prompt.md` + the new docs/ as source of truth. Highest priorities right now:
   - Populate the remaining ~34 countries in `research/countries.json` using the exact Uruguay v2.0 template.
   - Begin evolving the experience in the Vite dev env (start with My Portfolio, interactive Stacking Simulator, richer modals with real proof badges, advanced filters).
5. Maintain BUILD numbering (current is 20260610-004). Always update `SOURCE-OF-TRUTH.md`, `README.md`, and relevant docs on substantive changes. Run or trigger the `giveabit-project-handoff` skill after every major milestone.
6. When ready, prepare a clean hand-off back to Goose on M3 (including any work you do in the vault or new insights).

**Template Rule for All Future Projects:** Every Give A Bit project must have at least: GitHub source, live URL (when deployed), deployment details, key docs list, simple pitch, Git snapshot, mission alignment, gaps/improvements, and a hand-off note. Use the giveabit-project-handoff skill on every project. The /motopass/ folder (especially SOURCE-OF-TRUTH.md + the full docs/ suite) is the perpetual single source of truth — respect it on both machines.

Please confirm integration by replying with:
- What you copied/updated in your Obsidian vault and MASTER-BRAIN.md / Kanban.
- A short summary of the new scope from PRODUCT-SCOPE-ROADMAP.md (in your own words, like explaining to a 16-year-old).
- Any immediate next actions you plan for the data or the Vite dev environment.
- Confirmation that you have educated yourself and Hermes on the “Truth You Can Verify” principle and the full phased build ambition.

Thank you — this keeps everything automatic, organized, and moving forward seamlessly between M3 and M4. The project now has the strongest, best-documented foundation yet.

## Latest Session Summary (from 2026-06-10 goodbye)

**Chat Topic**: Reviewing, organizing, and fully documenting the MotoPass project (Bitcoin-native sovereign passports and jurisdictional stacking platform), creating a complete docs suite including marketing and a detailed build scope roadmap, enhancing wording, setting up a modern Vite/React dev environment, verifying the build, and updating Kimi via the giveabit-project-handoff skill.

**Key Things We Did**:
- Explored and reviewed all current content: pristine `website/index.html`, `research/countries.json` (16 seeded programs), DESIGN.md, next-prompt.md, PROJECT-VISION.md, SOURCE-OF-TRUTH.md, old KIMI handoff, images.
- Created comprehensive `docs/` folder with 10 files including EXECUTIVE-SUMMARY.md, MARKETING.md, and especially `PRODUCT-SCOPE-ROADMAP.md` (the master detailed explanation of exactly how much we are building: full phased plan from current pristine tracker to full sovereign OS, 50-country data at v2.0 flagship depth, integrations, etc.).
- Enhanced and polished root files (README, SOURCE-OF-TRUTH, DESIGN, etc.) cleanly while keeping the working pristine demo and assets untouched.
- Initialized modern npm dev environment at root (Vite + React + TS + Tailwind, sovereign theme, functional preview loading the same research data). Verified `npm run build` succeeds and produces `dist/`.
- Ran "update-kimi motopass" (giveabit-project-handoff skill): Refreshed SOURCE-OF-TRUTH.md and generated new clean `KIMI-HANDOFF-MotoPass-20260610.md`.

**Finished in this session**:
- Full professional documentation package (executive, marketing, and the detailed "how much we are going to build" roadmap).
- Clean enhancement of existing files and organization.
- Modern, ready-to-expand Vite/React dev environment with working npm scripts and verified build.
- Updated Kimi hand-off with clean, structured knowledge (new KIMI-HANDOFF-20260610.md and refreshed SOURCE).

**Still to do**:
- Initialize git, commit BUILD-20260610-004 work, push to private GitHub (or sovereign self-hosted).
- Deploy the pristine demo for a live URL (GitHub Pages/Netlify/etc.).
- Expand data to 50 countries using the Uruguay v2.0 template (prioritize Bitcoin/Lightning/territorial tax jurisdictions).
- Implement UI features in the Vite dev env (Portfolio, Stacking Simulator, Finance Compare, proof flows per next-prompt and DESIGN).
- Progress Bitcoin integrations (Satohash proofs, Nostr, Lightning) and Paige AI as detailed in the roadmap and docs/.

**Next for Kimi**: Integrate this summary (and the full new `docs/` suite, especially PRODUCT-SCOPE-ROADMAP.md) into MASTER-BRAIN.md / Kanban / Obsidian vault. Update any project maps or architecture notes. Educate yourself and Hermes on the full phased build ambition, the "Truth You Can Verify" prime directive, the 50-country data target, and that the new root Vite/React dev environment (with `npm run dev` / `npm run build`) is the place for UI expansion work while the pristine `website/index.html` stays as the clean reference demo. Use the giveabit-project-handoff skill for future updates or projects. Confirm what you integrated and your planned next actions (data population or dev env work).

The updated KIMI-HANDOFF file is ready. Do not move or sync anything to M4 until I or Kimi tell you it's time.

— Hand-off generated by giveabit-project-handoff skill on 2026-06-10 (BUILD-20260610-004: full documentation package + modern Vite/React dev environment)