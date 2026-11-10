# motopass — Last Updated 2026-11-10 by Buffy — invoices, offers and receipts read in the browser

Four Bitcoin/L2 readers now sit at `/tools`, and every one is explicit about its limit. A BOLT11 invoice is decoded from its bech32 words — network, amount in all four multipliers, timestamp, expiry, payment hash, description, payee key, CLTV and route hints — with a valid checksum but **no signature check**, so the card says `decoded locally`, not `verified`. A pico-bitcoin amount that is not a whole millisecond is refused instead of rounded. BOLT12 is read as BigSize TLV streams: offers (`lno1…`), invoice requests (`lnr1…`) and invoices (`lni1…`) are parsed, and the signature-bearing messages are checked with BIP-340 Schnorr over the BOLT12 Merkle root. The official invoice-request vector reproduces Merkle root `608407…` and verifies. Offers themselves are **unsigned by BOLT12 design** — the signature lives on the request and invoice — so the tool says there is no offer signature to check rather than inventing one, and rejects an offer that carries a signature field as malformed. This also corrects the earlier offer check: BOLT12 has no bech32 checksum, so validation now covers the TLV structure instead of a checksum the format does not have. The preimage card checks the one Lightning relation that needs no node (`sha256(preimage)` equals the payment hash), and the receipt inspector moved here from Portfolio so there is one verifier, not two. Portfolio's saved receipts gained a single Satohash/OpenTimestamps stamp over their sorted event ids, with a block height only when a block reports one and a `pending` label otherwise. Three UI passes: `/tools` in the More sheet, footer, prefetch map and SEO table; the receipt panel's anchor control plus a single link to the verifier; and the tools page's live result regions, associated labels, `Cmd/Ctrl+Enter` decode and scroll-margin anchors. Nothing here calls a node, relay or explorer, and no research fact changed.

## Previous update — 2026-11-10 by Buffy — receipts you can check, and a wallet list you can question

Five more rails, and each one states what it cannot prove. Every sats figure now carries the rate and capture date behind it — the fee invoice, the stack total and the portfolio show `₿1 = $77,328 · captured 2026-08-22`, eighty days old and flagged, because a dollar figure converted without a date is a different claim each day. A gap tip can be settled through the visitor's own NIP-47 wallet: the wallet issues the invoice (`make_invoice`), the wallet reports settlement (`lookup_invoice`), and only a wallet-reported `paid` unlocks a kind-30078 receipt signed by the payer. That receipt is deliberately **not** a NIP-57 zap receipt — only the receiving node may issue one of those — and MotoPass never watched the payment. Signed ledger events can be committed to Bitcoin with one Satohash stamp over the sorted digest of their ids, showing a block height only when a block actually reports one. Signing works without a browser extension: NIP-46 `bunker://` connections and `nostrconnect://` pairing, every returned event checked against the template it was asked to sign, with NIP-05 resolution saying which npub a name points at (domain trust, not identity). A per-country standing plan multiplies open gaps by the suggested tip, and displays a BOLT12 offer only when the configured string passes its bech32 checksum; nothing in the browser issues an offer or charges a schedule. Three UI passes: a gap strip that names the open count and total sats and jumps to the first missing fact, a staged sign → publish → anchor ledger panel, and the dated rate note plus wallet fingerprint on the money surfaces. The wallet card gained a payments ledger: `list_transactions` read only when asked, newest first, with the date, direction, amount, state and description your wallet reports, and a row tagged `this receipt` only when its payment hash matches the receipt you signed. It is the wallet's list, not a MotoPass total, and unrelated payments can appear in it. A signed receipt now survives the tab that made it: the public event fields and its signature are kept on this device (never the wallet connection string), re-verified on load, and matched against the wallet's rows — so `your receipt` still means something after a reload, and a hand-edited entry stops counting. The ledger itself is now one shared panel on both the gap tip and the portfolio wallet card: All / Received / Sent / My receipts chips with live counts, a `showing n of m` line, and a plain statement of how many receipts this device holds. No research fact was added or changed, and no invoice, balance, block height or offer is fabricated.

**Receipt and wallet tools.** A receipt now reads without the tab that made it: Portfolio lists what this device holds, with copy, remove and clear, and a read-only relay lookup by npub pulls public kind-30078 receipts back — every returned event re-verified before it is merged, so a relay can add nothing this browser has not checked. A paste-and-verify box reads any receipt event, checks its id and signature locally, and reports the one Lightning claim that needs no third party: `sha256(preimage)` against the payment hash, or that the wallet reported no preimage at all. The wallet ledger gained date bounds (`from`/`until`, with absent bounds omitted rather than sent as zero), an unpaid-invoices mode (`unpaid: true`) that says no receipt can exist for one yet, and expandable rows showing the wallet-reported fee and the local preimage verdict. Nothing is summed, no key is sent to a relay, and no research fact changed.

## Previous update — 2026-11-10 by Buffy — an Evidence tab with Bitcoin, Lightning and Nostr rails

The record modal's Evidence tab now opens with a coverage meter and carries the layer-2 tools. Every fact row copies as a Markdown citation; rows whose source is archived show the probe's SHA-256 digest, re-hashed in the browser on click. Where the archive kept an excerpt rather than the hashed payload the chip says `digest only` — 61 of the 103 stored digests reproduce, and the other 42 are excerpts, not changed sources. Missing facts offer a Lightning tip: a real LNURL-pay invoice resolved live from `motopass@breez.tips`, clamped to the server's own range, with the copy saying plainly that a tip does not fill the gap. The same tab publishes the audit trail as kind-30078 Nostr events signed by the visitor's npub, timestamped with each row's own date rather than the publish time, and hands back the JSON when no NIP-07 signer is present. Portfolio gains a NIP-47 card that sends only `get_balance` and keeps the connection string in sessionStorage. Modal tabs are sticky and snap-scroll, so seven-plus tabs stay usable on a phone. No research fact was added or changed, and no invoice, balance or event is fabricated.

## Previous update — 2026-11-09 by Buffy — banking on a published index, evidence per fact

Banking went from 1/21 to 11/21 by adopting one citable method: World Bank Findex account ownership, scored as a decile, with the percentage, year and API URL stored beside every score (`docs/BANKING-SCORE-RUBRIC.md`). The other 10 have no Findex observation and stay null with a written reason; São Tomé's unrecomputable agency score of 3 was withdrawn. Every one of the 23 facts can now name the audit row and URL that last wrote it — the table's `n/23` badge expands into that list, and mobile cards show the same completeness badge. Cayman's mobility stays null on purpose: BOTC counts in the wild disagree by 119 destinations. Canada was not added because IRCC has paused the Start-up Visa.

## Previous update — 2026-11-09 by Buffy — gaps filled from sources, facts column, day panel

21 programs now carry 22 or 23 of the 23 research facts (São Tomé 23). Bahamas 90-day presence and 10-year citizenship, Barbados 5 years and no codified minimum, Cayman 20 years to Caymanian status, Vanuatu's missing crypto-tax sentence, 20 mobility scores from Henley 2026 and the 8 blank tax scores were filled from named sources with audit rows. Banking stays empty on 20 programs because no comparable measure exists. The programs table gained a sortable facts-on-file column; the day panel now draws "no minimum" as a row.

## Previous update — 2026-11-09 by Buffy — selection board card, country coverage audit

The Programs count line moved out of the results grid to the top of the page, in a card above Advice: live match count, region chips with counts, jurisdiction / flagship / sources-on-file chips, and four `facts on file` counts for the filtered set. `npm run coverage:data` and `docs/COUNTRY-DATA-COVERAGE.md` record what each of the 21 programs is missing. No research facts were added. Not committed yet.

## Previous update — 2026-11-09 by Grok — passport, one-country copy, day receipts

Programs can lead with one passport, copy one country's change note without sending it, and open the sentence under a day bar. The phone route total pins to the top. A Satohash 429 retries that program and then continues. Intel calls a check fresh for 30 days. `cbiu.gov.dm` and `cnmv.es` stay probe-only. Research was not edited. Code commits: `84aa8e2`, `8a81d05`, `f7aca94`.

## Previous update — 2026-11-09 by Grok — citizen advice, sentences, days, Bitcoin fee

Programs shows what the US, UK, and Argentine pages tell their own citizens, the probe's stored before-and-after, the days each program asks for across the whole path, and a sats figure only where the note says the fee can be paid in Bitcoin. Phone compare keeps a long note to three lines. Research was not edited. Code commit: `abf1e6e`.

## Previous update — 2026-11-09 by Grok — bell, gazettes, mixer, compare clocks

Programs now shows a change bell, which gazettes are already watched, and a route mixer with announced routes behind a switch. Compare adds days in country, years to citizenship, fee-in-Bitcoin stance, and how you file. Research was not edited. Code commit: `8380862`.

## Previous update — 2026-11-09 by Grok — three decision clocks

Every program shows processing time, days in the country, and years to citizenship from the notes already on file. Announced routes stay labeled announced. Code commit: `f03eee7`.

## Previous update — 2026-11-09 by Grok — score meters, prices, region rail

Programs scores show a 0–100 meter, investment figures stay on one line, and the region list shows a count next to a visible match total. Code commit: `b473681`.

## Previous update — 2026-11-09 by Grok — tests match the cleared Uruguay probe

The 9 Nov probe left Uruguay unchanged and `minterior.gub.uy` ok. The two tests that still expected an open review now follow that catalog. `npm test` is 343 passed, 2 skipped. Cloudflare Pages failed the header commit, so the live site was still the `273eea0` bundle. Test commit: `c2d81e4`. Header code remains `3dac3a8`.

## Previous update — 2026-11-09 by Grok — table header clears the first country

The programs chart title row no longer covers the first country in git. It sits on its own opaque row, and Score sorts in the same style as the other columns. That commit did not reach production: Pages marked the deploy failed and the site kept serving `273eea0`. Code commit: `3dac3a8`.

## Previous update — 2026-11-08 by Grok — flags and dead links

Country cards show a sprite flag beside the name, including São Tomé and the UAE. The sprite URL carries `?v=6` so the edge cache does not keep the old 5-row sheet. Timeouts and confirmed 404s open in the Wayback Machine. Walled pages stay on the live URL. The Sources tab no longer crashes on a blocked row. The mobile badge coach wraps full sentences. Research dates and the 21 proofs were not moved. Code commit: `78c63ca`.

## Previous update — 2026-11-08 by Grok — 21 proofs re-anchored

All 21 Satohash proofs match the 8 Nov slice. Intel is 21 fresh, Satohash up, Uruguay stays the open review. Source badges show `8 Nov`. Source Monitor history is an older log (`2 Oct 2026`). Mobile region chips fade at the right edge. THOR's Chromium binary is not installed until the host runs `npm run probe:browser` or the next probe. Code commit: `9d3d06a`.

## Previous update — 2026-11-08 by Grok — worst URL, open review, 8 Nov re-read

Source Monitor chips follow the worst open URL: 1 changed, 15 healthy, 3 blocked, 2 unreachable. Uruguay's open review is `https://www.minterior.gub.uy`. All 21 research dates are 2026-11-08 from pages that actually loaded. Proofs read out of sync until the daily re-stamp. Commit: `2215860`.

## Previous update — 2026-11-08 by Grok — source monitor matches the 21

The source monitor follows the catalog: only Uruguay is changed, and that card says changed. Program cards and the table show `Sources probed 8 Nov` beside the September research badge. `last_checked` was not moved. Commit: `788e8ca`.

## Previous update — 2026-11-08 by Grok — truth pass on the 21-program catalog

Badges, HQ metrics, BTC Map cache, and launch gates now match the curated 21. Nine stuck "source changed" flags cleared; Italy and Uruguay remain. Spain $32,000 is the cheapest stated minimum. Applications stay closed. Research `last_checked` is still 2026-09-29. Commit: `43acd6c`.

## Previous update — 2026-09-30 by Buffy — PR #1 merged, live deploy verified

PR #1 merged to `main` (`4c878b4`), all six CI checks green, Cloudflare deployed. Verified LIVE in rendered DOM (headless Chromium on M3): bundle salt matches the merge commit; hero shows "Flagship depth 21/21" + "21 jurisdictions" (settled read); `/agents` has zero HERMES/M4 mentions; São Tomé live at 21/21 with its stamp pending Bitcoin confirmation; no mobile overflow, no page errors. Sampling note: DOM numbers must be read settled (0/21 and 19/21 were mid-animation artifacts). Cam's 9 workflow rules (gh-first on THOR, verify branch math, CI-green before merge, bundle-salt deploy proof, no false-positive content scans) absorbed as standard.

Landing hero no longer claims "50-country" / "50/50 flagship depth": all copy now reflects the curated 21-country corpus (en + 9 locales), flagship depth is computed from `countries.json` ("Flagship depth 20/21" — São Tomé in research), and the CI `validate:stamps` gate that stayed red on the stale ≥50 threshold now tracks the real corpus as a stamp-integrity gate. Hero modernized: corpus provenance badge, depth chip, 4-cell live stat band, scroll cue — everything prior preserved. E2E: BUILD-id specs skip with stale-dist guidance instead of failing; new tier-chip + compare-filter spec. tsc 0, unit 306/2, lint, build, pitch:check, **Playwright 37/37**. Pushed through `b4eb3a1` on `docs/meridian-ledger-brief`; PR into `main` still waits on Cam's GitHub credentials.

## Previous update — 2026-09-30 by Buffy — typecheck debt cleared, repo typechecks clean

`tsc --noEmit` now exits 0 (was 13 pre-existing errors): `SourceChangeEvent.status` made optional to match the watchdog feed's real rule-event shape, SourceMonitor helpers/styles typed, ThankYou switched to `SeoHead path`. Vitest 305/2 skip, lint, validate:data pass; **full Playwright suite 34/34** incl. new route coverage for `/sources` and `/thank-you` (`e2e/routes-sources-thankyou.spec.ts`, 7 tests — note: E2E is build-staleness-sensitive, rebuild before judging). Pushed on `docs/meridian-ledger-brief`; PR into `main` still waits on Cam's GitHub credentials (branch is on origin, nothing blocked).

## Previous update — 2026-09-29 by Buffy — CI validation, Compare onboarding, consistent page framing

Fixed the GitHub CI blocker for the current 21-program catalog, improved Compare defaults/restore/clear flows, unified the six requested page headers/frames, and retained the earlier Programs BTC-tier/freshness upgrades. Uncommitted on `docs/meridian-ledger-brief` (base `6df8b74`); validate:data, 305 unit tests, lint, production build, and focused Playwright checks pass. Typecheck has unrelated existing errors; no push/deployment performed.

## Previous update — 2026-09-15 by Rosa (THOR) — retire two rotating-rail watch URLs (Paraguay set.gov.py + UAE u.ae)

**Update 22:45 (Rosa, THOR) — curation `t_95a8142e`.** Retired `https://www.set.gov.py` (Paraguay) and
`https://u.ae` (UAE) from the watchdog watch list — both were the `immd.gov.hk`-class rotating content rail
whose rule scope generated repeated false "content changed" events. Each was kept in `legal_compliance.official_urls`
and its rules coverage now rests on already-watched rules-bearing siblings (Paraguay: `migraciones.gov.py/residencia-temporal/`
+ `/aranceles-migratorios/`; UAE: `www.vara.ae` + `icp.gov.ae/en/` — all rule_scope present). Per-URL `audit_trail`
entries record the retire. Feed regenerated on the v9 harness: **128 URLs (was 130) · ok 116 · rule-changed 0 ·
rebaselined 0**; live `source-monitor.json` carries neither retired URL; orphaned `set.gov.py` snapshot key and its
one false `rule` event were cleared; `npm run validate:data` clean (50 programs, schema v3). No harness change —
`scripts/probe-sources.mjs` untouched.

## Previous — Last Updated 2026-09-15 by Kimi (THOR) — CI hygiene (action runtime deadline + phantom red)

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
