/**
 * MotoPass Dashboard Charts — Google Apps Script
 *
 * Paste this into Extensions > Apps Script, then run setupDashboard().
 * It creates 8 beautiful charts on the Dashboard tab from your data.
 *
 * Charts created:
 * 1. Programs by Region (donut chart)
 * 2. Sovereignty Score Distribution (histogram)
 * 3. Transaction Types Over Time (line chart)
 * 4. Document Stamp Status (pie chart)
 * 5. Intel Pipeline Activity (bar chart)
 * 6. Application Funnel (horizontal bar)
 * 7. Alert Types Breakdown (donut chart)
 * 8. Crypto Score vs Sovereignty (scatter plot)
 *
 * Brand colors: BTC Orange #F7931A, Dark Ink #1A1A2E,
 *   Proof Green #22C55E, Watch Amber #F59E0B, Alert Red #EF4444,
 *   Nostr Violet #7C3AED, Electric Blue #3B82F6
 */

const COLORS = {
  btcOrange: '#F7931A',
  darkInk: '#1A1A2E',
  proofGreen: '#22C55E',
  watchAmber: '#F59E0B',
  alertRed: '#EF4444',
  nostrViolet: '#7C3AED',
  electricBlue: '#3B82F6',
  lightGray: '#94A3B8',
  white: '#FFFFFF',
  sectionBg: '#F1F5F9',
};

const CHART_PALETTE = [
  COLORS.btcOrange,
  COLORS.electricBlue,
  COLORS.proofGreen,
  COLORS.nostrViolet,
  COLORS.watchAmber,
  COLORS.alertRed,
  '#06B6D4', // cyan
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
];

// ── Setup ────────────────────────────────────────────────────────────────────

function setupDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Ensure Dashboard tab exists
  let dash = ss.getSheetByName('Dashboard');
  if (!dash) {
    dash = ss.insertSheet('Dashboard');
  }

  // Clear existing charts
  const existingCharts = dash.getCharts();
  existingCharts.forEach(c => dash.removeChart(c));

  // Build dashboard layout
  buildDashboardLayout(dash);

  // Create all charts
  createProgramsByRegionChart(dash, ss);
  createSovereigntyDistributionChart(dash, ss);
  createTransactionsOverTimeChart(dash, ss);
  createDocumentStatusChart(dash, ss);
  createIntelPipelineChart(dash, ss);
  createApplicationFunnelChart(dash, ss);
  createAlertTypesChart(dash, ss);
  createCryptoVsSovereigntyChart(dash, ss);

  // Style the dashboard
  styleDashboard(dash);

  SpreadsheetApp.flush();
  Logger.log('✅ Dashboard setup complete — 8 charts created');
}

// ── Dashboard Layout ─────────────────────────────────────────────────────────

function buildDashboardLayout(dash) {
  dash.clear();

  // Title
  dash.getRange('A1').setValue('MOTOPASS DASHBOARD')
    .setFontSize(24).setFontWeight('bold').setFontColor(COLORS.btcOrange)
    .setHorizontalAlignment('left');
  dash.getRange('A1:H1').merge();

  // Subtitle with date
  dash.getRange('A2').setValue('Auto-generated from live data')
    .setFontSize(10).setFontColor(COLORS.lightGray);
  dash.getRange('A2:H2').merge();

  // Summary stats row
  const statsRow = 4;
  dash.getRange(`A${statsRow}`).setValue('PROGRAMS').setFontWeight('bold').setFontSize(9).setFontColor(COLORS.lightGray);
  dash.getRange(`B${statsRow}`).setFormula('=COUNTA(Programs!A2:A100)').setFontSize(18).setFontWeight('bold').setFontColor(COLORS.darkInk);

  dash.getRange(`D${statsRow}`).setValue('TRANSACTIONS').setFontWeight('bold').setFontSize(9).setFontColor(COLORS.lightGray);
  dash.getRange(`E${statsRow}`).setFormula('=COUNTA(Transactions!A2:A1000)').setFontSize(18).setFontWeight('bold').setFontColor(COLORS.darkInk);

  dash.getRange(`G${statsRow}`).setValue('DOCUMENTS').setFontWeight('bold').setFontSize(9).setFontColor(COLORS.lightGray);
  dash.getRange(`H${statsRow}`).setFormula('=COUNTA(Documents!A2:A1000)').setFontSize(18).setFontWeight('bold').setFontColor(COLORS.darkInk);

  // Freshness stats
  const freshRow = 5;
  dash.getRange(`A${freshRow}`).setValue('🟢 Fresh').setFontColor(COLORS.proofGreen).setFontSize(10);
  dash.getRange(`B${freshRow}`).setFormula('=COUNTIF(Programs!P2:P100,"🟢 Fresh")').setFontWeight('bold').setFontColor(COLORS.proofGreen);
  dash.getRange(`C${freshRow}`).setValue('🟡 Watch').setFontColor(COLORS.watchAmber).setFontSize(10);
  dash.getRange(`D${freshRow}`).setFormula('=COUNTIF(Programs!P2:P100,"🟡 Watch")').setFontWeight('bold').setFontColor(COLORS.watchAmber);
  dash.getRange(`E${freshRow}`).setValue('🔴 Stale').setFontColor(COLORS.alertRed).setFontSize(10);
  dash.getRange(`F${freshRow}`).setFormula('=COUNTIF(Programs!P2:P100,"🔴 Stale")').setFontWeight('bold').setFontColor(COLORS.alertRed);

  // Application stats
  dash.getRange(`G${freshRow}`).setValue('APPS').setFontWeight('bold').setFontSize(9).setFontColor(COLORS.lightGray);
  dash.getRange(`H${freshRow}`).setFormula('=COUNTA(Applications!A2:A100)').setFontWeight('bold').setFontColor(COLORS.darkInk);

  // Section headers for chart areas
  dash.getRange('A7').setValue('PROGRAMS & SOVEREIGNTY').setFontWeight('bold').setFontSize(11).setFontColor(COLORS.darkInk);
  dash.getRange('A7:H7').setBackground(COLORS.sectionBg);

  dash.getRange('A22').setValue('TRANSACTIONS & DOCUMENTS').setFontWeight('bold').setFontSize(11).setFontColor(COLORS.darkInk);
  dash.getRange('A22:H22').setBackground(COLORS.sectionBg);

  dash.getRange('A37').setValue('INTEL, ALERTS & APPLICATIONS').setFontWeight('bold').setFontSize(11).setFontColor(COLORS.darkInk);
  dash.getRange('A37:H37').setBackground(COLORS.sectionBg);

  // Set column widths
  for (let i = 1; i <= 8; i++) {
    dash.setColumnWidth(i, 120);
  }

  // Freeze title rows
  dash.setFrozenRows(7);
}

// ── Chart 1: Programs by Region (Donut) ──────────────────────────────────────

function createProgramsByRegionChart(dash, ss) {
  const programs = ss.getSheetByName('Programs');
  if (!programs) return;

  // Build region count data in a hidden area
  const regions = getUniqueColumn(programs, 'D', 2, 100); // Column D = Region
  dash.getRange('J1').setValue('Region').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);
  dash.getRange('K1').setValue('Count').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);

  regions.forEach((region, i) => {
    dash.getRange(`J${i + 2}`).setValue(region).setFontSize(8);
    dash.getRange(`K${i + 2}`).setFormula(`=COUNTIF(Programs!D2:D100,"${region}")`).setFontSize(8);
  });

  const chart = dash.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dash.getRange(`J1:K${regions.length + 1}`))
    .setPosition(8, 1, 0, 0)
    .setOption('title', 'Programs by Region')
    .setOption('titleTextStyle', { color: COLORS.darkInk, fontSize: 12, bold: true })
    .setOption('width', 480)
    .setOption('height', 280)
    .setOption('pieHole', 0.4)
    .setOption('colors', CHART_PALETTE)
    .setOption('legend', { position: 'right', textStyle: { color: COLORS.darkInk, fontSize: 10 } })
    .setOption('backgroundColor', COLORS.white)
    .setOption('chartArea', { left: 20, top: 40, width: '65%', height: '75%' })
    .build();

  dash.insertChart(chart);
}

// ── Chart 2: Sovereignty Score Distribution (Histogram) ──────────────────────

function createSovereigntyDistributionChart(dash, ss) {
  const programs = ss.getSheetByName('Programs');
  if (!programs) return;

  // Build buckets: 0-20, 20-40, 40-60, 60-80, 80-100
  const buckets = ['0-20', '20-40', '40-60', '60-80', '80-100'];
  dash.getRange('L1').setValue('Sovereignty').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);
  dash.getRange('M1').setValue('Count').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);

  dash.getRange('L2').setValue('0-20');
  dash.getRange('M2').setFormula('=COUNTIFS(Programs!G2:G100,">="&0,Programs!G2:G100,"<"&20)');
  dash.getRange('L3').setValue('20-40');
  dash.getRange('M3').setFormula('=COUNTIFS(Programs!G2:G100,">="&20,Programs!G2:G100,"<"&40)');
  dash.getRange('L4').setValue('40-60');
  dash.getRange('M4').setFormula('=COUNTIFS(Programs!G2:G100,">="&40,Programs!G2:G100,"<"&60)');
  dash.getRange('L5').setValue('60-80');
  dash.getRange('M5').setFormula('=COUNTIFS(Programs!G2:G100,">="&60,Programs!G2:G100,"<"&80)');
  dash.getRange('L6').setValue('80-100');
  dash.getRange('M6').setFormula('=COUNTIFS(Programs!G2:G100,">="&80,Programs!G2:G100,"<="&100)');

  const chart = dash.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(dash.getRange('L1:M6'))
    .setPosition(8, 5, 0, 0)
    .setOption('title', 'Sovereignty Score Distribution')
    .setOption('titleTextStyle', { color: COLORS.darkInk, fontSize: 12, bold: true })
    .setOption('width', 480)
    .setOption('height', 280)
    .setOption('colors', [COLORS.electricBlue])
    .setOption('legend', { position: 'none' })
    .setOption('backgroundColor', COLORS.white)
    .setOption('hAxis', { textStyle: { color: COLORS.darkInk }, gridlines: { color: '#E2E8F0' } })
    .setOption('vAxis', { textStyle: { color: COLORS.darkInk }, gridlines: { color: '#E2E8F0' }, format: '0' })
    .setOption('chartArea', { left: 50, top: 40, width: '75%', height: '70%' })
    .setOption('bar', { groupWidth: '70%' })
    .build();

  dash.insertChart(chart);
}

// ── Chart 3: Transactions Over Time (Line) ───────────────────────────────────

function createTransactionsOverTimeChart(dash, ss) {
  const transactions = ss.getSheetByName('Transactions');
  if (!transactions) return;

  // Build monthly aggregation from Timestamp column A
  dash.getRange('N1').setValue('Month').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);
  dash.getRange('O1').setValue('Stamps').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);
  dash.getRange('P1').setValue('Total').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);

  // Get unique months from transactions
  const lastRow = transactions.getLastRow();
  if (lastRow < 2) return;

  const months = [];
  const data = transactions.getRange(2, 1, lastRow - 1, 2).getValues(); // Timestamp, Type
  data.forEach(row => {
    if (row[0]) {
      const d = new Date(row[0]);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months.includes(key)) months.push(key);
    }
  });

  months.sort().slice(-6).forEach((month, i) => {
    const row = i + 2;
    dash.getRange(`N${row}`).setValue(month).setFontSize(8);
    dash.getRange(`O${row}`).setFormula(`=COUNTIFS(Transactions!A2:A${lastRow},">="&DATEVALUE("${month}-01"),Transactions!A2:A${lastRow},"<"&DATEVALUE("${month}-01")+30,Transactions!B2:B${lastRow},"Stamp")`).setFontSize(8);
    dash.getRange(`P${row}`).setFormula(`=COUNTIFS(Transactions!A2:A${lastRow},">="&DATEVALUE("${month}-01"),Transactions!A2:A${lastRow},"<"&DATEVALUE("${month}-01")+30)`).setFontSize(8);
  });

  if (months.length === 0) return;

  const chart = dash.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(dash.getRange(`N1:P${Math.min(months.length + 1, 7)}`))
    .setPosition(23, 1, 0, 0)
    .setOption('title', 'Transactions Over Time')
    .setOption('titleTextStyle', { color: COLORS.darkInk, fontSize: 12, bold: true })
    .setOption('width', 480)
    .setOption('height', 280)
    .setOption('colors', [COLORS.proofGreen, COLORS.btcOrange])
    .setOption('legend', { position: 'bottom', textStyle: { color: COLORS.darkInk, fontSize: 10 } })
    .setOption('backgroundColor', COLORS.white)
    .setOption('hAxis', { textStyle: { color: COLORS.darkInk }, gridlines: { color: '#E2E8F0' } })
    .setOption('vAxis', { textStyle: { color: COLORS.darkInk }, gridlines: { color: '#E2E8F0' }, format: '0' })
    .setOption('curveType', 'function')
    .setOption('lineWidth', 3)
    .setOption('pointSize', 5)
    .setOption('chartArea', { left: 50, top: 40, width: '75%', height: '65%' })
    .build();

  dash.insertChart(chart);
}

// ── Chart 4: Document Stamp Status (Pie) ─────────────────────────────────────

function createDocumentStatusChart(dash, ss) {
  const documents = ss.getSheetByName('Documents');
  if (!documents) return;

  dash.getRange('Q1').setValue('Status').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);
  dash.getRange('R1').setValue('Count').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);

  dash.getRange('Q2').setValue('Confirmed');
  dash.getRange('R2').setFormula('=COUNTIF(Documents!H2:H1000,"Confirmed")');
  dash.getRange('Q3').setValue('Pending');
  dash.getRange('R3').setFormula('=COUNTIF(Documents!H2:H1000,"Pending")');
  dash.getRange('Q4').setValue('Error');
  dash.getRange('R4').setFormula('=COUNTIF(Documents!H2:H1000,"Error")');

  const chart = dash.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dash.getRange('Q1:R4'))
    .setPosition(23, 5, 0, 0)
    .setOption('title', 'Document Stamp Status')
    .setOption('titleTextStyle', { color: COLORS.darkInk, fontSize: 12, bold: true })
    .setOption('width', 480)
    .setOption('height', 280)
    .setOption('pieHole', 0.4)
    .setOption('colors', [COLORS.proofGreen, COLORS.watchAmber, COLORS.alertRed])
    .setOption('legend', { position: 'right', textStyle: { color: COLORS.darkInk, fontSize: 10 } })
    .setOption('backgroundColor', COLORS.white)
    .setOption('chartArea', { left: 20, top: 40, width: '60%', height: '75%' })
    .build();

  dash.insertChart(chart);
}

// ── Chart 5: Intel Pipeline Activity (Bar) ───────────────────────────────────

function createIntelPipelineChart(dash, ss) {
  const intel = ss.getSheetByName('Intel Log');
  if (!intel) return;

  dash.getRange('S1').setValue('Month').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);
  dash.getRange('T1').setValue('Changes').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);

  const lastRow = intel.getLastRow();
  if (lastRow < 2) return;

  const months = [];
  const data = intel.getRange(2, 1, lastRow - 1, 1).getValues();
  data.forEach(row => {
    if (row[0]) {
      const d = new Date(row[0]);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months.includes(key)) months.push(key);
    }
  });

  months.sort().slice(-6).forEach((month, i) => {
    const row = i + 2;
    dash.getRange(`S${row}`).setValue(month).setFontSize(8);
    dash.getRange(`T${row}`).setFormula(`=SUMIFS(Intel!E2:E${lastRow},Intel!A2:A${lastRow},">="&DATEVALUE("${month}-01"),Intel!A2:A${lastRow},"<"&DATEVALUE("${month}-01")+30)`).setFontSize(8);
  });

  if (months.length === 0) return;

  const chart = dash.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(dash.getRange(`S1:T${Math.min(months.length + 1, 7)}`))
    .setPosition(38, 1, 0, 0)
    .setOption('title', 'Intel Pipeline — Changes Applied')
    .setOption('titleTextStyle', { color: COLORS.darkInk, fontSize: 12, bold: true })
    .setOption('width', 480)
    .setOption('height', 280)
    .setOption('colors', [COLORS.nostrViolet])
    .setOption('legend', { position: 'none' })
    .setOption('backgroundColor', COLORS.white)
    .setOption('hAxis', { textStyle: { color: COLORS.darkInk }, gridlines: { color: '#E2E8F0' }, format: '0' })
    .setOption('vAxis', { textStyle: { color: COLORS.darkInk }, gridlines: { color: '#E2E8F0' } })
    .setOption('chartArea', { left: 80, top: 40, width: '70%', height: '70%' })
    .setOption('bar', { groupWidth: '60%' })
    .build();

  dash.insertChart(chart);
}

// ── Chart 6: Application Funnel (Horizontal Bar) ─────────────────────────────

function createApplicationFunnelChart(dash, ss) {
  dash.getRange('U1').setValue('Stage').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);
  dash.getRange('V1').setValue('Count').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);

  const stages = [
    'registered', 'documents', 'stamped', 'agent_assigned',
    'submitted', 'payment_pending', 'in_review', 'approved'
  ];

  stages.forEach((stage, i) => {
    const row = i + 2;
    dash.getRange(`U${row}`).setValue(stage.replace(/_/g, ' ')).setFontSize(8);
    dash.getRange(`V${row}`).setFormula(`=COUNTIF(Applications!E2:E100,"${stage}")`).setFontSize(8);
  });

  const chart = dash.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(dash.getRange('U1:V9'))
    .setPosition(38, 5, 0, 0)
    .setOption('title', 'Application Funnel')
    .setOption('titleTextStyle', { color: COLORS.darkInk, fontSize: 12, bold: true })
    .setOption('width', 480)
    .setOption('height', 280)
    .setOption('colors', [COLORS.electricBlue])
    .setOption('legend', { position: 'none' })
    .setOption('backgroundColor', COLORS.white)
    .setOption('hAxis', { textStyle: { color: COLORS.darkInk }, gridlines: { color: '#E2E8F0' }, format: '0' })
    .setOption('vAxis', { textStyle: { color: COLORS.darkInk, fontSize: 9 } })
    .setOption('chartArea', { left: 100, top: 40, width: '65%', height: '70%' })
    .setOption('bar', { groupWidth: '65%' })
    .build();

  dash.insertChart(chart);
}

// ── Chart 7: Alert Types (Donut) ─────────────────────────────────────────────

function createAlertTypesChart(dash, ss) {
  dash.getRange('W1').setValue('Type').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);
  dash.getRange('X1').setValue('Count').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);

  const types = ['rule-change', 'proof-update', 'freshness-stale', 'new-pathway', 'pathway-closed'];
  types.forEach((type, i) => {
    const row = i + 2;
    dash.getRange(`W${row}`).setValue(type).setFontSize(8);
    dash.getRange(`X${row}`).setFormula(`=COUNTIF(Alerts!C2:C1000,"${type}")`).setFontSize(8);
  });

  const chart = dash.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dash.getRange('W1:X6'))
    .setPosition(53, 1, 0, 0)
    .setOption('title', 'Alert Types')
    .setOption('titleTextStyle', { color: COLORS.darkInk, fontSize: 12, bold: true })
    .setOption('width', 480)
    .setOption('height', 280)
    .setOption('pieHole', 0.4)
    .setOption('colors', CHART_PALETTE)
    .setOption('legend', { position: 'right', textStyle: { color: COLORS.darkInk, fontSize: 10 } })
    .setOption('backgroundColor', COLORS.white)
    .setOption('chartArea', { left: 20, top: 40, width: '55%', height: '75%' })
    .build();

  dash.insertChart(chart);
}

// ── Chart 8: Crypto Score vs Sovereignty (Scatter) ───────────────────────────

function createCryptoVsSovereigntyChart(dash, ss) {
  const programs = ss.getSheetByName('Programs');
  if (!programs) return;

  dash.getRange('Y1').setValue('Crypto Score').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);
  dash.getRange('Z1').setValue('Sovereignty').setFontWeight('bold').setFontColor(COLORS.lightGray).setFontSize(8);

  const lastRow = Math.min(programs.getLastRow(), 100);
  const crypto = programs.getRange(2, 8, lastRow - 1, 1).getValues(); // Column H = Crypto Score
  const sovereignty = programs.getRange(2, 7, lastRow - 1, 1).getValues(); // Column G = Sovereignty

  crypto.forEach((row, i) => {
    if (row[0] !== '' && sovereignty[i][0] !== '') {
      dash.getRange(`Y${i + 2}`).setValue(row[0]).setFontSize(8);
      dash.getRange(`Z${i + 2}`).setValue(sovereignty[i][0]).setFontSize(8);
    }
  });

  const chart = dash.newChart()
    .setChartType(Charts.ChartType.SCATTER)
    .addRange(dash.getRange('Y1:Z51'))
    .setPosition(53, 5, 0, 0)
    .setOption('title', 'Crypto Score vs Sovereignty')
    .setOption('titleTextStyle', { color: COLORS.darkInk, fontSize: 12, bold: true })
    .setOption('width', 480)
    .setOption('height', 280)
    .setOption('colors', [COLORS.btcOrange])
    .setOption('legend', { position: 'none' })
    .setOption('backgroundColor', COLORS.white)
    .setOption('hAxis', { title: 'Crypto Score', textStyle: { color: COLORS.darkInk }, gridlines: { color: '#E2E8F0' } })
    .setOption('vAxis', { title: 'Sovereignty', textStyle: { color: COLORS.darkInk }, gridlines: { color: '#E2E8F0' } })
    .setOption('pointSize', 6)
    .setOption('chartArea', { left: 60, top: 40, width: '70%', height: '65%' })
    .build();

  dash.insertChart(chart);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getUniqueColumn(sheet, col, startRow, endRow) {
  const values = sheet.getRange(`${col}${startRow}:${col}${endRow}`).getValues();
  const unique = [...new Set(values.flat().filter(Boolean).map(String))];
  return unique.sort();
}

// ── Style Dashboard ──────────────────────────────────────────────────────────

function styleDashboard(dash) {
  // Set overall background
  dash.getRange('A1:H100').setBackground(COLORS.white);

  // Style stat numbers
  const statRanges = ['B4', 'E4', 'H4', 'D5', 'F5', 'H5'];
  statRanges.forEach(ref => {
    try {
      dash.getRange(ref).setFontSize(18).setFontWeight('bold');
    } catch (e) {
      // Skip if range doesn't exist
    }
  });

  // Add subtle borders to chart areas
  const chartAreas = [
    'A8:D21', 'E8:H21',    // Row 1 charts
    'A23:D36', 'E23:H36',  // Row 2 charts
    'A38:D52', 'E38:H52',  // Row 3 charts
    'A53:D67', 'E53:H67',  // Row 4 charts
  ];

  chartAreas.forEach(area => {
    try {
      dash.getRange(area).setBorder(true, true, true, true, false, false, '#E2E8F0', SpreadsheetApp.BorderStyle.SOLID);
    } catch (e) {
      // Skip invalid ranges
    }
  });
}

// ── Refresh (run periodically) ───────────────────────────────────────────────

function refreshDashboard() {
  setupDashboard();
  Logger.log('Dashboard refreshed at ' + new Date().toISOString());
}

// ── Create Triggers ──────────────────────────────────────────────────────────

function createDailyRefreshTrigger() {
  // Remove existing triggers
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'refreshDashboard') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Create daily trigger at 06:00 UTC
  ScriptApp.newTrigger('refreshDashboard')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  Logger.log('✅ Daily refresh trigger created (06:00 UTC)');
}
