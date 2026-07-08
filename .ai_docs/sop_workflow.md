# motopass — Standard Operating Procedure

> **Project:** MotoPass — Bitcoin Sovereign Passports & Residency
> **Live:** https://motopass.giveabit.io
> **Repo:** `~/projects/motopass` (M3), pushed to `origin main` for Cloudflare Pages auto-deploy

---

## 1. Installation & Setup

```bash
cd ~/projects/motopass
npm ci         # clean install from package-lock.json
```

**Node requirement:** `>=20` (engines field)

**Environment variables** (copy from `.env.example` to `.env.local`):

| Variable | Required | Purpose |
|----------|----------|---------|
| `CLOUDFLARE_API_TOKEN` | For manual deploy | Cloudflare Pages deploy token (Edit perms) |
| `VITE_SITE_URL` | For build | Deployed site URL (`https://motopass.giveabit.io`) |
| `VITE_SATOHASH_URL` | Optional | Satohash API base URL |
| `VITE_NOSTR_RELAY` | Optional | Nostr relay for identity features |

---

## 2. Local Development

```bash
npm run dev      # Vite dev server -> http://localhost:5173
```

- Hot-reload enabled via Vite + React plugin
- Static dirs (`research/`, `website/`, `images/`) served by custom `motopassStaticAssets` plugin
- `public/` served automatically by Vite (logo, sitemap, robots, headers, redirects)

---

## 3. Lint & Format

```bash
npm run lint      # eslint src/ --max-warnings 50 (TypeScript + React hooks)
npm run format    # prettier --check src/
```

**ESLint config:** `eslint.config.js` — TypeScript-ESLint + react-hooks + react-refresh
**Prettier config:** `.prettierrc`

---

## 4. Test

```bash
npm test          # vitest run
```

**Vitest config:** `vitest.config.ts`
- Environment: `node`
- Test patterns: `src/**/*.test.ts`, `scripts/**/*.test.ts`
- See: `src/lib/pitchStats.test.ts`, `src/lib/programFilter.test.ts`, `src/lib/satohash.test.ts`, `src/lib/userStorage.test.ts`

---

## 5. Data Validation

```bash
npm run validate:data    # node scripts/validate-data.mjs — validates countries.json schema
```

---

## 6. Health Check

```bash
npm run health-check     # bash scripts/health-check.sh
```

Checks (against `https://motopass.giveabit.io` by default):
- `research/countries.json` Content-Type and content fetch
- Program count >= 25 programs
- `logo.png` and `sitemap.xml` availability
- Retries up to 5 times with 8s delay

---

## 7. Build

```bash
npm run build      # vite build -> outputs to dist/
```

- Build output: `dist/`
- Static assets from `research/`, `website/`, `images/` are copied into `dist/` by `motopassStaticAssets` plugin at closeBundle
- Vite config: `vite.config.ts`

---

## 8. Deploy (Cloudflare Pages)

### Manual deploy (from M3 or M4):

```bash
# Check deploy readiness first
npm run deploy:check          # verifies CLOUDFLARE_API_TOKEN is set

# Build + deploy to motopass.giveabit.io
npm run deploy                # npm run build && wrangler pages deploy dist --project-name=motopass --branch=main

# Safe deploy (same but with echo warning)
npm run deploy:safe

# Verify-only (build, don't deploy)
npm run deploy:verify         # builds and prints success
```

### CI deploy (GitHub Actions):

Push to `origin main` — Cloudflare Pages auto-builds from repo at `https://github.com/kitsboy/motopass`.
The `dist/` dir is committed and CI badge is in the README.

### Cross-machine deploy (M3 -> M4 rsync pattern):

```bash
# On M3: build and rsync to M4
npm run build
rsync -avz --delete ~/projects/motopass/dist/ m4:~/tmp-motopass-dist/

# On M4: deploy
wrangler pages deploy ~/tmp-motopass-dist/ --project-name motopass
```

---

## 9. Goal Verification

```bash
npm run verify:goal           # bash scripts/verify-goal.sh
```

Full pipeline that:
1. Runs `npm run build` — checks dist artifacts exist (countries.json, logo.png, sitemap.xml)
2. Runs `npm test` — vitest
3. Validates git status and pushes if ahead of origin/main
4. Deploys with `wrangler pages deploy`

Requires `SCRATCH` env var set to evidence output directory.

---

## 10. Post-Deploy Verification

```bash
curl -sI https://motopass.giveabit.io | head -1
curl -s https://motopass.giveabit.io/research/countries.json | head -c 200
```

---

## Troubleshooting

| Problem | Check |
|---------|-------|
| Build fails | Run `npm ci` first; verify Node >=20 |
| Deploy fails (auth) | `echo $CLOUDFLARE_API_TOKEN` — set in `.env.local` |
| Dev server can't find assets | Vite config uses `fs.strict: false` for cross-dir serving |
| `wrangler` not found | Install via `npm install -g wrangler` or use npx |
| Image assets 404 | Run build — static assets copied at bundle close |
