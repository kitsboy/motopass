# Freshness research pass — 2026-08-21

**Scope:** 10 programs (stalest first) — fill each brief with sourced findings, then update countries.json and let the pipeline re-anchor.

| Rank | Program | Stale (days) | Brief |
|------|---------|--------------|-------|
| 1 | Bolivia | 98 | `bolivia-brief.md` |
| 2 | Paraguay | 95 | `paraguay-brief.md` |
| 3 | Central African Republic | 93 | `central-african-republic-brief.md` |
| 4 | Panama | 88 | `panama-brief.md` |
| 5 | Antigua and Barbuda | 85 | `antigua-and-barbuda-brief.md` |
| 6 | Portugal | 83 | `portugal-brief.md` |
| 7 | Uruguay | 81 | `uruguay-brief.md` |
| 8 | Malta | 81 | `malta-brief.md` |
| 9 | Dominica | 80 | `dominica-brief.md` |
| 10 | St. Kitts and Nevis | 79 | `st-kitts-and-nevis-brief.md` |

## Source-probe findings (2026-08-20, automated)

First probe baseline of 108 official URLs: **30 unreachable** from the pipeline
(bot-blocked gov portals, dead domains, or TLS issues). These are flagged in
`intel.json` as `watch.unreachable` — treat as “needs human re-check”, not
proof the site is dead for humans.

- **Portugal — FIXED this session:** added `https://aima.gov.pt` (SEF
  successor agency, verified live). SEF wound down 2023; residency now
  processed by AIMA.
- Others (e.g. `u.ae`, `gob.mx`, `migraciones.gob.ar`, `immigration.go.th`)
  are live government portals that block automated probes — re-check manually.

## Live research attempt (2026-08-20) — BLOCKED

The 2026-08-20 live pass could not run: the web-search backend was down and
government portals yield only nav boilerplate or unrelated gazette content to
automated extraction. **No rule updates were drafted — nothing here is
fabricated.** Briefs below are ready to fill the moment a source-enabled
researcher (human, Kimi, Paige, or an agent with search access) runs:

```bash
npm run research:pass        # regenerate briefs
# fill each brief's “Sources found” table with dated, URL-backed findings
# then update last_checked + legal_compliance in research/countries.json
# the daily intel pipeline re-anchors the new state automatically
```
