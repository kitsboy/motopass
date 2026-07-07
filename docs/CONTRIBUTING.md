# Contributing to MotoPass

## Welcome

MotoPass is a Give A Bit production project. Contributions advance Bitcoin-native sovereign mobility.

## Before you start

1. Read [docs/SOURCE-OF-TRUTH.md](./SOURCE-OF-TRUTH.md)
2. Read [docs/UPDATES-MAP.md](./UPDATES-MAP.md) for current state
3. Read [docs/DESIGN-CONTEXT.md](./DESIGN-CONTEXT.md) for UI work

## Development setup

```bash
git clone https://github.com/kitsboy/motopass.git
cd motopass
npm ci
npm run dev
```

Optional — refresh BTC Map static data:

```bash
npm run btcmap:density   # merchant counts per jurisdiction
npm run btcmap:sync      # offline place snapshots
```

## Workflow

```bash
git checkout -b feature/your-feature
# make changes
npm run build && npm test
git commit -m "feat: description (BUILD-YYYYMMDD-XXX)"
git push origin feature/your-feature
# Open PR to main
```

## Guidelines

- **Design:** Use tokens from `docs/DESIGN-TOKENS.md` — no hard-coded hex in components
- **Data:** Edit `research/countries.json`; follow `docs/DATA-MODEL.md`
- **BTC Map:** Update `src/data/programCoords.ts` when adding jurisdictions; run `btcmap:density` + `btcmap:sync`
- **Deploy:** Only Cloudflare project `motopass` (`npm run deploy:safe`)
- **Docs:** Update `docs/` on substantive changes; append `docs/KIMI-HANDOFF.md` if M3 agent
- **Prime directive:** “Truth You Can Verify” — timestamp claims via Satohash

## Pull request checklist

- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] Relevant docs updated
- [ ] BUILD number incremented if milestone
- [ ] No deploy to wrong Cloudflare project

## Code of conduct

- Bitcoin sovereignty first
- Privacy by design
- Safe Harbour principles
- Respect the pristine `website/index.html` demo purpose

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*