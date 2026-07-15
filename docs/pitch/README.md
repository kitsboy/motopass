---
title: Pitch Pack Index
project: MotoPass
version: 1.0.0
last_updated: 2026-07-14
owner: M3 (Grok/Cursor) + M4 (Kimi)
self_evolving: true
bitcoin_display_policy: Bitcoin-first — ₿ primary, USD secondary on every monetary figure
update_rule: >
  Material pitch/product/data change → run `npm run pitch:sync` in same change-set.
  Narrative docs link here; never hand-edit dollar figures in multiple files.
tags: [pitch, marketing, btc, self-evolving]
---
# MotoPass — Self-Evolving Pitch Pack

**Live pitch:** https://motopass.giveabit.io · **BUILD:** `2026.07.14-28`

## How evolution works (no line-by-line churn)

```
countries.json  ──►  npm run pitch:sync  ──►  research/pitch-anchor.json
                              │                        │
                              │                        ▼
                              │              docs/pitch/ANCHOR-SNAPSHOT.md
                              │                        │
                              ▼                        ▼
                     React app (live spot)     MARKETING / EXECUTIVE / diligence
                     BtcDualPrice everywhere   link to PITCH-ANCHOR — don't duplicate $
```

| Layer | File | Who updates |
|-------|------|-------------|
| **Data** | `research/countries.json` | M3 agents + Kimi research |
| **Anchor (machine)** | `research/pitch-anchor.json` | `npm run pitch:sync` |
| **Anchor (human)** | [PITCH-ANCHOR.md](../PITCH-ANCHOR.md) | Policy + links; figures via sync |
| **Snapshot** | [ANCHOR-SNAPSHOT.md](./ANCHOR-SNAPSHOT.md) | Auto-generated — do not edit |
| **UI** | `src/lib/btcPrice.ts`, `BtcDualPrice` | Live mempool.space + anchor fallback |
| **Narrative** | MARKETING, EXECUTIVE, diligence | Self-evolving frontmatter; cite anchor |

## Bitcoin-first display policy

1. **Always show ₿** (or sats for micro-amounts) before USD on mock and real data.
2. **Spot price** from mempool.space in app; `pitch-anchor.json` for docs/offline.
3. **Re-sync** after `countries.json` edits, BUILD bumps, or weekly Kimi freshness pass.
4. **Never** paste stale `$` figures into multiple docs — link [PITCH-ANCHOR.md](../PITCH-ANCHOR.md).

## Commands

```bash
npm run pitch:sync          # Regenerate anchor + snapshot from countries.json + BTC spot
npm run btcmap:density      # Merchant density (Forge pillar)
npm run dev                 # Pitch page shows live dual prices
```

## Pitch surfaces

| Doc | Role |
|-----|------|
| [PITCH-ANCHOR.md](../PITCH-ANCHOR.md) | Canonical figures + policy |
| [SOVEREIGN-STACK-4-PILLARS.md](../SOVEREIGN-STACK-4-PILLARS.md) | Product architecture spec |
| [MARKETING.md](../MARKETING.md) | Positioning narrative |
| [EXECUTIVE-SUMMARY.md](../EXECUTIVE-SUMMARY.md) | Partner/investor story |
| [diligence/](../diligence/) | Disclosure pack |
| Live `/` | PitchPage — rotator + savings graphs |

## Agent rules

1. **Same PR:** `countries.json` change → `npm run pitch:sync` → commit both JSON files + ANCHOR-SNAPSHOT.
2. **Narrative only** in MARKETING/EXECUTIVE — no embedded dollar tables.
3. **Kimi weekly:** if `pitch-anchor.json` `generated_at` > 7 days, re-run sync.
4. **Pre-launch copy:** intelligence MVP; applications not yet accepted.

---
*Safe Harbour · Give A Bit family*