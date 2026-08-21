# Paige — Proactive Alerts Spec (Nostr-Based Rule-Change Notifications)

**Purpose:** design how Paige surfaces rule changes, proof updates, and
freshness warnings to users via Nostr events — so users learn about changes
before they apply, without checking the site daily.

**Version:** BUILD 72 · 2026-08-21 · Design spec (not yet implemented)

---

## 1. Problem statement

MotoPass tracks 50 countries with residency, citizenship, and Bitcoin
integration data. Rules change — governments update thresholds, close
pathways, or open new ones. Today, users learn about changes only by
checking the site. Proactive alerts would notify users whose portfolio or
stack includes the changed program.

**Goal:** Paige detects changes, generates honest alert events, and publishes
them to Nostr — users see notifications in their preferred client without
trusting MotoPass.

---

## 2. Design principles

1. **Honest alerts only.** Every alert carries a Satohash proof link. Never
   notify about unverified changes.

2. **Detection, not rewrite.** Alerts tell you *something changed* — they
   never tell you *what it means*. Paige links to the proof; you verify.

3. **Personalized.** Alerts target users whose portfolio/stack includes the
   changed program. No spam for unrelated programs.

4. **Opt-in.** Users subscribe via Nostr filter. No tracking, no accounts.

5. **Non-blocking.** Alerts are fire-and-forget. If no relay accepts, the
   user never knew — no retry spam.

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY INTEL PIPELINE                      │
│  intel:probe detects URL content change                      │
│  intel:fetch applies verified research changes               │
│  intel:stamp re-anchors changed programs                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  ALERT GENERATOR (new)                       │
│  1. Diff old vs new audit_trail entries                      │
│  2. Classify change type (rule, proof, freshness)            │
│  3. Build Nostr event per changed program                    │
│  4. Sign with MotoPass agent key                             │
│  5. Publish to relays                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    NOSTR RELAYS                              │
│  wss://relay.motopass.giveabit.io                            │
│  wss://relay.damus.io                                        │
│  wss://relay.nostr.band                                      │
│  wss://nos.lol                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    USER CLIENTS                              │
│  Subscribe to filter: { authors: [paige_pubkey],            │
│    #t: ["motopass", "rule-change"] }                        │
│  See alerts in their timeline / notifications                │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Alert types

| Type | Tag | When | Example |
|------|-----|------|---------|
| **Rule change** | `rule-change` | `watch.changed` detected by probe | "Uruguay investor pathway thresholds updated" |
| **Proof re-anchored** | `proof-update` | `intel:stamp` re-anchors a program | "El Salvador proof re-anchored at block #960,123" |
| **Freshness warning** | `freshness-stale` | Program >45 days since last check | "Portugal data is 60 days old — re-research needed" |
| **New pathway** | `new-pathway` | New pathway added to a program | "Georgia digital nomad pathway added" |
| **Pathway closed** | `pathway-closed` | Pathway removed from a program | "Malta IIP pathway closed" |

---

## 5. Nostr event format

### Kind 30078 (replaceable, parameterized)

```json
{
  "kind": 30078,
  "content": "{\"platform\":\"MotoPass\",\"alert_type\":\"rule-change\",\"program\":\"Uruguay\",\"summary\":\"Investor pathway thresholds may have changed — source page content differs from baseline.\",\"proof_url\":\"https://satohash.io/verify/<hash>\",\"block_height\":960123,\"source\":\"source-probe\",\"timestamp\":\"2026-08-21T06:15:00Z\"}",
  "tags": [
    ["d", "motopass-alert-uruguay-rule-change-2026-08-21"],
    ["t", "motopass"],
    ["t", "rule-change"],
    ["t", "uruguay"],
    ["satohash", "https://satohash.io/verify/<hash>"],
    ["block", "960123"],
    ["program", "Uruguay"],
    ["alert-type", "rule-change"],
    ["source", "source-probe"]
  ],
  "created_at": 1755801600
}
```

### Tags reference

| Tag | Purpose | Required |
|-----|---------|----------|
| `d` | Replaceable event key (dedup per program + date) | Yes |
| `t` | Hashtags: `motopass`, alert type, program name | Yes |
| `satohash` | Proof URL for the change | Yes |
| `block` | Bitcoin block height (if proof re-anchored) | When available |
| `program` | Program name (for filtering) | Yes |
| `alert-type` | `rule-change`, `proof-update`, `freshness-stale`, `new-pathway`, `pathway-closed` | Yes |
| `source` | `source-probe`, `intel-fetch`, `satohash-api` | Yes |

---

## 6. Alert generation logic

### Step 1: Detect changes

The existing pipeline already detects changes:

- `intel:probe` → `watch.changed = true` + audit entry
- `intel:fetch` → audit entries with `source: intel-fetch:<adapter>`
- `intel:stamp` → audit entries with `source: satohash-api`

### Step 2: Classify change type

From the audit entry:
- `field: "watch.<url>"` → `rule-change`
- `field: "proof"` → `proof-update`
- `field: "finance.*"` or `field: "legal_compliance.*"` → `rule-change`
- `field: "pathways"` → `new-pathway` or `pathway-closed`
- Freshness >45d → `freshness-stale`

### Step 3: Build event

For each changed program:
1. Extract the change summary from the audit entry
2. Build the Nostr event with appropriate tags
3. The `d` tag ensures dedup: `motopass-alert-{slug}-{type}-{date}`

### Step 4: Sign and publish

- Sign with the MotoPass Paige agent key (NIP-07 or server-side)
- Publish to MOTOPASS_RELAYS
- Fire-and-forget: if no relay accepts, move on

---

## 7. User subscription

Users subscribe to Paige's alerts via a Nostr filter:

```json
{
  "authors": ["<paige_agent_pubkey>"],
  "#t": ["motopass"],
  "kinds": [30078],
  "limit": 50
}
```

### Portfolio-aware filtering (client-side)

The client can further filter alerts:
1. Load user's portfolio from localStorage
2. Filter alerts where `#program` matches a portfolio entry
3. Show only relevant alerts

---

## 8. What Paige should say

### "How will I know if a program changes?"

> Paige publishes proactive alerts to Nostr when the daily pipeline detects
> a rule change, proof update, or freshness warning. Subscribe to Paige's
> pubkey in your Nostr client to see notifications for programs in your
> portfolio.

### "What does a rule-change alert mean?"

> A rule-change alert means the official source page for a program has
> changed — the content hash differs from the baseline. It does not tell you
> what changed or whether it affects you. Verify the proof and check the
> program page for details.

### "Can I get alerts only for my programs?"

> Yes. Subscribe to Paige's pubkey and filter by the `motopass` hashtag.
> Your Nostr client can further filter by program name to show only alerts
> for programs in your portfolio.

### "Are alerts proof-gated?"

> Yes. Every alert carries a Satohash proof link. Paige never publishes an
> alert without an anchored proof. You can verify the alert independently.

---

## 9. Honesty rules

1. **Alerts are detection facts.** "Something changed" — never "X now means Y."

2. **Every alert carries a proof.** No proof, no alert.

3. **Alerts are fire-and-forget.** No retry spam if relays are down.

4. **No tracking.** Paige does not know who subscribes. Filtering is client-side.

5. **No false urgency.** Alerts are informational, not actionable instructions.

6. **Dedup by design.** The `d` tag ensures one alert per program per change per day.

---

## 10. Implementation roadmap

| Phase | What | Status |
|-------|------|--------|
| **Phase 1** | Alert generator script (reads audit_trail, builds events) | Spec |
| **Phase 2** | Wire into daily-intel.yml (post-stamp, publish alerts) | Spec |
| **Phase 3** | Paige agent key management (NIP-07 or server-side signing) | Spec |
| **Phase 4** | Client-side subscription + portfolio-aware filtering | Spec |
| **Phase 5** | In-app alert inbox (Dashboard or dedicated page) | Spec |

### Phase 1 detail: Alert generator script

```
scripts/generate-alerts.mjs
  1. Read countries.json
  2. For each program, check audit_trail for entries since last alert run
  3. Classify each entry as rule-change / proof-update / freshness-stale
  4. Build Nostr events (kind 30078) per changed program
  5. Sign with Paige agent key
  6. Publish to MOTOPASS_RELAYS
  7. Record last-alert-run timestamp (avoid re-alerting)
```

### Phase 2 detail: Wire into pipeline

```yaml
# .github/workflows/daily-intel.yml — after intel:stamp
- name: Generate proactive alerts
  run: node scripts/generate-alerts.mjs
  env:
    NOSTR_SIGNING_KEY: ${{ secrets.NOSTR_PAGIE_AGENT_KEY }}
```

---

## 11. Cross-references

- `docs/PAIGE-AI.md` — Paige AI specification
- `docs/PAIGE-INTEL-PIPELINE-GUIDE.md` — Intel pipeline & self-healing
- `docs/COUNTRY-INTEL.md` — Pipeline documentation
- `src/lib/nostrEvents.ts` — Existing Nostr event builders
- `src/lib/nostrTimestamp.ts` — Nostr publish infrastructure
- `src/lib/nostrRelay.ts` — Relay pool and publish
- `research/paige/proactive-alerts-knowledge.json` — Machine-readable facts

---

**Truth You Can Verify — even when the alert comes from an AI.**

— Paige Proactive Alerts Spec, MotoPass
BUILD 72 · 2026-08-21
