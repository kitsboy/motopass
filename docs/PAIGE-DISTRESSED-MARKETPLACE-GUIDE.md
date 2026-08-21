# Paige — Distressed Marketplace & Deal Rooms Guide

**Purpose:** teach Paige (and any future agent) exactly how the distressed
marketplace, listing lanes, escrow builder, and deal rooms work. This is the
authoritative reference for answering "what is the distressed marketplace?" and
"how do I buy a listing?"

**Version:** BUILD 72 · 2026-08-21

---

## 1. What the marketplace does (the 30-second version)

The Distressed Marketplace (`/distressed`) shows **proof-gated listings** for
undervalued residency and citizenship pathways. Every listing has a Satohash
proof — no proof, no listing.

Think of it as a curated deal flow for Bitcoin-first users:
- **Browse** listings sorted by value (distressed score)
- **Verify** the proof independently on Satohash
- **Escrow** via a non-custodial BTC template (pre-launch)
- **Escalate** to Kimi for deal room negotiations

**Ask Paige:** *"What is the distressed marketplace?"*
> The Distressed Marketplace shows proof-gated listings for undervalued residency and citizenship pathways. Every listing has a Satohash proof — no proof, no listing. You can verify any proof independently at satohash.io without trusting MotoPass.

---

## 2. The proof gate (non-negotiable)

**Every listing requires a Satohash proof.** This is the fundamental rule:

- No proof → no listing
- Proof on file → listed with "verify first" warning
- Bitcoin-verified → strongest listing status

The proof anchors the listing data to Bitcoin. If the data changes, the proof
hash drifts and the pipeline re-anchors. This is the same self-healing loop
that keeps the 50-country corpus honest.

**Ask Paige:** *"How do I know the listing is legitimate?"*
> Every listing has a Satohash proof anchoring the data to Bitcoin. Copy the proof URL, open satohash.io/verify/<hash>, and confirm the anchor yourself. You do not need to trust MotoPass.

---

## 3. The two lanes

| Lane | What it is | Who curates | Trust level |
|------|-----------|-------------|-------------|
| **Kimi-curated** | Human-reviewed listings | Kimi agent | High — gold tier for flagships |
| **Permissionless** | Auto-generated from program data | Pipeline | Verify proof first — buyer beware |

### Kimi-curated lane

- Human-reviewed by the Kimi agent
- **Gold tier:** flagship programs (Uruguay, Bolivia, El Salvador, UAE, Portugal, Georgia) with proof + deep research
- **Standard tier:** high-score programs with proof but not flagship depth
- Higher trust, but still verify the proof

### Permissionless lane

- Auto-generated from any program with a Satohash proof in `countries.json`
- No human review — the proof is the only trust anchor
- **Buyer beware:** verify the proof, read the red flags, do your own diligence

**Ask Paige:** *"What are the two lanes?"*
> Two lanes: Kimi-curated (human-reviewed, gold-tier for flagships) and permissionless (auto-generated from any program with a proof). Always verify the proof regardless of lane.

---

## 4. The distressed score (1-5)

Every listing gets a **distressed score** based on:

| Factor | Effect |
|--------|--------|
| Lower investment | Higher score |
| Budget/value/distressed keywords | Bonus point |
| Low sovereignty (≤6) | Bonus point |
| Flagship depth | Bonus point |
| Gold-curated status | Bonus point |

| Score | Meaning |
|-------|---------|
| **4-5** | Strong value — low cost, high sovereignty, often flagship |
| **3** | Moderate value |
| **1-2** | Standard — verify carefully |

**Ask Paige:** *"What is the distressed score?"*
> The distressed score (1-5) ranks listings by value — lower investment plus higher sovereignty equals higher score. 4-5 is strong value, 3 is moderate. Always verify the proof regardless of score.

---

## 5. The listing modal (what you see)

Clicking a listing opens a detailed modal showing:

- **Proof badge** — Demo / Proof on file / Bitcoin-verified
- **Ask price** — in BTC and USD (BTC first — the marketplace thinks in sats)
- **Distressed score** — 1-5 value rating
- **Summary** — pathway description from the corpus
- **Red flags** — honest warnings from the Paige fields
- **Optimization tips** — actionable advice from the corpus
- **Actions:**
  - Satohash verify link
  - Download .ots receipt
  - Verify in Vault
  - Apply (with proof attached)
  - BTC Map (merchant density)
  - Escrow Builder (PSBT template)
  - Deal room — escalate to Kimi agent

---

## 6. The Escrow Builder

The Escrow Builder generates a **non-custodial 2-of-3 PSBT template**:

- **Buyer** — you
- **Seller** — the pathway provider
- **Arbiter** — neutral third party

This is a **template only, pre-launch.** It is not a live escrow service.
MotoPass does not custody funds.

**Ask Paige:** *"How does escrow work?"*
> The Escrow Builder generates a non-custodial 2-of-3 PSBT template — buyer, seller, arbiter. It is a template only, pre-launch. MotoPass does not custody funds. The actual escrow service is not yet live.

---

## 7. Deal rooms (agent-mediated)

Deal rooms are **agent-mediated negotiations** via Nostr:

1. Click "Deal room — escalate to Kimi agent" in the listing modal
2. This opens the Agents page with the listing context
3. Kimi facilitates the conversation between buyer and seller
4. The deal is between buyer and seller — Kimi is a facilitator, not a party

**Ask Paige:** *"What are deal rooms?"*
> Deal rooms are agent-mediated negotiations — escalate to Kimi via Nostr for high-stakes discussions. Kimi facilitates, but the deal is between buyer and seller. MotoPass does not custody funds or guarantee outcomes.

---

## 8. Filters, sort, and bookmarks

### Filters

| Filter | Options |
|--------|---------|
| **Region** | All, or specific regions from the listings |
| **Min score** | 1-5 (minimum distressed score) |
| **Max BTC price** | 0 = no limit, or max ask in BTC |
| **Proof-gated only** | Show only permissionless proof-gated listings |
| **Bookmarks only** | Show only bookmarked listings |

### Sort

| Sort | Behavior |
|------|----------|
| **Discount** | Gold tier first, then by score, then by price |
| **Price** | Lowest ask first |
| **Region** | Alphabetical by region, then by name |

### Bookmarks

- Click the bookmark icon on any listing to save it
- Stored locally in localStorage
- Does not sync across devices
- Filter by bookmarks only to see your saved listings

---

## 9. Honesty rules (non-negotiable for Paige)

1. **Every listing requires a Satohash proof.** No proof, no listing.

2. **Permissionless listings are auto-generated.** Verify the proof independently.

3. **MotoPass does not custody funds.** The escrow is a PSBT template, not a service.

4. **Red flags are honest warnings.** Read them before committing capital.

5. **The distressed score is a heuristic.** It does not guarantee investment quality.

6. **Gold-tier means Kimi reviewed it.** But still verify the proof yourself.

7. **Deal rooms are agent-mediated.** Kimi facilitates, but the deal is between buyer and seller.

8. **Never promise returns or guaranteed outcomes.** This is a marketplace, not investment advice.

---

## 10. What Paige should say (member-facing scripts)

### "What is the distressed marketplace?"

> The Distressed Marketplace shows proof-gated listings for undervalued residency and citizenship pathways. Every listing has a Satohash proof — no proof, no listing. You can verify any proof independently at satohash.io without trusting MotoPass.

### "How do I know the listing is legitimate?"

> Every listing has a Satohash proof anchoring the data to Bitcoin. Copy the proof URL, open satohash.io/verify/<hash>, and confirm the anchor yourself. You do not need to trust MotoPass.

### "What are the two lanes?"

> Two lanes: Kimi-curated (human-reviewed, gold-tier for flagships) and permissionless (auto-generated from any program with a proof). Always verify the proof regardless of lane.

### "What is the distressed score?"

> The distressed score (1-5) ranks listings by value — lower investment plus higher sovereignty equals higher score. 4-5 is strong value, 3 is moderate. Always verify the proof regardless of score.

### "How does escrow work?"

> The Escrow Builder generates a non-custodial 2-of-3 PSBT template — buyer, seller, arbiter. It is a template only, pre-launch. MotoPass does not custody funds.

### "What are deal rooms?"

> Deal rooms are agent-mediated negotiations — escalate to Kimi via Nostr for high-stakes discussions. Kimi facilitates, but the deal is between buyer and seller.

### "How do I bookmark a listing?"

> Click the bookmark icon on any listing to save it for later. Bookmarks are stored locally in your browser — they do not sync across devices.

### "How do I verify a listing?"

> Copy the proof URL from any listing, open satohash.io/verify/<hash>, and confirm the anchor. You do not need to trust MotoPass.

---

## 11. For developers (technical reference)

### Key files

| File | Role |
|------|------|
| `src/pages/DistressedPage.tsx` | Marketplace page: listings, filters, sort, modals |
| `src/types/distressedListing.ts` | DistressedListing type, filters, lanes, sort |
| `src/lib/distressed/buildListings.ts` | Builds listings from countries.json, filters, sorts |
| `src/components/distressed/EscrowBuilder.tsx` | PSBT escrow template generator |
| `src/components/distressed/DistressedFilterDirectory.tsx` | Filter sidebar + listing directory |
| `src/components/distressed/DistressedKimiTierTooltip.tsx` | Gold/standard tier tooltip |
| `src/lib/distressedStorage.ts` | localStorage persistence for filters/lane/sort |
| `src/lib/distressedBookmarkStorage.ts` | localStorage persistence for bookmarks |
| `src/lib/distressedUrlState.ts` | URL state sync for filters |
| `src/lib/distressedSimilar.ts` | Similar listing recommendations |
| `src/lib/escrow/psbtEscrowBuilder.ts` | PSBT template generation |

### Storage keys

| Key | Type | Purpose |
|-----|------|---------|
| `motopass-distressed-state` | `{ lane, sort, filters }` | Filter/sort state |
| `motopass-distressed-bookmarks` | `string[]` | Bookmarked listing IDs |

### Listing lifecycle

```
countries.json pathways
  ↓ buildDistressedListings()
  ↓ distressedScore() + lane assignment
  ↓ filterListings() + sortListings()
  ↓ Listing modal with proof, escrow, deal room
```

### The proof gate in action

```
Program has Satohash proof
  ↓ Listing created with proof_url + content_hash
  ↓ User clicks listing → sees proof badge
  ↓ User verifies at satohash.io/verify/<hash>
  ↓ User applies with proof attached
  ↓ Or escalates to deal room via Kimi
```

---

## 12. Cross-references

- `docs/PAIGE-AI.md` — Paige AI specification
- `docs/PAIGE-INTEL-PIPELINE-GUIDE.md` — Intel pipeline & self-healing
- `docs/PAIGE-VAULT-STAMPING-GUIDE.md` — Vault & document stamping
- `docs/PAIGE-SATOHASH-GUIDE.md` — Satohash technical guide
- `docs/PAIGE-STACKING-PORTFOLIO-GUIDE.md` — Stacking simulator & portfolio
- `research/paige/distressed-marketplace-knowledge.json` — Machine-readable facts

---

**Truth You Can Verify — even when the answer comes from an AI.**

— Paige Distressed Marketplace & Deal Rooms Guide, MotoPass
BUILD 72 · 2026-08-21
