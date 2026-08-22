# motopass — Last Updated 2026-08-23 by Ziggy/THOR
Brief: Adv8f Hindi (hi) — FULL Hindi translation verified complete + live; i18n coverage audit confirms ALL 9 non-EN locales at 0 missing keys
Commit: cdf8e1f (translation) · docs verified this pass
Deploy: https://motopass.giveabit.io · CF project motopass

What landed:
- FULL Hindi (hi) translation for MotoPass: hi dict (209 core keys) + pageKeysHi (766/766 page keys). Genuine Devanagari, no gibberish, 0 English fallback. English remains source of truth.
- Live-verified hi: vite build clean · browser probe (hi-IN locale) on / and /trust → lang=hi, Devanagari CORE renders (nav कार्यक्रम/एजेंट/तिजोरी/भरोसा, primary CTA आवेदन खोलें, taglines बिटकॉइन ही गति है / बिटकॉइन ही मूल्य है, freshness नया/पुराना, proof badges एंकर्ड/सत्यापित, trust axes). No English "Lightning ready"/"Crypto friendly" leak.
- i18n completeness audit: ALL 9 non-EN locales (es/fr/pt/zh/ar/sw/de/hi/ja) at 0 missing keys vs EN source of truth (764 page-keys + 206 base keys). Identical-to-EN values are legit proper nouns/brand IDs (Paige, Seal/Forge/Nexus/Ledger, SGT, Satohash, GitHub, btcmap-cli, 404, ID, ⌘L, sha256). docs/PAIGE-I18N-GUIDE.md updated: Partial → Full for all locales.

Live-verified: vite build clean · preview server serves fresh bundle · browser probe confirms hi CORE genuinely renders in Devanagari.

---

# motopass — Last Updated 2026-08-23 by Ziggy/THOR
Brief: Adv8d Arabic (ar) RTL — FULL Arabic translation shipped (CORE + long-tail), live-verified RTL rendering
Commit: 67546ee
Deploy: https://motopass.giveabit.io · CF project motopass

What landed:
- Complete Arabic (ar) translation for MotoPass: ar dict (209 keys) + pageKeysAr (766/766 page keys). Genuine Arabic, no gibberish. English remains source of truth.
- RTL fully wired and live-verified: languages.ts ar dir:'rtl', I18nContext sets document.documentElement.dir=rtl, index.css [dir='rtl'] rules. Live browser check: ar → lang=ar, dir=rtl, CSS direction:rtl, nav/tagline/pitch/btcPrice/currency/trust/vault all render in Arabic.
- HOTSPOT-safe: isolated ONLY the pageKeysAr hunk from sibling in-progress edits (es/fr/de/zh/hi/ja) in the shared working tree.

Live-verified: vite build clean · preview server serves fresh bundle (22,839 Arabic chars) · browser probe on /, /trust, /vault confirms dir=rtl + Arabic CORE strings render · all trust CORE keys (fresh/stale/sovereignty/watch/risk/addToCompare/sovScoreTitle) present in ar sources.

---

# motopass — Last Updated 2026-08-22 by Ziggy/THOR
Brief: Adv2 real onboarding — application-fee Lightning commerce loop wired end-to-end (Seam B)
Commit: 5315226 (origin/main, pushed)
Deploy: https://motopass.giveabit.io · CF project motopass

What landed:
- ApplicationFeeStep.tsx — real Lightning application-fee step on the MotoPass wallet. Zero-knowledge: invoice keyed only by payment_hash; no name/email/npub ever sent. QR + BOLT11 copy + open-in-wallet + honest settlement polling (never fakes a landed payment).
- applicationFee.ts — client for the Satohash public rail: GET /api/public/motopass/fee (128,247 sats), POST /api/public/motopass/invoice (real BOLT11, provider lnbits, mock:false), GET /api/public/motopass/status/:hash.
- ApplyPage: removed auto-redirect to /agents so the applicant completes payment; fee step renders after the canonical hash is sealed; OTS stamp step preserved.
- Server rail (Satohash, THOR, commit 07ea6a8): server/routes/motopass-fee.js + server/lib/lnbits.js — live-verified 2026-08-22 (fee config, real invoice, status poll all respond).
- Honest constraint shown in-UI: LND has 0 open channels, so a real inbound settlement is blocked until channels open. Same invoice route works the moment channels open.

Live-verified: fee config HTTP 200 (sats 128247, rail motopass@api.satohash.io:8443) · real BOLT11 invoice created (lnbc…, payment_hash, mock:false) · status endpoint returns {paid:false, pending, amount_msat:128247000} · live bundle contains fee-step strings · 48 test files / 247 tests pass · vite build clean.

---

# motopass — Last Updated 2026-08-22 by Ziggy/THOR
Brief: Adv5 zero-knowledge persistence — real Nostr relay live on THOR (relay.motopass.giveabit.io), NIP-44 v2 encrypted state sync (zkNostrSync.ts), RUSTSEC-2026-0227 mitigation applied + verified
Commit: a849bb2 (rebased onto origin/main)
Deploy: https://motopass.giveabit.io · CF project motopass

What landed:
- src/lib/zkNostrSync.ts — user-owned-key NIP-44 v2 encrypted persistence (kind 30078, d=motopass:prefs). RUSTSEC-2026-0227-hardened decrypt (early max-size pre-check). No key = full functionality, session-only.
- src/lib/zkNostrSync.test.ts (15 tests, incl. official NIP-44 v2 vector) + zkNostrSync.live.test.ts (2 live relay tests, auto-skip when relay unreachable).
- Relay: nostr-rs-relay 0.10.0 on THOR 127.0.0.1:7447, Caddy vhost wired, NIP-11 live-verified. DNS record (Cam dashboard, DNS-only A → 169.58.32.160) + on-disk Caddyfile persist are the only pending ops items.

---

# motopass — Last Updated 2026-08-22 by Grok/M3
Brief: Country-intel deepening blitz — 24/50 programs re-verified/corrected across 5 batches (El Salvador legal-tender revoked, Panama thresholds fixed, Portugal 7/10yr, Malta CBI terminated…) · Satohash re-stamp 10/24 · Claude research-pipeline prompt (source-trust engine blueprint)
Commit: d9a86f6
Deploy: https://motopass.giveabit.io · CF project motopass

---

# motopass — Last Updated 2026-08-18 by Grok/M3
Brief: BUILD 71 closed — Nostr+Satohash attestations, crash fixes, honest badges, dist untracked
Commit: 4b39a863ec0514e59ad919d9cb92d0ef38bb9444
Deploy: https://motopass.giveabit.io · CF project motopass

---

# motopass — Last Updated 2026-08-10 by Kimi/THOR
Brief: Lighthouse sweep — BTC spot ticker label-in-name (sr-only hint); sourcemaps; llms.txt; a11y 100 maintained
Commit: 776a092
Deploy: https://motopass.giveabit.io · CF project motopass

---

# motopass — Last Updated 2026-07-19 by Grok
Brief: Satohash API client (health/stamp/getStamp) + VerifyPage API stamp with deep-link fallback
Commit: 10abc3648655f1180e4c61362d3fc30fbb0eb76d
