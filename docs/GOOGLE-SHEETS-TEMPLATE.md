# MotoPass Running Ledger — Google Sheets Template

> A complete, beautiful, formula-powered spreadsheet for tracking every MotoPass transaction, program, document, and intel change.

---

## Quick Start — Auto-Import (30 Seconds)

**The fastest way to populate everything:**

1. Open your sheet: https://docs.google.com/spreadsheets/d/1b7Q1YIvJCW1qJm28SlRy99mzmaTF6Y8Ss8hFKDpiiHM
2. Go to **Extensions → Apps Script**
3. Delete any existing code, paste the contents of `docs/GOOGLE-SHEETS-AUTO-IMPORT.js`
4. Click **Save** (floppy disk icon)
5. Click **Run** → select `importAll` from the dropdown
6. Click **Run** (authorize when prompted — first time only)
7. Wait ~10 seconds — all 5+ tabs auto-populate with live data from GitHub!
8. (Optional) Run `setupDashboard` to create 8 beautiful charts
9. (Optional) Run `createImportTrigger` for daily auto-refresh at 06:30 UTC

**One-click full setup:** Run `fullSetup()` — imports data, creates charts, and sets up the daily trigger.

### Auto-Import Menu

After setup, a **🔗 MotoPass** menu appears in the menu bar with:
- 📥 Import All Data
- 📊 Setup Dashboard Charts
- ⏰ Create Daily Import Trigger
- 🗑️ Remove Import Triggers
- 📋 List Triggers

---

## Quick Start — Manual Setup (2 Minutes)

If you prefer manual setup:

1. Open your sheet
2. Create 8 tabs (rename sheets at bottom): `Programs`, `Transactions`, `Documents`, `Intel Log`, `Applications`, `Alerts`, `BTC Prices`, `Dashboard`
3. Copy each tab's header row + sample data from the sections below
4. Paste into the sheet starting at A1
5. Add the formulas in the Formula column references
6. Apply the styling (colors, conditional formatting) from the Styling section

---

## Tab 1: Programs (50 Countries)

### Headers (Row 1)

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ID | Country | Flag | Region | Category | Status | Sovereignty | Crypto Score | Lightning | Min Investment | Typical Investment | Gov Fees | Processing Months | Tax Benefits | Last Checked | Freshness |

### Sample Data (Row 2)

| 1 | Uruguay | 🇺🇾 | Americas | rbi_cbi | Active | 82 | 7 | TRUE | 100000 | 150000 | 5000 | 6 | No income tax | 2026-08-20 | =IF(TODAY()-O2<=14,"🟢 Fresh",IF(TODAY()-O2<=45,"🟡 Watch","🔴 Stale")) |

### Key Formulas

**Column P (Freshness)** — paste in P2, drag down:
```
=IF(TODAY()-O2<=14,"🟢 Fresh",IF(TODAY()-O2<=45,"🟡 Watch","🔴 Stale"))
```

**Summary stats (put in a corner area, e.g. R1:S5):**

| R | S |
|---|---|
| Total Programs | `=COUNTA(A2:A100)` |
| Fresh | `=COUNTIF(P2:P100,"🟢 Fresh")` |
| Watch | `=COUNTIF(P2:P100,"🟡 Watch")` |
| Stale | `=COUNTIF(P2:P100,"🔴 Stale")` |
| Avg Sovereignty | `=AVERAGE(G2:G100)` |
| Lightning Ready | `=COUNTIF(I2:I100,TRUE)` |
| Avg Crypto Score | `=AVERAGE(H2:H100)` |

### Conditional Formatting Rules

1. **Column G (Sovreignty)**: Green scale 0→100
2. **Column H (Crypto Score)**: Green scale 0→10
3. **Column P (Freshness)**: 
   - Text contains "Fresh" → green background
   - Text contains "Watch" → yellow background  
   - Text contains "Stale" → red background

---

## Tab 2: Transaction Ledger

### Headers (Row 1)

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Type | Country | Program | Amount USD | Amount BTC | Hash | Block Height | Status | Category | Notes | Verify URL |

### Sample Data (Row 2)

| 2026-08-21T14:30:00Z | Stamp | Uruguay | Uruguay RBI | 0 | 0 | a1b2c3d4e5f6... | 958093 | Confirmed | Proof | Initial program data stamp | https://satohash.io/verify/a1b2c3d4... |

### Key Formulas

**Column L (Verify URL)** — auto-generate from hash:
```
=IF(H2<>"","https://satohash.io/verify/"&G2,"")
```

**Monthly summary (put in a summary area):**

| Formula | Purpose |
|---------|---------|
| `=COUNTIF(B2:B1000,"Stamp")` | Total stamps |
| `=COUNTIF(I2:I1000,"Confirmed")` | Confirmed transactions |
| `=COUNTIF(I2:I1000,"Pending")` | Pending transactions |
| `=SUMIF(B2:B1000,"Payment",E2:E1000)` | Total payments USD |
| `=SUMIF(B2:B1000,"Payment",F2:F1000)` | Total payments BTC |
| `=COUNTIFS(A2:A1000,">="&DATE(2026,8,1),A2:A1000,"<"&DATE(2026,9,1))` | This month's transactions |

**Transaction type breakdown:**
| `=COUNTIF(B2:B1000,"Stamp")` | Stamps |
| `=COUNTIF(B2:B1000,"Payment")` | Payments |
| `=COUNTIF(B2:B1000,"Application")` | Applications |
| `=COUNTIF(B2:B1000,"Registration")` | Registrations |
| `=COUNTIF(B2:B1000,"Nostr Announce")` | Nostr announcements |

### Conditional Formatting

1. **Column I (Status)**: 
   - "Confirmed" → green text + light green background
   - "Pending" → amber text + light amber background
   - "Error" → red text + light red background

---

## Tab 3: Document Registry

### Headers (Row 1)

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| ID | Filename | File Size | MIME Type | SHA-256 Hash | Stamp ID | Block Height | Status | Created At | Stamped At | Verify URL |

### Sample Data (Row 2)

| doc-001 | passport.pdf | 245760 | application/pdf | a1b2c3d4e5f6... | stamp-abc-123 | 958093 | Confirmed | 2026-08-21 | 2026-08-21 | https://satohash.io/verify/a1b2c3d4... |

### Key Formulas

**Column K (Verify URL):**
```
=IF(E2<>"","https://satohash.io/verify/"&E2,"")
```

**Registry stats:**
| `=COUNTA(A2:A1000)` | Total documents |
| `=COUNTIF(H2:H1000,"Confirmed")` | Confirmed stamps |
| `=COUNTIF(H2:H1000,"Pending")` | Pending stamps |
| `=SUM(D2:D1000)` | Total file size (bytes) |
| `=COUNTIF(H2:H1000,"Confirmed")/COUNTA(A2:A1000)*100` | Success rate % |

---

## Tab 4: Intel Pipeline Log

### Headers (Row 1)

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Run Date | Step | Countries Processed | Changes Detected | Changes Applied | Stamps Applied | Sources Used | Errors | Duration (s) | Notes |

### Sample Data (Row 2)

| 2026-08-21 | intel:fetch | 50 | 4 | 4 | 0 | wikipedia,btcmap,coingecko | 0 | 45 | Bolivia crypto 5→6, Portugal 6→7, Bulgaria 5→6, Vanuatu tax clarified |

### Key Formulas

**Weekly runs:**
```
=COUNTIFS(A2:A1000,">="&TODAY()-7,A2:A1000,"<="&TODAY())
```

**Total changes applied:**
```
=SUM(E2:E1000)
```

**Pipeline health:**
| `=COUNTIF(I2:I1000,">60")` | Slow runs (>60s) |
| `=IF(AVERAGE(J2:J100)>0,"Healthy","Check pipeline")` | Health check |

---

## Tab 5: Application Tracker

### Headers (Row 1)

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| App ID | Created | Name | Program | Status | Progress % | Npub | Data Hash | Attached Docs | Agent | Last Updated | Notes |

### Status Progression (use for Column E dropdown)

Data Validation list:
```
registered,documents,stamped,agent_assigned,submitted,payment_pending,in_review,approved
```

### Key Formulas

**Progress % (Column F)** — auto-calculate from status:
```
=SWITCH(E2,"registered",12.5,"documents",25,"stamped",37.5,"agent_assigned",50,"submitted",62.5,"payment_pending",75,"in_review",87.5,"approved",100,0)
```

**Days since creation:**
```
=DATEDIF(B2,TODAY(),"D")&" days"
```

**Status summary:**
| `=COUNTIF(E2:E100,"registered")` | Registered |
| `=COUNTIF(E2:E100,"submitted")` | Submitted |
| `=COUNTIF(E2:E100,"approved")` | Approved |
| `=AVERAGE(F2:F100)&"%"` | Avg progress |

### Conditional Formatting

**Column E (Status)**: Color scale by stage
- registered → gray
- documents → blue
- stamped → purple
- agent_assigned → orange
- submitted → yellow
- payment_pending → amber
- in_review → light green
- approved → bright green

---

## Tab 6: Alerts History

### Headers (Row 1)

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Alert ID | Timestamp | Type | Program | Summary | In Portfolio | Source | Proof Hash |

### Alert Types (dropdown for Column C)

```
rule-change,proof-update,freshness-stale,new-pathway,pathway-closed
```

### Key Formulas

**Alerts this week:**
```
=COUNTIFS(B2:B1000,">="&TODAY()-7,B2:B1000,"<="&TODAY())
```

**Portfolio-relevant alerts:**
```
=COUNTIF(F2:F1000,TRUE)
```

**Alert type breakdown:**
| `=COUNTIF(C2:C1000,"rule-change")` | Rule changes |
| `=COUNTIF(C2:C1000,"proof-update")` | Proof updates |
| `=COUNTIF(C2:C1000,"freshness-stale")` | Stale alerts |

---

## Tab 7: BTC Price History

### Headers (Row 1)

| A | B | C | D | E |
|---|---|---|---|---|
| Date | BTC/USD | BTC/EUR | BTC/GBP | Source |

### Key Formulas

**7-day moving average:**
```
=AVERAGE(B2:B8)
```

**30-day moving average:**
```
=AVERAGE(B2:B31)
```

**Price change % (day over day):**
```
=IF(B3<>0,(B2-B3)/B3*100,0)&"%"
```

**Price volatility (30-day):**
```
=STDEV(B2:B31)
```

---

## Tab 8: Dashboard (Summary)

### Layout

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| **MOTOPASS DASHBOARD** | | | | | `=TODAY()` |
| | | | | | |
| **PROGRAMS** | | **TRANSACTIONS** | | **DOCUMENTS** | |
| Total tracked | `=COUNTA(Programs!A2:A100)` | Total | `=COUNTA(Transactions!A2:A1000)` | Total stamped | `=COUNTA(Documents!A2:A1000)` |
| Fresh | `=COUNTIF(Programs!P2:P100,"🟢 Fresh")` | Confirmed | `=COUNTIF(Transactions!I2:I1000,"Confirmed")` | Confirmed | `=COUNTIF(Documents!H2:H1000,"Confirmed")` |
| Lightning ready | `=COUNTIF(Programs!I2:I100,TRUE)` | Pending | `=COUNTIF(Transactions!I2:I1000,"Pending")` | Pending | `=COUNTIF(Documents!H2:H1000,"Pending")` |
| Avg sovereignty | `=ROUND(AVERAGE(Programs!G2:G100),1)` | This month | `=COUNTIFS(Transactions!A2:A1000,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1))` | Success rate | `=ROUND(COUNTIF(Documents!H2:H1000,"Confirmed")/COUNTA(Documents!A2:A1000)*100,1)&"%"` |
| | | | | | |
| **APPLICATIONS** | | **INTEL PIPELINE** | | **ALERTS** | |
| Total | `=COUNTA(Applications!A2:A100)` | Total runs | `=COUNTA(Intel!A2:A1000)` | Total | `=COUNTA(Alerts!A2:A1000)` |
| Submitted | `=COUNTIF(Applications!E2:E100,"submitted")` | Changes applied | `=SUM(Intel!E2:E1000)` | This week | `=COUNTIFS(Alerts!B2:B1000,">="&TODAY()-7)` |
| Approved | `=COUNTIF(Applications!E2:E100,"approved")` | Avg duration | `=ROUND(AVERAGE(Intel!I2:I1000),1)&"s"` | Portfolio relevant | `=COUNTIF(Alerts!F2:F1000,TRUE)` |
| Avg progress | `=ROUND(AVERAGE(Applications!F2:F100),1)&"%"` | Errors | `=SUM(Intel!H2:H1000)` | | |

---

## Styling Guide

### Color Palette (MotoPass brand)

| Color | Hex | Use |
|-------|-----|-----|
| BTC Orange | `#F7931A` | Headers, primary actions |
| Dark Ink | `#1A1A2E` | Text, borders |
| Proof Green | `#22C55E` | Confirmed/healthy states |
| Watch Amber | `#F59E0B` | Pending/watch states |
| Alert Red | `#EF4444` | Error/stale states |
| Nostr Violet | `#7C3AED` | Agent/Nostr-related |
| Electric Blue | `#3B82F6` | Links, interactive |
| Section BG | `#F8FAFC` | Alternating row backgrounds |

### Step-by-Step Styling

1. **Header rows**: Select row 1 → Background: `#F7931A` → Text: white, bold, size 11
2. **Freeze pane**: View → Freeze → 1 row
3. **Column widths**: Auto-resize all, then set Timestamp columns to 180px
4. **Number formats**: 
   - USD columns: Format → Number → Currency
   - BTC columns: Format → Number → 8 decimal places
   - Date columns: Format → Number → Date time
   - Percentages: Format → Number → Percent
5. **Alternating rows**: Format → Alternating colors → Custom: `#F8FAFC` and white
6. **Data validation**: Select status columns → Data → Data validation → List of items
7. **Conditional formatting**: Format → Conditional formatting → Add rules per the specs above

### Dashboard Tab Styling

1. **Title**: Merge A1:F1 → Font: 24pt, bold, BTC Orange
2. **Section headers**: Merge A3:B3, C3:D3, E3:F3 → Font: 14pt, bold, Dark Ink, background: `#F1F5F9`
3. **Metric labels**: Font: 10pt, gray (`#64748B`), bold
4. **Metric values**: Font: 18pt, bold, Dark Ink
5. **Add borders**: All metric cells → 1px solid border, color: `#E2E8F0`

---

## Data Entry Shortcuts

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Add new row | `Ctrl+Shift+=` |
| Insert timestamp | `Ctrl+Shift+;` |
| Format as date | `Ctrl+Shift+#` |
| Format as currency | `Ctrl+Shift+$` |
| Wrap text | `Alt+Enter` in cell |

### Quick Entry Templates

**New Stamp Transaction:**
```
Timestamp: =NOW() (then Ctrl+Shift+; to lock)
Type: Stamp
Country: [select]
Program: [select]
Amount USD: 0
Amount BTC: 0
Hash: [paste from Vault]
Block Height: [paste from Vault]
Status: Pending
Category: Proof
```

**New Document:**
```
ID: doc-[auto-increment]
Filename: [paste]
File Size: [from Vault]
SHA-256 Hash: [from Vault]
Status: Pending
Created At: =NOW()
```

---

## Auto-Refresh & Maintenance

### Daily (automated via pipeline)
- Intel Pipeline Log auto-appends from `npm run intel:run`
- BTC Prices can be appended from CoinGecko API

### Weekly (manual)
- Update Programs tab freshness badges (or add a script)
- Review Applications status changes
- Export Alerts to archive old entries

### Monthly
- Archive old Transaction entries to a separate sheet
- Update BTC Price 30-day moving averages
- Review Dashboard metrics for trends

---

## Dashboard Charts (Auto-Generated)

The Dashboard tab can be auto-populated with 8 beautiful charts using the Google Apps Script.

### Quick Setup

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete any existing code in the editor
4. Paste the contents of `docs/GOOGLE-SHEETS-CHARTS-SCRIPT.js`
5. Click **Save** (floppy disk icon)
6. Click **Run** → select `setupDashboard` from the dropdown
7. Click **Run** (you may need to authorize the script)

### Charts Created

| # | Chart | Type | Data Source | Position |
|---|-------|------|-------------|----------|
| 1 | Programs by Region | Donut | Programs tab | Row 8 |
| 2 | Sovereignty Distribution | Column | Programs tab | Row 8 |
| 3 | Transactions Over Time | Line | Transactions tab | Row 23 |
| 4 | Document Stamp Status | Pie | Documents tab | Row 23 |
| 5 | Intel Pipeline Activity | Bar | Intel Log tab | Row 38 |
| 6 | Application Funnel | Bar | Applications tab | Row 38 |
| 7 | Alert Types | Donut | Alerts tab | Row 53 |
| 8 | Crypto vs Sovereignty | Scatter | Programs tab | Row 53 |

### Auto-Refresh

To auto-refresh the dashboard daily:

1. In Apps Script, run `createDailyRefreshTrigger`
2. This creates a trigger that runs `refreshDashboard` every day at 06:00 UTC
3. The dashboard will automatically update with fresh data

### Brand Colors

The charts use the MotoPass brand palette:
- BTC Orange `#F7931A` — primary, transactions
- Electric Blue `#3B82F6` — programs, comparisons
- Proof Green `#22C55E` — confirmed, healthy states
- Nostr Violet `#7C3AED` — intel, agent-related
- Watch Amber `#F59E0B` — pending, watch states
- Alert Red `#EF4444` — errors, stale states

---

## Import Script (Optional)

If you want to auto-populate from MotoPass data:

```bash
# Export programs data
node -e "
const data = JSON.parse(require('fs').readFileSync('research/countries.json'));
const rows = data.programs.map(p => [
  p.id, p.name, p.flag, p.region, p.category, p.status,
  p.sovereignty_score, p.finance.crypto_friendly_score,
  p.lightning_ready, p.finance.min_investment_usd,
  p.finance.typical_investment_usd, p.finance.gov_fees_usd,
  p.finance.processing_time_months, p.finance.tax_benefits,
  p.last_checked, ''
]);
console.log(['ID','Country','Flag','Region','Category','Status',
  'Sovereignty','Crypto Score','Lightning','Min Investment',
  'Typical Investment','Gov Fees','Processing Months','Tax Benefits',
  'Last Checked','Freshness'].join('\t'));
rows.forEach(r => console.log(r.join('\t')));
" > programs.tsv
```

Then import the TSV into Google Sheets: File → Import → Upload → Tab-separated.
