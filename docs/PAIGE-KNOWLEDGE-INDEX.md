# Paige Knowledge Base — Master Index

> **11th knowledge topic** — auto-discovered by `import.meta.glob` (hot-loadable, zero code changes).

## What Is the Knowledge Base?

The Paige knowledge base is a **self-documenting, hot-loadable RAG system** that teaches Paige (the MotoPass AI agent) about every feature, workflow, and policy in the platform. Each topic is a standalone JSON file that is automatically discovered at build time — no code changes needed to add new topics.

---

## At a Glance

```
┌──────────────────────────────────────────────────────────────────┐
│                 PAIGE KNOWLEDGE BASE                             │
│                                                                  │
│  10 Topics  ·  220 Facts  ·  73 Member Scripts                  │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  satohash   │  │intel-pipeline│  │vault-stamp  │             │
│  │  9 facts    │  │  27 facts   │  │  20 facts   │             │
│  │  5 scripts  │  │  4 scripts  │  │  8 scripts  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │stacking-    │  │distressed-  │  │proactive-   │             │
│  │portfolio    │  │marketplace  │  │alerts       │             │
│  │ 19 facts    │  │  18 facts   │  │  17 facts   │             │
│  │ 10 scripts  │  │  8 scripts  │  │  6 scripts  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │verification-│  │onboarding-  │  │btcmap-      │             │
│  │lifecycle    │  │matching     │  │discovery    │             │
│  │ 35 facts    │  │  28 facts   │  │  27 facts   │             │
│  │  8 scripts  │  │  8 scripts  │  │  8 scripts  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │i18n-        │  │knowledge-   │  ← You are here              │
│  │international│  │index        │                               │
│  │ 20 facts    │  │  9 facts    │                               │
│  │  8 scripts  │  │  0 scripts  │                               │
│  └─────────────┘  └─────────────┘                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Topic Catalog

### 1. Satohash & Timestamping

| | |
|---|---|
| **File** | `satohash-knowledge.json` |
| **Facts** | 9 |
| **Scripts** | 5 |
| **Pages** | `/verify`, `/vault` |

**What it covers:** The Satohash.io timestamp engine, OpenTimestamps (OTS), SHA-256 hashing, Bitcoin proof lifecycle, stamp API, and verification.

**Key concepts:**
- OpenTimestamps commits a SHA-256 hash into a Bitcoin transaction
- Only the hash is sent — documents never leave the device
- Stamps are confirmed when included in a Bitcoin block
- Verification is independent — anyone can verify without trusting MotoPass

**Member scripts:** What is Satohash?, How much does it cost?, How long does stamping take?, How do I verify?, What can I stamp?

---

### 2. Intel Pipeline

| | |
|---|---|
| **File** | `intel-pipeline-knowledge.json` |
| **Facts** | 27 |
| **Scripts** | 4 |
| **Pages** | `/programs`, `/dashboard` |

**What it covers:** The daily automated research pipeline, source adapters (Wikipedia, BTC Map, CoinGecko), self-healing loop, freshness tracking, and audit trail.

**Key concepts:**
- 8-step pipeline runs daily at 06:00 UTC via GitHub Actions
- Auto-research layer fetches live data from 3 APIs
- Self-healing: URL change → detect → research → apply → re-anchor → converge
- Every change recorded in audit_trail with canonical slice hash

**Member scripts:** How fresh is this data?, How does it self-heal?, Why should I trust it?, How do I check freshness?

---

### 3. Vault & Document Stamping

| | |
|---|---|
| **File** | `vault-stamping-knowledge.json` |
| **Facts** | 20 |
| **Scripts** | 8 |
| **Pages** | `/vault`, `/profile`, `/dashboard` |

**What it covers:** The Document Vault, file stamping workflow, shared document registry, export/import, and Apply flow integration.

**Key concepts:**
- Local SHA-256 hash → Satohash API stamp → poll → Bitcoin proof
- Shared registry across Vault, Profile, and Dashboard (localStorage)
- Export as portable JSON backup with verify URLs
- Import validates schema and merges into existing registry

**Member scripts:** What is the Vault?, How do I stamp?, Is it safe?, How do I verify?, What can I stamp?, How do I attach to an application?, How do I export?, How do I restore?

---

### 4. Stacking & Portfolio

| | |
|---|---|
| **File** | `stacking-portfolio-knowledge.json` |
| **Facts** | 19 |
| **Scripts** | 10 |
| **Pages** | `/portfolio`, `/simulator`, `/compare` |

**What it covers:** Portfolio management, Stack Simulator, Value Forks, Compare matrix, BTC dual price, Compliance Clock, and stacking synergy.

**Key concepts:**
- Portfolio is a saved list with combined stats and Compliance Clock
- Simulator picks programs and shows combined metrics + synergy breakdown
- Value Forks show pathway-level capital analysis (minimum vs typical)
- Compare provides side-by-side matrix with best-value badges

**Member scripts:** What is the Portfolio?, What is the Simulator?, What are Value Forks?, How do I compare?, What is stacking synergy?, What is sovereignty?, How do I save a stack?, How do I share?, What is BTC dual price?, What is Compliance Clock?

---

### 5. Distressed Marketplace

| | |
|---|---|
| **File** | `distressed-marketplace-knowledge.json` |
| **Facts** | 18 |
| **Scripts** | 8 |
| **Pages** | `/distressed` |

**What it covers:** Proof-gated listings, curated vs permissionless lanes, distressed scoring, escrow templates, and deal rooms.

**Key concepts:**
- Every listing requires a Satohash proof — no proof, no listing
- Two lanes: Kimi-curated (gold/standard) vs permissionless
- Distressed score 1-5 ranks value opportunities
- Escrow is non-custodial 2-of-3 PSBT template (pre-launch)

**Member scripts:** What is the distressed marketplace?, What are lanes?, What is distressed score?, How does escrow work?, What are red flags?, How do I bookmark?, What are deal rooms?, How do I verify a listing?

---

### 6. Proactive Alerts

| | |
|---|---|
| **File** | `proactive-alerts-knowledge.json` |
| **Facts** | 17 |
| **Scripts** | 6 |
| **Pages** | `/dashboard` |

**What it covers:** Nostr-based rule-change alerts, alert types, subscription, portfolio-aware filtering, and the alert inbox.

**Key concepts:**
- 5 alert types: rule-change, proof-update, freshness-stale, new-pathway, pathway-closed
- Published as Nostr kind 30078 replaceable events
- Portfolio-aware: marks alerts relevant to saved programs
- Every alert carries a Satohash proof link

**Member scripts:** How will I know if a program changes?, What does an alert mean?, Can I filter alerts?, Are alerts proof-gated?, What is a freshness alert?, How do I subscribe?

---

### 7. Verification Lifecycle

| | |
|---|---|
| **File** | `verification-lifecycle-knowledge.json` |
| **Facts** | 35 |
| **Scripts** | 8 |
| **Pages** | `/verify`, `/vault` |

**What it covers:** Hash generation, OTS verification, batch verify, document stamping registry, Nostr attestation, security guards, and proof lifecycle.

**Key concepts:**
- 4 verification modes: opentimestamps, structural, hash-only, failed
- Batch verify for multiple hashes at once
- Nostr attestation signs and publishes proofs to relays
- Security guards validate signed events and allowlisted URLs

**Member scripts:** What is verification?, How do I stamp?, What is pending?, What is confirmed?, Can I verify offline?, What is OTS?, Is it legally binding?, How do I re-verify?

---

### 8. Onboarding & Program Matching

| | |
|---|---|
| **File** | `onboarding-matching-knowledge.json` |
| **Facts** | 28 |
| **Scripts** | 8 |
| **Pages** | `/register`, `/programs`, `/apply`, `/dashboard` |

**What it covers:** Registration flow, program discovery, filter system, Gold Standard flagships, application process, and launch gates.

**Key concepts:**
- 3-step registration: Nostr connect → profile → confirm
- Programs page with 50 countries, table/card views, filter presets
- Gold Standard: Uruguay and Bolivia as flagship depth templates
- 5 launch gates must pass before applications open

**Member scripts:** How do I start?, How do I register?, How do I apply?, How do I find a program?, What is Gold Standard?, How do I compare?, What are launch gates?, What is the Portfolio?

---

### 9. BTC Map & Merchant Discovery

| | |
|---|---|
| **File** | `btcmap-discovery-knowledge.json` |
| **Facts** | 27 |
| **Scripts** | 8 |
| **Pages** | `/btcmap`, `/programs` |

**What it covers:** BTC Map merchant directory, density heatmap, cluster map, Lightning readiness, spatial queries, and merchant data.

**Key concepts:**
- BTC Map is community-sourced open data of Bitcoin-accepting merchants
- Density heatmap shows merchant concentration per jurisdiction
- Cluster map groups nearby merchants for exploration
- Lightning readiness indicates instant-payment capability

**Member scripts:** What is BTC Map?, How many merchants are there?, Is the data accurate?, What is density?, Can I save merchants?, How do I export?, What is Lightning readiness?, How do I add a venue?

---

### 10. Internationalization (i18n)

| | |
|---|---|
| **File** | `i18n-knowledge.json` |
| **Facts** | 20 |
| **Scripts** | 8 |
| **Pages** | All pages |

**What it covers:** 10-language support, browser auto-detection, per-route overrides, RTL for Arabic, and the ⌘L keyboard shortcut.

**Key concepts:**
- 10 languages: EN, ES, FR, PT, ZH, AR, SW, DE, HI, JA
- System auto-detects from browser settings
- Per-route overrides: view /programs in Spanish, /vault in French
- Arabic is the only RTL language — layout flips automatically

**Member scripts:** How do I change language?, Why is some text in English?, What is System language?, Does RTL work?, Can I mix languages?, How many languages?, What about new languages?, Where are translations stored?

---

### 11. Knowledge Index (This Topic)

| | |
|---|---|
| **File** | `knowledge-index.json` |
| **Facts** | 9 |
| **Scripts** | 0 |
| **Pages** | Meta/index |

**What it covers:** The knowledge base architecture itself — how topics are discovered, indexed, searched, and used by Paige.

---

## Architecture

### Discovery

```typescript
// Vite auto-discovers all knowledge JSONs at build time
const knowledgeModules = import.meta.glob<{ default: KnowledgeFile }>(
  '../../../research/paige/*-knowledge.json',
  { eager: true },
)
```

**To add a new topic:** Create `research/paige/{topic}-knowledge.json` — done. The glob picks it up automatically.

### Indexing

Each topic's content is indexed into three structures:

| Structure | Contents | Purpose |
|-----------|----------|---------|
| `facts` | All facts from all topics | Content-based search |
| `scripts` | All member scripts | Pre-written answers |
| `topicText` | Facts + split topic name | Topic-level scoring |

### Search Algorithm

```
Query: "how do I stamp my document"
  ↓ Tokenize: ['how', 'stamp', 'document']  (filtered >2 chars)
  ↓ For each topic:
      score = 0
      for each token:
        if token in topicText: score += 2
        if token matches topic name: score += 3
  ↓ Sort by score, return top 5
```

### Fallback Chain

```
t('key') in active language
  ↓ undefined? → t('key') in English
  ↓ undefined? → return 'key' itself
  ↓ DEV mode? → console.warn
```

---

## How Paige Uses the Knowledge Base

### Query Routing

When a user asks Paige a question:

```
User: "How do I stamp my passport?"
  ↓ Tokenize: ['how', 'stamp', 'passport']
  ↓ searchKnowledge() → vault-stamping (score: 9)
  ↓ Also searches programs for country matches
  ↓ Returns: knowledge hit + optional program hits
  ↓ Paige formats response with vault-stamping member script
```

### Mixed Results

```
User: "Uruguay crypto tax"
  ↓ Tokens: ['uruguay', 'crypto', 'tax']
  ↓ Knowledge: stacking-portfolio (score: 6) — has sovereignty/tax facts
  ↓ Programs: Uruguay (proof card with crypto score and tax benefits)
  ↓ Paige renders both: knowledge block + program proof card
```

### KB Badge

The chat header shows:
```
🤖 Paige AI  [RAG · 12 flagships]  [KB · 10 topics · 220 facts]
```

Hover tooltip shows per-topic breakdown:
```
satohash: 9 facts, 5 scripts
intel-pipeline: 27 facts, 4 scripts
vault-stamping: 20 facts, 8 scripts
stacking-portfolio: 19 facts, 10 scripts
distressed-marketplace: 18 facts, 8 scripts
proactive-alerts: 17 facts, 6 scripts
verification-lifecycle: 35 facts, 8 scripts
onboarding-matching: 28 facts, 8 scripts
btcmap-discovery: 27 facts, 8 scripts
i18n-internationalization: 20 facts, 8 scripts
knowledge-index: 9 facts, 0 scripts
```

---

## Adding a New Topic

### Step 1: Create the JSON file

```json
{
  "schema": "motopass.paige-knowledge.v1",
  "topic": "my-new-topic",
  "version": "2026-08-21",
  "build": "2026.08.20-72",
  "facts": [
    "Fact 1 about the new topic",
    "Fact 2 about the new topic",
    "Fact 3 about the new topic"
  ],
  "honesty_rules": [
    "Rule 1: Always be truthful",
    "Rule 2: Never overpromise"
  ],
  "member_scripts": {
    "what_is": "Plain-language explanation of the new topic",
    "how_to": "Step-by-step guide for using the new feature"
  }
}
```

### Step 2: Save it

Save as `research/paige/{topic}-knowledge.json`.

### Step 3: Done

The glob discovers it at build time. The KB badge updates automatically. Paige can now search and reference the new topic.

---

## Verification

```bash
# Validate all knowledge files
node -e "
const fs = require('fs');
const dir = 'research/paige';
const files = fs.readdirSync(dir).filter(f => f.endsWith('-knowledge.json'));
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(dir + '/' + f));
  console.log('OK:', f, '- topic:', data.topic, '- facts:', data.facts.length);
}
"

# Run knowledge tests
npx vitest run src/lib/paige/knowledge.test.ts

# Full test suite
npm test
```

---

## Honesty Rules for Paige

1. **Never claim the knowledge base is complete** — new topics are added progressively.
2. **Always show honest coverage** — if a topic has partial translations, say so.
3. **Never fabricate facts** — if a topic doesn't cover something, say "I don't have that in my knowledge base yet."
4. **Member scripts are starting points** — adapt them to the user's specific question.
5. **Knowledge base facts are research-based** — not legal advice or official government data.
6. **The KB badge is live** — topic count and fact count update automatically.
7. **New topics take effect at build time** — changes are not instant in production.
8. **Knowledge base files never leave the device** — they are bundled into the SPA at build time.
