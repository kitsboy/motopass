# Current Status — MotoPass

**Version:** BUILD 68 (v0.2.0)  
**Last Updated:** 2026-08-18 (Grok/M3)  
**Domain:** motopass.giveabit.io  
**Status:** 🟢 Live · main (BUILD 68)

## Recent Milestones
- BUILD 68 — Nostr + Satohash timestamp attestations; allowlisted hrefs; honest proof badges; recovery JSON; `docs/SECURITY-TIMESTAMP-NOSTR.md`
- BUILD 67 — Imagine brand assets; Satohash poll; live LN Address; countries depth
- BUILD 66 — Finance Compare eager-import fix + dropdown clip

## Known Issues
- BOLT12 / Liquid / Silent / PYNYM rails still demo stubs (Lightning + on-chain are live addresses)
- Repo-wide `tsc --noEmit` cleanup pending
- Paige backend still retrieval/local (no hosted LLM)
- Full Lightning BOLT11 invoice mint (LNbits) not yet wired — LN Address QR is live path
- `origin` previously HTTPS-auth broken; prefer SSH `git@github.com:kitsboy/motopass.git`

## Next Steps
- Wire LNbits/BOLT11 mint when node env is ready (`VITE_LNBITS_*`)
- Re-lazy Finance Compare after reliability budget
- Live Nostr relay portfolio sync
- Paige Phase 2 (Nostr DM + grounded backend)

## Deploy
- CF Pages project `motopass` · auto-deploy on main
- Live: https://motopass.giveabit.io
- Satohash API: https://api.satohash.io/health
