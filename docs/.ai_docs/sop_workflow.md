# motopass — Standard Operating Procedure

## Build
```bash
cd ~/projects/motopass && npm run build
```

## Dev Server
```bash
cd ~/projects/motopass && npm run dev
```

## Pre-Deploy Checks
```bash
cd ~/projects/motopass && git status && npm run build
```
## Deploy (Manual — wrangler from M4)
### Step 1: Sync dist from M3 to M4
```bash
rsync -avz --delete ~/projects/motopass/dist/ m4:~/tmp-motopass-dist/
```

### Step 2: On M4, deploy
```bash
wrangler pages deploy ~/tmp-motopass-dist/ --project-name motopass
```

## Post-Deploy Verify
```bash
curl -s ## Stack\n| Layer | Technology |\n|-------|-----------|\n| Frontend | React |\n| Styling | Tailwind CSS |\n| Verification | OTS + Satohash |\n\n## Ports\n| Service | Port |\n|---------|------|\n| Dev server | 5173 |\n\n## Key Architecture\n- CBI/RBI passport command center\n- OTS + Satohash document verification\n- 16/50 countries seeded\n- Silent Payments (planned)\n\n## Hosting\nCloudflare Pages manual deploy — motopass.giveabit.io | grep -q 'motopass'
```
