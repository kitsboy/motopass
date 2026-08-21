# Paige Knowledge: Onboarding Flow & Program Matching

> **9th knowledge topic** — auto-discovered by `import.meta.glob` (hot-loadable, zero code changes).

## 30-Second Version

MotoPass guides users through a 4-step journey: **explore** 50 country programs → **stamp** documents in the Vault → **build** a portfolio → **apply** with Bitcoin-anchored proofs. The program matching system combines sovereign-scored research, filter presets, and deep flagship templates to help members find the right jurisdiction.

---

## User Journey Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    MOTOPASS USER JOURNEY                         │
│                                                                  │
│  ┌─────────┐   ┌────────────┐   ┌──────────┐   ┌────────────┐  │
│  │ DISCOVER │ → │  REGISTER  │ → │  PREPARE │ → │   APPLY    │  │
│  │/programs │   │ /register  │   │  /vault  │   │   /apply   │  │
│  └────┬────┘   └─────┬──────┘   └────┬─────┘   └─────┬──────┘  │
│       │              │               │               │           │
│  Browse 50      Nostr wallet     Upload docs     Submit with     │
│  countries      connect +        SHA-256 hash    proof hashes    │
│  Filter by      profile setup    Satohash stamp  + doc attach    │
│  presets                                                           │
│                                        │                          │
│                                        ↓                          │
│                                 ┌────────────┐                    │
│                                 │  /dashboard │                   │
│                                 │  Alerts +   │                   │
│                                 │  Registry   │                   │
│                                 └────────────┘                    │
│                                        │                          │
│                                        ↓                          │
│                                 ┌────────────┐                    │
│                                 │  /agents   │                    │
│                                 │  Kimi      │                   │
│                                 │  handoff   │                   │
│                                 └────────────┘                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Discovery — `/programs`

The Programs page is the main entry point for exploring 50 countries.

### Views
- **Table view** (default): Compact rows with sortable columns, adjustable density (compact/comfortable)
- **Card view**: Grid of program cards with visual summaries

### Filter System

| Filter | Type | Range | Description |
|--------|------|-------|-------------|
| Text search | Free text | — | Matches name, details, bitcoin_integration |
| Region | Sidebar chips | 6 regions | Americas, Europe, Asia, Africa, Oceania, TBD |
| Category | Dropdown | rbi_cbi, etc. | Residency/Citizenship by Investment |
| Investment range | Dual sliders | $0–$2M | Min and max investment thresholds |
| Crypto score | Slider | 0–10 | Minimum Bitcoin/crypto friendly score |
| Sovereignty | Dual sliders | 0–10 | Sovereignty score range |
| Lightning-only | Checkbox | true/false | Only Lightning-ready programs |
| Status | Dropdown | All, Researching, etc. | Program status filter |

### Filter Presets (One-Click)

| Preset | What it does | Shortcut URL |
|--------|-------------|--------------|
| **Under $100K** | Max investment ≤ $100,000 | `?maxInvestment=100000` |
| **Lightning-ready** | Only programs with Lightning merchant data | `?lightning=1` |
| **Bitcoin-friendly** | Crypto score ≥ 7 | `?cryptoScore=7` |

### Gold Standard Spotlight

Uruguay and Bolivia appear as featured flagship programs at the top of the page. They cycle on idle (30s) and have the deepest research templates including:
- Multiple pathway analyses
- Compliance Clock timelines
- Critical test results (live/work, freedom scope, dual citizenship)

### URL State

All filters, view mode, table density, and selected program are encoded in URL search params:
```
/programs?region=Americas&maxInvestment=100000&view=card&program=42
```

This means filters are shareable via link and persist across reloads.

---

## Step 2: Registration — `/register`

A 3-step flow that creates a local user profile:

### Step 1: Connect Nostr
- Prompts user to connect a Nostr wallet browser extension (nos2x, Alby, etc.)
- If no extension detected, opens https://nostr.com/get-started
- On success: captures `npub` and `pubkey`

### Step 2: Profile Setup
- **Display name**: Free text
- **Target program**: Dropdown of all eligible programs, grouped by region
  - Research-status programs are shown with a warning but blocked from selection
- Shows connected npub in a styled badge

### Step 3: Confirmation
- Review display name, target program, and agent assignment (Kimi)
- On submit: creates `UserProfile` in localStorage with:
  - `status: 'registered'`
  - `agentId: 'kimi'`, `agentName: 'Kimi'`
  - `registeredAt: ISO timestamp`
  - Empty documents and payments arrays

### Status Progression

```
registered → documents → stamped → agent_assigned → submitted → payment_pending → in_review → approved
```

---

## Step 3: Document Preparation — `/vault`

### Document Stamper Workflow

```
User uploads file
    ↓
Browser computes SHA-256 hash locally (file never leaves device)
    ↓
POST hash to Satohash API (POST /api/stamp)
    ↓
API returns stamp_id + pending status
    ↓
Poll GET /api/stamp/:id until status = confirmed
    ↓
Record: block_height, tx_hash, stamped_at
    ↓
Proof anchored on Bitcoin blockchain
```

### Shared Document Registry

Documents stamped from any entry point (Vault, Profile, Dashboard) are stored in a unified localStorage registry:

| Field | Description |
|-------|-------------|
| `id` | Unique document ID |
| `name` | Original filename |
| `hash` | SHA-256 hash (hex) |
| `stampId` | Satohash API stamp ID |
| `blockHeight` | Bitcoin block number (when confirmed) |
| `status` | pending / confirmed / error |
| `createdAt` | ISO timestamp |
| `size` | File size in bytes |

### Export / Import

The registry can be exported as a portable JSON backup with embedded verify URLs:
```json
{
  "schema": "motopass.document-registry.v1",
  "exported_at": "2026-08-21T12:00:00Z",
  "documents": [...],
  "verify_links": { "hash": "https://satohash.io/verify/<hash>" }
}
```

Import validates schema, checks for duplicates, and merges into the existing registry.

---

## Step 4: Application — `/apply`

### Form Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Applicant's display name |
| Target program | Yes | Free-text program name |
| Notes | No | Additional context (max 2000 chars) |
| Attached documents | No | Select stamped docs from registry |

### Document Attachment

- Lists all documents from the shared registry
- Only `confirmed` status documents can be attached
- Each shows: filename, truncated hash, file size, status badge, verify link
- Select All / Clear All toggle for convenience

### Application Hashing

When submitted:
1. Builds payload: `{ program, created, npub, docHashes[] }`
2. SHA-256 hashes the payload via Web Crypto API
3. Stores locally with status `'interest'`
4. Generates application ID: `app-{timestamp}`
5. Redirects to `/agents` with application params

### Launch Gates

Applications only open when all 5 gates pass:

| Gate | Pillar | Name | What it checks |
|------|--------|------|---------------|
| G1 | Seal | OTS + Satohash proofs | Bitcoin proofs exist on all flagships |
| G2 | Forge | Marketplace + Vault UI | Distressed listings and vault routes working |
| G3 | Nexus | Live Nostr relay | wss://relay.motopass.giveabit.io reachable |
| G4 | Ledger | Oracle seed + Kimi | Agent infrastructure ready |
| G5 | Ops | CI + build | Validators pass, build artifacts published |

---

## Program Matching Deep Dive

### Sovereignty Score (0-100)

Measures the independence and freedom a program provides:
- Live and work rights
- Scope of freedom
- Dual citizenship support
- Property ownership rights
- Tax regime favorability

### Crypto Friendly Score (0-10)

Rates Bitcoin/crypto adoption in the jurisdiction:
- Merchant acceptance (via BTC Map data)
- Lightning Network readiness
- Regulatory environment
- Government crypto policies

### Stacking Synergy (low/medium/high)

How well a program combines with others in a multi-program portfolio:
- **High**: Complementary benefits, different regions
- **Medium**: Some overlap, but distinct advantages
- **Low**: Similar benefits, limited stacking value

### Flagship Depth

Two tiers:
- **Deep** (`flagship_tier: 'deep'`): Full research template with pathways, compliance clock, critical tests
- **Template** (`flagship_tier: 'template'`): Scaffold awaiting full research

### Freshness Badges

| Badge | Meaning | Color |
|-------|---------|-------|
| Fresh | Checked ≤14 days ago | Green |
| Watch | Checked ≤45 days ago | Amber |
| Stale | Checked >45 days ago | Red |

### Proof Status

| Status | Meaning |
|--------|---------|
| none | No Bitcoin proof exists |
| pending | Stamp submitted, awaiting confirmation |
| confirmed | Proof anchored on Bitcoin blockchain |

---

## ProgramModal Tabs

When a user clicks a program card, the modal provides deep research:

| Tab | Content | Availability |
|-----|---------|-------------|
| **Overview** | Summary, key stats (sovereignty, stacking, risk, Lightning), investment card | All programs |
| **Pathways** | Multiple residency/citizenship pathways with costs and notes | Flagships only |
| **Finance** | Min investment, typical investment, gov fees, processing time, tax benefits | All programs |
| **Bitcoin** | Crypto integration details, score, proof link, BTC Map merchant data | All programs |
| **Critical** | Live/work test, freedom scope, dual citizenship (pass/fail/pending) | Flagships only |
| **Legal** | Status, last checked, primary laws, official URLs, property rights, recent changes | All programs |
| **Intel** | Sourced pros/cons with verification dates, scorecard bars, freshness, audit trail | Programs with intel |
| **Paige** | Common questions, red flags, optimization tips, escalation triggers | Programs with Paige fields |
| **Sources** | List of data sources | All programs |

---

## Paige's Role in Onboarding

### What Paige Can Help With

1. **Program recommendations**: Based on user preferences (budget, region, Bitcoin readiness)
2. **Filter guidance**: Suggest which presets to use for specific goals
3. **Application prep**: Help attach the right documents and fill in notes
4. **Status tracking**: Check application progress and next steps
5. **Portal navigation**: Guide users to the right page for their current stage

### What Paige Must NOT Do

1. **Never recommend specific programs as "best"** — present options, let users decide
2. **Never claim applications are in progress** unless actually submitted
3. **Never bypass launch gates** — if gates aren't open, explain the requirements
4. **Never promise agent response times** — Kimi follows office hours
5. **Never store application data** — everything stays in the user's browser

### Common Questions

| User asks | Paige responds with |
|-----------|-------------------|
| "How do I start?" | 4-step guide overview with links |
| "Which program is best for me?" | Filter suggestions based on their criteria |
| "What's a sovereignty score?" | Explanation of the 0-100 scoring methodology |
| "How do I apply?" | Step-by-step guide to /apply with document attachment |
| "Are applications open?" | Check launch gates status and explain any blockers |
| "What's the Gold Standard?" | Explain Uruguay and Bolivia flagship depth |
| "How do I compare programs?" | Guide to Compare page and ProgramModal tabs |
| "What's the portfolio for?" | Explain saved list, Compliance Clock, and stack planning |

---

## Honesty Rules for Paige

1. **Registration is local-only** — no data is sent to any server during registration
2. **Applications are 'interest' status** — they are not official government submissions
3. **Sovereignty and crypto scores are research estimates** — not legal certifications
4. **Filter presets narrow the view** — they don't constitute recommendations
5. **Agent (Kimi) availability follows office hours** — not instant 24/7 support
6. **Document hashes never leave the device** — only the hash is sent to Satohash API
7. **Program data freshness varies** — always show honest freshness badges
8. **Launch gates are real requirements** — if they haven't passed, applications are genuinely gated

---

## Developer Reference

### Key Files

| File | Purpose |
|------|---------|
| `src/pages/ProgramsPage.tsx` | Main program explorer with all filters |
| `src/pages/RegisterPage.tsx` | 3-step registration flow |
| `src/pages/ApplyPage.tsx` | Application form with doc attachment |
| `src/pages/PitchPage.tsx` | Landing page with journey guide |
| `src/pages/ProfilePage.tsx` | User profile with stamped documents |
| `src/pages/DashboardPage.tsx` | Member dashboard with alerts + registry |
| `src/lib/programFilter.ts` | Filter logic |
| `src/lib/programFilterPresets.ts` | Preset definitions |
| `src/components/programs/ProgramModal.tsx` | Deep research modal |
| `src/components/programs/GoldStandardSpotlight.tsx` | Flagship spotlight |
| `src/lib/pitchStats.ts` | Pitch page statistics |
| `src/lib/launch/launchGates.ts` | Gate definitions |
| `src/types/user.ts` | UserProfile type |

### Storage Keys

| Key | Storage | Purpose |
|-----|---------|---------|
| `motopass-profile` | localStorage | User profile (npub, name, program, status) |
| `motopass-portfolio` | localStorage | Saved program IDs |
| `motopass-documents` | localStorage | Document stamp registry |
| `motopass-filters` | localStorage | Saved filter state |
| `motopass-filter-presets` | sessionStorage | Active preset chips |
| `motopass-programs-view` | localStorage | Table vs card view |

### Data Flow Diagram

```
countries.json (50 programs)
    ↓ usePrograms() hook
    ↓ ProgramsContext
    ↓ filterPrograms(filters) → toCinematicPrograms()
    ↓
ProgramsPage
    ├── GoldStandardSpotlight (Uruguay, Bolivia)
    ├── ProgramsComplianceStrip
    ├── IntelWatchStrip
    ├── Filter bar (search, presets, advanced)
    ├── Region sidebar
    └── Program cards / table rows
            ↓ onClick
        ProgramModal (7+ tabs)
            ↓ "Add to Stack"
        usePortfolio() → localStorage
            ↓
        /portfolio → ComplianceClock
            ↓
        /apply → hashApplicationPayload()
            ↓
        /agents → Kimi handoff
```
