# motopass — Last Updated 2026-09-15 by Kimi (THOR) — CI hygiene (action runtime deadline + phantom red)

**Update 21:58 (Kimi, THOR) — the gate is green, and the two things that made it *look* broken are gone.**
**Commits:** `e319b6e` (action runtimes) · `0636589` (annotation) on `kitsboy/motopass` main.

- **A red run Cam saw was already moot — and got re-run anyway.** Run `35010360271` (CI #76 at `2c1bcb0`) failed on `smoke › Arabic sets RTL document direction`, and the auto-retry cron re-ran it at **19:20Z — 26 minutes after `881cbcd` fixed that exact bug and main went green**. The retry tests a superseded SHA, so it can only come back red again and pins a permanent red X. `gh-actions-retry.sh` now retries **only a failure at the current head of main**, and only the newest run of that workflow at that SHA (dry-run + a negative test: candidates `[35010360271]` when head is `2c1bcb0`, `[]` once head moved).
- **Node 20 runtime deadline: `actions/cache@v4` and `actions/upload-artifact@v4` declare `runs.using: node20`; GitHub removes the Node 20 runtime on 2026-09-23 (8 days).** They were being force-run on Node 24 with a warning that would have become a hard stop. → `cache@v6`, `upload-artifact@v7`, and `stefanzweifel/git-auto-commit-action@v5 → @v7` (same `node20` runtime, and it drives **both scheduled syncs** — `daily-intel` and `btcmap` would have died silently on the same date; `v7` restored `skip_fetch`, which `daily-intel` passes). `checkout@v5`/`setup-node@v5` are already `node24` and were left alone. `node-version: '20'` is the app toolchain, **not** an action runtime — it is not what the annotation was about (separate follow-up: Node 20 is EOL).
- **A green run no longer carries a red error annotation.** `prettier:check` is warn-only via `continue-on-error`, but its exit 1 still made GitHub attach an **error**-level `Process completed with exit code 1.` to the run — so every green push read "1 error and 10 warnings", and the one *real* e2e error was indistinguishable from the phantom. The step now swallows its own exit code and emits `::warning::prettier drift in 355 src files`. Verified live on `75d7181`: **build-test success, annotations = 11 warnings, 0 errors.**
- **What's left, honestly:** the 10 remaining warnings are real lint advisories (`react-refresh/only-export-components` ×6, `react-hooks/exhaustive-deps` ×4) — non-blocking (`--max-warnings 50`), and the fix is a code refactor, so it belongs to the code lane. The repo-wide `prettier --write src` is still deliberately deferred.

## Previous brief (Ziggy, THOR) — the CI gate is ON again

**Brief:** the CI gate is ON again — `ci.yml` had been `disabled_manually` since 2026-07-15, so lint / unit tests / data-stamp-trust validation / the bundle budget and the **source-probe self-test** ran on NO push for two months (only the Deploy workflow's build + live marker did). Both chronic reds fixed at the root, workflow re-enabled, first run is the fix commit itself.
**Commit:** `ed8a596` (`ee1ccf1` lint · `be402fe` pitch check) on `kitsboy/motopass` main.

- **lint: 11 errors → 0** — conditional `useReducedMotion()` in `StatCard`, synchronous `setState` inside an effect in `CountUp`, five `any` escapes + `document.title` inside `useMemo` in `SourceMonitorPage`; the one React-Compiler advisory rule that would only matter once the compiler is on is `warn`, with its reason written beside it in `eslint.config.js`.
- **pitch anchor:** the old step was red on every push **by construction** — `BUILD_ID` names the commit being built, which can never be inside a committed file. Replaced by one canonical `npm run pitch:check` that normalises provenance and still fails on real data drift (proven: stale → 1, synced → 0, build-id-only → 0, one `gov_fees_usd` edit → 1). The anchor pair was itself two months stale (₿1.20 · $77k) → regenerated to ₿1.58 · $102k (96%), 50 programs.
- **`prettier:check` is warn-only** until a one-shot `npx prettier --write src` lands (354 of 382 `src/` files predate the check); deliberately deferred so it cannot stomp in-flight cards.
- **Gate protection, plainly:** `CI` + `Deploy motopass to Cloudflare Pages` (build + live marker; CF Pages git integration is the one deployer). `Daily Country Intel (self-heal)` runs the self-test daily as well.
- Full CI step list reproduced locally on the fixed tree before pushing — **every step PASS**; e2e 25 passed with 1 flaky footer spec, since hardened (12/12 clean over 3 repeats).
- **The gate earned its keep on its second push:** `Arabic sets RTL document direction` went red twice in a row — and it was right. Picking العربية (or any lazy-loaded locale) for the first time flipped the app to RTL and **silently reverted it to the previous language ~500 ms later** (`src/hooks/useRouteLangMemory.ts` saved the route→language map in an *unmount cleanup* reading a stale ref; the locale-chunk loading screen unmounts that hook). Fixed by persisting on change instead of on unmount; probe now shows `lang=ar dir=rtl pref=ar` stable, and the spec asserts the switch is still RTL 1.2 s later (12/12).

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
