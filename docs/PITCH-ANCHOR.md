---
title: Pitch Anchor — Canonical Figures
project: MotoPass
version: 1.0.0
last_updated: 2026-07-14
build: 2026.07.14-32
owner: M3 + M4
self_evolving: true
bitcoin_display_policy: Bitcoin-first — ₿ primary, USD secondary
sync_command: npm run pitch:sync
machine_source: research/pitch-anchor.json
auto_snapshot: docs/pitch/ANCHOR-SNAPSHOT.md
tags: [pitch, anchor, btc, figures]
---
# MotoPass Pitch Anchor

**Prime rule:** All monetary figures are **Bitcoin-first**. Regenerate — don't hand-edit across docs.

## Sync

```bash
npm run pitch:sync
```

Writes:
- `research/pitch-anchor.json` — machine source (app fallback + agents)
- `docs/pitch/ANCHOR-SNAPSHOT.md` — human-readable table for Kimi/Obsidian

## Live figures

See **[ANCHOR-SNAPSHOT.md](./pitch/ANCHOR-SNAPSHOT.md)** for current ₿ · USD tables (auto-generated).

Spot refreshes from [mempool.space](https://mempool.space/api/v1/prices) on each sync. The React app polls the same feed live via `BtcPriceContext`.

## What the anchor carries

| Metric | Source |
|--------|--------|
| Program count, Lightning-ready count | `countries.json` aggregate |
| Avg typical investment, gov fees | Program finance fields |
| Traditional vs MotoPass advisory (modeled) | `pitchStats` formula |
| Cost savings % | Derived |
| Uruguay / Bolivia flagship ₿ · USD | Flagship entries + Rentista note |

## Narrative docs — link, don't duplicate

These files stay **self-evolving** via frontmatter. They describe *story*; this anchor holds *numbers*:

- [pitch/README.md](./pitch/README.md) — pack index + evolution rules
- [MARKETING.md](./MARKETING.md)
- [EXECUTIVE-SUMMARY.md](./EXECUTIVE-SUMMARY.md)
- [SOVEREIGN-STACK-4-PILLARS.md](./SOVEREIGN-STACK-4-PILLARS.md)
- [diligence/](./diligence/)

## UI wiring

| Component | Behavior |
|-----------|----------|
| `BtcDualPrice` | ₿ primary, USD muted — all money surfaces |
| `BtcPriceTicker` | Hero + nav spot: `₿1 · $XXk` |
| `EvolvingPitchRotator` | Stack savings in ₿ |
| `SavingsGraphs` | Traditional vs MotoPass bars in ₿ |
| `ProgramCard`, Compare, Portfolio, Simulator | Min invest / totals in ₿ |

## Pre-launch status

Intelligence MVP live. Applications not yet accepted. Figures are **modeled** from program data — not quotes or offers.

---
*Safe Harbour · Give A Bit · motopass.giveabit.io*