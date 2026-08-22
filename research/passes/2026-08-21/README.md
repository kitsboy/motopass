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
fabricated.**

## Partial completion (2026-08-22, source-enabled researcher)

The web-search backend remained unavailable, but a Wikipedia-based pass
(`read_url` on en.wikipedia.org) verified two high-value corrections:

- **Central African Republic — CORRECTED:** parliament agreed to repeal the
  Bitcoin legal-tender law in **April 2023** (adopted Apr 2022, Law 22.004).
  Corpus fields updated to historical framing and `category` moved
  `legal_tender_bitcoin` → `rbi_cbi`. `last_checked` → 2026-08-22.
- **Bolivia — UPDATED:** 2014 crypto ban (Res. 044) repealed by Central Bank
  Resolution 144 (15 Dec 2020) — crypto legal since. Corpus fields updated;
  `last_checked` → 2026-08-22.
- **Paraguay + Panama — STILL BLOCKED:** no source accessible for their
  visa thresholds / crypto-law status; corpus left unchanged and stale so the
  daily pipeline keeps flagging them. Re-run when search access returns.
- **Re-attempt (same day):** web search still down; EN + ES Wikipedia checked
  for Panama Law 697 veto details and Paraguay SUACE/mine-law status — no
  coverage. Absence of coverage is not confirmation; no changes made.
- **Bolivia bonus:** ES Wikipedia surfaced a 2025 election proposal for a
  crypto-asset monetary-stabilization fund (unverified, not law) — logged in
  the Bolivia brief for monitoring.

Sources: `Legality of cryptocurrency by country or territory` (Wikipedia,
revision 2026-08-21) · EN + ES Wikipedia (fetched 2026-08-22). Verified
facts only — no fabricated rules.

```bash
npm run research:pass        # regenerate briefs
# fill each brief's “Sources found” table with dated, URL-backed findings
# then update last_checked + legal_compliance in research/countries.json
# the daily intel pipeline re-anchors the new state automatically
```
