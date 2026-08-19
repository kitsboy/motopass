# Current Status — MotoPass

**Version:** BUILD 71 (v0.2.0)  
**Last Updated:** 2026-08-18 (session end · Grok/M3)  
**Domain:** motopass.giveabit.io  
**Status:** 🟢 Live · main @ `4b39a86`

## Recent Milestones
- BUILD 71 — Eager Distressed/Agents/Apply/Simulator; honest distressed badges; NIP-01 + Schnorr before publish; redacted Apply/Profile hashes; `dist/` untracked
- BUILD 70 — Programs `useLocation` crash; dedupe react-router; route error boundary
- BUILD 69 — Verify i18n-context crash; i18n fallback; visible cards
- BUILD 68 — Nostr + Satohash timestamp attestations; `docs/SECURITY-TIMESTAMP-NOSTR.md`
- BUILD 67 — Imagine brand assets; Satohash poll; live LN Address

## Known Issues
- BOLT12 / Liquid / Silent / PYNYM rails still demo stubs (Lightning + on-chain are live addresses)
- Repo-wide `tsc --noEmit` cleanup pending
- Paige backend still retrieval/local (no hosted LLM)
- Full Lightning BOLT11 invoice mint (LNbits) not yet wired — LN Address QR is live path
- BTC Map / Portfolio / Blog still lazy — watch for router-context crash

## Next Steps
- Wire LNbits/BOLT11 mint when node env is ready (`VITE_LNBITS_*`)
- Smoke remaining lazy routes on every nav click
- Live Nostr relay portfolio sync
- Paige Phase 2 (Nostr DM + grounded backend)

## Deploy
- CF Pages project `motopass` · CI builds `dist/` (not in git) then wrangler deploy
- Live: https://motopass.giveabit.io
- Satohash API: https://api.satohash.io/health
