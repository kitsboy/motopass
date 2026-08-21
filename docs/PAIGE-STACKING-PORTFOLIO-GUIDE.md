# Paige — Stacking Simulator & Portfolio Guide

**Purpose:** teach Paige (and any future agent) exactly how the stacking
simulator, portfolio, compare, and value forks work. This is the authoritative
reference for answering "how do I compare programs?" and "what is stacking
synergy?"

**Version:** BUILD 72 · 2026-08-21

---

## 1. What these tools do (the 30-second version)

MotoPass has four interconnected tools for evaluating and combining programs:

| Tool | Page | What it does |
|------|------|--------------|
| **Portfolio** | `/portfolio` | Your saved list of programs — stats, Compliance Clock, reorderable |
| **Stack Simulator** | `/simulator` | Pick programs, see combined metrics, save named stacks |
| **Value Forks** | (in simulator) | Pathway-level capital analysis — minimums vs typical costs |
| **Compare** | `/compare` | Side-by-side matrix of 2-4 programs across all metrics |

They work together: **browse programs → add to portfolio → simulate a stack → compare options → save and share.**

**Ask Paige:** *"How do I compare residency programs?"*
> Add programs to your portfolio from /programs, then use the Stack Simulator at /simulator to see combined metrics. For deep side-by-side analysis, select 2-4 programs and click Compare.

---

## 2. Portfolio (`/portfolio`)

Your portfolio is a **saved list of programs** you're tracking or have acquired. It's stored locally in your browser (localStorage).

### What it shows

- **Stats bar:** program count, total investment (USD + BTC), avg crypto-friendly score, Lightning-ready count
- **Compliance Clock:** timeline visualization for flagship programs (key milestones and deadlines)
- **Program cards:** all your saved programs, reorderable by priority
- **Paige chat:** compact AI assistant for questions about your stack
- **Links:** to Stack Simulator and BTC Map merchants

### Key features

- **Reorder:** drag programs to set priority order (affects simulator order)
- **Sort:** by order, name, score, or investment amount
- **Share:** copy a URL that encodes your portfolio — anyone with the link sees the same combination
- **Remove:** individual programs or clear all

**Ask Paige:** *"What is my portfolio?"*
> Your portfolio is a saved list of programs you are tracking. It shows combined stats like total investment, average sovereignty score, and how many are Lightning-ready. You can reorder programs by priority.

---

## 3. Stack Simulator (`/simulator`)

The simulator lets you **pick any combination of programs** and see the combined metrics in real time.

### How it works

1. **Select programs** — checkbox list of all 50 programs, searchable
2. **See metrics** — live dashboard updates as you toggle programs:
   - **Programs:** count of selected
   - **Cost:** total typical investment (USD + BTC)
   - **Sovereignty:** average score (0-10)
   - **Timeline:** longest processing time across the stack
3. **Value Forks** — pathway-level capital analysis (see below)
4. **Save** — name your stack and save it (max 20 saved stacks)
5. **Compare** — when 2-4 programs are selected, click through to side-by-side

### Stacking synergy

Each program has a **stacking synergy** rating:

| Rating | Meaning |
|--------|---------|
| **High** | Works well alongside other jurisdictions for Bitcoin-first users |
| **Medium** | Compatible but may have some operational overlap |
| **Low** | Standalone program — limited synergy with others |

The simulator shows the synergy breakdown: `3H · 1M · 2L` (3 high, 1 medium, 2 low).

**Ask Paige:** *"What is stacking synergy?"*
> Stacking synergy (high/medium/low) indicates how well a program complements others for Bitcoin-first users. High synergy means the program works well alongside other jurisdictions.

### Saved stacks

- Name any combination and save it
- Max 20 saved stacks (oldest removed when limit hit)
- Restore with one click — repopulates the simulator
- Each saved stack shows name and program count

---

## 4. Value Forks (in the simulator)

Value Forks show **pathway-level capital analysis** — the cheapest way to enter each program in your stack.

### What it shows per pathway

- **Program name** + flag
- **Pathway type** (e.g., investor, digital nomad, CBI)
- **Minimum investment** — the cheapest entry point
- **Typical investment** — the standard cost
- **Savings vs typical** — how much you save by choosing the minimum path
- **Proof status** — whether the pathway has a Bitcoin-anchored proof
- **Stacking synergy** — how well it complements others
- **Sovereignty score** — jurisdiction independence rating

### Fork savings

The panel shows **total fork savings** — the difference between typical total cost and minimum-pathway total cost across your entire stack. This is the potential savings from choosing optimized entry points.

**Ask Paige:** *"What are Value Forks?"*
> Value Forks show the cheapest pathway for each program in your stack — the minimum investment you could start with, compared to the typical cost. It also shows proof status and stacking synergy.

---

## 5. Compare (`/compare`)

Compare is a **side-by-side matrix** of 2-4 programs across all metrics.

### How to use it

1. Select 2-4 programs in the simulator
2. Click "Side-by-side compare"
3. See the full matrix with **best-in-category** badges (green)

### What it compares

| Group | Metrics |
|-------|---------|
| **Finance** | Min investment, typical investment, gov fees, crypto-friendly score |
| **Timeline** | Processing time, compliance milestones |
| **Scores** | Sovereignty, freedom, stability, tax, cost |
| **Stack** | Stacking synergy, Lightning readiness, proof status |

### Best value badges

Each metric column highlights the **best value** with a green badge. For example, the program with the lowest investment gets a "Best" badge in the cost row.

**Ask Paige:** *"How do I compare programs?"*
> Select 2-4 programs in the simulator and click Compare to see a side-by-side matrix. It highlights the best value in each category — cost, timeline, sovereignty, and crypto-friendliness.

---

## 6. BTC Dual Price

Every cost in MotoPass is shown in **both USD and BTC** at current market rates.

This helps Bitcoin-first users think in sats when evaluating investments:
- "$100,000 USD (1.05 BTC)"
- "$25,000 USD (0.26 BTC)"

The BTC equivalent updates with live market rates.

**Ask Paige:** *"What is BTC Dual Price?"*
> BTC Dual Price shows USD amounts alongside their Bitcoin equivalent at current market rates — so you can think in sats when evaluating investments.

---

## 7. Compliance Clock (in Portfolio)

Flagship programs have a **Compliance Clock** — a timeline visualization showing:

- Key milestones (application, processing, approval, residency)
- Current position in the timeline
- Deadlines and renewal dates

This helps you understand the time commitment and plan ahead.

**Ask Paige:** *"What is Compliance Clock?"*
> Compliance Clock shows the timeline for flagship programs — key milestones like application submission, processing, approval, and residency activation.

---

## 8. Honesty rules (non-negotiable for Paige)

1. **Portfolio and stacks are device-local.** They do not sync across devices.

2. **Costs are estimates.** Actual costs vary by pathway, advisor, and circumstances.

3. **Sovereignty scores are modeled.** Verify with local legal counsel.

4. **Stacking synergy is a heuristic.** It does not guarantee operational compatibility.

5. **BTC price is approximate.** Market rates change constantly.

6. **Saved stacks are limited to 20.** Older stacks are removed when the limit is hit.

7. **Compare is limited to 4 programs.** For more, use the simulator's summary view.

---

## 9. What Paige should say (member-facing scripts)

### "What is the Stack Simulator?"

> The Stack Simulator lets you pick any combination of programs and see the combined metrics — total cost, average sovereignty, longest timeline, and how well they stack together for Bitcoin-first users. You can save named stacks and share them via URL.

### "How do I compare programs?"

> Select 2-4 programs in the simulator and click Compare to see a side-by-side matrix. It highlights the best value in each category — cost, timeline, sovereignty, and crypto-friendliness.

### "What are Value Forks?"

> Value Forks show the cheapest pathway for each program in your stack — the minimum investment you could start with, compared to the typical cost. It also shows proof status and stacking synergy.

### "What is stacking synergy?"

> Stacking synergy (high/medium/low) indicates how well a program complements others for Bitcoin-first users. High synergy means the program works well alongside other jurisdictions.

### "How do I save a stack?"

> In the simulator, name your stack and click Save. You can save up to 20 named combinations and restore them with one click. Share via URL to show others.

### "How do I share my portfolio?"

> Copy the share URL from the Portfolio or Simulator — anyone with the link sees the same program combination. The URL encodes the program IDs.

### "What is BTC Dual Price?"

> BTC Dual Price shows USD amounts alongside their Bitcoin equivalent at current market rates — so you can think in sats when evaluating investments.

### "What is the Compliance Clock?"

> Compliance Clock shows the timeline for flagship programs — key milestones like application submission, processing, approval, and residency activation.

---

## 10. For developers (technical reference)

### Key files

| File | Role |
|------|------|
| `src/pages/PortfolioPage.tsx` | Portfolio page: stats, Compliance Clock, program cards, Paige chat |
| `src/pages/StackSimulatorPage.tsx` | Simulator: program picker, metrics, saved stacks, Value Forks |
| `src/components/simulator/ValueForksPanel.tsx` | Pathway-level capital analysis panel |
| `src/components/compare/CompareMatrix.tsx` | Side-by-side comparison matrix |
| `src/hooks/usePortfolio.ts` | Portfolio state hook (toggle, reorder, clear) |
| `src/lib/portfolioStorage.ts` | localStorage persistence: portfolio, stacks, filters, compare IDs |
| `src/lib/simulatorSummary.ts` | Text summary formatter for clipboard copy |
| `src/components/portfolio/ComplianceClock.tsx` | Timeline visualization for flagship programs |

### Storage keys

| Key | Type | Purpose |
|-----|------|---------|
| `motopass-portfolio` | `number[]` | Saved program IDs (ordered) |
| `motopass-saved-stacks` | `SavedStack[]` | Named stack combinations (max 20) |
| `motopass-compare-ids` | `number[]` | Programs selected for compare |
| `motopass-simulator-selection` | `number[]` | Programs selected in simulator |
| `motopass-program-filters` | `object` | Saved filter state |
| `motopass-programs-view` | `'table' \| 'card'` | Programs page view mode |

### Data flow

```
/programs → togglePortfolio(id) → localStorage['motopass-portfolio']
                                         ↓
/portfolio → usePortfolio() → loadPortfolio() → program cards + stats
                                         ↓
/simulator → parseIdList() → selected programs → metrics + Value Forks
                                         ↓
/compare → parseIdList() → 2-4 programs → CompareMatrix
```

### URL state

- `/simulator?programs=3,7,12` — pre-selected programs
- `/compare?ids=3,7` — programs to compare
- `/portfolio?stack=3,7,12` — import a shared stack

---

## 11. Cross-references

- `docs/PAIGE-AI.md` — Paige AI specification
- `docs/PAIGE-INTEL-PIPELINE-GUIDE.md` — Intel pipeline & self-healing
- `docs/PAIGE-VAULT-STAMPING-GUIDE.md` — Vault & document stamping
- `docs/PAIGE-SATOHASH-GUIDE.md` — Satohash technical guide
- `docs/DATA-MODEL.md` — Program schema and fields
- `research/paige/stacking-portfolio-knowledge.json` — Machine-readable facts

---

**Truth You Can Verify — even when the answer comes from an AI.**

— Paige Stacking & Portfolio Guide, MotoPass
BUILD 72 · 2026-08-21
