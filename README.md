# MotoPass — Bitcoin Sovereign Passports & Residency

**BUILD-20260702-012** · Last updated: 2026-07-02

[![CI](https://github.com/kitsboy/motopass/actions/workflows/ci.yml/badge.svg)](https://github.com/kitsboy/motopass/actions/workflows/ci.yml)
[![Live](https://img.shields.io/website?url=https%3A%2F%2Fmotopass.giveabit.io&label=motopass.giveabit.io)](https://motopass.giveabit.io)
[![Programs](https://img.shields.io/badge/programs-50-brightgreen)](https://motopass.giveabit.io/research/countries.json)

**Live:** https://motopass.giveabit.io

Bitcoin-native platform for CBI/RBI programs, jurisdictional stacking, and sovereign mobility. **Prime directive:** “Truth You Can Verify.”

---

## Quickstart

```bash
npm ci
npm run dev          # React app → http://localhost:5173
open website/index.html   # Static demo (zero-build reference)
```

```bash
npm run build && npm test
npm run deploy:safe  # Cloudflare Pages → motopass only
```

---

## Documentation (all in `docs/`)

| Doc | Purpose |
|-----|---------|
| [docs/README.md](docs/README.md) | Documentation hub |
| [docs/UPDATES-MAP.md](docs/UPDATES-MAP.md) | Build history & work queue |
| [docs/WORK-TREE.md](docs/WORK-TREE.md) | Complete file map |
| [docs/SOURCE-OF-TRUTH.md](docs/SOURCE-OF-TRUTH.md) | Canonical project record |
| [docs/KIMI-HANDOFF.md](docs/KIMI-HANDOFF.md) | Latest agent handoff |
| [docs/DESIGN-CONTEXT.md](docs/DESIGN-CONTEXT.md) | UI design (canonical) |
| [docs/PRODUCT-SCOPE-ROADMAP.md](docs/PRODUCT-SCOPE-ROADMAP.md) | Full build scope |

Root stubs (`SOURCE-OF-TRUTH.md`, `DESIGN.md`, etc.) redirect to `docs/`.

---

## Project layout

```
motopass/
├── README.md              ← You are here
├── docs/                  ← All documentation
├── src/                   ← React app (14 routes, dark mode)
├── research/countries.json ← 50 programs
├── website/index.html     ← Static demo
├── images/                ← Sovereign assets
└── scripts/               ← verify-goal, data tools
```

---

## Current state (BUILD-012)

- **Luminous Sovereign** light UI + dark mode toggle
- **50 jurisdictions** in live data
- Portfolio, Simulator, Compare, Vault, Nostr/Satohash stubs
- Motion landing hero (sovereignty.jpg @ 35% opacity)

**Next:** Deepen all 50 to Uruguay flagship template; live Satohash + Nostr.

---

## Agents

- **M3 (Grok):** Code, build, push — read `GROK-SESSION-PROTOCOL.md` each session
- **M4 (Kimi):** Orchestration — read `docs/KIMI-HANDOFF.md`

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*