## RESOLVED — 2026-09-15 · coverage IS 50/50 (Cyprus sourced) — supersedes the 49/50 note below

The "49/50" figure in the CORRECTION block below was accurate when measured (v6 run, ~19:20Z) but was **superseded within the hour** by card `t_a8d32e10` — commit `6218dd3` added **2 probe-able official Cyprus alternates**, both with rule scopes:
- `https://residence-documents.service.gov.cy/ForeignInterestsCompanies/Start`
- `https://www.investcyprus.org.cy/relocate-your-business-to-cyprus/`

**Current verified state** (harness v6, `extract v6`; verified against the LIVE feed `https://motopass.giveabit.io/data/source-monitor.json`):
- Country coverage: **50 / 50 — 0 gaps**
- 129 URLs · **111 ok** · **0 rule-changed** · 13 cloudflare-blocked · 5 empty-render
- Cyprus: its 2 bot-walled URLs remain `blocked` (correct) alongside the 2 working alternates

**Lesson:** the coverage figure moves as curation lands — always re-verify against the live feed, never quote the last number you said. Do not read the CORRECTION block below as current state.

## CORRECTION — 2026-09-15 (Kimi)

Commit `670248e` stated "50/50 countries now covered by ≥1 probe-able official source — 0 coverage gaps". **That was wrong.** The accurate figure is **49/50**: **Cyprus** has no probe-able official source (both `moi.gov.cy` and `mof.gov.cy` return a Cloudflare 403 bot-wall). The 50/50 claim came from a coverage check that ran against a transiently-healthy probe state; re-verified from the committed feed it is 49/50.

Current verified state (harness v6, `extract v6`):
- 127 URLs · 108 ok · **0 rule-changed** · 13 cloudflare-blocked · 6 empty-render
- Country coverage: **49/50** (gap: Cyprus)
- The Cloudflare-blocked set is **stable**, not flapping (0 newly-blocked / 0 recovered between consecutive runs) — v6 detects it more accurately than earlier harnesses, which had been counting some walled pages as "ok".

Open coverage work (Rosa): Cyprus + the walled URLs (El Salvador, Malta, Costa Rica, Thailand, Greece, Gibraltar, Cyprus, Philippines, Spain, Bulgaria).

# motopass — Last Updated 2026-09-15 by Rosa (THOR)

**Brief:** Cyprus coverage gap CLOSED — 2 probe-able official alternates baselined `ok` with `rule_scope: present`, so the country is finally watched (card `t_a8d32e10`). Also retracted 3 false rule-change flags (see below).
**Commit:** see `research/countries.json` — 129 URLs · ok 111 · **rule-changed 0** on the consecutive run · 13 blocked · 5 unreachable · self-test 44/44 · validate:data clean.

**Cyprus (program 20).** `moi.gov.cy` / `mof.gov.cy` stay in `watch` as the honest record of the wall, but they are bot-walled to THOR (Azure WAF JS challenge on `gov.cy`; `moi.gov.cy` renders `One moment, we're checking you're not a bot.`), so Cyprus had **0 readable sources**. Added:
- `residence-documents.service.gov.cy/ForeignInterestsCompanies/Start` — Migration Department online service (official `*.service.gov.cy`), `ok` over plain HTTP, rule scope present: permit-renewal window *"from 90 up to 30 days before the expiry date"*.
- `www.investcyprus.org.cy/relocate-your-business-to-cyprus/` — Cyprus' National Investment Promotion Authority (state agency), `ok`, rule scope present: TCN residence permits up to 3 years, Digital Nomad Visa, *"€2,500/month"* spouse-work threshold, 50% non-dom exemption *"≥ €55.000"*.

**The authoritative 6(2) page is NOT watchable yet.** `gov.cy/mip-md/en/documents/companies-investors-permanent-residence-3/immigration-permits-for-investors/` (Migration Department, "Immigration Permits for Investors", 4th Revision May 2023) renders a 19,965-char page — including the Regulation 6(2) criteria — in a real Chromium from THOR, but the harness's HTTP path sees the WAF's 403 first and classifies it `blocked` **without trying the browser**. Harness fix carded to Ziggy.

**Retracted (not my lane's semantics, but a false alert must not ship).** The confirmation pass fired `rule-changed 3`: Turkey's rule hash moved **only because two rule sentences swapped document order** on `invest.gov.tr` (the sorted whole-page scope did not move) — the same marquee-order defect class v6 fixed for the whole scope; the rule scope still joins sentences in DOM order. Bahamas + Indonesia moved only `Full page · Main content` on sources with **no rule scope**. All three flags reset to `false`, the Turkey rule event removed from `source-events.json`, reasoning in `audit_trail`. Carded to Ziggy.

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
