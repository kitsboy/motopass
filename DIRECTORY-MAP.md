# DIRECTORY MAP — MotoPass

> **Multi-LLM Handoff Document** — any agent (Grok, Kimi, Claude, Hermes) should be able to pick up from this file and understand the entire project. This is the quick-start index; SOURCE-OF-TRUTH.md is the comprehensive reference.

## Quick Facts
- **Project:** MotoPass — Sovereign Passport Platform (CBI/RBI)
- **Live URL:** https://motopass.giveabit.io (Cloudflare Pages)
- **Repo:** github.com/kitsboy/motopass (origin on main)
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS
- **Workflow:** M3 (dev + git) → git push → CF Pages deploy
- **Domain note:** We do NOT own motopass.io — use motopass.giveabit.io everywhere

## Directory Structure

| Path | Purpose |
|------|---------|
| `src/` | React app source (App.tsx, main.tsx, index.css) |
| `dist/` | Production build (deployed to CF Pages) |
| `website/` | Pristine single-file vanilla HTML demo (reference) |
| `research/` | Country program data (countries.json, countries_full.json) |
| `docs/` | Full documentation suite |
| `docs/SEO.md` | SEO strategy + keyword research (English) |
| `docs/SEO-*.md` | SEO translations (de, es, fr, pt, sw, zh) |
| `docs/MISSION.md` | Mission statement |
| `docs/ARCHITECTURE.md` | Technical architecture |
| `docs/BITCOIN-VERIFICATION.md` | OTS verification design |
| `docs/DATA-MODEL.md` | Data model reference |
| `docs/DESIGN-REFERENCE.md` | Design system reference |
| `docs/EXECUTIVE-SUMMARY.md` | Executive summary for partners |
| `docs/I18N.md` | Internationalization shared reference |
| `docs/PRODUCT-SCOPE-ROADMAP.md` | Full product scope + roadmap |

## Entry Points (read in order)
1. `README.md` — Overview and quickstart
2. `SOURCE-OF-TRUTH.md` — Canonical single source of truth
3. `DIRECTORY-MAP.md` — This file (you are here)
4. `DESIGN.md` — Visual design system
5. `MISSION.md` — Project mission
6. `EXEC-SUMMARY.md` — Executive summary

## Key Files

### Source
- `src/App.tsx` — Main React app component
- `src/main.tsx` — Entry point
- `src/index.css` — Tailwind CSS + custom styles
- `index.html` — Vite HTML entry
- `vite.config.ts` — Build configuration
- `tailwind.config.js` — Tailwind theme
- `package.json` — Dependencies and scripts

### Build & Deploy
- `npm run dev` — Development server
- `npm run build` → `dist/` — Production build
- Deploy: `npx wrangler pages deploy dist/ --project-name=motopass`

### Data
- `research/countries.json` — Seeded country program data (16/50)
- `research/countries_full.json` — Full dataset
- `website/index.html` — Reference UI (vanilla HTML/JS)

## Git Workflow
```bash
# Normal workflow
cd ~/projects/motopass
git add -A
git commit -m "description of changes"
git push origin main
```

The CF Pages project is connected to this repo — git push triggers automated deploy to https://motopass.giveabit.io.

## Related Projects in Portfolio
- **giveabit.io** — Parent brand hub (github.com/kitsboy/giveabit)
- **satohash.io** — OTS notarization (github.com/kitsboy/satohash)
- **katoa.org** — Creator support (github.com/kitsboy/katoa)
