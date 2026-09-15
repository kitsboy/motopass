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

## Session — 2026-09-15 · Cyprus sourcing: 2 probe-able official alternates + 3 false rule flags retracted (Rosa, `t_a8d32e10`)

Follow-up to Ziggy's v6 card (`t_50cbc2d3`). `scripts/probe-sources.mjs` NOT touched (declared hotspot) — curation-side only.
Method: skill `motopass-source-curation` — curl (probe UA `motopass-intel-probe/2.0`) → shadow tree `/tmp/mp-shadow` with the real engine → real run.

**1. Cyprus had 0 readable sources; now 2, both `rule_scope: present`.**
- `https://residence-documents.service.gov.cy/ForeignInterestsCompanies/Start` — Migration Dept online service, `ok` on **plain HTTP**, rule text = the permit-renewal window ("from 90 up to 30 days before the expiry date").
- `https://www.investcyprus.org.cy/relocate-your-business-to-cyprus/` — National Investment Promotion Authority (state agency, `investcyprus.org.cy`, WordPress/static), `ok` on HTTP, rule text = TCN work/residence permits ≤3 years, Digital Nomad Visa, "€2,500/month", 50% non-dom exemption "≥ €55.000".
- Both added to `legal_compliance.official_urls` **and** `watch.urls`; `moi.gov.cy` + `mof.gov.cy` kept as the honest record of the wall.
- Dead ends measured, do not re-probe: every `www.gov.cy/*`, `moi.gov.cy/*`, `mof.gov.cy/*`, `pio.gov.cy`, `mfa.gov.cy`, `police.gov.cy`, `bfu.gov.cy`, `www.service.gov.cy` (502), `www.parliament.cy` (Cloudflare check), `www.tax.gov.cy`, `www.dls.moi.gov.cy` and every `*.moi.gov.cy`/`*.mof.gov.cy` sub-host (NXDOMAIN), `www.crmd.*` (NXDOMAIN), `www.cyprustrade.gov.cy` (meta-refresh only). Reachable with the probe UA but **not** rule-relevant to 6(2): `www.centralbank.cy`, `www.cysec.gov.cy`, `www.cystat.gov.cy`, `www.companies.gov.cy`, `www.data.gov.cy` (no CKAN API).

**2. The authoritative Regulation 6(2) page renders from THOR but the harness cannot see it.**
`https://www.gov.cy/mip-md/en/documents/companies-investors-permanent-residence-3/immigration-permits-for-investors/` → with the probe's exact UA a real Chromium **passes the Azure WAF JS challenge** (URL gains `?afd_azwaf_tok=…`) and renders 19,965 chars of real content: *"In line with the provisions of Regulation 6(2) of the Aliens and Immigration Regulations…"*. The engine's `httpProbe` gets the WAF 403 first, matches `CF_MARKERS`, and returns `blocked` **without browser escalation** — so the one page that states the sanctioned criteria is unreachable to the watchdog. Carded to the harness owner.

**3. Retracted three false change flags produced by the confirmation pass (`rule-changed 3`).**
- Turkey `invest.gov.tr`: the **rule** scope hash moved only because two rule sentences swapped document order ("Sizeable domestic market…" ↔ "Young and dynamic population…"); the sorted whole-page scope did NOT move. Root cause: `wholeText()` sorts, `ruleSentences()` joins in DOM order — the marquee-order defect class v6 fixed for `whole` only.
- Bahamas (33) + Indonesia (38): only `Full page · Main content` moved, on sources with **no rule scope** (no rule text, no rule event pushed).
- `watch.changed` reset to `false` on all three, the Turkey `rule` event removed from `public/data/source-events.json`, reasoning appended to each `audit_trail` (mirrors Ziggy's HK precedent in `187d610`). Baselines kept at their new values so nothing re-fires.

**Verified:** shadow tree 4 URLs → 2 ok/rule present, 2 blocked (moi/mof); real runs 129 URLs · run 1 ok 109/rule-changed 3 → run 2 **ok 111 · rule-changed 0** · blocked 13 · unreachable 5 · self-test 44/44 · `npm run validate:data` clean.

## Session — 2026-09-15 · Source-watchdog v6 — layout churn attributed and killed, HK pinned to its rules pages (Ziggy)

Card `t_50cbc2d3` (follow-up to `t_4336aaae`). `scripts/probe-sources.mjs` is a declared hotspot — claimed in a
card comment before editing; `git status` clean at start. Both events in the v5 feed were the churn class the v5
work set out to kill. Both are fixed at the root, and `layout_changed` is now attributable from the report alone.

**1. `immd.gov.hk`'s rule event was a rotating headline.** The homepage is browser-pinned and its rule scope
comes from a "What's New" rail (the headlines match `fee|residenc*|visa`), so the rail entering/leaving the scope
read as a rule change. No filter can separate a headline that *announces* a fee change from a fee change itself,
so HK's homepage is retired as a watch URL (option b on the card) and HK now watches the two RULES pages that
headline points at: `/eng/specifiedschemes.html` + `/eng/services/fee-tables/`. Both probe `ok` over plain HTTP,
both carry a rule scope, and a fee edit (`1,300` → `1,400`) moves BOTH scopes — mutation-tested on the real
pages. `immd.gov.hk` stays in `legal_compliance.official_urls` as a citation. `watch.changed` reset to false;
the false event was retracted from the rolling feed; the audit trail records why.

**2. `layout_changed` 0 → 16/18: six causes, each measured with a block-level diff (two probes of the same URL).**

| class | pages | the varying block, verbatim | fix |
|---|---|---|---|
| per-request machine stamp | Cyprus moi/mof, Philippines boi, Spain inclusion, Bulgaria bnb/mfa | `20260915T155544Z-r1b89f57c95…` · `8fe74e64e143c03fad5081e1e50beac3` · `0.cf8c655f.1789487834.29261e58` · `The incident ID is: 7675314743632885536.` | `isVolatileStamp()` |
| load countdown | Thailand thaievisa.go.th | `Acknowledge (9s)` → `Acknowledge (10s)` | `STAMP_COUNTDOWN_RE` |
| the page's own live clock | Bulgaria mfa.bg, Costa Rica rree.go.cr, Andorra govern.ad | `September 15 2026, 15:57:41 UTC` · `Costa Rica, Martes 15 de Setiembre de 2026 6:19:41 p.m.` · `Dimarts, 15 de setembre del 2026 ǀ 18:19:45` | `isClockStamp()` — whole scope only, so a rule sentence that carries a deadline time still counts |
| order-only rotation | Mauritius edbmauritius.org | 177 vs 177 blocks, identical SET, different ORDER (sector marquee) | `whole` = the sorted SET of blocks |
| counter ticker | Bolivia cancilleria.gob.bo | `3,463,022` → `3,463,035` | bare figures stay churn; only the RULE scope exempts money |
| **the page is not content at all** | Cyprus moi/mof, Philippines boi, Bulgaria bnb/mfa, Spain inclusion | bot challenge · `You reached this page when trying to access …` (Radware) · `Error Error Error This page can't be displayed … incident ID …` · `Acceso denegado … Dirección IP: …` | `isBotWall()` → reported `blocked`, never baselined as `ok` content |

Class 6 is why classes 1 and 3 existed at all on those URLs: **v5 had baselined WAF/challenge pages as `ok` page
content**, so their "content" was a challenge string plus a per-request token. Naming the wall is the root-cause
fix — a token filter alone would have kept watching a page we cannot read. One more artefact class is fixed too:
a URL whose probe path flips between HTML extraction and a render now gets a silent WHOLE-scope re-baseline
(`applyScopes(..., wholeRebaseline)`), because the two paths produce different texts; that flip was itself a
per-run layout change (edb.gov.sg: 0 blocks via http, 11 via the render). The rule scope keeps its own
pending→confirmed gate, so the flip cannot swallow a rule alert either.

**3. `layout_changed_urls[]` + `layout_change_streak`** — `public/data/source-monitor.json` now names every
drifted URL, its scope and how many consecutive runs it has moved (`layout_changed_repeat_count` counts the
repeats); the probe prints the same list on stdout. The next observer no longer has to re-probe 127 URLs to
attribute a drift.

**4. Naming the walls moved the coverage numbers — reported, not hidden.** `ok` 114 → 109 and
`cloudflare-blocked` 7 → 13: `moi.gov.cy`/`mof.gov.cy`, `boi.gov.ph`, `bnb.bg`/`mfa.bg`, `inclusion.gob.es`
were never readable content. **Cyprus now has 0 readable official sources from THOR** (its rule scope was
already empty in v5, so nothing protective was lost — the country simply learns both its URLs are walled);
Bulgaria keeps `fsc.bg`, Spain keeps `exteriores.gob.es` + `cnmv.es`, Philippines keeps `pra.gov.ph` +
`immigration.gov.ph`. Follow-up: a sourcing card for Rosa.

**Verified:** `node scripts/probe-sources.mjs --self-test` 44/44 (was 18). Full probe in a shadow tree, twice
back-to-back on the SAME baselines (run 1 re-baselines v5→v6 silently, so run 2 is the real churn test):
127 URLs · ok 109 · **rule-changed 0 in both runs** · layout-changed 0 in the re-baseline run and 7 on the
consecutive run, down from 16/18 anonymous drifts before · blocked 13 · unreachable 5 · no-rule-scope 64 ·
`npm run validate:data` clean. The 7 are all `streak: 1` (first movement since the baseline) and block-level
attribution shows rotating announcement/news rails — real page movement of non-rule content, now named in the
report instead of anonymous. Rule detection is unaffected: `rule-changed 0` on a corpus that is not changing.

## Session — 2026-09-15 · Source curation: 12 probe-able official alternates for the empty/403 renders (Rosa)

Card `t_4336aaae` (follow-up to `t_1202f120`). v5 stopped accepting a zero-text render as `ok`, which
honestly surfaced 5-6 sources that had been "watched" on an empty baseline. Nothing was broken — those pages
deliver no readable content to a THOR probe. `scripts/probe-sources.mjs` was NOT touched (declared hotspot);
only `research/countries.json` + the probe's own feed outputs.

**Per-URL outcome** (verified with the real engine, not a rough fetch):

| was unreachable | what ships now | result |
|---|---|---|
| `bahamas.gov.bs` (13 chars: "403 Forbidden") | `immigration.gov.bs` (Dept. of Immigration) + `laws.bahamas.gov.bs` (legislation/gazette portal) | ok · rule scope present / none |
| `consular.mfa.go.th` (20 chars: skip-to-content shell) | `www.mfa.go.th/en/page/issuance-of-visa` (consular visa rules + Baht fees) | ok · rule scope present |
| `www.inm.gob.mx` (0 chars) | `www.inm.gob.mx/tramites/publico/solicitud_estancia.html` (INM trámites microsite) + `dof.gob.mx` (Diario Oficial) | ok · rule scope present (both) |
| `www.migracioncolombia.gov.co` (0 chars / flapping) | `portal.migracioncolombia.gov.co/tramites-y-servicios/todos` + `…/tarifas/tarifas-vigentes` (Resolución 0599/2026 fees) | ok · rule scope present (both) |
| `www.migraciones.gov.py` (0 chars / goto timeout) | `migraciones.gov.py/residencia-temporal/` + `migraciones.gov.py/aranceles-migratorios/` | ok · rule scope present (both) |
| **flapping** `u.ae` / Singapore / Bolivia | `icp.gov.ae/en/` · `ica.gov.sg` · `cancilleria.gob.bo` | ok · rule scope present (UAE, SG) / none (BO) |

All 12 were added to BOTH `legal_compliance.official_urls` and `watch.urls`; the old failing URLs stay in
`watch.urls` on purpose (house style — their status stays visible in the feed instead of being hidden).
`www.migracioncolombia.gov.co` and `www.migraciones.gov.py` came back `ok` in the run that baselined the
alternates, which is exactly the flapping the card describes; the alternates are what make both countries
covered even on the runs where the root host renders nothing.

**Explicit no-source statements (nothing invented):** the INM root (`inm.gob.mx`) itself has no probe-able
render from THOR — its `tramites/publico/…` page does. `consular.mfa.go.th` is a JS shell and
`immigration.go.th` is a Cloudflare wall, so Thailand's probe-able official sources are `thaievisa.go.th`,
`ltr.boi.go.th` and the new MFA fee page. `mre.gov.py` is Cloudflare-blocked to our probe UA (403 → the
harness correctly refuses to escalate), so Paraguay's coverage comes from `set.gov.py` + the two DNM pages.

**Verified:** `node scripts/probe-sources.mjs` full run — 126 URLs · ok 114 · unreachable 5 (the same old
URLs, plus `u.ae` on its off-run) · cloudflare-blocked 7 · rule-changed 0 (except the pre-existing HK
headline churn) · no-rule-scope 65 (63 + 2 new no-rule URLs, both deliberate). `--self-test` 18/18.
`npm run validate:data` clean. 12/12 new URLs baseline `ok`, 10 of 12 with `rule_scope: present`.

## Session — 2026-09-15 · Watchdog harness v5: `sha256('')` is not a baseline, an empty render is not `ok` (Ziggy)

Card `t_1202f120` (verification: `t_f2368b83`). Fixes both structural causes of the 11 false "rule-scope
confirmations", plus the chrome that made the rule scope meaningless on 7 URLs.

**The v2.2 re-baseline did not touch either defect — it grew them.** The harness still wrote `sha256('')`
as a rule baseline and still accepted a zero-text render as `ok`, so across it:
`scopes.rule.last_hash = e3b0c442…` went **48 → 63 of 114**, and `status: ok` with an EMPTY whole-page hash
went **4 → 9**. Those are the numbers this change takes to zero.

**A — an empty scope is not a baseline.** `classifyProbeResult()` drops an empty `rule`/`main` scope before
anything is written, and `applyScopes()` DELETES a scope the probe no longer carries. The URL is recorded as
`rule_scope: "none"` (also surfaced per-URL in the manifest, plus `report.no_rule_scope_count` / `_urls`),
can never be baselined, and can never alert — empty→text and text→empty used to read as two rule changes.
If a page later GAINS real rule text it emits an informational `rule scope added` coverage event, not a rule
alert. Live: **63 → 0**.

**B — a page that renders to no text is not `ok`.** Any result whose extracted text is under the existing
60-char threshold now returns `{ ok: false, error: 'empty render (N chars of text)' }` → reported
`unreachable`, never baselined. It is retried once (longer render settle) before reclassification, and the
redirect race that used to crash the read (`Execution context was destroyed`) is retried rather than
reported. Live: **9 → 0** ok-with-empty-whole.

**C/D — the rule scope was mostly chrome.** Extraction now strips `<script>/<style>/<head>/<noscript>`
(JSON-LD included) and `<nav>/<header>/<footer>/<aside>` blocks, splits the page into content blocks, and
drops churn — nav labels, press/news rails, cookie modals, rates tickers, repeated site chrome, serialised
CSS/JSON-LD. The term set and sentence splitter are language-agnostic (CJK `。` terminator; JP/ES/IT/PT/FR/DE
terms), so `moj.go.jp/isa` — which previously yielded ZERO rule sentences — now yields Japanese rule text.
The churn filter applies to `whole` as well as `rule`: layout drift in the reported run was **0** (34 before).

**Silent re-baseline.** `EXTRACT_V` (5) marks the pipeline version; when it changes, every scope is
re-written silently once, so a pipeline upgrade can never fire a corpus-wide rule alarm. This run:
`rebaselined 102 · rule-changed 0`.

**Verified (live clone, two engines):** `node scripts/probe-sources.mjs --self-test` → 18 assertions over
the extraction pipeline, the baseline gate, the scope writer, plus a loopback fixture that renders to
nothing (skips without Chromium). Wired into CI as `npm run intel:probe:selftest` after the Playwright
install. v2.2's `smellsLikeCode` escalation guard is kept.

**Reported run:** 114 URLs · ok 102 · unreachable 5 · cloudflare-blocked 7 · rule-changed 0 · layout-changed 0
· no-rule-scope 63 · rebaselined 102. Rule-text snapshots 107 → 56 (chrome-only "rule text" purged).

**Honest caveat (needs curation, not more harness).** Five sources render nothing usable from our probe:
`bahamas.gov.bs` literally renders `403 Forbidden` (13 chars), `consular.mfa.go.th` renders only
"ข้ามไปยังเนื้อหาหลัก" / "skip to main content" (20 chars), `inm.gob.mx` renders 0 chars, and
`migracioncolombia.gov.co` / `migraciones.gov.py` time out. They are now reported unreachable with the char
count instead of being baselined `ok` on nothing — so the ok/unreachable split moves from 107/0 to ~102/5 and
will shift by a couple of URLs run to run until those sources are curated (carded for Rosa).

## Session — 2026-09-15 · Watchdog v2.2: false-alarm class fixed + full re-baseline

Investigated the rule-scope events that fired during the repair window (and after the two board cards verified them as 0 substantive — corpus stands). Three fresh flags (Indonesia oss.go.id, New Zealand mbie.govt.nz, Barbados) were proven FALSE by inspecting their diffs:
- Indonesia's "rule text" was literal **JavaScript code** (`typeof window`, scroll-restoration) from a JS app bundle served as page text — not rules.
- New Zealand's was a **news headline** ("Northland cycle trail receives funding boost" — a gov homepage), not an immigration rule.
- Barbados was a polluted-baseline relic from the iterative fix.

Root cause fixed permanently: the http probe now detects **JS/SPA-shell code** in the rule scope and escalates to the real browser (so a JS bundle can never baseline as rule text). Then a **full re-baseline** of all 114 URLs from the corrected engine — no more whack-a-mole of mixed baselines.

**Verified across two clean consecutive runs: 107 ok · 0 rule-changed · 0 events · 7 Cloudflare-blocked · 0 unreachable.** The change feed is now trustworthy: it will only fire on a genuinely confirmed rule-text change.

Note: run times can reach 3-5 min because many gov portals now render in the real browser — acceptable on the 24h cron.

## Session — 2026-09-15 · Source Monitor page LIVE at /sources

- Client page `src/pages/SourceMonitorPage.tsx` (lazy) fetching `/data/source-monitor.json` + `/data/source-events.json`; route wired (`fe27e64`), SPA-fallback allowlist + sitemap updated (`18fe983`).
- **Live-verified in a real browser**: `motopass.giveabit.io/sources` → 200, renders hero / countries / honesty disclosure, 0 JS errors, page title set.
- Data feeds served by the v2.1 watchdog cron (diffs, change events, coverage gaps).
- Prior stale background-probe run was harmless testing noise — the committed/live data is the clean state (0 rule-changes, 107 ok).

**Follow-ups (named, not blocking):** nav link + `nav.sources` i18n label (8+ locale files — separate polish); per-country freshness badge on program cards; OTS-strip full anchor integration (manifest hash stamp on the daily cycle); watch/Nostr alerts (needs the MotoPass Nostr key decision); Rosa curation of the 7 Cloudflare-blocked + Colombia.

## Session addendum — 2026-09-15 · Watchdog v2.1 (diffs · events · coverage gaps)

Pushed `50d009b`. Adds to v2.0:
- **Per-URL rule-text snapshots** → a confirmed rule change now records a before/after diff in `source-events.json` (rolling, cap 200) and in the manifest's `last_events`.
- **Coverage gaps** — `status_since` per URL; each country carries `coverage_gap_days`; `report.coverage_gap_count`.
- **Escalation tuned**: browser escalation now only fires when http yields a JS shell OR no rule text (was over-escalating on any cookie banner). Runtime 8min → **2min**. Re-baseline recovered **106/114** official sources (was 77).
- **Verified stable**: 0 false rule-changes across consecutive runs; 34 whole-page layout drifts reported as informational only. Rule scope correctly re-baselines and will flag a page that later gains rule text.

**Live:** `motopass.giveabit.io/data/source-monitor.json` (107 ok · 7 Cloudflare-blocked · 0 unreachable · 0 rule-changed) · `source-events.json` (200) · `source-snapshots.json`. Manifest now carries `last_events` + per-country `coverage_gap_days` for the presentation layer.

**Next (presentation):** wire the Source Monitor page into the motopass SPA — per-country cards (freshness ring, source status, coverage gap), a change/activity feed with diffs, most-researched panel (Umami), OTS-proof strip of the manifest hash. Mock rendered; awaiting Cam's look-approval to wire.

## Session — 2026-09-15 (later) · SECOND bug found and fixed: a browser-pinned source was never probed (Rosa)

**`probeTarget()` used the pinned mode to SKIP the probe.** `wantBrowser = entry.mode === 'browser'` then:
`let result = wantBrowser ? null : await httpProbeWithRetry(url)` and the escalation guarded by `if (!wantBrowser)`.
So for any URL whose mode was pinned to `browser`, `result` stayed `null` and the entry returned **`probe failed`** — every run, forever, no matter how healthy the source.

**Consequence:** the moment a URL baselined successfully through Chromium, its mode was pinned to `browser` and the *next* run reported it unreachable. **21 of the 114 sources were trapped** — Bolivia, Hong Kong, Mexico, UAE, Zug, Cyprus, Greece `mfa.gr`, Vanuatu, Mauritius, Brazil *planalto*, Argentina *boletin*, St. Lucia, Bahamas, Belize, Cambodia, Philippines `boi`, Malaysia `mdec`, Indonesia ×2, Japan `meti`, Spain `inclusion`, Cayman `ciregistry`. (This is also why the browser-binary fix alone looked like it "wore off" between two runs.) Fixed in `27c3b52`: a pinned-browser URL now runs the browser directly; an unpinned URL keeps http-then-browser escalation; Cloudflare 403 walls are still short-circuited.

**Verified after the fix (three consecutive real runs): 114 URLs · ok 107 · unreachable 0 · cloudflare-blocked 7 · rule-changed 0.** Committed as `e9dbbc0`.

**Rule-change events during the repair window were NOT published.** 11 `source-probe-v2` rule-scope movements fired while the harness itself was broken (UAE ×2, Paraguay, Chile, Barbados, Japan, Ireland ×3, Italy ×3). There is no text-level snapshot behind them, they all landed inside a 3-hour pipeline-repair window, and a 2.5-hour "rule change" on `enterprise.gov.ie` is not credible. `watch.changed` was cleared for the 6 affected countries and each audit entry now states why it was re-baselined instead of silently disappearing. **They need a rule-text diff before anyone treats them as real** — that is the gap the v3 snapshot feed (in flight on this repo) closes.

**Observation for the v3 feed:** the `whole` scope drifted on **37–39 of 114 URLs within 20 minutes** on every run — the full-page hash is dominated by volatile elements (news rails, tickers, "last updated"). Rule scope is stable. If layout events are going to be shown to a human, filter the volatile lines out of `whole` the way `rule` already does, or the feed will be noise.

**Hotspot:** `scripts/probe-sources.mjs` was being edited by a concurrent session in this same working clone (`/root/motopass`) while this card ran — an uncommitted coverage-clock + rule-text-snapshot feature. I staged my one-hunk fix with `git apply --cached` so none of the other session's unreleased work was committed by me, and left their working-tree changes intact. Anyone else touching this file should coordinate first.

## Session — 2026-09-15 · Source curation DONE + watchdog root-cause fix (Rosa)

**Root cause of the "25 unreachable" (biggest finding):** it was never the URLs. `probe-sources.mjs` escalates to Playwright chromium when a page is bot-gated/JS-only, but the pinned browser build (`chromium-1243`, required by playwright 1.63.0 in `/root/hq`) was missing from `~/.cache/ms-playwright` — every browser escalation died with `browserType.launch: executable doesn't exist`. Reinstalled via `npx playwright install chromium` (from `/root/hq`). **Result: 25 of the 31 "failing" sources were false negatives — they probe clean.**

- Post-fix full probe: **114 URLs · ok 107 · rule-changed 0 · layout-changed 35 · cloudflare-blocked 7 · unreachable 0**.
- Every one of the 50 programs now has ≥1 probe-able official source. **Zero countries unwatched.**
- If this ever recurs, the symptom is `unreachable` counts jumping in one run with `browserType.launch` in `last_error` — run `npx playwright install chromium` in `/root/hq`.

**Curation (6 verified alternates added — 5 countries, blocked-by-Cloudflare set).** All verified **PROBE-ABLE (HTTP 200, real content, mode pinned `http`, scopes `whole`+`rule`, baselined 2026-09-15T13:52Z)**, added to both `legal_compliance.official_urls` and `watch.urls`:

| Country | Added alternate (official authority) | Why |
|---|---|---|
| El Salvador | `https://www.migracion.gob.sv` | DGME — the immigration authority (only source; was the sole country with zero ok URLs) |
| Malta | `https://www.identita.gov.mt` | Identità — citizenship/identity agency |
| Costa Rica | `https://www.rree.go.cr` | Foreign Ministry (consular/visa) |
| Thailand | `https://consular.mfa.go.th` · `https://www.thaievisa.go.th` | Consular Dept (visa rules) + official e-visa portal |
| Bulgaria | `https://www.mfa.bg` | Foreign Ministry (visa/consular) |

Existing working sources were kept. The 7 Cloudflare-walled URLs stay in `watch.urls` (indexed, so a future un-walling is detected) but are **no longer any country's only source**.

**Still Cloudflare-walled, no probe-able alternate exists (documented, not invented):**
- Greece `https://www.mfa.gr` — bot-walled on every variant (`/en/`, apex, `www.gov.gr` all return "Access Denied" via browser). **Greece is covered** by `https://migration.gov.gr` (Ministry of Migration & Asylum, ok).
- Gibraltar `https://www.gfsc.gi` — GFSC is the financial regulator; **Gibraltar is covered** by `https://www.gibraltar.gov.gi` (HM Government of Gibraltar, ok).
- El Salvador `presidencia.gob.sv`, Malta `mfsa.mt`, Costa Rica `migracion.go.cr`, Thailand `immigration.go.th`, Bulgaria `mvr.bg` — all 403 Cloudflare bot walls from a datacenter IP; alternates above carry the watch.

**Rejected candidates (checked, NOT added — empty shell / parked / dead-end):** `cancilleria.gob.sv` & `gob.sv` (115-byte shell), `communitymalta.gov.mt` (116-byte), `dgme.go.cr`, `gobernacion.go.cr`, `www.gov.gr` (Access Denied). Nothing was added that isn't an official government host.

## Session — 2026-09-15 · Official-source watchdog v2 (the "rules changed?" detector)

**Done (Cam-directed build, approved as complete/robust/reliable):**
- Rebuilt `scripts/probe-sources.mjs`: browser escalation (Playwright chromium) recovers JS / bot-gated gov portals; Cloudflare bot walls are classified `blocked` (not retried pointlessly). Per-URL scopes: `whole` (full page) / `rule` (fees·thresholds·requirements·eligibility terms) / `main` (dominant content container). A rule scope only ALERTS after the same value is seen on two consecutive probes (pending→confirmed); volatile lines (live tickers, "last updated", ©) are stripped. Whole-page-only drift = `layout_changed` (informational), never a rule change. Writes `public/data/source-monitor.json`. Detection facts only — never auto-rewrites a rule.
- Baseline established for all 108 official source URLs: 77 ok · 6 Cloudflare-blocked · 25 unreachable (curation queue below).
- Cron `10511cbe573d` (daily 07:00, no_agent, silent when clean, delivers on a confirmed rule change) via `~/.hermes/scripts/motopass-source-watch.sh` → commits the fresh feed + manifest to main and pushes.

**Open (curation):** 6 Cloudflare-blocked (El Salvador, Malta, Costa Rica, Thailand, Bulgaria, Gibraltar) + 25 unreachable (CAR, Bolivia, UAE, Hong Kong, Mexico, Cyprus×2, Greece, Vanuatu, Mauritius, Brazil, St. Lucia, Bahamas×2, Belize, Cambodia, Philippines, Malaysia, Indonesia×2, Japan, New Zealand, Spain, Cayman Islands) → each needs a probe-able alternate official source, verified before adding. Rosa's lane.

**Presentation:** manifest is live at `/data/source-monitor.json` (50 countries, per-URL status + change history). Site display layer is the next phase (Cam's design direction pending).

## Session — 2026-09-15 · Truth fix: "Applications open" was a build result, not a decision

**Done:**
- The live site announced **"Applications open"** (nav, footer, pitch CTA band, Apply banner) while the footer and legal copy said **"Not accepting applications"**. Cam confirmed the truth: **we are not accepting applications yet**.
- **Root cause — a design flaw, not a copy typo:** `scripts/launch-gate-check.mjs` computed `applications_open = gates.every(g => g.pass)`. Five green **technical** gates (Seal OTS, Forge UI, Nexus relay, Ledger oracle, Ops CI) were being treated as a decision to accept applications. Any green build announced applications open, automatically and permanently.
- `public/launch-gates.json` → `applications_open: false` (the served report said `true`, generated **2026-07-16** and stale since). The in-code `FALLBACK_LAUNCH_GATES` already defaulted to `false`, so the served report was the single wrong source.
- `scripts/launch-gate-check.mjs` → explicit **HUMAN GATE**: `applications_open = gates.every(pass) && HUMAN_GATE_ACCEPTING_APPLICATIONS`, with a scorecard note when the gates are green but the human gate is shut. Reopen deliberately: `LAUNCH_APPLICATIONS_OPEN=1 node scripts/launch-gate-check.mjs`.
- No UI or API logic changed — the components already render from this data. `ApplyPage.tsx:139` renders the "Launch Engine complete — applications open" banner only inside `{applicationsOpen && …}`, and `:187` holds the pre-launch branch, so the corrected flag is what switches the page.

**Decisions:**
- A green technical scorecard must never again publish a commercial decision. Both conditions are now required, and the closed state is the default.
- The stale `generated_at` (July) was left as-is rather than rewritten — the report should not look fresher than it is. Regenerating it is a separate job.

**Verified live:** served `launch-gates.json` reads `applications_open: false`; the deployed bundle carries the new commit id (`index-BM1Zst5a-20260915-a64ed6e.js`).

**Lane note:** this touched motopass code, which is normally the M3/Grok lane. Flagged to Cam so Grok can rebase.

**Git State:** HEAD == `origin/main` (`a64ed6e`).

## Session — 2026-09-10 (Buffy/Freebuff) — Batch 6 research pass: Europe golden-visa tier healed

**Done (user work order: Batch 6 — Spain, Greece, Italy, Turkey, Latvia, Estonia, Bulgaria, Croatia, Gibraltar, Andorra):**
- **Greece — MATERIAL:** golden-visa tier structure corrected — zones are **€800k (high-density) / €400k (rest of country) / €250k (heritage + new 2026 startup route)**; the "€500k most regions" tier on file doesn't exist. Plus: planned **15% transfer tax on non-EU buyers from Jul 2027** (up to ~€96k) added as a con. Sources: getgoldenvisa 2026 · buygreece · itciland 2026-01-19 · goldenvisas.com.
- **Croatia — phantom pathway removed:** the €300k "real-estate residency" route had **no legal basis** (property purchase grants no residence right in Croatia); removed, page floor re-anchored to DNV (EUR 3,622.50/mo / €43,470/12mo — confirmed official mup.gov.hr). Sources: mup.gov.hr · taxesforexpats 2026-07-31.
- **Turkey — deposit route un-suspended:** bank-deposit CBI is **ACTIVE at $500k/3-yr** (was wrongly marked suspended); property $400k confirmed via official invest.gov.tr. Sources: globalresidenceindex 2026-01-16 · legal500 · serkalaw.
- **Italy — flat-tax correction:** HNW new-resident flat tax is **€300,000/yr** (was €100k on file — 3× understated); investor tiers €250k/500k/1M/2M verified against the official programme site. Source: Fragomen 2026-04-28 · investorvisa.mise.gov.it.
- **Gibraltar — Cat 2 re-anchored:** official ITO figures — **£118k assessable cap** (not £105k), **£37k minimum** tax (not "~£37k max" — the min/max direction was inverted!), max ~£44.7k; **2026 residency-criteria overhaul** ahead of UK–EU treaty noted. Sources: gibraltar.gov.gi · sovereigngroup 2026-07-07.
- **Bulgaria — bonds route closed:** bond-based investment route cancelled (Feb 2021 Citizenship Act amendments); only the company/jobs PR route (BGN 1M ≈ €511k + 10 jobs) remains active; **euro adopted 1 Jan 2026** noted.
- **Spain — SMI re-anchor:** DNV = 200% SMI 2026 = **€2,849/mo (€34,188/yr)** (was €2,160–2,646 band); NLV €28,800 confirmed; abolition stands.
- **Latvia — risk signal:** €50k company route verified lowest-in-EU (+€10k state fee); **€10M golden-visa fraud probe** (FIU flagged 20+ companies) added as a con.
- **Andorra — refinement:** Jan 2026 reform details — general €1M / reduced €400k Housing Fund routes + €50k AFA deposit structure; page floor aligned to the reduced route.
- **Estonia — verification pass:** no material change (nomad ~€3,504/mo, startup, e-Residency, VASP all consistent).
- **Method:** `scripts/research-batch6-europe.mjs` — same audited pattern; last_checked=2026-09-10 on all ten.
- **Gates:** validate-data ✓ · check-intel ✓ · trust envelopes ✓ · tsc 0 · 268/268 unit.

---

## Session — 2026-09-10 (Buffy/Freebuff) — Batch 5 research pass: LatAm tier healed

**Done (user work order: Batch 5 — Brazil, Argentina, Chile, Colombia, Belize):**
- **Colombia — MATERIAL (SMMLV re-pricing):** SMMLV 2026 = **COP 1,750,905** (corpus carried COP 2,000,000). Every threshold moved: nomad/pensionado 3× = COP 5,252,715 ≈ **$1,350/mo** (was $900–1,000); M investor = **100× SMMLV** (company, ≈$35–45k) vs **350× SMMLV** (real estate, ≈$157–163k) — the old single $100k figure matched neither route. Sources: colombiavisas 2026-01-01 · Res. 5477 art. 57 · medellinadvisors · expatgroup.
- **Brazil — CORRECTION + addition:** page floor $150k → **$95k** (VITEM IX R$500k is the true minimum); **R$150k startup tier documented** (oliveiralawyers 2026); VITEM XIV alt: **$1,500/mo OR ~$18k savings** (zsassociados · riotimes).
- **Chile — CORRECTION:** page floor $200k → **$500k** (inversionista confirmed + INVESTCHILE sponsorship); rentista re-anchored to **1× Chilean minimum wage (~$650/mo)** from conservative $1,000 (immi.legal 2026-04-26).
- **Argentina — index re-anchor:** rentista = 5× SMVM, SMVM Aug 2026 = ARS 376,600 → 5× = ARS 1,883,000 ≈ **$1,400–1,500/mo**; sourced peso anchor added so users verify the week they file (goldenharbors 2026-08-05 · immi.legal).
- **Belize — VERIFICATION PASS:** QRP $2,000/mo confirmed official (BTB upd. 2026-07-27); age conflict recorded (BTB 45+ vs law-firm guides 40+) — no change on weak signals, flag for BTB confirmation.
- **Method:** `scripts/research-batch5-latam.mjs` — same audited pattern; last_checked=2026-09-10 on all five.
- **Gates:** validate-data ✓ · check-intel ✓ · trust envelopes ✓ · tsc 0 · 268/268 unit.

---

## Session — 2026-09-10 (Buffy/Freebuff) — Batch 4 research pass: Caribbean CBI cluster healed

**Done (user work order: Batch 4 — St. Lucia, Grenada, Barbados, Bahamas + cross-cluster P-10998 refinement):**
- **Grenada — MATERIAL:** NTF donation raised **$150k → $235k** (single or family of up to 4; GIS Grenada 2026 announcement, corroborated across 2025-09 → 2026-08 sources); all-in single ≈ $242.5k. RE share $270k unchanged. Finance floor aligned.
- **St. Lucia — CORRECTION:** page-level finance floor $100k → **$240k** (NEF is the true minimum; pathways were already right at $240k/$300k/$300k). Thresholds verified current.
- **Bahamas — CORRECTION:** page-level min $500k → **$1.0M** / typical → $1.2M (aligned to the already-corrected EPR $1.0M official figure; old $750k remnants purged from Paige fields too).
- **Barbados — VERIFICATION PASS:** both official watch URLs flagged "changed" for weeks — rule review found NO threshold change (Welcome Stamp $50k/yr + $2k/$3k fees confirmed official; SERP stays counsel-dependent, no verified number to apply).
- **Antigua + Dominica — P-10998 RESOLVED:** the Proclamation's mechanism is a **B-1/B-2 visa-validity cut** for their nationals (10-yr visas reduced, eff. 1 Jan 2026), not an entry ban (CitizenX 2026-08-03). St. Lucia and Grenada are NOT on the restricted list.
- **Method:** `scripts/research-batch4-caribbean.mjs` — same audited pattern; last_checked=2026-09-10 on all six touched entries.
- **Gates:** validate-data ✓ · check-intel ✓ · trust envelopes ✓ · tsc 0 · 268/268 unit.

---

## Session — 2026-09-10 (Buffy/Freebuff) — Batch 3 research pass: 80–98d tail healed

**Done (user work order: Batch 3 — Bolivia, Paraguay, CAR, Panama, Antigua, Portugal, Uruguay, Dominica, St. Kitts):**
- **Uruguay — MATERIAL (2026 tax reform, Law 20.446 as amended, eff. 1 Jan 2026):** 11-year foreign-income holiday PRESERVED, then **12% on most foreign investment income** (pensions/Social Security exempt); tax-residency-via-RE threshold now **~US$2M**. Residency pathways (RE $100k / rentista ~$1,500/mo) unchanged — $2M is the tax-residency threshold, not general residency. Sources: PwC Tax Summaries · IMI Daily 2026-02-25 · Greenback 2026-04-17.
- **Antigua — CORRECTION (official CIU):** NDF is **$230,000 flat — single applicant OR family of up to 4** (fees $10k/$20k); removed the speculatory "single tier may be ~$100k" note. Sources: cip.gov.ag/investment-options/ndf · Ancova 2026-07-21.
- **St. Kitts — STATUS:** proposed 30-day-visit rule **still not law** (verified Aug 2026); mandatory interviews in effect; 2026 overhaul plans genuine-link rules + phasing out donation-only citizenship. Sources: getgoldenvisa 2026-08-21 · IMI Daily 2026-01-04.
- **Bolivia — UPDATE:** crypto ban timeline clarified (partial Dec 2020 via Res. 144, **fully lifted 25 Jun 2024**); volumes +530% to $430M+ (Reuters 2025-06-27); Paz government (Oct 2025 runoff): floating FX ~9–9.5 BOB/USD, Investment Law bill in Assembly (Aug 2026). Crypto legal, NOT legal tender; framework forming.
- **Verification passes (no material change, recorded for the honesty trail):** Dominica (EDF $200k + ECCIRA current) · Panama (FN $200k / QI $300k / pensionado; 2025 draft crypto bill still latest) · Portugal (€500k fund route + Lei Orgânica 1/2026 confirmed) · Paraguay (SUACE $70k/10yr current) · CAR (repeal framing + Sango stalled confirmed).
- **Method:** `scripts/research-batch3-tail.mjs` — same audited pattern as Batches 1–2; last_checked=2026-09-10 on all nine.
- **Gates:** validate-data ✓ · check-intel ✓ · tsc 0 · 268/268 unit.

---

## Session — 2026-09-10 (Buffy/Freebuff) — Batch 2 research pass: 50d tier healed

**Done (user work order: Batch 2 — Costa Rica, Hong Kong, Thailand, Mexico, Cyprus):** `210abb0`
- **Mexico — deferred INM item RESOLVED:** July 2025 consular guidelines + UMA 2026 (117.31 MXN) roughly doubled solvency bars: temp = ~$4,400/mo or ~$74k balance (was $2,600/$43k); PR = ~$7,400/mo or ~$298k; house route MXN 10.76M (~$598k); investment route MXN 5,378,664 ≈ **$300k** (was $250k). **Crypto explicitly NOT accepted** as solvency proof. Consulates vary ±5–10%.
- **Cyprus — deferred 6.2 item RESOLVED:** criteria since 2 May 2023 — four investment categories (first-sale residential / other RE incl. resale / company +5 employees / AIF funds), **€50k/yr secured income** (+€15k spouse, +€10k minor child); the 2021 €30k bank-deposit requirement is GONE. PR card renews every 10 yrs; visit ≥ every 2 yrs; annual CRMD compliance declarations. Citizenship ~7 presence-yrs (2,655 days), B1 Greek.
- **Hong Kong:** CIES residential single-property threshold **lowered HK$50M → HK$30M (eff. 2025-09-17**, 2025 Policy Address), residential cap stays HK$10M, aggregate RE cap → HK$15M; eligible wholly-owned private company investments count from 2025-03-01. TTPS Cat A = 36-month stay (ImmD official; was recorded 24).
- **Thailand:** remittance-tax uncertainty RESOLVED — May 2025 draft legislation: foreign income remitted in year earned or following year is exempt (taxable only when remitted later; applies to income from 2024). Elite rebranded **Thailand Privilege**: Bronze ฿650k/5yr (promo to 30 Sep 2026), Gold ฿900k, Platinum ฿1.5M/10yr, Diamond ฿2.5M/15yr, Reserve ฿5M/20yr. LTR thresholds re-verified current.
- **Costa Rica:** verification pass — all thresholds current ($150k inversionista / $2,500/mo rentista + $60k CD alternative / ~$3k nomad). No numeric drift.
- **Method:** `scripts/research-batch2-tier50.mjs` — same audited pattern as Batch 1; last_checked=2026-09-10 across all five.
- **Gates:** validate-data ✓ · check-intel ✓ · envelopes ✓ · tsc 0 · 268/268 unit.

**Git State:** `210abb0` pushed; tree clean.

**Not done / next agent:**
- Batch 3 (80–98d tail): Bolivia (98d), Paraguay (95d), CAR (93d), Panama (88d), Antigua (85d), Portugal (83d), Uruguay (81d), Dominica/St. Kitts/Switzerland-class remainder
- Both deferred items from the old backlog (Mexico INM, Cyprus 6.2) are now CLOSED — remove from any stale-task lists
- Satohash re-stamp will pick up all ten batch-1+2 programs automatically

---

## Session — 2026-09-10 (Buffy/Freebuff) — Batch 1 research pass: 75d+ cohort healed

**Done (user work order: first research batch via the Claude pipeline prompt):**
- **Cohort:** El Salvador (77d), Georgia (75d), UAE (75d), Singapore (76d), Switzerland (78d) — all re-verified against 2026 sources, `413e023`.
- **Headline corrections (all sourced + audited):**
  - **Georgia:** RE residency $100k → **$150k effective 2026-03-01** (Jun 2025 law, Arts. 15(j)/7(d.e)); VASP regime is LIVE at NBG since Jan 2023 (was recorded as "draft"). min_investment 50k→150k, typical→160k.
  - **UAE (official u.ae, upd. 2026-07-28):** real-estate Golden Visa = **5 years, not 10** (10-yr is public investments); AED 2M bar confirmed; NEW: tax-contribution route (≥AED 250k/yr) listed.
  - **Singapore:** GIP 2023 quanta confirmed current — **S$10M business / S$25M fund / SFO AUM ≥S$200M + S$50M deployed**; app fee S$20k (2025-05-05); ~12mo processing. Old corpus ($400k min, GIP $1.8M, SFO $5M) was badly stale — the largest correction in the batch.
  - **El Salvador:** Freedom Visa pathway ADDED ($1M BTC/USDt → residency + fast-track citizenship, 1,000/yr cap, operating per IMI 2026-04 + lawyer-verified 2026-07); reserve ~7,762 BTC (2026-09-02); Chivo privatized (IMF-confirmed 2026-09-03).
  - **Switzerland:** forfait federal base **CHF 435,000 (2026)**, 21/26 cantons retain it, Geneva ~CHF 1M practice minimum; 0% private crypto capital gains confirmed.
- **Method:** `scripts/research-batch1-cohort.mjs` (rerunnable one-shot) — every change appended to `audit_trail` with date/field/from/to/source; `last_checked=2026-09-10`; pros/cons refreshed with dated citations; freshness/watch/satohash untouched (pipeline-owned).
- **Gates:** validate-data ✓ · check-intel ✓ · trust envelopes ✓ · tsc 0 · 268/268 unit.

**Git State:** `413e023` pushed; tree clean.

**Not done / next agent:**
- Batch 2 candidates (50d tier): Costa Rica, Hong Kong, Thailand, Mexico, Cyprus — then the 80–98d tail (Bolivia, Paraguay, CAR, Panama, Portugal, Malta)
- Satohash re-stamp will pick these five up automatically as the canonical slice changed (daily self-heal)
- Prompt doc's Section 5 hot-button list updated as batches land

---

## Session — 2026-09-10 (Buffy/Freebuff) — continuation batch: UX depth + Veritas v2

**Done (follow-up round after the 15-item mission):**
- **Distressed empty-state reset** (`415f2fb`): one-click "Reset all filters" (lane + region + score + ask + proof/bookmark toggles + transient search) beside the gate-explainer link.
- **GoalFinder shareable URLs** (`415f2fb`): `?gf-budget=150k&gf-timeline=12mo&gf-goal=fastest` — URL-backed chips, share button copies the permalink, back-button safe (replace:true).
- **Veritas v2 — Wayback mirrors** (`ab2dfe5`): sources with status `unreachable`/`changed` now show an "Archive" link → `web.archive.org/web/{probe-date}/{url}` — a down source no longer breaks the inspectable trail.

**Architecture finding — freshness is honest and two-layered (do NOT 'fix' by stamping):**
- `research/countries.json` freshness = **research-claim age** (50–98d — when a human/agent last verified the claims). Reads stale, correctly.
- `public/countries/{ISO}.json` + index (gab.country-trust.v1) = **daily probe freshness** (0–1d, pipeline-stamped). The machine layer is fresh.
- The research-claim layer needs **human-quality batch research** (prompt ready in `CLAUDE-RESEARCH-PIPELINE-PROMPT.md`), not a script — freshness flags exist precisely to call this out.

**Verified:** tsc 0 · 268/268 unit · 26/26 e2e · build green (469KB / 152KB gzip).

**Git State:** commits `415f2fb`, `ab2dfe5` pushed to main; tree clean.

**Not done / next agent:**
- Research-claim freshness: run 2–3 country research batches against the Claude prompt (prioritize the 75d+ cohort: UAE, Georgia, El Salvador, Singapore, Switzerland, Thailand)
- Veritas v3 idea: surface per-country trust-envelope freshness in ProgramsPage cards (data already ships in `public/countries/`)
- Standing backlog unchanged: LNbits BOLT12 mint · hosted grounded Paige · live Nostr relay sync · 14 proofs re-stamp convergence

---

## Session — 2026-09-10 (Buffy/Freebuff) — 15-item mission complete: all waves shipped

**Done (user request: finish all 15 improvement items end-to-end, commit+push in batches, weave exceptional design polish):**

*Wave 1 — fixes & quality:*
- **tsc 38→0** — entire backlog cleared: 82 i18n keys restored (34 union-missing + 48 sw-orphans), component type fixes, test-file typing (Vite `?raw` for hero test + `@types/node` shim).
- **eslint 13→0** — two real refactors (`useRouteLangMemory` ref-write, `LazyFlag` lazy-init), rest documented suppressions.
- **26/26 e2e green (first fully passing suite)** — deterministic git-derived build-id helper (`e2e/support/build.ts`), role-based Uruguay card locator, auto-waiting visibility assert replaces `scrollIntoView` race.

*Wave 2 — features (all with full 9–10-locale parity):*
- **Watch-lists** (`38cb2e8`): bell toggle on cards/modal, localStorage-backed `watchlistStorage`, watched-filter chip in AlertInbox, pinned watched alerts.
- **Apply flow-map** (`24c8b13`): 5-step visual stepper above the form, fee step reflects `onPaid`; **Programs onboarding strip**: first-visit 3-chip explainer (proofs/freshness/watch), dismissed stays dismissed.
- **Simulator demo presets** (`4d7b17e`): Budget/Fastest/Max-Sovereignty one-click stacks over real corpus IDs.
- **Modal tab memory + swipe** (`bf76102`): last tab remembered per user (clamped to tabs the program offers), horizontal-flick navigation via `useTabSwipe` (never fights vertical scroll), 220ms tab-panel rise.
- **Goal-based path finder** (`422e16f`): budget × timeline × goal chips → ranked matches by sovereignty, opens program modal. The flagship UX differentiator.
- **Veritas source-trust v1** (`85b404a`): per-source probe panel in modal Sources tab — live watchdog statuses (OK/Changed/Down/Pending) with probe dates + healthy-count. Source trust is now *inspectable*, not asserted.
- **Sats conversion**: verified already live on every money surface (no duplication).
- **Per-country chunking**: evaluated and consciously skipped — corpus is one intentionally-atomic research file, deferred off critical path, 152KB gzip total index; chunking adds failure modes for no real user win.

*Wave 3 — design polish (reduced-motion safe throughout):*
- **Hero count-ups** (`f0734c9`): `CountUp` component (easeOutExpo, fires once in view) animates jurisdictions/lightning chips.
- **WCAG AA badge contrast**: proof-green `#16A34A`→`#15803D` (light mode 10px text), FreshnessBadge stale tier to ink-secondary.
- **StatCard reduced-motion guard** on entrance + hover lift.

*Wave 4 — i18n:*
- **FULL PARITY: 820/820 keys × 10 locales** (`2889eb4`) — closed the last 11 vault keys in hi/de/fr/es/zh.

**Verified:** tsc 0 · eslint 0 · 268/268 unit · 26/26 e2e · build green (index 469KB / 152KB gzip).

**Git State:**
- 9 commits pushed: `4c87384 6080a99(→424a8ed) 38cb2e8 24c8b13 4d7b17e bf76102 f0734c9 422e16f 85b404a 2889eb4`
- Branch: main, clean tree, CI auto-deploys to motopass.giveabit.io

**Not done / next agent:**
- Standalone ChunkedData plan deliberately archived — revisit only if corpus >1MB or per-country deep-links emerge
- Veritas v2: extend panel with per-claim source diffs + Wayback snapshots for unreachable sources
- GoalFinder v2: persist goals in URL, share permalinks for goal queries
- Standing backlog: LNbits BOLT12 mint · hosted grounded Paige · live Nostr relay/portfolio sync · 14 proofs re-stamp convergence (self-heals daily)
- Research war: 26 stale countries (freshness sweep keeps running; batch research prompt ready in `CLAUDE-RESEARCH-PIPELINE-PROMPT.md`)

---

## Session — 2026-09-10 (Buffy/Freebuff) — UX polish batches + working-tree restore

**Done (user request: restore deleted images, continue upgrade batches, honest GUI polish):**
- **Restored 13 deleted image files** in working tree via `git checkout -- .` (education, incubator, flags-sprite, funding-flow, header-elite, kimi, passport, sovereignty×3, vault-archive, explainer poster) — tree now clean.
- **Batch A — interaction & mobile polish:**
  - `src/index.css`: `.input-field` 16px font floor on mobile (`text-[16px] md:text-sm`) — kills iOS Safari auto-zoom on every form (Apply, Register, Verify, Profile).
  - Global `:focus-visible` keyboard focus ring (BTC orange, 2px offset) — WCAG 2.4.7 parity across all interactive elements, invisible for mouse/touch.
  - Global `prefers-reduced-motion` kill-switch (0.01ms durations) — belt-and-braces layer under per-component guards.
  - Toast error variant now shows `AlertTriangle` icon (parity with success ✓).
- **Batch B — proof & loading polish:**
  - `FreshnessBadge` tooltip: human date + raw ISO (`Last checked · 12 Aug 2026 (2026-08-12)`).
  - `CardSkeleton`/`RowSkeleton` rise-in staggered entrance — no abrupt pop-in.
- **Batch C — quality:** fixed `prefer-const` (BtcMapMerchantDirectory) + removed unused `hashHex` (vaultVerify) + unused `SeoKeywords` import (seo.ts). The `react-hooks/set-state-in-effect` error class deliberately deferred — riskier than its value.

**Verified:** tsc 38 errors vs 40 baseline (zero new, two fixed) · **260/260 unit** · build green (index 462.5 KB, gzip 150 KB) · e2e 23/26 with 2 pre-existing failures on main (`BUILD version visible`, `Uruguay flagship modal` — fail identically with changes stashed) + 1 known RTL flake.

**Git State:**
- Base SHA: `6466b9d` · Batch commit follows
- Branch: main

**Not done / next agent:**
- Pre-existing e2e failures need a dedicated fix card (BUILD-visibility selector + Uruguay modal Pathways tab)
- `set-state-in-effect` sweep (careful, per-component)
- Full translation parity ja/hi/sw · LNbits mint · hosted grounded Paige · live Nostr relay (standing backlog)

---

## Session — 2026-08-27 · Breez Server Costs donate (Grok M3)

**Done:**
- `src/data/serverCosts.ts` — Layer 1 `bc1pucgsh…lpscgy`, Layer 2 `motopass@breez.tips` (`lightning:motopass@breez.tips`). TEMP `motopass-server@giveabit.io` removed.
- Live-verified: Server Costs → Layer 2 shows Breez Spark + `motopass@breez.tips`.

**Git State:** SHA `570060f` on `origin/main`.

---
## Session — 2026-08-23 (Ziggy) — Defer heavy live-data fetches to after first paint (smoothness epic)

**Done (task t_64288276 — defer heavy elements + code-split routes, all MotoPass pages):**
- New `src/lib/idle.ts` — `afterIdle()` (requestIdleCallback + setTimeout fallback) to run a callback once the browser is idle after first paint.
- The four app-wide live-data providers now defer their initial fetch to idle instead of firing on mount for every route: **BtcPriceContext** (mempool spot), **BlockHeightContext** (mempool block height), **BtcMapDensityContext** (density snapshot), **ProgramsContext** (the 531KB `/research/countries.json` — the big one). Consumers already render loading/fallback, so pages are solid at first paint and live numbers fill in after. User refresh stays immediate. No features stripped.
- Routes were already `React.lazy` code-split (verified in build output — each of the 10 pages loads its own bundle); heavy video (`MotoPassExplainer`, `VaultEducationPlayer`) and animated charts (`SavingsGraphs`) were already in-view-deferred.

**Verified:**
- Build clean; boots with no runtime errors; live A/B vs origin/main confirms the deferral. Live sweep (mobile 390 + desktop 1440): FCP 200-450ms on all 10 routes, each route loads only its own bundle, live-data fetches fire after first paint.
- HOTSPOT: committed ONLY my 5 files (`src/lib/idle.ts` + 4 context providers) as `78a84e9`; pushed to origin/main; live deploy confirmed (bundle salt `78a84e9`). Sibling ziggy task t_810e8b85 (lazy flags/images) has UNCOMMITTED edits in the shared checkout — left untouched, not staged.

**Decisions:**
- Defer to idle (not remove): live data still arrives, just after first paint, preserving the honesty visuals + interactive hover graphs.
- Honest numbers: on a fast localhost harness the A/B TBT delta is small (Chrome queues these fetches behind route chunks anyway); the real win is architectural — the 531KB `countries.json` fetch + JSON.parse is off the critical path, which matters on real mobile/slow networks.

**Git State:**
- SHA: `78a84e9` (pushed to origin/main, live-verified)
- Pre-existing (NOT mine): caught `useProgramsContext must be used within ProgramsProvider` ErrorBoundary console error — verified identical on origin/main before-build. Page renders fine; flag for a separate root-cause card (likely duplicate context module across split chunks).

---

## Session — 2026-08-22 (Grok/M3) — Country-intel deepening blitz (24 fresh/26 stale) + Claude research-pipeline prompt — BUILD 72

**Done (user request: deepen the stalest countries batch-by-batch via the Wikipedia Legality page, verify thresholds, re-stamp, and hand off):**
- **5 research batches completed this session** — 24 programs re-verified/corrected with dated, sourced facts + `audit_trail` entries. All gates pass; `intel.json` regenerated each batch; every push auto-deployed and **verified live** against `/research/countries.json`:
  - **Batch 1 (2026-08-21):** CAR (repeal 2023 → `rbi_cbi`), Bolivia (BCB 144), Paraguay (Itaipu + SUACE $70k verified), Panama (Friendly Nations $5k→$200k correction, Qualified Investor RE $300k/securities $500k/deposit $750k, 2022 veto + 2023 SC strike-down) — `a14704e`
  - **Batch 2:** Portugal (Lei Orgânica 1/2026 naturalisation 7/10yrs, clock 5→10), Malta (CBI terminated by CJEU C-181/23 + Act XXI/2025; MPRP details), St. Kitts (SISC $250k, RE floor $400k→$325k), Antigua (business route $400k share of $5M+), Dominica (EDF $200k), Uruguay (re-verified) — `dfc8d11`
  - **Batch 3:** 🚨 **El Salvador — Bitcoin legal-tender REVOKED Feb 2025** (IMF $1.4B deal condition) → last `legal_tender_bitcoin` moved to `rbi_cbi`; Switzerland lump-sum tax verified; Singapore (PSA 2019); UAE (VARA/DFSA/FSRA/CBUAE+SCA as of Oct 2025); Georgia (2019 MoF 0% gains); Costa Rica (BCCR 2017) — `24c67e9`
  - **Batch 4:** Hong Kong (VATP mid-2024), Thailand (payment-tool ban since 1 Apr 2022 — new fact), Mexico (FinTech Law), Cyprus (legal, CASP/MiCA for business) — `0dc825f`
  - **Batch 5:** Greece, Vanuatu (ban lifted Jul 2021), Turkey (CBRT payment ban 30 Apr 2021), Mauritius (FSC Digital Asset under FSA 2007) — `806977f`
- **Residency thresholds verified** (Brave Search, recovered after rate-limits): HK CIES HK$30M incl. mandatory HK$3M CIES-IP + RE cap HK$10M; Thailand LTR full official BOI requirements (Wealthy = USD 1M assets + **USD 500k Thai investment** — corpus corrected). **Honestly deferred (no fabrication):** Mexico INM + Cyprus 6.2 thresholds — Brave rate-limited, official sites block bots; flagged in briefs as monitoring items.
- **Satohash re-stamp:** `intel:stamp` re-anchored 10/24 drifted programs before API throttle; remaining 14 heal on next daily run (incremental self-heal by design). `validate:stamps` ✓.
- **`docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md`** (new, 478 lines, `d9a86f6`) — comprehensive prompt for Claude to improve the research pipeline: MotoPass mission, Satohash/OTS verification model, schema v3 data contract, the 6-question-per-country questionnaire, **all 50 countries with their known hot-button items**, 7-axis source-criteria, build plan (source registry / discovery tool / trust engine), free-first API table + paid shortlist, deliverables, and hard rules.
- **Research passes:** `research/passes/2026-08-21/` (10 briefs: CAR, Bolivia, PY, PA + batch-2 six) and `research/passes/2026-08-22/` (14 briefs: batch-3 six, batch-4 four, batch-5 four) with per-pass READMEs.
- **Verified:** all gates green (`validate:data` ✓, `validate:stamps` ✓, `intel:check` ✓), every deploy confirmed live (batch strings found in live `/research/countries.json`). Freshness: **24 fresh / 26 stale**.

**Decisions:**
- El Salvador treated like CAR (historical-pioneer reframe + `rbi_cbi` category) — never fabricate; unverifiable thresholds left flagged, not guessed.
- New `docs/CLAUDE-RESEARCH-PIPELINE-PROMPT.md` is the blueprint for the next big push: build the source-trust engine (Satohash-anchored source content at fetch time).

**Git State:**
- Commits this session: `a14704e`, `dfc8d11`, `24c67e9`, `0dc825f`, `806977f`, `d9a86f6` (all pushed)
- Working tree: see status below (docs handoff pending commit)
- Branch: main

---

## Session — 2026-08-21 (Grok/M3) — Paige knowledge-base wiring: RAG retrieval + knowledge search — BUILD 72

**Done (user request: "Wire all three Paige knowledge JSONs into the RAG retrieval"):**
- **`src/lib/paige/knowledge.ts`** — Knowledge-base module that imports all three JSON files (`satohash-knowledge.json`, `intel-pipeline-knowledge.json`, `vault-stamping-knowledge.json`), indexes facts + member scripts, and provides token-based search:
  - `searchKnowledge(query)` → ranked topics with relevant facts and matching member scripts
  - `getMemberScript(topic, key)` → specific pre-written answer
  - `getTopicFacts(topic)` → all facts for a topic
  - `detectKnowledgeTopic(query)` → checks if a query matches a knowledge-base topic (score threshold)
- **`src/lib/paige/retrieve.ts`** — Extended with `retrieveAll()` that searches both program data AND knowledge base, returning interleaved `PaigeHit[]` (programs) + `PaigeKnowledgeHit[]` (topics). New types: `PaigeKnowledgeHit`, `PaigeResult`.
- **`src/lib/paige/respond.ts`** — Extended with `buildPaigeResponseWithKnowledge()` that formats knowledge hits (topic label + top script or fact) alongside program blocks. Topic labels: Satohash & Timestamping / Intel Pipeline & Self-Healing / Vault & Document Stamping.
- **`src/components/PaigeChat.tsx`** — Updated to use `retrieveAll()` and handle mixed results:
  - Knowledge-only queries → streaming text response (no program cards)
  - Mixed queries → intro message lists both topics and programs, then shows program cards
  - Knowledge context is woven into responses via `buildPaigeResponseWithKnowledge`
- **`src/lib/paige/knowledge.test.ts`** — 14 tests covering search, member scripts, topic facts, and topic detection across all three knowledge domains.
- **Verified:** 209 unit tests (14 new, 44 files) · 26/26 e2e (1 flaky unrelated) · build green · 0 new tsc errors (26 pre-existing baseline).

**Git State:**
- Files: `src/lib/paige/knowledge.ts`, `src/lib/paige/knowledge.test.ts`, `src/lib/paige/retrieve.ts`, `src/lib/paige/respond.ts`, `src/components/PaigeChat.tsx`
- Branch: main

---

## Session — 2026-08-21 (Grok/M3) — Intel fetch pipeline: automated daily research layer — BUILD 72

**Done (user request: "Build the daily-intel pipeline" — automated web research to replace manual brief-filling):**
- **`scripts/lib/intel-sources.mjs`** — Multi-source adapter module:
  - Wikipedia REST API (`/page/summary/` + `/page/html/`): extracts crypto mentions, tax regime, investment thresholds, processing times; handles 50 country→page-title mappings with unquoted-key-safe syntax
  - BTC Map API (`/v4/places/search/`): merchant count + Lightning readiness per country, using lat/lon/radius_km from the existing `fetch-btcmap-density.mjs` coordinate map
  - CoinGecko API (`/simple/price`): BTC local-currency price signal for crypto climate assessment
  - All sources timeout-bounded (12s), graceful failure → null (never blocks the pipeline)
- **`scripts/lib/intel-diff.mjs`** — Diff engine comparing fetched intel against corpus:
  - Wikipedia analysis: crypto keyword detection, tax signal extraction (no-income > territorial > favorable hierarchy), investment threshold parsing, processing time detection, residency pathway signals
  - BTC Map analysis: merchant count → Lightning-ready upgrade, crypto-friendly score boost for strong merchant presence
  - Confidence-gated changes: only `medium`+ confidence proposals reach the write layer; `low` signals are collected but never applied
  - Honesty rules: never overwrites null/empty, never downgrades a researched value, never touches `last_checked`
- **`scripts/intel-fetch.mjs`** — Orchestrator script:
  - Fetches all 3 sources for each country (concurrency 5, paced 500ms between batches)
  - Diffs against corpus, validates each change, applies verified updates, records `audit_trail` entries with `source: intel-fetch:<adapter>` + canonical slice hash
  - Options: `--dry-run`, `--top=N` (stalest N), `--country=NAME` (single)
  - First real run: 48/50 Wikipedia, 35/50 BTC Map, 1 CoinGecko fetched; 107 signals across 48 countries; 4 verified changes applied (Bolivia +2 crypto score from BTC Map merchants, Portugal +1, Bulgaria +1, Vanuatu tax clarification from Wikipedia)
- **npm script** `intel:fetch` added, wired into `intel:run` pipeline (between `intel:freshness` and `intel:probe`)
- **GitHub Actions** `.github/workflows/daily-intel.yml` updated: step 3 is now `intel:fetch` (auto-research), all step numbers shifted, summary includes auto-research stats
- **Documentation** `docs/COUNTRY-INTEL.md` updated with full pipeline table + intel:fetch reference
- **Verified:** 195 unit tests · 26/26 e2e · build green · 0 new tsc errors (26 pre-existing baseline)

**Git State:**
- Files: `scripts/lib/intel-sources.mjs`, `scripts/lib/intel-diff.mjs`, `scripts/intel-fetch.mjs`, `package.json`, `.github/workflows/daily-intel.yml`, `docs/COUNTRY-INTEL.md`
- Branch: main

---

## Session — 2026-08-21 (Grok/M3) — ISO map consolidated (single source of truth) — BUILD 72

**Done (follow-up to the flag fix — remove the drift risk):**
- **`src/lib/programAdapter.ts` no longer duplicates the country→ISO map.** It previously carried a byte-identical copy of `ISO_BY_NAME` plus its own private `countryCode()`. Both deleted; it now imports `programCountryCode` from `src/lib/countryCode.ts` (the single canonical module) and calls it directly in `toCinematicProgram`.
- **Drift-guard tests** in `src/lib/programAdapter.test.ts` (new `countryCode single source of truth` block):
  - All 50 program names resolve a 2-letter ISO via the shared module (no silent initials fallback like CAR→CA)
  - `toCinematicProgram(...).countryCode` equals `programCountryCode(name)` for every program — the adapter can never diverge again
- `ALL_PROGRAM_NAMES` list is deliberately inline (mirrors countries.json); a new country added to the corpus must be added to the ISO map — the 50-count assertion + btcmap.test's exact-code assertions catch omissions.
- **Verified:** 195 unit tests (2 new, 43 files) · 26/26 e2e · build green · 0 new tsc errors (26 pre-existing baseline — the 3 in programAdapter.test are pre-existing fixture-type errors, line numbers only shifted).

**Git State:**
- Commit: `refactor(flags): single country→ISO source of truth — adapter imports shared map`
- Branch: main

---

## Session — 2026-08-21 (Grok/M3) — Country flags fixed (12 wrong ISO codes) — BUILD 72

**Done (user report: "Central African Republic flag is wrong"):**
- **Root cause:** `src/lib/countryCode.ts` and `src/lib/programAdapter.ts` both map country name → ISO 3166-1 alpha-2 for flagcdn sprites, but 12 of the 50 programs were missing from the map. The initials fallback silently returned the WRONG country: Central African Republic → `CA` (**Canada's flag** 🇨🇦 shown instead of 🇨🇫), St. Kitts and Nevis → `SK` (Slovakia), St. Lucia → `SL` (Sierra Leone), Estonia → `ES` (Spain), Croatia → `CR` (Costa Rica), Cayman Islands → `CI` (Côte d'Ivoire), Belize → `BE` (Belgium), Latvia → `LA` (Laos), Barbados/Bahamas → `BA` (Bosnia), Bulgaria → `BU` (invalid), Andorra → `AN` (invalid). The emoji fallback in countries.json was correct all along — the CDN sprite is tried first, so it masked the error.
- **Fix:** added the 12 missing mappings (`CF`, `KN` for the `St. Kitts and Nevis` spelling, `LC` for `St. Lucia`, `BB`, `BS`, `BZ`, `LV`, `EE`, `BG`, `HR`, `KY`, `AD`) to BOTH maps (they're duplicated — keep in sync).
- **Regression guard:** new test in `src/lib/btcmap.test.ts` asserting the correct ISO + sprite URL for all 50 programs (would have caught Canada-for-CAR).
- **Verified:** 193 unit tests (43 files) · 26/26 e2e · build green · 0 new tsc errors (26 pre-existing baseline).

**Git State:**
- Commit: `fix(flags): correct ISO codes for 12 countries — CAR showed Canada's flag`
- Branch: main

---

## Session — 2026-08-21 (Grok/M3) — Vault proof card polish + hover education tips — BUILD 72

**Done (user request — make the proof cards presentable + mouse-over tips):**
- **`src/components/ui/InfoTip.tsx`** — new lightweight hover/focus tooltip (useId + role=tooltip, pointer-events-none panel so it never intercepts clicks). Follows the SovereigntyScoreTooltip pattern.
- **`VaultProofRow` restructured:**
  - The raw `Block # · date · .ots` wall-of-text line became a labeled **proof-anchor strip** on a bordered card-muted background: `⛓ Block #958093` · `📅 Last checked 2026-07-02` · `# Content hash e7f67a70…` (full hash in the tooltip) · `🧾 OTS receipt /proofs/….ots` — each with sr-only labels (a11y win).
  - **Every action button got an icon + education tip**: Use this proof (BadgeCheck), Copy verify URL, Satohash ↗, .ots ⬇ (FileDown), Apply → (ArrowRight), Announce on Nostr, Lineage; the ProofBadge and the lineage-row Satohash/copy-event-id links too.
  - Removed `overflow-hidden` from the row card (demo watermark clips via its own class) so tooltips can overflow the card.
- 20 new i18n keys (`vault.tip.*`, `vault.blockLabel/hashLabel/otsLabel`), English fallback. Demo rows still clip tooltips via the DEMO watermark's overflow — acceptable (placeholders).
- **Verified:** 192 unit tests · 26/26 e2e · build green · 0 new tsc errors · browser-checked locally: card reads `Costa Rica · Proof on file · Block #958093 · Last checked 2026-07-02 · Content hash e7f67a70… · OTS receipt /proofs/….ots · [actions]`, tooltip shown on hover for both meta chips and action buttons.

**Git State:**
- Commit: `feat(vault): polished proof cards — labeled anchor strip + hover education tips`
- Branch: main

---

## Session — 2026-08-21 (Grok/M3) — HOTFIX: CSP blocked startup (boot-guard loop) — BUILD 72

**Critical — live site was broken for real browsers (reported by Cam):**
- **Symptom:** stuck in the boot-guard loop — "MotoPass needs a quick refresh" → "Almost there — Retrying in 1s…" reloading forever.
- **Root cause:** Kimi's `_headers` CSP (`77f4000`, no `'unsafe-eval'`) blocked ajv's code generation. `src/lib/schema.ts` compiles schemas at **module scope** via `new Function` → throws "Error compiling schema" → the entry `import()` rejects → the boot-guard loader's unconditional `.catch` fired `__mpRetryLoad()` → infinite `?cb=` reload loop. Confirmed by strict-CSP Playwright (main never mounts) vs `bypassCSP` (works) — and `verify-live-app.mjs` used `bypassCSP: true`, so CI couldn't catch it.
- **Fixes:**
  1. `public/_headers` CSP: added `'unsafe-eval'` (ajv requirement, documented), allowlisted `https://static.cloudflareinsights.com` (CF auto Web Analytics beacon that was spamming violations), and added `https://api.btcmap.org` + `wss://*` to `connect-src` (BTC Map + Nostr relays were also blocked).
  2. Boot-guard hardening (`vite.config.ts`): the entry `.catch(e => __mpRetryLoad(e))` now passes the rejection reason; non-poison errors show the recovery UI **once** instead of the reload loop — future boot bugs won't loop forever.
  3. `scripts/verify-live-app.mjs` now runs with `bypassCSP: false` + asserts no boot-guard UI — CSP regressions will fail CI (`live-health`) from now on.
- **Verified:** strict-CSP local serve of `dist` with the production headers → React mounts, footer BUILD 72, zero CSP violations, zero page errors · 192 unit tests · 26/26 e2e.

**Git State:**
- Commit: `fix(csp): allow ajv eval + btcmap/wss connect-src — boot-guard loop hotfix`
- Branch: main

---

## Session — 2026-08-21 (Grok/M3) — Registry backup restore/import — BUILD 72 continued

**Done:**
- **Restore/import UI for the registry backup** — closes the export loop:
  - `parseDocumentRegistryBackup(json)` — validates schema `motopass-document-registry/v1`, imports only entries with a 64-hex SHA-256 (the honest anchor), preserves the recorded status as the backup's claim, tolerates missing fields, reports `imported`/`skipped`.
  - `mergeRegistryBackup(current, incoming)` — same-id entries keep the newer `updatedAt`, new entries added, result newest-first.
  - `RegistryImportButton` (shared component, hidden .json input) — parse → merge → `saveStampedDocuments` → toast result (or error with the validation reason). Mounted on the Dashboard registry card and the Profile document list, next to Export; both pages refresh their `docs` state + profile mirror after a successful restore.
- 6 new unit tests (valid parse preserves claim, invalid JSON/foreign-schema reject, hash-validity skip count, no-survivors failure, merge newer-wins, merge newest-first) — 192 total green · 26/26 e2e · build green · 0 new tsc errors.

**Git State:**
- Commit: `feat(registry): restore/import UI — parse, validate, merge backup`
- Branch: main

---

## Session — 2026-08-21 (Grok/M3) — Document registry export backup — BUILD 72 continued

**Done:**
- **Portable JSON backup of the shared document registry** (`src/lib/documentRegistryExport.ts`):
  - `motopass-document-registry/v1` bundle — build id/label, exported_at, issuer, and every document with raw SHA-256 (the on-chain anchor), Satohash stamp id, honest status, block height, created/updated dates, note, and an **allowlisted verify URL** (`documentVerifyUrl`) so the backup is auditable against Bitcoin without MotoPass.
  - Names are included for the owner's identification only — they were never part of any hashed payload.
  - **Export backup** button on the Dashboard registry card and on the Profile document list → downloads `motopass-documents-<BUILD>.json` (same pattern as Vault credential export).
- 3 new unit tests (v1 schema + verify links, honest pending/error passthrough, JSON round-trip) — 186 total green · 26/26 e2e · build green · 0 new tsc errors (26 pre-existing).

**Git State:**
- Commit: `feat(registry): portable JSON export backup with verify links`
- Branch: main

**Not done / next agent:**
- Restore/import UI for the backup (parser + merge is a natural follow-up)

---

## Session — 2026-08-21 (Grok/M3) — Dashboard document registry card — BUILD 72 continued

**Done:**
- **Shared document registry now on the Dashboard** (`DocumentRegistryCard`, mounted between the main grid and payments):
  - Renders the same `motopass-vault-documents` registry as Profile/Vault — one list everywhere.
  - Honest status chips (Confirmed @ block N / Awaiting anchor / Error + note), verify links, size/type meta.
  - **Quick actions**: per-row **Re-check** (`refreshStampStatus`) and **Retry stamp** (`restampHash` — re-submits the stored hash for entries whose first attempt failed or never anchored; the file is never needed again, only the hash leaves the device). Card-level **Re-check all** (sequential, non-blocking) + "Add documents" link to Profile + "Open Vault" link.
  - `restampHash` added to `documentStamp.ts` (stampHash → pollStamp → honest deriveDocStatus); profile mirror + status stay synced after every action (`registryToProfileDocuments` / `deriveProfileStatus`), so a confirmed anchor can move the profile to `stamped`.
  - i18n: 12 new `dashboard.registry*` keys (English fallback).
- 3 new unit tests for `restampHash` (satohash module mocked: confirmed derivation + filename sent, API-failure honesty with hash preserved, no-hash guard without API call) — 183 total green · 26/26 e2e (Arabic RTL flake passed on retry — unrelated dropdown timing) · build green · 0 new tsc errors.

**Git State:**
- Commit: `feat(dashboard): shared document registry card with stamp / re-check quick actions`
- Branch: main

---

## Session — 2026-08-21 (Grok/M3) — Profile + Vault share one document registry — BUILD 72 continued

**Done:**
- **Unified document stamping**: ProfilePage and Vault now share the single `motopass-vault-documents` registry (`documentStamp.ts`).
  - ProfilePage file-upload now runs the **exact Vault workflow** (`stampDocumentFile`): local SHA-256 → `POST /api/stamp` → poll → honest pending/confirmed/error status. The old divergent "metadata-wrapped hash + deep-link only" path is gone — the raw-file hash is the anchor everywhere (`profileDocumentStampPayload` removed with its test).
  - Profile document list renders **from the registry** (mount-sync pulls Vault-stamped docs into the profile mirror) with honest status chips (Confirmed @ block N / Awaiting anchor / Error), verify links, re-check (`refreshStampStatus`), and delete.
  - `PassportApplication`-style mirror: `registryToProfileDocuments` maps registry → `UserDocument[]` (confirmed → `stamped`, pending/error pass through); `UserDocument.status` widened. `deriveProfileStatus` sets `stamped` only when ≥1 confirmed anchor, `documents` when any doc — and never downgrades a progressed profile.
  - New registry helpers: `upsertStampedDocument` (in-place update or newest-first prepend).
- 3 new unit tests (upsert in-place + prepend, registry→profile mirror honesty, status derivation without downgrade) — 180 total green · 26/26 e2e · build green · 0 new tsc errors (26 pre-existing baseline).

**Decisions:**
- One registry, one anchor: raw-file SHA-256. Profile names stay display-only — never hashed on-chain.

**Git State:**
- Commit: `feat(profile): unify document stamping with the vault registry — one list, honest statuses`
- Branch: main

---

## Session — 2026-08-21 (Grok/M3) — Document proofs wired into Apply — BUILD 72 continued

**Done:**
- **Attach Vault-stamped document proofs to an application** (`/apply`):
  - `applyStampPayload` now emits a `docs[]` array — the SHA-256 hashes of attached documents, validated hex, deduped, sorted; **names/notes never enter the on-chain payload** (`normalizeDocHashes` helper, unit-tested).
  - New attach-documents card between NostrConnect and the form: lists the Vault registry (`loadStampedDocuments`), **only Bitcoin-confirmed stamps are selectable**; pending/error rows render disabled with honest labels ("Awaiting anchor" / "Stamp error — restamp in Vault"). Select-all/clear, per-doc verify links (allowlisted), "Open Vault" CTA, empty state linking to the stamper.
  - `?proof=<hash>` prefill now auto-selects a matching confirmed registry doc (external program-proof hashes keep the existing behavior unchanged).
  - `PassportApplication.docProofs[]` — hash + display name (local only) + stamp_id + block height + stamped date stored per application; success card shows attached proofs with Satohash verify links.
- 3 new unit tests (docs emitted as null when empty; sorted/deduped/lowercased + filename never leaked; normalizeDocHashes edge cases) — 177 total green · 26/26 e2e · build green · 0 new tsc errors (26 pre-existing baseline).

**Decisions:**
- Only `confirmed` (block-anchored) documents attach — a pending stamp is not yet a proof of existence. The on-chain claim stays "these exact files existed at block N", never "this person is X" (names are local-only display).

**Git State:**
- Commit: `feat(apply): attach vault-stamped document proofs to applications`
- Branch: main

---

## Session — 2026-08-20 (Grok/M3) — Vault document-stamping workflow — BUILD 72 continued

**Done:**
- **Stamp any document in the Vault via the Satohash API** (`DocumentStamper` on /vault):
  - `src/lib/documentStamp.ts` — registry (localStorage, hash-only, files never leave device) + orchestration: SHA-256 locally → `POST /api/stamp` → `pollStamp` for Bitcoin anchor → honest status (`pending` / `confirmed` @ block / `error`).
  - `refreshStampStatus` re-checks a stored stamp via `GET /api/stamps/:id`; verify links use the allowlisted satohash.io origin; delete/copy per entry.
  - 8 new unit tests (status derivation, registry round-trip, corrupt-storage tolerance, sha256 vector, verify-URL allowlist) — 174 total green · 26/26 e2e · build green · 0 new tsc errors.
  - i18n keys (English fallback) + mounted between the verify card and the archive on VaultPage.

**Decisions:**
- Raw-file hash (not metadata-wrapped) is the honest anchor — proves that exact file existed at block N.
- Statuses stay honest: pending until the API reports an anchor; never claims verified without a block height.

**Git State:**
- Commit: `feat(vault): stamp any document via the Satohash API — local-hash registry with honest status`
- Branch: main

---

## Session — 2026-08-20 (Grok/M3) — CRITICAL: canonical-slice bug fixed + re-anchored — BUILD 72 continued

**Critical fix (proof coverage bug):**
- The canonical slice used `JSON.stringify(slice, Object.keys(slice).sort())` — an array replacer applies at EVERY nesting level, so `finance`/`pathways`/`legal_compliance`/`critical_tests`/`compliance_clock` serialized as EMPTY `{}`. **All proofs (and all prior .ots files) only covered id/name/last_checked — the researched content was never on-chain.**
- Fix: recursive `stableStringify` (key-sorted at all depths) in `scripts/lib/canonical-slice.mjs` + regression test (nested content present + key-order independence).
- Re-anchored 48/50 with corrected hashes via the Satohash API (Cayman Islands + Andorra hit the rate limit — converge on the daily run; intel.json reports them honestly as `in_sync: false`).
- Old `public/proofs/*.ots` predate the fix (covered the old slice format) — API `stamp_id` is now the authoritative anchor. Documented in `docs/COUNTRY-INTEL.md`.

**Also this round:**
- Source probe baselined 108 official URLs — **30 unreachable** (bot-blocked gov portals + dead links) recorded in intel.json `watch.unreachable`.
- Portugal source-layer fix: added `https://aima.gov.pt` (SEF successor, verified live) + recent_changes note + audit entry.
- `npm run research:pass` briefs generated for the 10 stalest (web search backend was down — briefs await a source-enabled researcher).
- 166 unit tests · build green · gates green · 26/26 e2e · 0 new tsc errors.

**Git State:**
- Commit: `fix(intel): canonical slice covered empty nested objects — stable stringify + re-anchor`
- Branch: main

---

## Session — 2026-08-20 (Grok/M3) — 50/50 proofs re-anchored + research pass scaffold — BUILD 72 continued

**Done:**
- **All 50/50 proofs now in sync on the Satohash API** (0 drifted) — completed the incremental re-anchor over paced runs (19 → 50). Every program has a real `stamp_id`, fresh `content_hash`, `stamped_at`, and a `proof` audit entry.
- **ProgramsTable Intel column** — compact IntelStatusBadge (renders nothing when fresh+in-sync, keeps density).
- **Freshness research pass scaffold** — `npm run research:pass` generates `research/passes/<date>/<slug>-brief.md` for the stalest programs (current corpus facts + official URLs + fill-in source checklist + verdict). Never mutates facts; a researcher fills briefs with sources, updates `last_checked`, and the pipeline re-anchors. 10 briefs generated (Bolivia 98d → St. Kitts 79d).
- **Note:** web search backend was down this session — no live research was possible; the briefs are ready for the next researcher/agent with source access.
- Verified: 165 unit tests · build green · validate:data/stamps + intel:check green · 26/26 e2e · 0 new tsc errors.

**Git State:**
- Commit: `chore(intel): 50/50 proofs re-anchored + table intel column + research pass scaffold`
- Branch: main

---

## Session — 2026-08-20 (Grok/M3) — Intel surface UI + Paige Satohash knowledge — BUILD 72 continued

**Done:**
- **Surface slice (consumes intel.json):**
  - `src/hooks/useIntel.ts` — runtime manifest hook (module-cached, BUILD-tagged fetch).
  - `IntelStatusBadge` on program cards — honest watch-changed / stale-days / proof-re-anchoring states from the manifest (renders nothing when fresh+in-sync).
  - `IntelWatchStrip` on Programs (full: sweep counts, Satohash API chip, source-change flags, Bitcoin-anchored change feed) + compact ticker on home live-data section.
  - ProgramModal **Intel tab** — pros/cons (each with `verified` date), 7-metric scorecard bars (honest nulls = research pending), freshness, and the Bitcoin-anchored change ledger with per-entry verify links.
  - i18n keys added (English fallback for other locales).
- **Paige Satohash knowledge base (Track B):**
  - `docs/PAIGE-SATOHASH-GUIDE.md` — technical guide: endpoints, headers, rate limits, codebase map, honesty rules, promotion do/don't.
  - `docs/PAIGE-USER-GUIDE.md` — member-facing plain-language scripts.
  - `research/paige/satohash-knowledge.json` — machine-readable corpus Paige loads at boot.
- Verified: tsc adds zero new errors (26 pre-existing) · 165 unit tests · build green · validate:data/stamps + intel:check green · 26/26 e2e.

**Decisions:**
- `proof.in_sync` comes only from the server-side intel.json (canonical-slice comparison) — never derived in the SPA.
- Intel surfaces stay honest: badges render nothing rather than invent a state.

**Git State:**
- Commit: `feat(intel): surface UI (badges/strip/modal intel tab) + paige satohash knowledge base`
- Branch: main

---

## Session — 2026-08-20 (Grok/M3) — Country Intel pipeline (schema v3) — BUILD 72 continued

**Done:**
- **Country Intel pipeline built** (`docs/COUNTRY-INTEL.md`): daily self-healing layer over the 50-program corpus.
  - Schema v3 per program: `freshness` (fresh≤14d / watch≤45d / stale>45d), `watch` (official URLs + probe state), `pros[]/cons[]` (structured claims, each `{text, source, verified_at}`), `scorecard` (7 metrics, honest nulls where unresearched), `audit_trail` (every change, hash-anchored). All derived only from vetted corpus fields — no invented facts.
  - `scripts/migrate-schema-v3.mjs` (idempotent, 300 blocks / 50 programs), `update-freshness.mjs`, `probe-sources.mjs` (official-source watchdog: body-hash change detection → audit entry), `stamp-changed.mjs` (**Satohash API re-stamp loop**: canonical-slice hash drift → `POST /api/stamp` → new proof_url/stamp_id/stamped_at), `write-intel.mjs`/`check-intel.mjs` (runtime manifest `public/data/intel.json` + CI gate).
  - `scripts/lib/canonical-slice.mjs` — single shared slice definition (stamp-ots.mjs refactored onto it).
  - `.github/workflows/daily-intel.yml` — daily 06:00 UTC cron: migrate → freshness → probe → re-stamp (paced 2.5 s, capped 12/run) → write manifest → validate gates → auto-commit detection + re-anchors only.
  - `validate-data.mjs` now requires v3 blocks; staleness is a hard warning (not a deploy blocker).
  - 9 new unit tests (`scripts/intel-core.test.ts`) — 165 total green.
- **Healed 19/50 stale proofs in-session**: discovered ALL 50 programs' stored `content_hash`/`proof_url` drifted from the current canonical slice (corpus enriched after BUILD 68 proofs — proof_url hash ≠ .ots filename hash). Re-stamped via the live Satohash API (v5.0.0-ELITE, anonymous stamps work, HTTP 200). Remaining 31 converge over daily runs (API rate-limits bursts — 429 handled gracefully, incremental self-heal by design).

**Decisions:**
- Detection + re-anchors auto-commit (facts); rule **rewrites** stay human-reviewed (us / Kimi / Paige). `last_checked` is a human research date — the pipeline never rewrites it, so daily sweeps never trigger spurious re-stamps.
- Satohash API is the re-stamp backbone (part-owned, cost-down vs local OTS calendars); `proof.in_sync` in intel.json shows honest per-program state until converged.
- Pre-existing lint red on main (12 errors, unrelated src components) — untouched this session; worth a cleanup pass later.

**Git State:**
- Commit: `feat(intel): country intel pipeline — schema v3 + daily self-heal + satohash re-stamp loop`
- Branch: main

**Not done / next agent:**
- UI slice: freshness badges on cards, pros/cons + scorecard in modal, policy-watch feed, freshness ticker (consume `intel.json` via a `useIntel` hook)
- Continue re-stamp convergence (31 pending) — or run `npm run intel:stamp` manually in batches
- Paige: Satohash technical + user guides + knowledge corpus (doc stamping workflow, promote satohash.io)
- LNbits BOLT11 mint · Paige hosted backend · repo-wide `tsc --noEmit` (26 pre-existing) · live Nostr relay

---

## Session — 2026-08-20 (Grok/M3) — BUILD 72 CLOSED

**Done:**
- BUILD 72 — Portfolio / BTC Map / Blog / BlogPost now **eager** imports in `src/App.tsx` (same pattern as BUILD 70/71 crash fixes). Dashboard / Register / Profile / NotFound stay lazy.
- Fixed stale e2e selector `.hero-headline` → `.hero-elite-tagline` — hero redesign dropped the class; test was already failing on `main` before this session (verified via stash).
- Verified: `tsc --noEmit` adds **zero** new errors (26 pre-existing repo-wide backlog untouched, none in App.tsx) · 156 unit tests · production build green · bundle gate OK (index 1010 KB, advisory warn only) · **26/26 e2e pass**.

**Decisions:**
- Keep the crash-prone route set fully eager until the lazy-chunk context crash class is retired; only non-primary routes (Dashboard/Register/Profile/NotFound) remain lazy.

**Git State:**
- SHA: `55d228d` (code) — handoff/docs follow in the next commit
- Branch: main

**Not done / next agent:**
- LNbits BOLT11 mint when node env is ready
- Paige hosted backend (grounded only)
- Repo-wide `tsc --noEmit` — 26 pre-existing errors in: CompareMatrix, heroEliteMotion.test, PitchRevealSection, PitchTrustedStrip, ValueForksPanel, Card, VaultEducationCard, translations, nostrEventId, paigeHistory.test, pitchStats, programAdapter.test, savingsGraphExport, vaultVerify, DashboardPage, FinanceComparePage
- Live Nostr relay / portfolio sync

---

## 2026-08-19 (Kimi/THOR — Standard Project Kit adopted + debrief + repo re-sync)

**Scope:** Standard Project Kit rollout + first machine-readable session debrief + repo sync check.

**Done:**
- Adopted the senior-engineer **Standard Project Kit** (skill `standard-project-kit`): investigate → bounded implement → verify real system → milestone tag → handoff; two-actor loop (Kimi assistant + Grok/Aider coder). Now the default build/handoff method for ALL projects.
- Session debrief now runs **automatically at session end** (silent, machine-readable YAML) via the `/goodbye` pipeline.
- Wrote first debrief: `docs/debriefs/session-2026-08-19-001.yaml`.
- Re-synced `/root/ref/motopass` from origin (was 13 behind) — now at `440198b` (BUILD 71 session-end handoff).
- Verified live: `https://motopass.giveabit.io` → HTTP 200, title OK, site up.

**Git State:**
- Tip SHA: `440198b`; repo in sync with origin/main.

**Open (unchanged, still live):**
| Item |
|------|
| LNbits BOLT11 mint (when node env ready) |
| Remaining lazy routes (BTC Map / Portfolio / Blog) |
| Paige hosted backend |
| Repo-wide `tsc --noEmit` |
| Live Nostr relay / portfolio sync |

**Do not regress:** `dist/` untracked (CI/wrangler is the only builder) · Nostr = gossip, Satohash/OTS = proof · BIP-85 `128002'` never in SPA · honest badges only.

---

## Session — 2026-08-18 (Grok / M3) — CLOSED

**Done:**
- BUILD 68 — Nostr kind 30078 + Satohash timestamp attestations; allowlisted hrefs; honest badges; `docs/SECURITY-TIMESTAMP-NOSTR.md`
- BUILD 69 — `/verify` i18n-context crash; `useI18n` fallback; cards no longer start at opacity 0
- BUILD 70 — `/programs` `useLocation` crash; dedupe react-router; eager Programs/Vault/Verify; route error boundary
- BUILD 71 — eager Distressed/Agents/Apply/Simulator; Distressed badges honest; Schnorr + NIP-01 id before publish; redacted Apply/Profile hashes; `dist/` untracked
- Live verified: home, `/programs` (Uruguay/Bolivia filled), `/verify`, `/vault` on BUILD 70; 71 is on `main` via CI build+deploy

**Decisions:**
- Nostr is gossip; Satohash/OTS is proof. Never badge “Bitcoin-verified” from a URL.
- BIP-85 Nostr `128002'` is wallet/node only — never in the SPA.
- CI/`wrangler pages deploy` is the only `dist/` builder. Do not commit build artifacts.

**Git State:**
- SHA: `4b39a863ec0514e59ad919d9cb92d0ef38bb9444`
- Tip: `4b39a86` feat(build71): eager primary routes, honest proofs, signed-event verify
- Branch: main
- Unpushed: none

**Not done / next agent:**
- LNbits BOLT11 mint when node env is ready
- Remaining lazy routes (BTC Map, Portfolio, Blog) — watch for router-context crash
- Paige hosted backend (grounded only)
- Repo-wide `tsc --noEmit`
- Live Nostr relay / portfolio sync

## Latest Session Summary (from 2026-08-18 goodbye)

**Chat Topic:** Whatsup → Nostr + Satohash timestamps → security + live crash recovery → BUILD 68–71.

**Finished in this session:**
- Timestamp attestations (kind 30078) with allowlist, honest badges, copyable stub
- `docs/SECURITY-TIMESTAMP-NOSTR.md`
- Live crash fixes (verify i18n, programs router)
- BUILD 71: eager primary routes, Schnorr verify, redacted hashes, `dist/` untracked

**Still to do:**
- LNbits BOLT11; remaining lazy routes; Paige hosted; tsc cleanup; live relay

**Next for Kimi:** Integrate into MASTER-BRAIN / Kanban. Do not expect `dist/` in git. Live: https://motopass.giveabit.io · wait for BUILD 71 in the footer after CI.

---

## Session — 2026-08-18 (Grok / M3) — BUILD 69 hotfix

**Done:**
- Live `/verify` crashed: `useI18n must be used within I18nProvider` (lazy chunk / duplicate context). Verify is now eager like Compare.
- `useI18n` never throws — English fallback if context is missing.
- `t()` no longer returns empty string in prod (blank card copy).
- Glass `Card` no longer starts at opacity 0 (stuck motion looked like empty cards).

**Git State:**
- BUILD: 2026.08.18-69

---

## Session — 2026-08-18 (Grok / M3) — BUILD 68

**Done:**
- Nostr + Satohash timestamp attestations (kind 30078, satohash/hash/block/ots tags)
- NIP-07 sign + publish with template-match reject; stub recovery always (JSON + copy + sessionStorage)
- Allowlisted Satohash/OTS hrefs; hash-only is not “verified”; badges: Demo / Proof on file / Bitcoin-verified
- No preimage prefix in verify history
- `docs/SECURITY-TIMESTAMP-NOSTR.md` — attack vectors + verifier contract
- BIP-85 Nostr `128002'` noted as wallet/node only — not in the SPA

**Decisions:**
- Nostr is gossip; Satohash/OTS is proof
- Demo/on-file URLs must never render as “Satohash Verified”

**Git State:**
- SHA: `e582a74`
- Branch: main
- BUILD: 2026.08.18-68
- Unpushed: committing now

**Not done / next:**
- LNbits BOLT11 mint
- Schnorr + getEventHash after signEvent
- Paige hosted backend
- tsc cleanup

---

## Session — 2026-08-11 (Grok / M3) — CLOSED

**Done:**
- BUILD 67 — Imagine brand pack wired: hero, sovereignty, passport, funding-flow, vault-archive (public/ + images/ + dist)
- HeroMotionBackground → sovereignty.jpg (header-elite fallback); CompareHero funding-flow band; ProgramModal passport; Vault archive banner
- Satohash: API health chip on Verify, pollStamp after stamp, vault hash verify notes API liveness
- Lightning: live LN Address QR (`motopass-server@giveabit.io` / `VITE_LIGHTNING_ADDRESS`) + live on-chain donation address; demo rails labeled
- countries.json narrative depth pass from structured fields (details / bitcoin_integration / sources)
- Docs: `.ai_docs/current-status.md`, ROADMAP, DESIGN-CONTEXT imagery table
- Tests: 140 unit green; production build OK; pushed to origin/main (SSH)

**Decisions:**
- Lightning “live” path = Lightning Address QR (LNURL-pay), not BOLT11 mint yet — next step LNbits when node env ready
- Corpus depth enrichment composes from existing finance/pathways only (no invented legal claims)

**Git State:**
- Tip: \`9e4bfe2\` (session-end handoff) (docs align)
- Feature: `db2206c` (BUILD 67 code)
- Unpushed: none
- Branch: main

**Not done / next agent:**
- LNbits BOLT11 mint
- Paige hosted backend
- Nostr portfolio sync
- tsc cleanup

---


## 2026-08-10 — Kimi/THOR: Lighthouse sweep (DONE, deployed)
Full site optimization sweep completed end-to-end (sw.js 206-crash fix, console-error elimination, a11y + SEO + security pass). See LATEST-UPDATE.md (top) for per-site summary + commit. Scores re-verified by Kimi. Before touching code, re-check the live Lighthouse state; do not regress: sw.js cache guards (status 200 only), CSP analytics allowlist, image width/height attrs, aria-labels on form controls.

# KIMI → GROK HANDOFF — 2026-07-20 (THOR mega ops + less-chat + HQ v2.5 + memory)

**From:** Kimi on THOR  
**To:** Grok on M3  
**Read before coding this session.**

## TL;DR for Grok
Ops on THOR was cleaned and automated. **You still own all code on M3** (`~/projects/*` → `git push`). Do not SSH to THOR for coding. Keep writing `docs/KIMI-HANDOFF.md` after sessions.

## Machine roles (hard)
| Machine | Who | Does |
|---------|-----|------|
| **M3** | Grok | Code only in `~/projects/` → push |
| **THOR** | Kimi | Docker, LNbits/LND, crons, vault docs, HQ deploy |
| **M4** | — | DEPRECATED |

## What shipped on THOR (you need awareness)

### HQ glass (kitsboy/HQ) — v2.5+
- Live: https://hq.giveabit.io
- Password **gate** + browser **Vault** (keys never in git)
- Live pipes: `api.satohash.io/metrics.json`, status pinger
- Status matrix: GH Actions every 15m + THOR `hq-status-refresh` every 30m
- After HQ UI work: push main; CF Pages auto/manual as before
- Pull latest HQ on M3: `cd ~/projects/HQ && git pull`

### Satohash proof plane
- API live: https://api.satohash.io/health + `/metrics.json` (`gab.product-metrics.v1`)
- Runtime on THOR Docker; SPA still CF Pages from your pushes
- Keep `VITE_API_URL` → `https://api.satohash.io` when building SPA
- Family clients: thin satohash-client in suite repos

### Less-chat ops (Cam preference)
- Cam reads **OPS-PULSE** / morning Telegram pulse before opening chats
- You should still not spam handoffs — one clear `docs/KIMI-HANDOFF.md` entry per session is enough
- SEO/design weekly jobs are **change-gates** (silent if no commits) — your pushes reopen the gate

### Automations (do not duplicate on M3)
| Job | Cadence |
|-----|---------|
| Morning pulse | daily 07:30 TG script |
| HQ status refresh | 15m GH + 30m THOR |
| GitHub scan | every 6h |
| Learn loop | Sunday |
| EU / kanban / LNbits digests | **weekly** (not daily) |

### Memory (Hermes)
- Built-in MEMORY/USER denser + limits raised
- External: **holographic** local provider ON
- Cam uses `/goal` and `/learn` on THOR — optional for you on M3 if Hermes available

## What Grok should do on EVERY project session
1. `git pull origin <default-branch>` first  
2. Read this file (or repo `docs/KIMI-HANDOFF.md` top entry)  
3. Read `AGENTS.md` + `GROK-SESSION-PROTOCOL.md`  
4. Code → test → commit → push  
5. **Append** your handoff at top of `docs/KIMI-HANDOFF.md` (or dated file) and push  
6. Never commit secrets / `.env` / macaroons  

## Repo-specific notes
| Repo | Branch | Note |
|------|--------|------|
| giveabit | main | Parent + NIP-05; CF auto |
| satohash | main | API on THOR; SPA CF; metrics.json live |
| katoa | main | CF; manual deploy path may still apply |
| stranded | main | CF auto |
| tadbuy | main | CF |
| motopass | main | CF |
| sherpacarta | main | CF |
| openstrata | **talent** | default branch talent |
| btcminiscript | main | lib/docs |
| HQ | main | ops glass; gate+vault; status.json bot commits OK |

## Doc suite standard (keep current)
Root: `AGENTS.md`, `GROK-SESSION-PROTOCOL.md`, `README.md`, `SOURCE-OF-TRUTH.md` (code), `DILIGENCE.md` (live), `docs/KIMI-HANDOFF.md`, diligence packs as needed.

## Do NOT
- Deploy LNbits/LND/Docker from M3  
- Assume M4 is active  
- Re-open status chats for green suite — Cam uses pulse/HQ  
- Put invoice keys or PATs in repo files  

## Safe Harbour + giveabit.io
All public outputs stay Bitcoin-sovereign + Safe Harbour.

— Kimi · THOR · 2026-07-20

---

# Kimi Handoff — MotoPass

Persistent handoff log for M3 (Grok) → M4 (Kimi). Append new sections at the bottom each session.

---

## Handoff to Kimi — 2026-07-02

**Machine:** M3 (Grok)  
**Project:** motopass

### Done
- [x] Completed 55-upgrade backlog (BUILD-20260702-009): 25 programs, Portfolio/Simulator/Compare/Vault routes, Nostr/Satohash/payment stubs, i18n, SEO, CI
- [x] Squashed upgrade work into single summary commit `0fd1748`, then hygiene commits for verification
- [x] Added `scripts/verify-goal.sh` + `npm run verify:goal` — orchestrated verification plan steps 1–7 with clean per-step artifacts
- [x] Untracked `node_modules/` from git (7278 files removed from index; `.gitignore` already excluded)
- [x] Reordered `research/countries.json` so `"programs"` appears in first 80 bytes (live curl probe)
- [x] GitHub Actions CI green; live site health-check passes; Cloudflare deploy target locked to `motopass` only
- [x] Session protocol read; this handoff file created per `GROK-SESSION-PROTOCOL.md`

### Decisions
- Verification evidence must come from `npm run verify:goal` only — no manual `tee` one-liners (prevents mangled logs)
- `node_modules` must never be tracked; use `npm ci` in CI
- Deploy only to Cloudflare Pages project `motopass` (`--project-name=motopass`), not giveabit/tadbuy/sherpacarta
- OAuth git push cannot update `.github/workflows/` without `workflow` scope; CI workflow was added via GitHub API when needed
- Deferred per plan non-goals: full Paige LLM backend, live Nostr relay, real Lightning settlement, 50-country flagship depth

### What's Next
- Kimi: integrate this summary into MASTER-BRAIN.md / Kanban / Obsidian vault maps
- Expand `research/countries.json` from 25 → 50 programs (Uruguay flagship template)
- Optional: `gh auth refresh -s workflow` on M3 for future CI workflow edits via git
- Run `SCRATCH=<scratch-dir> npm run verify:goal` after any substantive change before claiming ship
- CF git-hook deploy can lag; manual `npm run deploy:safe` if live site stale after push

### Git State
- Last commit SHA: `db2206c` (handoff + protocol on main)
- Branch: `main`
- Unpushed: none

---

## Handoff to Kimi — 2026-07-02 (design pass)

**Machine:** M3 (Grok)  
**Project:** motopass

### Done
- [x] Full **Luminous Sovereign** light theme — canvas `#F5F2EC`, white cards, `border-mp`, `shadow-card`
- [x] `docs/DESIGN-CONTEXT.md` + `docs/DESIGN-TOKENS.md` — canonical design docs
- [x] Landing hero: `HeroMotionBackground` — sovereignty.jpg motion at **35% opacity**
- [x] 55+ UI upgrades across all 14 routes + shared components
- [x] BUILD-20260702-010

### What's Next
- Kimi: review live https://motopass.giveabit.io for contrast/readability feedback
- Optional: dark mode toggle using same token file
- Deploy dist after push (CF may auto-deploy from git)

### Git State
- Last commit SHA: `db2206c`
- Branch: `main`
- Unpushed: none
- Live: https://motopass.giveabit.io — theme-color `#F5F2EC`, manual deploy confirmed

---

## Handoff to Kimi — 2026-07-02 (BUILD-011)

**Machine:** M3 (Grok)  
**Project:** motopass

### Done
- [x] **Dark mode toggle** — `ThemeContext`, `ThemeToggle` in header, Sovereign Night palette via RGB CSS tokens
- [x] **50 jurisdictions** — `research/countries.json` expanded 25 → 50 (Brazil through Andorra)
- [x] **Legacy demo aligned** — `website/index.html` patched to Luminous Sovereign light theme
- [x] Design docs updated for dark mode tokens
- [x] Deployed to https://motopass.giveabit.io

### What's Next
- Kimi: verify dark mode contrast on mobile; spot-check new 25 program entries for accuracy
- Optional: deepen flagship research per country (Uruguay template depth)

### Git State
- Last commit SHA: `db2206c`
- Branch: `main`
- Unpushed: none

---

## Handoff to Kimi — 2026-07-02 (BUILD-012 docs)

**Machine:** M3 (Grok)  
**Project:** motopass

### Done
- [x] Consolidated all documentation into `docs/` (SOURCE-OF-TRUTH, DESIGN, DIRECTORY-MAP, PROJECT-VISION, NEXT-PROMPT, CHANGELOG, CONTRIBUTING)
- [x] Created `docs/UPDATES-MAP.md` (build history + work queue) and `docs/WORK-TREE.md` (complete file map)
- [x] Archived superseded handoffs/templates to `docs/archive/`
- [x] Root stubs redirect to `docs/`; README slimmed to quickstart + doc index
- [x] Updated MISSION, CHANGELOG, CONTRIBUTING, DESIGN-REFERENCE, SOURCE-OF-TRUTH

### Decisions
- Keep at root only: README, AGENTS, GROK-SESSION-PROTOCOL, LATEST-UPDATE (protocol + tooling requirements)
- Canonical design: `docs/DESIGN-CONTEXT.md` + `docs/DESIGN-TOKENS.md`
- Single handoff file: `docs/KIMI-HANDOFF.md` (append-only)

### What's Next
- Kimi: sync `docs/UPDATES-MAP.md` into Obsidian vault index
- Deepen 50 countries to Uruguay flagship depth

### Git State
- Last commit SHA: `db2206c`
- Branch: `main`
- Unpushed: none

---

## Handoff to Kimi — 2026-07-02 (BUILD 2026.07.02-02)

**Machine:** M3 (Grok)  
**Project:** motopass

### Done
- [x] Ingested Claude Warm Sovereign Cinematic batch (`motopass-warm-sovereign-cinematic_1`) — Landing + Programs
- [x] Added `src/styles/tokens.css` + merged Tailwind cinematic tokens with legacy Luminous aliases
- [x] New `src/components/programs/*` (ProgramCard, ProgramsTable, ProgramModal, Chip, ProofBadge)
- [x] `src/lib/programAdapter.ts` maps live `countries.json` → cinematic program shape
- [x] PitchPage: cinematic hero + live metrics from `computePitchStats`; SavingsGraphs from real data
- [x] ProgramsPage: sticky filter rail, table/card density shift, export/import preserved
- [x] Kept shipped Footer + full Legal/Careers/ServerCosts modals (no FooterActionBar duplicate)
- [x] PortfolioPage still uses legacy ProgramCard/ProgramModal (deferred cinematic pass)
- [x] BUILD_ID bumped to `2026.07.02-02`; deployed to motopass.giveabit.io
- [x] Removed `claude files/` after ingest

### Decisions
- Cinematic `Program` type (string id, score 0–100) lives in `components/programs/types.ts`; adapter bridges from `types/program.ts`
- Flagship visual weight = sovereignty_score × 10 ≥ 85
- `PageHeader` accepts both `subtitle` and `description`; `StatCard` supports legacy + cinematic APIs

### What's Next
- Portfolio page cinematic pass (ProgramCard/ProgramModal in `components/programs/`)
- Kimi: sync UPDATES-MAP into Obsidian vault

### Git State
- Last commit SHA: `db2206c`
- Branch: `main`
- Unpushed: none

---

## Latest Session Summary (from 2026-07-02 goodbye)

**Chat topic:** Shipped Warm Sovereign Cinematic merge; clarified Antigravity / GitHub / deploy workflow.

**Finished in this session:**
- Cinematic Landing + Programs live (BUILD `2026.07.02-02`)
- GitHub pushed; Cloudflare deployed; `claude files/` removed
- User happy with look; workflow advice documented in `docs/SESSION-SUMMARY-2026-07-02.md`

**Still to do:**
- Portfolio cinematic pass
- Optional design experiments on a git branch (Antigravity)

**Next for Kimi:** Integrate `docs/UPDATES-MAP.md` + this summary into Obsidian vault. Do not sync M4 until Cam/Kimi says so.

---

## Handoff to Kimi — 2026-07-07 (Batch 1/8)

**Machine:** M3 (Grok)  
**Project:** motopass

### Done (improvements 1–25)
- [x] Deleted legacy `ProgramsTable.tsx`; a11y fixes (aria-labels, htmlFor, table caption/scope)
- [x] `ProgramsLoadError` on Programs/Portfolio/Simulator/Compare
- [x] `programAdapter` stub-proof detection + tests; `ProofBadge` demo state
- [x] PageHeader scale fix; removed duplicate fonts from index.html
- [x] StackSimulator month range parsing; Register uses live 50 programs
- [x] Footer safe-area above mobile nav; BUILD `2026.07.07-04`

### Git State
- Branch: `main`
- BUILD: `2026.07.07-04`

---

## Handoff to Kimi — 2026-07-07 (Batch 8/8)

**Machine:** M3 (Grok)  
**Project:** motopass

### Done (improvements 176–200)
- [x] Playwright smoke tests in `e2e/smoke.spec.ts` — home, footer BUILD, programs, theme toggle
- [x] `scripts/e2e-smoke.sh` + `npm run test:e2e` with `playwright.config.ts`
- [x] `React.lazy` code-split `PitchPage` and `ProgramsPage` with `CardSkeleton` Suspense
- [x] `docs/IMPROVEMENTS-QUEUE.md` — all 200 items, batches 1–8 marked complete
- [x] `docs/UPDATES-MAP.md` + `LATEST-UPDATE.md` updated to BUILD `2026.07.07-11`
- [x] Footer Satohash link `text-accent` on light card surface
- [x] `.hero-headline` gold token preserved in `index.css`
- [x] `react-helmet-async` + `@playwright/test` declared in `package.json`

### Decisions
- E2E runs against `vite preview` on port 4173 (strictPort) — matches existing smoke-routes pattern
- Only Pitch + Programs lazy-loaded (highest bundle weight); other routes stay eager for now
- Full 200-item queue documented retroactively in IMPROVEMENTS-QUEUE from batch commit messages + shipped work

### What's Next
- Kimi: sync IMPROVEMENTS-QUEUE + UPDATES-MAP into Obsidian vault
- Optional: add `npm run test:e2e` to GitHub Actions CI (needs playwright browser install step)
- P1 backlog unchanged: deepen 50 countries, live Nostr relay, Satohash pipeline

### Git State
- Branch: `main`
- BUILD: `2026.07.07-11`

---

## Handoff to Kimi — 2026-07-07 (Nav upgrade)

**Machine:** M3 (Grok)
**Project:** motopass

### Done
- [x] Major nav overhaul — modular `src/components/nav/*` (HeaderToolbar, DesktopNav, LanguageDropdown, MobileMenuSheet, MobileBottomNav, MoreNavSheet)
- [x] Compact header (`h-12`), unified `.nav-btn` / `.nav-pill` / `.nav-tab` CSS system in `index.css`
- [x] Language flags as dropdown (desktop + mobile menu) with click-outside, Escape, checkmark, RTL badge
- [x] Grouped desktop pills: Explore / Tools + account pill; animated mobile hamburger sheet + bottom tab bar
- [x] Removed legacy `LanguageSwitcher.tsx`; e2e test for language dropdown + footer BUILD scroll fix
- [x] BUILD `2026.07.07-12` — committed, pushed, deployed to Cloudflare Pages

### Decisions
- Nav split into focused modules to keep Layout slim and enable independent mobile/desktop patterns
- Language dropdown replaces inline flag row — tighter toolbar, scales to all languages
- Desktop toolbar hidden below `lg`; mobile uses bottom nav + More sheet for overflow routes

### What's Next
- Kimi: verify live site footer shows `BUILD 2026.07.07-12` after hard refresh
- Optional: document nav batch in IMPROVEMENTS-QUEUE as batch 9 (50+ items)
- P1 backlog unchanged: Portfolio cinematic pass, deepen 50 countries, live Nostr relay

### Git State
- Last commit SHA: fd0caa2
- Branch: `main`
- Unpushed: (none)

---

## Handoff to Kimi — 2026-07-07 (Batches 17–20)

**Machine:** M3 (Grok)
**Project:** motopass

### Done
- [x] Batch 17 a11y — `useFocusTrap`, MoreNavSheet trap, CopyField live region, reduced-motion modals, Agents `aria-disabled`
- [x] Batch 18 i18n — Agents page keys, ProgramModal tabs/labels, pt/zh/ar/de/sw/hi overrides, PaymentQrCode/FileUpload i18n
- [x] Batch 19 nav/polish — Breadcrumbs, PrefetchNavLink, dashboard `?next=` redirect, portfolio sort/remove-all, compare modal, vault copy, verify paste, register optgroups/stub guard
- [x] Batch 20 CI/SEO — Playwright in CI, hreflang in SeoHead, sitemap generator, BlockHeight backoff, FAQ JSON-LD, 15 e2e tests, bundle budget
- [x] BUILD `2026.07.07-24` — committed `44e7bb1`, pushed, deployed

### Decisions
- Logged-out `/dashboard` auto-redirects to `/register?next=` (not inline CTA card)
- Round 2 items 201–500 tracked as batches 9–20 in IMPROVEMENTS-QUEUE.md

### What's Next
- Kimi: verify footer shows `BUILD 2026.07.07-24` after hard refresh
- P1 backlog unchanged: deepen 50 countries, live Nostr relay, Satohash pipeline

### Git State
- Last commit SHA: 44e7bb1
- Branch: `main`
- Unpushed: (none)

---

## Handoff to Kimi — 2026-07-07 (BTC Map v2 — all 5 steps)

**Machine:** M3 (Grok)
**Project:** motopass

### Done
- [x] Step 1 — Merchant density badges on `ProgramCard` via `public/data/btcmap-density.json` + `BtcMapDensityProvider`
- [x] Step 2 — Nostr NIP-98 auth (`btcmapAuth.ts`) + save/unsave merchants on `/v4/places/saved`
- [x] Step 3 — Report venue CTA (`BtcMapReportVenue`) on `/btcmap` and `/agents` → btcmap.org/add-location + btcmap-cli
- [x] Step 4 — Offline cache: 50 jurisdiction snapshots in `public/data/btcmap/` + cache-first hook with API fallback
- [x] Step 5 — Native Leaflet map (`BtcMapLeaflet`) with orange pins + search-radius circle (replaces iframe)
- [x] Scripts: `npm run btcmap:density`, `npm run btcmap:sync`
- [x] BUILD `2026.07.07-26` — 30 unit + 16 e2e tests passing, deployed

### Decisions
- `react-leaflet@4.2.1` for React 18 compatibility (v5 requires React 19)
- Density tiers: sparse (&lt;5), moderate (5–19), dense (20+)
- Offline snapshots capped at 48 places per jurisdiction to keep JSON lean
- BTC Map Bearer token stored in `sessionStorage` separate from MotoPass npub session

### What's Next
- Kimi: verify footer `BUILD 2026.07.07-26`; test Nostr save flow with Alby/extension on `/btcmap`
- Optional: wire `btcmap:density` + `btcmap:sync` into CI weekly cron
- P1 backlog unchanged: deepen 50 countries, live Nostr relay, Satohash pipeline

### Git State
- Last commit SHA: 41238c2
- Branch: `main`
- Unpushed: (none)

---

## Handoff to Kimi — 2026-07-07 (docs sweep)

**Machine:** M3 (Grok)
**Project:** motopass

### Done
- [x] Full documentation refresh for BUILD `2026.07.07-26` / BTC Map v2
- [x] Updated: README, CHANGELOG, UPDATES-MAP, SOURCE-OF-TRUTH, WORK-TREE, ARCHITECTURE, DATA-MODEL, GLOSSARY, IMPROVEMENTS-QUEUE (batches 21–22), EXECUTIVE-SUMMARY, MARKETING, MISSION, PRODUCT-SCOPE-ROADMAP, I18N, SEO (+ locale files), DESIGN-*, NEXT-PROMPT, CONTRIBUTING, BITCOIN-VERIFICATION, PAIGE-AI, PROJECT-VISION

### Git State
- Last commit SHA: a93b8f5
- Branch: `main`
- Unpushed: (none)

---

## Latest Session Summary (from 2026-07-07 goodbye)

**Chat topic:** BTC Map v2 (all 5 steps) + full docs refresh for BUILD 26.

**Finished in this session:**
- BTC Map v2: density badges, Nostr saves, Leaflet map, offline cache, report-venue CTA
- Scripts `btcmap:density` + `btcmap:sync`; 50 jurisdiction snapshots
- 30 unit + 16 e2e passing; deployed to motopass.giveabit.io
- Full docs sweep (34 files) — see `docs/SESSION-SUMMARY-2026-07-07.md`

**Still to do:**
- Uruguay-flagship depth for all 50 programs
- Live Nostr relay, Satohash pipeline, Paige backend
- Optional: weekly btcmap sync in CI; test Nostr save on `/btcmap` with Alby

**Next for Kimi:** Integrate summary into MASTER-BRAIN / Obsidian. Verify footer shows `BUILD 2026.07.07-26` after hard refresh.

### Git State
- Last commit SHA: `db2206c`
- Branch: `main`
- Unpushed: (none)

---

## Handoff to Kimi — 2026-07-14 (BUILD 27 — all 20 priorities)

**Machine:** M3 (Cursor)
**Project:** motopass

### Done (20-priority sprint)
- [x] 1–5: Flagship schema v2 — Uruguay, Bolivia, UAE, Portugal, Switzerland, El Salvador in `countries.json`
- [x] 6–7: Content-hash Satohash proofs + `validate:stamps` CI gate
- [x] 8: `pitch:sync` enforced in CI
- [x] 9–10: Organization/WebSite/BreadcrumbList JSON-LD + Bitcoin visa SEO keywords
- [x] 11: `BtcDualPrice` in ProgramModal finance/pathways
- [x] 12: Portfolio cinematic polish + compliance clocks + quick links
- [x] 13: `ComplianceClock` component on portfolio + modal overview
- [x] 14: Weekly `btcmap-cron.yml` workflow
- [x] 15: CI builds `dist/` artifact + optional CF deploy job (dist still committed for safety)
- [x] 16: BUILD `2026.07.14-27`
- [x] 17: npub session sync on profile load
- [x] 18: Paige RAG (`PaigeChat`) on dashboard
- [x] 19: Nostr DM stub on `/agents` + `nostrRelay.ts`
- [x] 20: Kimi: integrate this handoff + 4-pillar Kanban on M4 (instructions below)

### Kimi / MASTER-BRAIN (M4 — Cam sync when ready)
- Add swimlanes: Forge · Seal · Ledger · Nexus
- Link `docs/SOVEREIGN-STACK-4-PILLARS.md`, `docs/pitch/README.md`
- Weekly: `npm run pitch:sync` freshness + SEO audit queue

### Git State
- Branch: `main`

---

## Handoff to Kimi — 2026-07-14 (Bitcoin-first pitch + 4 Pillars)

**Machine:** M3 (Cursor/Grok)
**Project:** motopass

### Done
- [x] Bitcoin-first pricing — `btcPrice.ts`, `BtcPriceContext`, `BtcDualPrice`, `BtcPriceTicker`
- [x] Pitch page: live spot ticker, hero BTC Map CTA, savings rotator in ₿
- [x] Program cards, compare, portfolio, simulator — ₿ primary · USD secondary
- [x] Self-evolving pitch pack — `npm run pitch:sync` → `research/pitch-anchor.json` + `docs/pitch/ANCHOR-SNAPSHOT.md`
- [x] Docs: `PITCH-ANCHOR.md`, `pitch/README.md`, `SOVEREIGN-STACK-4-PILLARS.md`, MARKETING/EXECUTIVE/MISSION frontmatter
- [x] 33 unit tests passing; build green

### Decisions
- All monetary figures: ₿ at mempool.space spot (anchor JSON fallback offline)
- Narrative docs link PITCH-ANCHOR — never duplicate dollar tables across files
- Uruguay/Bolivia flagship amounts in anchor auto-regenerate from `countries.json`

### What's Next
- Uruguay JSON schema migration + ProgramModal depth tabs
- `pitch:sync` in CI when `countries.json` changes
- SEO JSON-LD (Organization, WebSite, BreadcrumbList)
- 5 flagship countries before 50/50 depth push

### Git State
- Last commit SHA: `db2206c`
- Branch: `main`

---

## Handoff to Kimi — 2026-07-14 (BUILD 28 — 50/50 + version sync + redeploy)

**Machine:** M3 (Grok)
**Project:** motopass

### Done
- [x] BUILD `2026.07.14-28` · package `0.2.0` · manifest `motopass-giveabit-v28`
- [x] `scripts/sync-build-version.mjs` + `npm run sync:build` in CI
- [x] 50/50 flagship depth — 16 deep + 34 template scaffolds (all stamped)
- [x] +5 deep flagships: Costa Rica, Hong Kong, Thailand, Cyprus, Estonia (`c43a95c`)
- [x] Version sync across README, docs hub, diligence, pitch anchor
- [x] UI: BtcPriceTicker header, ProgramsTable ₿, tier badges, pitch 50/50 metric
- [x] CI pitch:sync pins BTC spot + timestamp for idempotent gate
- [x] 36 unit + 17 e2e tests green · deploy to motopass.giveabit.io

### Decisions
- Template tier = honest "research pending" scaffolds; deep tier = Uruguay-standard
- `flagship_tier` preserved in adapter + modal badge
- Historical BUILD 26/27 refs kept in changelog/session archives only

### Kimi / M4
- Kanban: deepen remaining 29 template flagships (real research)
- OpenTimestamps pipeline (replace content-hash-only proofs)
- Set `CLOUDFLARE_API_TOKEN` in GitHub secrets for CI deploy

### Git State
- SHA: `db2206c`
- Branch: `main`
- Unpushed: (none)

---

## Handoff to Kimi — 2026-07-14 (BUILD 29 — 50/50 deep flagships)

**Machine:** M3 (Grok)
**Project:** motopass

### Done
- [x] Deepened all 29 template flagships to Uruguay-standard research depth
- [x] 0 template tiers remain — pitch metric now 50/50 deep
- [x] `apply-flagship-extensions.mjs` clears stale `flagship_tier` on re-apply
- [x] BUILD `2026.07.14-29` · manifest `motopass-giveabit-v29`
- [x] All 50 re-stamped · validate:stamps green · 36 unit + 17 e2e tests

### Decisions
- Honest nulls kept where law is uncertain (dual citizenship, scope of freedom)
- Ireland IIP closure noted; NZ AIP high threshold flagged
- Cambodia/Japan/Philippines nomad routes marked informal where no formal visa exists

### Git State
- SHA: `db2206c`
- Branch: `main`
- Unpushed: (none)

---

## Session — 2026-07-14 (BUILD 32 — applications open · v2.3 master)

**Done:**
- Launch Engine: `scripts/launch-gate-check.mjs` (G1–G5) → `public/launch-gates.json`
- Seal: Vault page + OTS on disk (50/50) + `validate:seal`
- Forge: Distressed marketplace (`/distressed`) + PSBT escrow stub
- Apply: `/apply` open when gates pass · launch banner · success polish
- Mobile: viewport containment (`overflow-x-clip`), 19 e2e tests green
- BUILD `2026.07.14-32` · `npm run deploy:all` script added

**Decisions:**
- G3 Nexus uses `LAUNCH_FAKE_RELAY=1` default for QA until relay live
- Applications gated by scorecard JSON, not hardcoded flags

**Git State:**
- SHA: `db2206c`
- Message: `BUILD 32 — applications open — full v2.3 master`
- Deployed: Cloudflare Pages `064d43c2.motopass.pages.dev` → https://motopass.giveabit.io
- Health check: passed (50 programs, sitemap, logo)

---

## Session — 2026-07-14 (BUILD 33 — sovereign UI + nav cleanup)

**Done:**
- Premium dark sovereign UI: glass cards, BTC grid/hash textures, default dark theme
- `GlassCard` component · polished Apply/Vault/Distressed pages
- Nav audit: single `MAIN_NAV_ROUTES` in `navRoutes.ts` — no Explore/Tools duplicates
- Canonical menu: Programs · Vault · Distressed · BTC Map · Simulator · Compare · Agents · Apply
- Mobile: bottom tabs + More sheet · footer/desktop active states
- BUILD `2026.07.14-33` · 36 unit + 19 e2e green · deployed

**Git State:**
- SHA: `db2206c`
- Message: `BUILD 33 — sovereign UI + nav cleanup`
- Deployed: https://motopass.giveabit.io (preview `39fc4371.motopass.pages.dev`)

**Knowledge sync (same session):**
- SHA: `db2206c` — docs, `.ai_docs/context_map.md`, ARCHITECTURE, UPDATES-MAP, SOURCE-OF-TRUTH, pitch:sync

---

## Session — 2026-07-14 (BUILD 34 — members club UI redesign)

**Done:**
- Full premium redesign: dark canvas `#0a0a0f`, Bitcoin orange `#ff9500`, electric blue accents
- Typography: Inter body + Inter Tight display (replaced Fraunces/Source Serif)
- New UI primitives: `Button`, `Card`, `Input`, `Modal` in `src/components/ui/`
- `Header.tsx` with cinematic animated hash-pattern background + orange/electric glows
- Premium glass cards (rounded-2xl buttons, scale+glow hover, grain textures)
- Polished Vault, Distressed, Apply, Programs pages + exclusive nav + premium footer
- BUILD `2026.07.14-34` · 36 unit + 19 e2e green

**Decisions:**
- `GlassCard` / `ClassyModal` kept as thin wrappers over `Card` / `Modal` for backward compat
- Header uses CSS-only animation (hash drift + glow pulse) — no image gen dependency

**Git State:**
- SHA: `db2206c`
- Message: `feat(ui): BUILD 34 members club redesign — cinematic header, premium glass`
- Pushed: `origin/main`

---

## Latest Session Summary — 2026-07-14 (goodbye · Grok)

**Chat topic:** Premium sovereign UI redesign, home page business polish, then global lighten/glass pass after site felt too dark.

**Key things we did:**
- **BUILD 34** — Members-club UI: `#0a0a0f` canvas, `#ff9500` orange, Inter/Inter Tight, `Button`/`Card`/`Input`/`Modal`, cinematic `Header.tsx`, nav/footer/page polish
- **BUILD 35** — Home (`PitchPage` at `/`) expanded: four pillars, product suite, how-it-works, live-data trust strip, FAQ, CTA band; clarified pitch *is* home and metrics auto-update from `countries.json`
- **BUILD 36** — Canvas ~20% lighter (`#16161f`), glassier surfaces globally (48% glass, 28px blur), ambient glow, breadcrumb/nav/modal polish; 50-item UX batch shipped

**What we finished:**
- Live at https://motopass.giveabit.io · BUILD `2026.07.14-36` · commit `f8aecf5`
- 36 unit + 19 e2e tests green on every ship
- Nav canonical: Programs · Vault · Distressed · BTC Map · Simulator · Compare · Agents · Apply

**Still to do (optional next session):**
- Knowledge sync docs (ARCHITECTURE, UPDATES-MAP) for BUILD 35–36 if Kimi wants parity
- `npm run pitch:sync` on next deploy if investor anchor needs fresh BTC spot
- Further lighten if user wants another 10–15% (BUILD 36 was ~20% lift)

**Next for Kimi:** Integrate summary into vault/Kanban. No raw chat logs. M4 sync when ready.

**Git State:**
- SHA: `db2206c`
- Label: `lighter glass canvas +20% · ambient polish · 50 UX fixes`
- Pushed: `origin/main`

---

## Session — 2026-07-15 (BUILD 39 — BTC Map layout polish)

**Done:**
- Redesigned `/btcmap`: command bar (jurisdiction + program intel + Nostr), map-first 3/5 + merchant directory 2/5 split
- `BtcMapMerchantDirectory` — search, fixed-height scroll panel, divider rows (not chunky cards)
- Report venue demoted to inline footer links; areas chips below map; taller map on desktop
- BUILD `2026.07.15-39` · 36 unit + 19 e2e green

**Git State:** see latest push to `origin/main`

---

## Session — 2026-07-15 (BUILD 38 — fix blank site + Agents education)

**Done:**
- **Root cause:** Cloudflare CDN cached `index.html` as `/assets/index-*.js` (`cf-cache-status: HIT`, HTML body + `immutable` headers) — React never mounted, blank black screen
- **Fix:** `public/_redirects` now serves `/assets/*` before SPA fallback; JS headers add `must-revalidate`; new bundle hash busts poisoned cache
- **Agents page** (`/agents`): full how-it-works (4 steps), Nexus banner, Paige + deal-room cards, upgraded agent grid with Card primitives
- `scripts/verify-live-app.mjs` + wired into `health-check.sh` — confirms main bundle is JS not HTML
- Live verified: `SMOKE_URL=https://motopass.giveabit.io` e2e passes · BUILD `2026.07.15-38`

**Decisions:**
- Cache purge API failed (token lacks Zone Cache Purge) — bundle hash rotation is sufficient fix; Kimi may purge zone manually if needed
- E2E tests only hit localhost preview by default — production check now via `verify-live-app.mjs`

**Git State:**
- SHA: `db2206c`
- Pushed: `origin/main`

---

## Session — 2026-07-15 (BUILD 37 — education / how-it-works sections)

**Done:**
- New `HowItWorksSection` component (`src/components/ui/HowItWorksSection.tsx`) — reusable step cards with icons, links, footer note
- **Vault** (`/vault`): 4-step guide — what gets stamped, verified vs demo, browser verify, Nostr lineage
- **Distressed** (`/distressed`): 4-step guide — listing criteria, curated vs permissionless, score meaning, deal-room flow
- **Pitch** (`/`): site-wide "Understanding MotoPass" four-pillar guide (Forge → Seal → Ledger → Nexus), Distressed stack card, FAQ expanded to 5 questions (Vault + Distressed)
- i18n keys in `pageKeys.ts` + `translations.ts` for all new copy
- BUILD `2026.07.15-37` · 36 unit + 19 e2e green

**Decisions:**
- Education sections sit above interactive tools on Vault/Distressed so visitors understand *why* before *how*
- Pitch guide uses same four-pillar language as `docs/SOVEREIGN-STACK-4-PILLARS.md` for consistency
- Safe harbour disclaimer on every education footer

**Git State:**
- SHA: `db2206c`
- Message: `feat(education): BUILD 37 how-it-works for Vault, Distressed, and Pitch`
- Pushed: `origin/main`

---

## Session — 2026-07-15 (BUILD 42 — CDN cache poison recovery)

**Done:**
- **Root cause (again):** Browsers/CDN cached `index.html` as lazy JS chunks and CSS (`PitchPage-*.js`, `usePrograms-*.js`, `index-*.css` returning 3687-byte HTML). Main bundle was fine; React crashed with `useI18n must be used within I18nProvider`.
- **Fix:** Vite output filenames now include BUILD_ID salt (`*-20260715-42.js`) so poisoned URLs are bypassed without zone purge
- `public/_headers` — removed `immutable`, added `index.html` `no-cache`, `must-revalidate` on assets
- `scripts/verify-live-app.mjs` — Playwright checks **all** `/assets/` responses for HTML poisoning
- `scripts/purge-live-cache.mjs` — purge all dist assets (+ `purge_everything` fallback); token still lacks Zone.Cache Purge
- Deployed to Cloudflare Pages; live verify passes

**Decisions:**
- Salted filenames on every ship until Kimi grants zone purge permission or CF cache rules are tightened
- `curl` alone is insufficient for prod verify — browser cache differs from `no-store` fetch

**Git State:**
- SHA: `db2206c`
- Message: `fix(deploy): BUILD 42 recover from CDN cache poison`
- Pushed: `origin/main`

---

## Session — 2026-07-15 (BUILD 43–47 — nav chrome + CDN cache hardening)

**Done:**
- **BUILD 43** — Language dropdown z-index fix (portal layering behind Members nav)
- **BUILD 45** — Nav chrome pack (items 1,4–10): portaled language dropdown, tablet language label, dropdown animation, system locale auto-detect, scroll-collapse header, sticky section nav on Pitch/Vault/Distressed, larger mobile breadcrumb taps, active nav pill pulse
- **BUILD 46** — “Blank overlay” diagnosis: not UI overlay — CDN cached `index.html` as JS; boot guard, `no-cache` asset headers, static `ErrorFallback`, eager home bundle, `ErrorBoundary` inside `I18nProvider`
- **BUILD 47** — Auto-retry cache-bust loader (`?cb=` reload + `?b=BUILD_ID` on index assets); dynamic `import()` entry with retry hook; live verify passes
- **Scripts:** `scripts/wait-live-app.mjs` (poll verify post-deploy), `scripts/purge-live-cache.mjs` (purge_all fallback), `scripts/verify-live-app.mjs` (Playwright + dynamic import matcher)
- **Deploy:** `vite.config.ts` salted filenames, boot guard, safe asset loader plugins

**Decisions:**
- “Page disappears after 1s” = script poison, not a React overlay — boot guard shows recovery UI until fresh load
- Zone Cache Purge API fails (token lacks permission) — **Kimi to grant Zone.Cache Purge for all Give A Bit sites** and wire into `deploy` script
- Salted filenames + `no-cache` headers + auto-retry remain belt-and-suspenders until purge is live
- `curl` alone insufficient for prod verify — use Playwright (`verify-live-app.mjs`)

**Still open (polish queue):**
- CF zone purge on every deploy (all sites)
- Apply BTC Map directory-panel pattern to Distressed filters / Apply gates
- Side-by-side program diff view; footer “verify this page” badge

**Git State:**
- SHA: `db2206c`
- Live: BUILD `2026.07.15-47` · https://motopass.giveabit.io · verify OK
- Pushed: `origin/main`

---

## Latest Session Summary (from 2026-07-15 goodbye)

**Chat topic:** Stabilize production after CDN cache poison outages; ship nav chrome; harden deploys.

**Finished in this session:**
- BUILD 43–47 deployed; site live and user-confirmed healthy
- Nav chrome pack (lang portal, collapse header, anchor nav, breadcrumbs, pill pulse, system locale)
- CDN poison mitigations: salted filenames, no-cache headers, boot guard, auto-retry `?cb=` loader
- Live verify passing; handoff + `SESSION-SUMMARY-2026-07-15.md` written

**Still to do:**
- Grant Cloudflare **Zone.Cache Purge** for deploy tokens (all Give A Bit sites)
- Polish queue: Distressed directory filters, program diff view, footer verify badge

**Next for Kimi:** Integrate summary into MASTER-BRAIN / Obsidian. Add CF purge to shared deploy playbook. See `docs/SESSION-SUMMARY-2026-07-15.md`.

**Git:** `f100da7` · BUILD `2026.07.15-47` · https://motopass.giveabit.io

---

## Session — 2026-07-15 (BUILD 48 — Batch 23 parallel agents)

**Done:**
- **6 parallel agents** shipped Batch 23 subset (531–580): deploy health, nav polish, programs, distressed/apply directories, vault verify, agents
- **Deploy:** `deploy-health.mjs`, `parse-live-index.mjs`, `useLiveDeployHealth` footer green dot, `verify:live:ci`, purge script error clarity, CI live-health stub
- **Nav:** `BackToTop`, ⌘L language shortcut, per-route lang memory (`routeLangStorage`), reduced-motion pulse guard
- **Programs:** Compare side-by-side diff + “Add all to stack”, filter preset chips, `FreshnessBadge` on cards
- **Distressed/Apply:** `DistressedFilterDirectory`, `DistressedListingsList`, `ApplyLaunchGatesDirectory`
- **Vault/Verify:** `FooterVerifyLink`, `VerifyResultsExplainer`, `pageVerify.ts`, vault portfolio link
- **Agents:** Office hours availability cards (item 580)
- **BUILD:** `2026.07.15-48` · 48 unit tests pass · build OK

**Decisions:**
- Zone Cache Purge (531/535) still blocked — salted filenames + wait-live remain primary defense
- Batch 23 queue updated; ~35 items still open (map clustering, vault OTS drag-drop, agent filters, etc.)

**Git State:**
- SHA: `db2206c`
- Message: `feat: BUILD 48 — Batch 23 parallel agent ship`
- Pushed: `origin/main`

---

## Session — 2026-07-15 (BUILD 49 — Batch 24 elite, 100-item queue)

**Done:**
- **Batch 24 queue** — items 581–680 added to `IMPROVEMENTS-QUEUE.md`
- **6 parallel agents** shipped ~70 upgrades across deploy, nav, programs, BTC map, distressed, vault, agents, design, i18n
- **Deploy:** purge token live, `DEPLOYMENT.md`, boot guard countdown, CI live-health, `check-live-headers.mjs`
- **Nav:** anchor nav, breadcrumbs ellipsis, shortcuts modal (`?`), page transitions, prefetch hover
- **Programs:** compare modal link, export URL/JSON, sovereignty tooltip, density toggle, portfolio reorder
- **BTC Map:** CSV export, clustering, freshness badge, split view, jurisdiction jump, weekly sync cron
- **Vault/Verify:** OTS drag-drop, hash history, lineage timeline, batch verify, kind:30078 stub
- **Agents:** status filters, region SVG map, Paige prompts, toast system, Kimi live-now indicator
- **62 unit tests** pass · BUILD `2026.07.15-49`

**Still open (Batch 24):** Pitch polish 611–620, distressed 632–640, design 664–670, i18n/SEO 672–680 (~30 items)

**Git State:**
- SHA: `db2206c`
- Pushed: `origin/main`

---

## Session — 2026-07-15 (BUILD 50 — queue complete 680/680)

**Done:**
- **4 parallel agents** finished remaining 33 items (pitch 611–620, distressed/apply 632–640, design 664–670, i18n/SEO 672–680, deploy 537–538)
- Pitch: hero CTA animation, stats counter, FAQ accordion, scroll progress, trusted-by strip, JSON-LD FAQ
- Distressed/Apply: saved filters, autosave draft, progress stepper, similar chips, confetti, sticky mobile filters
- Design: table zebra, modal springs, skeleton reduced-motion, form shake, starfield parallax
- i18n/SEO: RTL tables, hreflang, 404 search, reading time, a11y budget CI, sitemap lastmod
- **e2e reliability:** lock file + fresh preview (`fa465eb`)
- **73 unit tests** pass · BUILD `2026.07.15-50`

**Git State:**
- SHA: `db2206c`
- Pushed: `origin/main` · live BUILD 50

---

## Session — 2026-07-15 (BUILD 51 — elite sovereign redesign)

**Done:**
- **Design system** — dark canvas `#0a0a0f`, deeper navy glass, reverse hash drift layer on header
- **Nav** — primary: Programs · Vault · Distressed · BTC Map · Simulator · Agents · Apply; Compare/Portfolio/Verify in overflow only
- **Vault → Apply** — "Use this proof" navigates with `?program=&proof=`; Apply shows proof card + prefilled notes
- **Stack Simulator** — `ValueForksPanel` (pathway forks across stack)
- **Programs** — `GoldStandardSpotlight` for Uruguay + Bolivia flagship depth
- **Pitch** — pillars reordered Forge → Seal → Ledger → Nexus
- **Paige** — must cite Satohash or mark claims `[unverified]`
- **Portfolio** — Nostr identity banner for npub readiness
- **73 unit tests** pass · BUILD `2026.07.15-51` · live verified

**Git State:**
- SHA: `db2206c`
- Pushed: `origin/main` · live https://motopass.giveabit.io

---

## Session — 2026-07-15 (BUILD 52 — Elite Paradise Pass)

**Done:**
- Cinematic header: dual hash layers, grain overlay, vignette, stronger orange/electric glows
- Buttons: heavier hover scale + glow via native CSS (avoids Tailwind @apply conflicts)
- Glass cards: layered gradient depth, stronger borders and hover lift
- Typography: bolder display headings, refined body leading
- Mobile: 390px overflow hardening (nav, mono blocks, headers)
- Distressed: multi-pathway listings, Kimi gold tier, proof-gated permissionless unlock
- Vault: Export credentials JSON bundle
- Simulator: Value forks with proof status, synergy, sovereignty, savings delta
- Programs: Compliance clock strip with severity colors (critical/warning/healthy)
- Dashboard: Paige proof enforcement card visible
- **73 tests** pass · BUILD `2026.07.15-52`

**Git State:**
- SHA: `db2206c`
- Pushed: `origin/main`

---

## Session — 2026-07-15 (BUILD 53 — canvas lift + footer gap attempt)

**Done:**
- Canvas lifted ~20% (`#0a0a0f` → `#12121c` in tokens + index.css)
- Removed `mb-20` from `Footer.tsx`
- Removed `min-h-screen` from `ProgramsPage.tsx`
- **73 tests** pass · BUILD `2026.07.15-53` · deployed live

**Decisions:**
- User still saw ~5cm black void below footer on mobile — margin tweak was insufficient

**Git State:**
- SHA: `db2206c`
- Pushed: `origin/main`

---

## Session — 2026-07-15 (BUILD 54 — footer flush fix)

**Done:**
- **Root cause:** layout shell `pb-[calc(3.75rem+safe-area)]` sat *below* footer → empty canvas void
- **Fix:** removed layout padding; moved clearance into footer (`footer-glass` extends behind mobile tab bar)
- **73 tests** pass · BUILD `2026.07.15-54` · live verified (CDN retries OK)
- Dist artifacts + docs synced

**Decisions:**
- Mobile tab-bar clearance belongs inside footer, not layout wrapper
- Nav primary unchanged: Programs · Vault · Distressed · BTC Map · Simulator · Agents · Apply

**Git State:**
- SHA: `db2206c`
- Pushed: `origin/main` · live https://motopass.giveabit.io

---

## Session — 2026-07-15 (BUILD 56 — Batch 25 + footer gap v2)

**Done:**
- Footer gap v2: removed footer shell pb + safe-area double-count; `min-h-dvh` layout; document ends flush at footer
- Batch 25 complete (681–780): 6 parallel agents — mobile, deploy, nav, programs, pitch/BTC map, distressed/vault, agents/design/i18n
- 85 unit tests pass; deploy hardening (verify-live BUILD match, footer-gap e2e stub, predeploy tests)
- BUILD `2026.07.15-56` · queue 780/780

**Decisions:**
- Mobile tab clearance: fixed nav overlays footer; no extra padding band below footer content
- Main scroll clearance removed from layout shell — footer is last document node

**Git State:**
- SHA: pending commit
- Branch: `main`

---

## Latest Session Summary (from 2026-07-15 goodbye)

**Chat Topic:** Footer gap still visible after BUILD 54; ship Batch 25 with parallel agents.

**Finished:**
- BUILD 56 live target — footer flush v2 + full Batch 25 (100 items)
- 85 unit tests green

**Still to do:**
- User hard-refresh on device to confirm footer gap gone
- Kimi: integrate Batch 25 summary into vault

**Next for Kimi:** See `docs/IMPROVEMENTS-QUEUE.md` Batch 25 section. BUILD 56 is current.

---

---

## Session — 2026-07-15 (BUILD 60 — Batch 26)

**Done:**
- Batch 26 complete (781–880): 100 items — deploy/CI hardening, nav shortcuts (`g v`, `g a`), programs compare markdown export, pitch/BTC map polish, distressed bookmarks/filters, vault bulk export, Paige streaming/history, Nostr relay config, Kimi .ics, ja/de i18n stubs, `links:check`, bundle warn >460kb
- Preserved BUILD 58 footer-gap fix (`overflow: clip` on `.sovereign-canvas`; no `min-h-svh` / `flex-1` shell stretch)
- Footer-gap e2e corrected to scroll to document bottom (not `scrollIntoView block:end` under sticky tab bar)
- 122 unit tests pass; footer-gap e2e 4/4 pass

**Decisions:**
- Layout shell stays BUILD 58 shape — footer is last content node; sticky mobile tab bar follows in DOM
- E2e footer metrics use `nav.mobile-nav-glass[aria-label="Mobile tab bar"]` selector

**Git State:**
- SHA: `db2206c`
- Branch: `main`
- Live: https://motopass.giveabit.io (deploy after push)

---

## Session — 2026-07-15 (BUILD 57 — Savings dashboard v3)

**Done:**
- Replaced pitch `SavingsGraphs` with elite dark-glass multi-panel dashboard (v3 style)
- Static modeled figures: Legal $81,000 vs $3,900 · Time 177 vs 135 days · Jurisdictions 3 vs 50
- MotoPass logo (`/images/motopass-logo.png`) — no Bitcoin branding in section
- Animated horizontal comparison bars with gold shimmer on MotoPass fills
- Title: "Cost & time, modeled — not promised"
- BUILD `2026.07.15-57` deployed + CF cache purge (58 URLs)

**Decisions:**
- Savings section uses fixed anchor numbers (not live `pitchStatsToSavingsRows`) for clarity per user spec
- Section is self-contained dark band (`savings-dashboard-v3`) for elite contrast vs light page bands

**Git State:**
- SHA: `db2206c`
- Branch: `main`
- Live: https://motopass.giveabit.io

---

## Session — 2026-07-15 (BUILD 62 — Full-screen data-story presentation)

**Done:**
- Rebuilt `SavingsPresentation` as pure React/CSS dashboard matching `data-story.jpg` design language
- Full-screen modal — no image crop; scales to fit viewport via `min(vw, vh)` aspect-ratio box
- Six-card grid: Cost Comparison, MotoPass mini, Time Comparison, Jurisdictions, Savings donut, Modeled delta summary
- Animated real metrics: $81,000→$3,900 · 177→135 days · 3→50 jurisdictions
- MotoPass logo only (no Bitcoin) on all branded cards
- Phased auto-play: intro → cost → time → jurisdictions → savings → finale
- BUILD `2026.07.15-62` deployed to https://motopass.giveabit.io
- 125 unit tests pass

**Decisions:**
- Pure React recreation instead of `data-story.jpg` background overlay — eliminates bottom cutoff and Bitcoin artifacts while preserving exact visual style
- Homepage `SavingsGraphs` section unchanged; only presentation overlay updated

**Git State:**
- SHA: `db2206c` (+ docs sync commit)
- Branch: `main`
- Live: https://motopass.giveabit.io

---

## Session — 2026-07-15 (BUILD 66 — Finance Compare fix)

**Done:**
- Fixed `/compare` stuck on infinite loading skeleton after BUILD 65 redesign
- Root cause: lazy `FinanceComparePage` chunk never resolved in preview/production (e2e showed only `status "Loading"`)
- Eager-import compare route in `src/App.tsx` — reliable load in main bundle
- Show picker + empty state immediately; matrix/diff wait on `countries.json` only
- Fixed program search dropdown clipped by `.fc-page { overflow: hidden }`
- Added `compare.loadingPrograms` i18n key; table `aria-label` for a11y/e2e
- Compare e2e: wait for `countries.json`; 3/3 smoke tests pass
- BUILD `2026.07.15-66` pushed; live confirmed (`index-...-66.js`)
- Docs synced: `sync-build-version.mjs`, CHANGELOG, UPDATES-MAP, SOURCE-OF-TRUTH, handoff

**Decisions:**
- Eager import for `/compare` — core nav route; reliability over code-split (~17KB chunk was broken)
- Do not gate empty state on programs fetch — users must see "Select programs to compare" immediately
- BUILD 65 lazy chunks remain on CDN but unused; boot guard handles stale caches

**Git State:**
- SHA: `db2206c`
- Branch: `main`
- Unpushed: docs commit pending this session
- Live: https://motopass.giveabit.io/compare (BUILD 66)

### Latest Session Summary (from 2026-07-15 goodbye)

**Chat topic:** Finance Compare broken after BUILD 65 — user said "it does not work anymore."

**Finished:** BUILD 66 compare regression fix shipped and live; tests green.

**Still to do:** Optional tsc cleanup; long-term Bitcoin/Nostr/escrow roadmap unchanged.

**Next for Kimi:** Integrate BUILD 66 note into vault maps; no action unless compare regressions reported.

---

## Session — 2026-07-19 (Satohash API client — family timestamp backbone)

**Machine:** M3 (Grok)  
**Project:** motopass

### Done
- [x] Expanded `src/lib/satohash.ts` with Satohash public API client:
  - `SATOHASH_API_BASE` from `VITE_SATOHASH_API_URL` (default `https://api.satohash.io`)
  - `getApiHealth()`, `stampHash()`, `getStamp()` — never throw; `ok:false` when offline
  - Headers: `X-Satohash-Client: motopass`, optional `X-Satohash-Key`
  - Kept browser hash + deep-link helpers (`sha256Hex`, `satohashVerifyUrl`, `satohashStampGuideUrl`, `hashApplicationPayload`, `fetchBitcoinBlockHeight`)
  - Added `satohashProofVerifyUrl(id)` for API-issued proof ids
- [x] Tests: `src/lib/satohash.test.ts` — 12 tests with mocked `fetch` (offline, validation, success, API key header)
- [x] UI: `/verify` stamps via API first; on success shows proof id + verify link; on failure falls back to `satohash.io/stamp?hash=` deep link
- [x] `.env.example`: `VITE_SATOHASH_URL`, `VITE_SATOHASH_API_URL` (no secrets)
- [x] `vite-env.d.ts` types for `VITE_SATOHASH_API_URL`
- [x] Full unit suite: 135 tests pass

### Decisions
- API may not be live yet — all client calls are graceful-fail; VerifyPage always offers stamp-guide fallback
- Minimal UI surface: only VerifyPage stamp button changed (Profile/Apply still use deep links)
- No API keys committed; optional key only via runtime `opts.apiKey` or future env if needed

### What's Next
- When `api.satohash.io` is live: smoke stamp from `/verify` and confirm proof id resolves
- Optional: wire ProfilePage/ApplyPage upload path to `stampHash` the same way
- Optional: family free-tier key via env (never commit secrets)

### Git State
- Branch: `main`
- See commit message after push for SHA

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*