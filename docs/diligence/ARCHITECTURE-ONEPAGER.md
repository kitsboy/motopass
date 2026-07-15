---
title: Technical Architecture One-Pager
project: MotoPass
version: 1.0.0
audience: developers, technical partners
last_updated: 2026-07-14
owner: Kimi (Orchestrator) + Nova (Docs)
self_evolving: true
update_rule: >
  Any material change to product, stack, deploy path, traction, or ask
  MUST update this file in the same PR/commit when possible.
  Weekly freshness target: score >= 7 (see nova-product-management).
tags: [diligence, pitch, mvp, giveabit]
---
# MotoPass — Technical Architecture One-Pager

**Live:** https://motopass.giveabit.io · **Repo:** https://github.com/kitsboy/motopass · **Version:** `0.1.0`

## Stack
React/Vite · Cloudflare Pages · OTS/Satohash verification roadmap · country data models

## System map (boxes)
```
[User browser]
     |
     v
[SPA / static app on Cloudflare Pages]
     |
        +--------+--------+
|                 |
        v                 v
[Public APIs / LN / Nostr / OTS]   [Optional M3/M4 services]
```

## Architecture notes
- SPA intelligence dashboard
- Country program datasets (seeded subset toward 50)
- Finance/compare modeling layers
- Verification story: claims → OTS/Bitcoin
- Docs-heavy product (vision, data model, design tokens)

## Deploy path
Build on M3 → wrangler pages deploy dist/ --project-name motopass

## Data & privacy posture
Prefer client-side and user-held keys. Minimize PII. Bitcoin rails where payments exist. See project privacy/security docs if present.

## MVP boundary
- **In MVP now:** Live UI + seeded countries + finance modeling + verification architecture.
- **Explicitly later:** 50 countries, live Satohash on claims, portfolio simulator, Paige AI.

## Dependencies
Satohash/OTS; country law sources

## How a technical helper starts (15 min)
```bash
git clone https://github.com/kitsboy/motopass.git
cd motopass
# typically:
npm install
npm run dev
```
Read `README.md`, `docs/DEPLOYMENT.md` (or `DEPLOY.md`), and this file.

## Known gaps (full disclosure)
See Investor one-pager risks + project `LATEST-UPDATE.md` / handoffs. Do not claim production hardness without tests/deploy verification.

## Related
- [Investor one-pager](./INVESTOR-ONEPAGER.md)
- [Ask sheet](./ASK-SHEET.md)
- Deeper docs: `docs/ARCHITECTURE.md` (if present), `SOURCE-OF-TRUTH.md`, `docs/.ai_docs/`

---
**Safe Harbour:** Educational / informational only. Not financial, legal, or investment advice.
Bitcoin involves risk. DYOR. Not your keys, not your cheese.
Part of the [Give A Bit](https://giveabit.io) family.
