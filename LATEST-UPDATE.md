# motopass — Last Updated 2026-08-26 (end of session, Hermes/Kimi)

**Brief:** All languages now FULL (no English fallback), videos offloaded to R2, mobile CLS smoothness confirmed, MotoPass Nostr relay brought live.

## Languages — ALL FULL (Cam rule: Hindi stays LIGHT)
Committed + pushed to origin/master (motopass = M3/Grok lane; Cam green-lit these pushes):
- Portuguese FULL e15e682 · Arabic (RTL) FULL 50eaf39 · Japanese FULL 99cd49f6 · Swahili FULL f35fbb7
- Hindi: CORE + English fallback only (full declined per Cam).
- Swahili re-split into single-page cards (landing A1 t_fe1c9a7a, /trust A2 t_89e69b13, /compare A3 t_5fb0fd9e done; /programs B1 t_2c73edd2, /portfolio B2 t_fe2fb5d2, /vault+sim+menu B3 t_32e087b9 finishing).

## Video offload → R2 (t_c16aa991)
MotoPass explainer + OTS-walkthrough MP4s moved off the bundle → R2 bucket `giveabit-videos`, served at https://videos.giveabit.io. Commit 687498c pushed. Posters stay local, lazy+preload preserved, no CLS.

## Mobile CLS smoothness (confirmed this session)
All 4 pages clean on mobile: landing / 0.009, /compare 0.007, /programs 0, /portfolio 0 (was 0.4–1.0). Deferred content now reserves space, loads in-place, no viewport jump.

## MotoPass Nostr relay — LIVE (t_ac7d80df)
relay.motopass.giveabit.io was running on THOR but had no DNS record. Cam added the A record (169.58.32.160); Ziggy reloaded Caddy → now live. Zero-knowledge relay, nostr-rs-relay 0.10.0.

## Verify (t_0acd7659)
Bitcoin L1+L2 green: OTS/on-chain API (164 stamps, block, mempool), Lightning/LNURL working. One POST /api/stamp endpoint flagged for follow-up.

See docs/KIMI-HANDOFF.md (hq) for the full session log + FIXES-LOG.md.
