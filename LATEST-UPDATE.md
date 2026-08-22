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
