#!/usr/bin/env node
/**
 * Export MotoPass data to TSV files for Google Sheets import.
 *
 * Usage:
 *   node scripts/export-sheets-data.mjs            # exports all tabs
 *   node scripts/export-sheets-data.mjs --tab programs  # exports one tab
 *
 * Output: sheets-export/ directory with TSV files ready for Google Sheets import.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const OUT_DIR = join(process.cwd(), 'sheets-export')

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), path), 'utf8'))
  } catch {
    return null
  }
}

function tsvEscape(val) {
  if (val == null) return ''
  const s = String(val)
  if (s.includes('\t') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function writeTsv(filename, headers, rows) {
  mkdirSync(OUT_DIR, { recursive: true })
  const path = join(OUT_DIR, filename)
  const lines = [
    headers.join('\t'),
    ...rows.map(r => r.map(tsvEscape).join('\t')),
  ]
  writeFileSync(path, lines.join('\n') + '\n')
  console.log(`✅ ${filename} — ${rows.length} rows → ${path}`)
}

// ── Tab 1: Programs ──────────────────────────────────────────────────────────

function exportPrograms() {
  const data = loadJson('research/countries.json')
  if (!data?.programs) {
    console.log('⚠️  research/countries.json not found — skipping Programs tab')
    return
  }

  const headers = [
    'ID', 'Country', 'Flag', 'Region', 'Category', 'Status',
    'Sovereignty', 'Crypto Score', 'Lightning', 'Flagship',
    'Min Investment', 'Typical Investment', 'Gov Fees',
    'Processing Months', 'Tax Benefits', 'Bitcoin Integration',
    'Stacking Synergy', 'Risk Level', 'Last Checked', 'Freshness',
  ]

  const rows = data.programs.map(p => [
    p.id,
    p.name,
    p.flag,
    p.region,
    p.category,
    p.status,
    p.sovereignty_score ?? '',
    p.finance?.crypto_friendly_score ?? '',
    p.lightning_ready ? 'TRUE' : 'FALSE',
    p.flagship_depth ? 'TRUE' : 'FALSE',
    p.finance?.min_investment_usd ?? '',
    p.finance?.typical_investment_usd ?? '',
    p.finance?.gov_fees_usd ?? '',
    p.finance?.processing_time_months ?? '',
    p.finance?.tax_benefits ?? '',
    p.bitcoin_integration ?? '',
    p.stacking_synergy ?? '',
    p.risk_level ?? '',
    p.last_checked ?? '',
    // Freshness formula (Google Sheets will interpret this)
    p.last_checked
      ? `=IF(TODAY()-DATEVALUE("${p.last_checked}")<=14,"🟢 Fresh",IF(TODAY()-DATEVALUE("${p.last_checked}")<=45,"🟡 Watch","🔴 Stale"))`
      : '',
  ])

  writeTsv('programs.tsv', headers, rows)
}

// ── Tab 2: Transactions (empty template) ─────────────────────────────────────

function exportTransactions() {
  const headers = [
    'Timestamp', 'Type', 'Country', 'Program', 'Amount USD',
    'Amount BTC', 'Hash', 'Block Height', 'Status', 'Category',
    'Notes', 'Verify URL',
  ]

  // Seed with known stamps from countries.json
  const data = loadJson('research/countries.json')
  const rows = []

  if (data?.programs) {
    for (const p of data.programs) {
      if (p.satohash_proofs?.length) {
        for (const proof of p.satohash_proofs) {
          rows.push([
            p.last_checked ?? '',
            'Stamp',
            p.name,
            p.name,
            0,
            0,
            proof.hash ?? proof.stamp_id ?? '',
            proof.block_height ?? p.last_verified_block ?? '',
            proof.confirmed ? 'Confirmed' : (proof.block_height ? 'Confirmed' : 'Pending'),
            'Proof',
            `Program data anchor for ${p.name}`,
            proof.hash ? `https://satohash.io/verify/${proof.hash}` : '',
          ])
        }
      } else if (p.last_verified_block) {
        rows.push([
          p.last_checked ?? '',
          'Stamp',
          p.name,
          p.name,
          0,
          0,
          '',
          p.last_verified_block,
          'Confirmed',
          'Proof',
          `Program data anchor for ${p.name}`,
          '',
        ])
      }
    }
  }

  writeTsv('transactions.tsv', headers, rows)
}

// ── Tab 3: Documents (empty template) ────────────────────────────────────────

function exportDocuments() {
  const headers = [
    'ID', 'Filename', 'File Size', 'SHA-256 Hash', 'Stamp ID',
    'Block Height', 'Status', 'Created At', 'Stamped At', 'Verify URL',
  ]

  writeTsv('documents.tsv', headers, [])
}

// ── Tab 4: Intel Log ─────────────────────────────────────────────────────────

function exportIntelLog() {
  const data = loadJson('research/countries.json')
  const headers = [
    'Run Date', 'Step', 'Countries', 'Changes Detected',
    'Changes Applied', 'Stamps Applied', 'Sources', 'Errors',
    'Duration (s)', 'Notes',
  ]

  const rows = []

  // Extract audit trail entries as intel log rows
  if (data?.programs) {
    for (const p of data.programs) {
      if (p.audit_trail) {
        for (const entry of p.audit_trail) {
          rows.push([
            entry.date ?? '',
            'intel:fetch',
            p.name,
            1,
            1,
            0,
            entry.source ?? '',
            0,
            '',
            `${entry.field}: ${entry.from ?? ''} → ${entry.to ?? ''}`,
          ])
        }
      }
    }
  }

  writeTsv('intel-log.tsv', headers, rows)
}

// ── Tab 5: Applications (empty template) ─────────────────────────────────────

function exportApplications() {
  const headers = [
    'App ID', 'Created', 'Name', 'Program', 'Status',
    'Progress %', 'Npub', 'Data Hash', 'Attached Docs',
    'Agent', 'Last Updated', 'Notes',
  ]

  writeTsv('applications.tsv', headers, [])
}

// ── Tab 6: Alerts ────────────────────────────────────────────────────────────

function exportAlerts() {
  const data = loadJson('research/countries.json')
  const headers = [
    'Alert ID', 'Timestamp', 'Type', 'Country', 'Summary',
    'In Portfolio', 'Source', 'Proof Hash',
  ]

  const rows = []

  if (data?.programs) {
    let alertId = 1
    for (const p of data.programs) {
      if (p.audit_trail) {
        for (const entry of p.audit_trail) {
          const type = entry.field?.includes('proof') ? 'proof-update'
            : entry.field?.includes('freshness') ? 'freshness-stale'
            : 'rule-change'
          rows.push([
            `alert-${alertId++}`,
            entry.date ?? '',
            type,
            p.name,
            `${entry.field}: ${entry.from ?? ''} → ${entry.to ?? ''}`,
            'FALSE',
            entry.source ?? '',
            entry.hash ?? '',
          ])
        }
      }
    }
  }

  writeTsv('alerts.tsv', headers, rows)
}

// ── Tab 7: BTC Prices (seed with CoinGecko) ─────────────────────────────────

function exportBtcPrices() {
  const headers = ['Date', 'BTC/USD', 'BTC/EUR', 'BTC/GBP', 'Source']
  writeTsv('btc-prices.tsv', headers, [])
}

// ── Main ─────────────────────────────────────────────────────────────────────

const tab = process.argv.find(a => a.startsWith('--tab='))?.split('=')[1]

const exporters = {
  programs: exportPrograms,
  transactions: exportTransactions,
  documents: exportDocuments,
  'intel-log': exportIntelLog,
  applications: exportApplications,
  alerts: exportAlerts,
  'btc-prices': exportBtcPrices,
}

if (tab) {
  if (exporters[tab]) exporters[tab]()
  else console.error(`Unknown tab: ${tab}. Available: ${Object.keys(exporters).join(', ')}`)
} else {
  console.log('📦 Exporting all tabs to sheets-export/...\n')
  for (const [name, fn] of Object.entries(exporters)) {
    fn()
  }
  console.log(`\n✅ Done! Import the .tsv files into Google Sheets:`)
  console.log(`   File → Import → Upload → Select .tsv → Tab separator`)
  console.log(`   Or paste directly from the files.`)
}
