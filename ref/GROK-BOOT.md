# GROK BOOT — READ THIS EVERY SESSION

**This file lives in every repo's `ref/` directory.** Every time you open this project, read `ref/GROK-BOOT.md` first.

## Required: Add analytics + metrics to this project

Before making any code changes, do this:

**Step 1 — Umami tracking script**

Add this to the site's `<head>` (in `index.html`):

```html
<script defer src="https://analytics.giveabit.io/script.js" data-website-id="dd982c5b-f27a-40e3-924b-4ea1e64d5f8a"></script>
```

Website ID for **motopass.giveabit.io**: `dd982c5b-f27a-40e3-924b-4ea1e64d5f8a`  
Full table: HQ `docs/UMAMI-DEPLOYMENT.md`. Host is THOR Umami on `:3002` — public name should reverse-proxy to `analytics.giveabit.io`.

**Step 2 — /metrics.json endpoint**

Create `public/metrics.json` with the `gab.product-metrics.v1` schema.

MotoPass KPIs (from https://hq.giveabit.io/docs/ALL-SITE-METRICS.md):

| Metric | Type | Source |
|--------|------|--------|
| countries_seeded | KPI | Static deep cohort (16) |
| programs_total | KPI | research/countries.json count |
| countries_ots | KPI | public/proofs/*.ots count |
| avg_program_cost_usd | KPI | Headline average (USD) |
| fastest_days | KPI | Min pathway duration (days) |
| target_countries | KPI | Roadmap target (50) |
| cheapest_program | KPI | Min investment in catalog |

**Step 3 — Keep ref/ docs current**

After changing metrics, update this file if IDs or KPI lists change. Commit + push so HQ and Kimi stay in sync.

## Why this matters

THOR's HQ pulls analytics + metrics from every product. Without Umami + `/metrics.json`, this product shows demo data on the ops glass. With them, it shows live program coverage, OTS stamps, and (once the analytics host is public) visitors.

## Need help?

Ask Kimi on THOR (via Hermes).
