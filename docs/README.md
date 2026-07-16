# MotoPass Documentation Hub

**BUILD:** 2026.07.15-66 · **Last updated:** 2026-07-15

Official documentation for MotoPass. All long-form docs live here unless required at repo root (see [WORK-TREE.md](./WORK-TREE.md)).

---

## Quick navigation

| I need to… | Read |
|------------|------|
| See what's shipped & what's next | [UPDATES-MAP.md](./UPDATES-MAP.md) |
| Find any file in the project | [WORK-TREE.md](./WORK-TREE.md) |
| Understand the project canon | [SOURCE-OF-TRUTH.md](./SOURCE-OF-TRUTH.md) |
| Pick up from last Grok session | [KIMI-HANDOFF.md](./KIMI-HANDOFF.md) |
| Pitch figures (₿ · USD, auto-synced) | [PITCH-ANCHOR.md](./PITCH-ANCHOR.md) · [pitch/README.md](./pitch/README.md) |
| Build or style UI | [DESIGN-CONTEXT.md](./DESIGN-CONTEXT.md) + [DESIGN-TOKENS.md](./DESIGN-TOKENS.md) |
| Understand full scope | [PRODUCT-SCOPE-ROADMAP.md](./PRODUCT-SCOPE-ROADMAP.md) |
| System architecture & nav | [ARCHITECTURE.md](./ARCHITECTURE.md) · [DIRECTORY-MAP.md](./DIRECTORY-MAP.md) |
| Agent context map | [.ai_docs/context_map.md](../.ai_docs/context_map.md) |
| BTC Map integration details | [ARCHITECTURE.md](./ARCHITECTURE.md) · [DATA-MODEL.md](./DATA-MODEL.md) |

---

## Read order (new agents)

1. **[SOURCE-OF-TRUTH.md](./SOURCE-OF-TRUTH.md)** — Canonical project record
2. **[UPDATES-MAP.md](./UPDATES-MAP.md)** — Build history & work queue
3. **[KIMI-HANDOFF.md](./KIMI-HANDOFF.md)** — Latest M3 session (bottom section)
4. **[SESSION-SUMMARY-2026-07-15-BUILD66.md](./SESSION-SUMMARY-2026-07-15-BUILD66.md)** — Compare fix session (goodbye)
5. **[EXECUTIVE-SUMMARY.md](./EXECUTIVE-SUMMARY.md)** — Strategic one-pager
6. **[PRODUCT-SCOPE-ROADMAP.md](./PRODUCT-SCOPE-ROADMAP.md)** — Phased ambition
7. **[DESIGN-CONTEXT.md](./DESIGN-CONTEXT.md)** — Current UI direction

---

## Document index

### Strategy & marketing
- [PITCH-ANCHOR.md](./PITCH-ANCHOR.md) — canonical figures (Bitcoin-first)
- [pitch/README.md](./pitch/README.md) — self-evolving pitch pack
- [SOVEREIGN-STACK-4-PILLARS.md](./SOVEREIGN-STACK-4-PILLARS.md)
- [EXECUTIVE-SUMMARY.md](./EXECUTIVE-SUMMARY.md)
- [MARKETING.md](./MARKETING.md)
- [MISSION.md](./MISSION.md)
- [PROJECT-VISION.md](./PROJECT-VISION.md)
- [GLOSSARY.md](./GLOSSARY.md)

### Product & technical
- [PRODUCT-SCOPE-ROADMAP.md](./PRODUCT-SCOPE-ROADMAP.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md) — includes BTC Map v2 architecture
- [DATA-MODEL.md](./DATA-MODEL.md) — includes BTC Map cache/density schemas
- [BITCOIN-VERIFICATION.md](./BITCOIN-VERIFICATION.md)
- [PAIGE-AI.md](./PAIGE-AI.md)
- [I18N.md](./I18N.md)

### Design
- [DESIGN-CONTEXT.md](./DESIGN-CONTEXT.md) — **Canonical**
- [DESIGN-TOKENS.md](./DESIGN-TOKENS.md) — **Canonical**
- [DESIGN-REFERENCE.md](./DESIGN-REFERENCE.md)
- [DESIGN.md](./DESIGN.md) — Legacy + pointers
- [NEXT-PROMPT.md](./NEXT-PROMPT.md)

### SEO (localized)
- [SEO.md](./SEO.md) · [SEO-de](./SEO-de.md) · [SEO-es](./SEO-es.md) · [SEO-fr](./SEO-fr.md) · [SEO-pt](./SEO-pt.md) · [SEO-sw](./SEO-sw.md) · [SEO-zh](./SEO-zh.md)

### Process
- [CHANGELOG.md](./CHANGELOG.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [IMPROVEMENTS-QUEUE.md](./IMPROVEMENTS-QUEUE.md) — 200-item polish + BTC Map batches
- [DIRECTORY-MAP.md](./DIRECTORY-MAP.md) — Legacy index
- [archive/](./archive/) — Superseded docs

---

## Maintenance rules

1. Substantive changes → update relevant doc + `docs/UPDATES-MAP.md`
2. Every Grok session → append `docs/KIMI-HANDOFF.md`
3. BUILD increments on meaningful milestones (`BUILD-YYYY.MM.DD-NN`)
4. Design changes → `DESIGN-CONTEXT.md` + `DESIGN-TOKENS.md` first
5. Data schema changes → `DATA-MODEL.md` + `research/countries.json`
6. BTC Map data refresh → `npm run btcmap:density` + `npm run btcmap:sync`

**Prime directive:** “Truth You Can Verify.”

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*