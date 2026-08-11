# Current Status — MotoPass

**Version:** BUILD 67 (v0.2.0)  
**Last Updated:** 2026-08-11 (session end · Grok/M3)  
**Domain:** motopass.giveabit.io  
**Status:** 🟢 Live · main @ `9222c9d`

## Recent Milestones
- BUILD 67 — Imagine brand assets wired (hero/sovereignty/passport/funding-flow/vault-archive); Satohash API health + pollStamp; live Lightning Address QR; countries.json narrative depth pass (feature `db2206c`)
- BUILD 66 — Finance Compare eager-import fix + dropdown clip
- 2026-08-10 — Kimi Lighthouse sweep (a11y ticker, sourcemaps, llms.txt)

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
