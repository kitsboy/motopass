## CORRECTION — 2026-09-15 (Kimi)

Commit `670248e` stated "50/50 countries now covered by ≥1 probe-able official source — 0 coverage gaps". **That was wrong.** The accurate figure is **49/50**: **Cyprus** has no probe-able official source (both `moi.gov.cy` and `mof.gov.cy` return a Cloudflare 403 bot-wall). The 50/50 claim came from a coverage check that ran against a transiently-healthy probe state; re-verified from the committed feed it is 49/50.

Current verified state (harness v6, `extract v6`):
- 127 URLs · 108 ok · **0 rule-changed** · 13 cloudflare-blocked · 6 empty-render
- Country coverage: **49/50** (gap: Cyprus)
- The Cloudflare-blocked set is **stable**, not flapping (0 newly-blocked / 0 recovered between consecutive runs) — v6 detects it more accurately than earlier harnesses, which had been counting some walled pages as "ok".

Open coverage work (Rosa): Cyprus + the walled URLs (El Salvador, Malta, Costa Rica, Thailand, Greece, Gibraltar, Cyprus, Philippines, Spain, Bulgaria).

# motopass — Last Updated 2026-09-15 by Ziggy (THOR)

**Brief:** source-watchdog v6 — layout churn attributed and mostly killed (per-request stamps, live datelines, marquee order, counters, and WAF/challenge pages that v5 had baselined as `ok` content). `layout_changed_urls[]` + `layout_change_streak` now name every drifted page in `public/data/source-monitor.json`, and Hong Kong's watch is pinned to its two ImmD RULES pages instead of the rotating homepage rail.
**Commit:** pending push (127 URLs · ok 109 · rule-changed 0 · layout-changed 7 attributed on the consecutive run, down from 16/18 anonymous · blocked 13 · self-test 44/44)

# motopass — Last Updated 2026-09-15 by Rosa (THOR)

**Brief:** 12 verified probe-able official alternates for the sources v5 honestly reports unreachable (empty/403 renders). Old failing URLs kept in `watch`; 12/12 new URLs baseline `ok`, 10 with `rule_scope: present`.
**Commit:** `f4b7568` (pushed — live feed 126 URLs, ok 114)

# motopass — Last Updated 2026-09-15 by Kimi (THOR)

**Brief:** official-source watchdog v2 — browser-backed, per-country rule scopes, layout-vs-rule classification, 24h cron, live manifest.
**Commit:** `fb0501d`

# motopass — Last Updated 2026-09-15 by Kimi (THOR)

**Brief:** applications are NOT open — the launch gate no longer derives a business decision from a green build.
**Commit:** `a64ed6e` (pushed)

# motopass — Last Updated 2026-09-10 by Buffy (Freebuff)

**Brief:** UX polish batches — iOS input-zoom fix, global focus ring, reduced-motion guard, toast parity, proof-badge + skeleton polish, lint cleanup.

**Commit:** pending push (base `6466b9d`)

---

# motopass — Last Updated 2026-08-27 by Grok (M3)

**Brief:** Server Costs donate is Breez Spark (`motopass@breez.tips`).

**Commit:** `570060f`

- Lightning: `motopass@breez.tips`
- On-chain: `bc1pucgsh9g0vyzc9zn8e4up5d08vmk56rsk7em7gwzcv79hk0dkulaslpscgy`
- TEMP `motopass-server@giveabit.io` removed from public rail.
