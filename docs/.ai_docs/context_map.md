# motopass — Context Map

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React |
| Styling | Tailwind CSS |
| Verification | OTS + Satohash |
| Payments | Silent Payments (planned) |

## Ports
| Service | Port |
|---------|------|
| Dev server | 5173 |

## Key Architecture
- CBI/RBI passport command center
- OTS-anchored document verification via Satohash
- 16 of 50 countries seeded with passport requirements
- "Truth You Can Verify" — blockchain-anchored credentials
- Zero-knowledge: no user data stored server-side

## Entry Points
| Path | Purpose |
|------|---------|
| src/ | React components |
| docs/ | Project documentation |
| public/ | Static assets |

## Hosting
Cloudflare Pages — manual deploy from M4
Custom domain: motopass.giveabit.io
