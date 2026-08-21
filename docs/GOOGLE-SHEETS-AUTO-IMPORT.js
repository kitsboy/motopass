/**
 * MotoPass Auto-Import — Google Apps Script
 *
 * Pulls the latest data from GitHub (kitsboy/motopass) and populates
 * all spreadsheet tabs. Run manually or set up a daily trigger.
 *
 * Data sources:
 *   research/countries.json → Programs, Transactions, Intel Log, Alerts
 *   localStorage-like local data → Documents, Applications (manual entry)
 *
 * Setup:
 *   1. Open your Google Sheet
 *   2. Extensions > Apps Script
 *   3. Paste this script (delete any existing code)
 *   4. Click Save
 *   5. Run importAll() (authorize when prompted)
 *   6. (Optional) Run createImportTrigger() for daily auto-import
 *
 * API rate limits:
 *   GitHub raw content: 60 requests/hour (unauthenticated)
 *   We fetch ~2 files per run, well within limits.
 */

// ── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  // GitHub raw URLs (main branch)
  COUNTRIES_URL: 'https://raw.githubusercontent.com/kitsboy/motopass/main/research/countries.json',
  INTEL_URL: 'https://raw.githubusercontent.com/kitsboy/motopass/main/public/data/intel.json',

  // Sheet names
  SHEETS: {
    PROGRAMS: 'Programs',
    TRANSACTIONS: 'Transactions',
    DOCUMENTS: 'Documents',
    INTEL: 'Intel Log',
    APPLICATIONS: 'Applications',
    ALERTS: 'Alerts',
    BTC_PRICES: 'BTC Prices',
    DASHBOARD: 'Dashboard',
  },

  // GitHub API (optional, for higher rate limits)
  // Set these in Project Settings > Script Properties if you have a token
  // GITHUB_TOKEN: PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
};

// ── Main Import Functions ────────────────────────────────────────────────────

/**
 * Import all data from GitHub. This is the main entry point.
 */
function importAll() {
  const startTime = new Date();
  Logger.log('🚀 Starting MotoPass auto-import...');

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Fetch data from GitHub
  const countries = fetchJson(CONFIG.COUNTRIES_URL);
  const intel = fetchJson(CONFIG.INTEL_URL);

  if (!countries?.programs) {
    Logger.log('❌ Failed to fetch countries.json — aborting');
    return;
  }

  Logger.log(`📦 Fetched ${countries.programs.length} programs from GitHub`);

  // Import each tab
  importPrograms(ss, countries);
  importTransactions(ss, countries);
  importIntelLog(ss, countries);
  importAlerts(ss, countries);

  if (intel) {
    importIntelManifest(ss, intel);
  }

  // Update dashboard if it exists
  const dash = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  if (dash) {
    try {
      // Try to refresh charts if the chart script is also installed
      if (typeof setupDashboard === 'function') {
        setupDashboard();
        Logger.log('📊 Dashboard charts refreshed');
      }
    } catch (e) {
      Logger.log('⚠️  Dashboard refresh skipped: ' + e.message);
    }
  }

  // Log completion
  const elapsed = ((new Date() - startTime) / 1000).toFixed(1);
  Logger.log(`✅ Import complete in ${elapsed}s`);
  Logger.log(`   Programs: ${countries.programs.length}`);
  Logger.log(`   Transactions: ${countRows(ss, CONFIG.SHEETS.TRANSACTIONS)}`);
  Logger.log(`   Intel entries: ${countRows(ss, CONFIG.SHEETS.INTEL)}`);
  Logger.log(`   Alerts: ${countRows(ss, CONFIG.SHEETS.ALERTS)}`);

  // Update the "last imported" timestamp on Dashboard
  if (dash) {
    dash.getRange('A2').setValue(`Last import: ${new Date().toISOString()} from GitHub`)
      .setFontSize(9).setFontColor('#64748B');
  }
}

// ── Tab Importers ────────────────────────────────────────────────────────────

/**
 * Import Programs tab — 50 countries with all metadata.
 */
function importPrograms(ss, countries) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.PROGRAMS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.PROGRAMS);
  }

  // Headers
  const headers = [
    'ID', 'Country', 'Flag', 'Region', 'Category', 'Status',
    'Sovereignty', 'Crypto Score', 'Lightning', 'Flagship',
    'Min Investment', 'Typical Investment', 'Gov Fees',
    'Processing Months', 'Tax Benefits', 'Bitcoin Integration',
    'Stacking Synergy', 'Risk Level', 'Last Checked', 'Freshness',
    'Pros Count', 'Cons Count', 'Audit Trail Count',
  ];

  // Data rows
  const rows = countries.programs.map(p => {
    const lastChecked = p.last_checked || '';
    const freshness = lastChecked
      ? `=IF(TODAY()-DATEVALUE("${lastChecked}")<=14,"🟢 Fresh",IF(TODAY()-DATEVALUE("${lastChecked}")<=45,"🟡 Watch","🔴 Stale"))`
      : '';

    return [
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
      lastChecked,
      freshness,
      (p.pros || []).length,
      (p.cons || []).length,
      (p.audit_trail || []).length,
    ];
  });

  // Write data
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  // Style headers
  styleHeaders(sheet, headers.length);

  Logger.log(`📋 Programs: ${rows.length} rows`);
}

/**
 * Import Transactions tab — all Satohash stamps from audit trails.
 */
function importTransactions(ss, countries) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.TRANSACTIONS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.TRANSACTIONS);
  }

  const headers = [
    'Timestamp', 'Type', 'Country', 'Program', 'Amount USD',
    'Amount BTC', 'Hash', 'Block Height', 'Status', 'Category',
    'Notes', 'Verify URL',
  ];

  const rows = [];

  for (const p of countries.programs) {
    // Satohash proofs
    if (p.satohash_proofs?.length) {
      for (const proof of p.satohash_proofs) {
        const hash = proof.hash || proof.stamp_id || '';
        rows.push([
          p.last_checked || '',
          'Stamp',
          p.name,
          p.name,
          0,
          0,
          hash,
          proof.block_height || p.last_verified_block || '',
          (proof.block_height || p.last_verified_block) ? 'Confirmed' : 'Pending',
          'Proof',
          `Program data anchor for ${p.name}`,
          hash ? `https://satohash.io/verify/${hash}` : '',
        ]);
      }
    } else if (p.last_verified_block) {
      rows.push([
        p.last_checked || '',
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
      ]);
    }

    // Audit trail entries as transactions
    if (p.audit_trail) {
      for (const entry of p.audit_trail) {
        rows.push([
          entry.date || '',
          'Intel Update',
          p.name,
          p.name,
          0,
          0,
          entry.hash || '',
          '',
          entry.hash ? 'Confirmed' : 'Logged',
          'Intel',
          `${entry.field}: ${entry.to || ''}`,
          entry.hash ? `https://satohash.io/verify/${entry.hash}` : '',
        ]);
      }
    }
  }

  // Sort by timestamp descending
  rows.sort((a, b) => (b[0] || '').localeCompare(a[0] || ''));

  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  styleHeaders(sheet, headers.length);
  Logger.log(`💰 Transactions: ${rows.length} rows`);
}

/**
 * Import Intel Log tab — pipeline run history from audit trails.
 */
function importIntelLog(ss, countries) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.INTEL);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.INTEL);
  }

  const headers = [
    'Run Date', 'Step', 'Country', 'Changes Detected',
    'Changes Applied', 'Stamps Applied', 'Source', 'Errors',
    'Duration (s)', 'Notes',
  ];

  const rows = [];

  for (const p of countries.programs) {
    if (p.audit_trail) {
      for (const entry of p.audit_trail) {
        rows.push([
          entry.date || '',
          'intel:fetch',
          p.name,
          1,
          1,
          0,
          entry.source || '',
          0,
          '',
          `${entry.field}: ${entry.from ? entry.from + ' → ' : ''}${entry.to || ''}`,
        ]);
      }
    }
  }

  rows.sort((a, b) => (b[0] || '').localeCompare(a[0] || ''));

  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  styleHeaders(sheet, headers.length);
  Logger.log(`🔍 Intel Log: ${rows.length} rows`);
}

/**
 * Import Alerts tab — proactive alerts from audit trails.
 */
function importAlerts(ss, countries) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.ALERTS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.ALERTS);
  }

  const headers = [
    'Alert ID', 'Timestamp', 'Type', 'Country', 'Summary',
    'In Portfolio', 'Source', 'Proof Hash',
  ];

  const rows = [];
  let alertId = 1;

  for (const p of countries.programs) {
    if (p.audit_trail) {
      for (const entry of p.audit_trail) {
        const type = classifyAlert(entry);
        rows.push([
          `alert-${String(alertId++).padStart(4, '0')}`,
          entry.date || '',
          type,
          p.name,
          `${entry.field}: ${entry.from ? entry.from + ' → ' : ''}${entry.to || ''}`,
          'FALSE',
          entry.source || '',
          entry.hash || '',
        ]);
      }
    }
  }

  rows.sort((a, b) => (b[1] || '').localeCompare(a[1] || ''));

  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  styleHeaders(sheet, headers.length);
  Logger.log(`🚨 Alerts: ${rows.length} rows`);
}

/**
 * Import Intel Manifest — runtime state from intel.json.
 */
function importIntelManifest(ss, intel) {
  // Store manifest summary in a small area on the Dashboard or a new tab
  let sheet = ss.getSheetByName('Intel Manifest');
  if (!sheet) {
    sheet = ss.insertSheet('Intel Manifest');
  }

  sheet.clearContents();
  sheet.getRange('A1').setValue('Intel Manifest Summary').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A3').setValue('Last Updated');
  sheet.getRange('B3').setValue(intel.last_updated || 'unknown');
  sheet.getRange('A4').setValue('Build');
  sheet.getRange('B4').setValue(intel.build || 'unknown');
  sheet.getRange('A5').setValue('Programs');
  sheet.getRange('B5').setValue(intel.programs?.length || 0);

  // Program freshness summary
  if (intel.programs) {
    sheet.getRange('A7').setValue('Program').setFontWeight('bold');
    sheet.getRange('B7').setValue('Freshness').setFontWeight('bold');
    sheet.getRange('C7').setValue('Proof In Sync').setFontWeight('bold');
    sheet.getRange('D7').setValue('Last Checked').setFontWeight('bold');

    intel.programs.slice(0, 50).forEach((p, i) => {
      const row = i + 8;
      sheet.getRange(`A${row}`).setValue(p.name || '');
      sheet.getRange(`B${row}`).setValue(p.freshness?.status || '');
      sheet.getRange(`C${row}`).setValue(p.proof?.in_sync ? 'TRUE' : 'FALSE');
      sheet.getRange(`D${row}`).setValue(p.last_checked || '');
    });
  }

  styleHeaders(sheet, 4);
  Logger.log(`📋 Intel Manifest: imported`);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch JSON from a URL with error handling.
 */
function fetchJson(url) {
  try {
    const options = {
      method: 'GET',
      muteHttpExceptions: true,
      followRedirects: true,
    };

    // Use GitHub token if available (higher rate limits)
    const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
    if (token) {
      options.headers = { Authorization: `token ${token}` };
    }

    const response = UrlFetchApp.fetch(url, options);

    if (response.getResponseCode() !== 200) {
      Logger.log(`⚠️  HTTP ${response.getResponseCode()} for ${url}`);
      return null;
    }

    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log(`❌ Failed to fetch ${url}: ${e.message}`);
    return null;
  }
}

/**
 * Classify an audit trail entry into an alert type.
 */
function classifyAlert(entry) {
  const field = (entry.field || '').toLowerCase();
  const notes = (entry.to || '').toLowerCase();

  if (field.includes('proof') || notes.includes('proof') || notes.includes('stamp')) {
    return 'proof-update';
  }
  if (field.includes('freshness') || field.includes('stale')) {
    return 'freshness-stale';
  }
  if (field.includes('pathway') && notes.includes('added')) {
    return 'new-pathway';
  }
  if (field.includes('pathway') && notes.includes('removed')) {
    return 'pathway-closed';
  }
  return 'rule-change';
}

/**
 * Style header row with brand colors.
 */
function styleHeaders(sheet, colCount) {
  const headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setBackground('#F7931A'); // BTC Orange
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment('center');

  // Freeze header row
  sheet.setFrozenRows(1);

  // Auto-resize columns (best effort)
  for (let i = 1; i <= colCount; i++) {
    try {
      sheet.autoResizeColumn(i);
      // Set max width to prevent overly wide columns
      const width = sheet.getColumnWidth(i);
      if (width > 200) sheet.setColumnWidth(i, 200);
      if (width < 60) sheet.setColumnWidth(i, 60);
    } catch (e) {
      // Skip
    }
  }
}

/**
 * Count rows in a sheet (excluding header).
 */
function countRows(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return 0;
  return Math.max(0, sheet.getLastRow() - 1);
}

// ── Trigger Management ───────────────────────────────────────────────────────

/**
 * Create a daily import trigger (runs at 06:30 UTC).
 */
function createImportTrigger() {
  // Remove existing import triggers
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'importAll') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('importAll')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .nearMinute(30)
    .create();

  Logger.log('✅ Daily import trigger created (06:30 UTC)');
}

/**
 * Remove all import triggers.
 */
function removeImportTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'importAll') {
      ScriptApp.deleteTrigger(t);
      Logger.log('🗑️ Removed trigger: ' + t.getUniqueId());
    }
  });
}

/**
 * List all current triggers.
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log(`📋 ${triggers.length} triggers:`);
  triggers.forEach(t => {
    Logger.log(`   - ${t.getHandlerFunction()} (${t.getTriggerSource()}, ${t.getEventType()})`);
  });
}

// ── Setup Menu ───────────────────────────────────────────────────────────────

/**
 * Add a custom menu to the spreadsheet for easy access.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔗 MotoPass')
    .addItem('📥 Import All Data', 'importAll')
    .addItem('📊 Setup Dashboard Charts', 'setupDashboard')
    .addSeparator()
    .addItem('⏰ Create Daily Import Trigger', 'createImportTrigger')
    .addItem('🗑️ Remove Import Triggers', 'removeImportTriggers')
    .addSeparator()
    .addItem('📋 List Triggers', 'listTriggers')
    .addToUi();
}

// ── One-Time Setup ───────────────────────────────────────────────────────────

/**
 * Run this once to set up everything: import data + create charts + trigger.
 */
function fullSetup() {
  Logger.log('🚀 Running full MotoPass spreadsheet setup...');

  // Step 1: Import data
  importAll();

  // Step 2: Setup dashboard charts (if chart script is installed)
  if (typeof setupDashboard === 'function') {
    setupDashboard();
    Logger.log('📊 Dashboard charts created');
  }

  // Step 3: Create daily trigger
  createImportTrigger();

  Logger.log('✅ Full setup complete! Sheet will auto-refresh daily at 06:30 UTC.');
}
