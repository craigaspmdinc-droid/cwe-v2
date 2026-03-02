/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.4                              ║
 * ║                    CWE-AppView.gs                                     ║
 * ║  PURPOSE: Single-screen interactive app canvas — NO CELL MERGING     ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

var C = {
  BG:       '#0d1117',
  SURFACE:  '#161b22',
  SURFACE2: '#21262d',
  BORDER:   '#30363d',
  ACCENT:   '#58a6ff',
  GREEN:    '#3fb950',
  WARN:     '#d29922',
  DANGER:   '#f85149',
  PURPLE:   '#a5a3ff',
  TEXT:     '#e6edf3',
  MUTED:    '#8b949e'
};

// ═══════════════════════════════════════════════════════════════════════
// PUBLIC ENTRY POINTS
// ═══════════════════════════════════════════════════════════════════════

function setupAppView() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  cweHideDataSheets(ss);
  cweBuildCanvas(ss);
  cweSetChrome(ss);
  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'App view active! Install onSelectionChange trigger to enable action tiles.',
    '✅ CWE V2.5', 6
  );
}

function refreshMetrics() {
  // Updates ONLY the 4 live metric cells — drawings and layout are preserved
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CWE App');
  if (!sheet) { setupAppView(); return; }

  var metrics = cweGetMetrics(ss);
  var mTiles = [
    { col: 2, val: metrics.totalOpen,                   color: '#58a6ff', lbl: 'OPEN CLAIMS'     },
    { col: 4, val: metrics.criticalHigh,                color: '#f85149', lbl: 'CRITICAL / HIGH'  },
    { col: 6, val: metrics.escalatedCount,              color: '#d29922', lbl: 'ESCALATED'        },
    { col: 8, val: '$' + cweFmt(metrics.totalVariance), color: '#3fb950', lbl: 'OPEN EXPOSURE'    },
  ];
  Logger.log('refreshMetrics: open=' + metrics.totalOpen + ' critical=' + metrics.criticalHigh);
  mTiles.forEach(function(t) {
    // Value cell (row 8)
    var cell = sheet.getRange(8, t.col);
    cell.setValue(t.val);
    cell.setNumberFormat('@');
    cell.setFontSize(26);
    cell.setFontWeight('bold');
    cell.setFontColor(t.color);
    cell.setBackground('#161b22');
    cell.setHorizontalAlignment('center');
    cell.setVerticalAlignment('middle');
    cell.setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
    // Label cell (row 9) — always rewrite in case it was cleared
    var lbl = sheet.getRange(9, t.col);
    lbl.setValue(t.lbl);
    lbl.setFontSize(9);
    lbl.setFontWeight('bold');
    lbl.setFontColor('#8b949e');
    lbl.setBackground('#161b22');
    lbl.setHorizontalAlignment('center');
    lbl.setVerticalAlignment('top');
  });

  // Update timestamp in top bar
  var ts = 'Updated  ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM d, yyyy  h:mm a');
  sheet.getRange(1, 8).setValue(ts)
    .setFontSize(9).setFontColor(C.MUTED).setBackground(C.SURFACE)
    .setHorizontalAlignment('right').setVerticalAlignment('middle');

  // Update stage counts
  var stageCounts = metrics.byStageCounts || {};
  var stageList = [
    { lbl: 'NEW',          color: C.ACCENT, aliases: ['NEW'] },
    { lbl: 'WORKING',      color: C.GREEN,  aliases: ['WORKING','IN PROGRESS','In Progress'] },
    { lbl: 'PENDING INFO', color: C.WARN,   aliases: ['PENDING INFO','PENDING'] },
    { lbl: 'APPEALED',     color: C.PURPLE, aliases: ['APPEALED'] },
    { lbl: 'ESCALATED',    color: C.DANGER, aliases: ['ESCALATED','CONTRACT PULLED','Contract Pulled','CONTRACT_PULLED'] },
    { lbl: 'RESOLVED',     color: C.GREEN,  aliases: ['RESOLVED'] },
    { lbl: 'CLOSED',       color: C.MUTED,  aliases: ['CLOSED'] },
  ];
  var stageCountsUp = {};
  Object.keys(stageCounts).forEach(function(k) { stageCountsUp[k.toUpperCase()] = stageCounts[k]; });
  stageList.forEach(function(s, i) {
    var col = 2 + (i * 2);
    var count = 0;
    s.aliases.forEach(function(a) { count += (stageCounts[a] || stageCountsUp[a.toUpperCase()] || 0); });
    sheet.getRange(32, col)
      .setValue(count === 0 ? '—' : count).setNumberFormat('@')
      .setFontSize(11).setFontWeight('bold')
      .setFontColor(count > 0 ? s.color : C.MUTED)
      .setBackground(C.BG)
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
  });

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Metrics updated: ' + metrics.totalOpen + ' open claims, ' + metrics.criticalHigh + ' critical/high.',
    '✅ CWE V2.5', 4
  );
}

function refreshCanvas() {
  // Full rebuild — USE SPARINGLY, wipes drawings
  // Use refreshMetrics() for routine updates
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  cweBuildCanvas(ss);
  cweHideDataSheets(ss);
  ss.setActiveSheet(ss.getSheetByName('CWE App'));
  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Canvas rebuilt. Re-add your action button drawings.',
    '⚠️ CWE V2.5', 8
  );
}

function showAllSheets() {
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(function(s) { s.showSheet(); });
  SpreadsheetApp.getActiveSpreadsheet().toast('All sheets visible.', '🔓');
}

function hideDataSheets() {
  cweHideDataSheets(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getActiveSpreadsheet().toast('Data sheets hidden.', '🔒');
}

function openTrainingCenter() {
  var html = HtmlService.createHtmlOutputFromFile('CWE_V2_Training')
    .setWidth(1100).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'CWE V2.5 — Training Center');
}

function cweHideDataSheets(ss) {
  ss.getSheets().forEach(function(s) {
    if (s.getName() !== 'CWE App') {
      try { s.hideSheet(); } catch(e) {}
    }
  });
}

function cweSetChrome(ss) {
  var name = ss.getName();
  if (name.toLowerCase().indexOf('sheet') > -1 || name.toLowerCase().indexOf('untitled') > -1) {
    ss.rename('Claims Workflow Engine V2.4');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CANVAS BUILDER — zero cell merging
// All layout done with column widths + row heights + background fills
// Text placed in leftmost cell of each "block", rest filled with color
// ═══════════════════════════════════════════════════════════════════════

function cweBuildCanvas(ss) {
  // Get or create sheet
  var sheet = ss.getSheetByName('CWE App');
  if (!sheet) {
    sheet = ss.insertSheet('CWE App', 0);
  }

  // Break all existing merges before clearing — prevents stale merge conflicts
  try {
    var mergedRanges = sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).getMergedRanges();
    mergedRanges.forEach(function(r) { try { r.breakApart(); } catch(e) {} });
  } catch(e) { Logger.log('unmerge: ' + e.message); }

  // Clear everything safely
  sheet.clearContents();
  sheet.clearNotes();

  // Reset formats on the working area
  var area = sheet.getRange(1, 1, 40, 25);
  area.setBackground(C.BG);
  area.setFontColor(C.TEXT);
  area.setFontFamily('Arial');
  area.setFontSize(10);
  area.setFontWeight('normal');
  area.setFontStyle('normal');
  area.setBorder(false, false, false, false, false, false);
  area.setHorizontalAlignment('left');
  area.setVerticalAlignment('middle');
  area.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

  sheet.setHiddenGridlines(true);
  sheet.setTabColor(C.ACCENT);
  sheet.setFrozenRows(0);

  // ── Column widths ────────────────────────────────────────────────────
  // A=margin, B=tile1, C=gap, D=tile2, E=gap, F=tile3, G=gap, H=tile4, I+=overflow
  var colW = [14, 188, 14, 188, 14, 188, 14, 188, 14, 188, 14, 188, 14, 60, 60, 60, 60, 60, 60, 60];
  colW.forEach(function(w, i) { sheet.setColumnWidth(i + 1, w); });

  // ── Row heights ──────────────────────────────────────────────────────
  var rowH = [
    0,   // placeholder (1-indexed below)
    50,  // 1  top bar
    14,  // 2  spacer
    46,  // 3  hero title
    22,  // 4  subtitle
    14,  // 5  spacer
    18,  // 6  section label: metrics
    6,   // 7  card top pad
    44,  // 8  metric value — tall enough for 28pt font
    22,  // 9  metric label
    6,   // 10 card bot pad
    14,  // 11 spacer
    14,  // 12 spacer
    4,   // 13 action area top
    30,  // 14 action area
    30,  // 15 action area
    30,  // 16 action area
    4,   // 17 action area bottom
    14,  // 18 spacer
    18,  // 19 section label: resources
    6,   // 20 card top pad
    26,  // 21 resource title
    20,  // 22 resource link
    6,   // 23 card bot pad
    14,  // 24 spacer (between resource rows)
    6,   // 25 card top pad row2
    26,  // 26 resource title row2
    20,  // 27 resource link row2
    6,   // 28 card bot pad row2
    14,  // 29 spacer
    18,  // 30 section label: stages
    28,  // 31 stage row — all 7 badges
    24,  // 32 stage counts
    14,  // 33 spacer
    20,  // 34 footer
  ];
  for (var r = 1; r < rowH.length; r++) {
    sheet.setRowHeight(r, rowH[r]);
  }

  // ════════════════════════════════════════════════════════════════════
  // ROW 1 — TOP BAR
  // ════════════════════════════════════════════════════════════════════
  cweRow(sheet, 1, 1, 25, C.SURFACE, null);
  cweBorder(sheet, 1, 1, 1, 25, 'bottom', C.BORDER);
  cweCell(sheet, 1, 2, '⚡  CWE V2.5', 13, 'bold', C.ACCENT, C.SURFACE, 'left');
  cweCell(sheet, 1, 7, 'CLAIMS WORKFLOW ENGINE', 11, 'bold', C.TEXT, C.SURFACE, 'left');
  var ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM d, yyyy  h:mm a');
  cweCell(sheet, 1, 8, 'Updated  ' + ts, 9, 'normal', C.MUTED, C.SURFACE, 'right');

  // ════════════════════════════════════════════════════════════════════
  // ROWS 3-4 — HERO
  // ════════════════════════════════════════════════════════════════════
  sheet.getRange(3, 2).setValue('Claims Workflow Engine')
    .setFontSize(22).setFontWeight('bold').setFontColor(C.TEXT).setBackground(C.BG)
    .setHorizontalAlignment('left').setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  sheet.getRange(4, 2).setValue('Multi-specialty outpatient billing')
    .setFontSize(11).setFontWeight('normal').setFontColor(C.MUTED).setBackground(C.BG)
    .setHorizontalAlignment('left').setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  // ════════════════════════════════════════════════════════════════════
  // ROW 6 — METRICS LABEL
  // ════════════════════════════════════════════════════════════════════
  cweCell(sheet, 6, 2, 'LIVE METRICS', 9, 'bold', C.MUTED, C.BG, 'left');

  // ── Metric tiles (rows 7-10) ─────────────────────────────────────────
  var metrics = cweGetMetrics(ss);
  var mTiles = [
    { col: 2, val: metrics.totalOpen,                    lbl: 'OPEN CLAIMS',     color: C.ACCENT },
    { col: 4, val: metrics.criticalHigh,                 lbl: 'CRITICAL / HIGH', color: C.DANGER },
    { col: 6, val: metrics.escalatedCount,               lbl: 'ESCALATED',       color: C.WARN   },
    { col: 8, val: '$' + cweFmt(metrics.totalVariance),  lbl: 'OPEN EXPOSURE',   color: C.GREEN  },
  ];
  Logger.log('Metric values: open=' + metrics.totalOpen + ' critical=' + metrics.criticalHigh + ' escalated=' + metrics.escalatedCount + ' variance=' + metrics.totalVariance);
  mTiles.forEach(function(t) {
    // Paint card background rows 7-10
    var cardRange = sheet.getRange(7, t.col, 4, 1);
    cardRange.setBackground(C.SURFACE);
    cardRange.setBorder(true, true, true, true, false, false, C.BORDER, SpreadsheetApp.BorderStyle.SOLID);
    // Value cell
    var valCell = sheet.getRange(8, t.col);
    valCell.setValue(t.val);
    valCell.setNumberFormat('@');
    valCell.setFontSize(26);
    valCell.setFontWeight('bold');
    valCell.setFontColor(t.color);
    valCell.setBackground(C.SURFACE);
    valCell.setHorizontalAlignment('center');
    valCell.setVerticalAlignment('middle');
    valCell.setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
    // Label cell
    var lblCell = sheet.getRange(9, t.col);
    lblCell.setValue(t.lbl);
    lblCell.setFontSize(9);
    lblCell.setFontWeight('bold');
    lblCell.setFontColor(C.TEXT);
    lblCell.setBackground(C.SURFACE);
    lblCell.setHorizontalAlignment('center');
    lblCell.setVerticalAlignment('top');
    lblCell.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  });
  SpreadsheetApp.flush();

  // Action button drawings float above rows 12-17 — no background needed

  // ════════════════════════════════════════════════════════════════════
  // ROW 19 — RESOURCES LABEL
  // ════════════════════════════════════════════════════════════════════
  cweCell(sheet, 19, 2, 'QUICK REFERENCES', 9, 'bold', C.MUTED, C.BG, 'left');

  // ── Resource cards (rows 20-23) ──────────────────────────────────────
  // External cards — real hyperlinks
  var extCards = [
    { row: 20, col: 6,  icon: '🏥', title: 'CMS Coverage DB',
      url: 'https://www.cms.gov/medicare-coverage-database/' },
    { row: 20, col: 10, icon: '🔗', title: 'NCCI Edit Tables',
      url: 'https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits' },
  ];
  extCards.forEach(function(r) {
    cweBlock(sheet, r.row, r.col, 4, 1, C.SURFACE, C.BORDER);
    cweCell(sheet, r.row + 1, r.col, r.icon + '  ' + r.title, 10, 'bold', C.TEXT, C.SURFACE, 'left');
    var rtv = SpreadsheetApp.newRichTextValue()
      .setText('↗  Open in browser')
      .setLinkUrl(r.url)
      .build();
    sheet.getRange(r.row + 2, r.col).setRichTextValue(rtv)
      .setFontSize(9).setFontColor(C.ACCENT).setBackground(C.SURFACE)
      .setVerticalAlignment('top').setHorizontalAlignment('left');
  });

  // Internal cards — open REF sheets via assigned drawing buttons
  var intCards = [
    { row: 20, col: 2,  icon: '📋', title: 'CARC Reference',        fn: 'openRefCARC'         },
    { row: 24, col: 2,  icon: '🗺️', title: 'MAC Jurisdiction Map',  fn: 'openRefMACs'         },
    { row: 24, col: 6,  icon: '🏛️', title: 'MassHealth Carrier Codes', fn: 'openRefMassHealth' },
    { row: 24, col: 10, icon: '📅', title: 'Global Period Reference', fn: 'openRefGlobalPeriods' },
  ];
  intCards.forEach(function(r) {
    cweBlock(sheet, r.row, r.col, 4, 1, C.SURFACE, C.BORDER);
    cweCell(sheet, r.row + 1, r.col, r.icon + '  ' + r.title, 10, 'bold', C.TEXT, C.SURFACE, 'left');
    cweCell(sheet, r.row + 2, r.col, '📂  Open internal reference', 9, 'normal', C.ACCENT, C.SURFACE, 'left');
  });

  // ════════════════════════════════════════════════════════════════════
  // ROW 25 — STAGES LABEL
  // ════════════════════════════════════════════════════════════════════
  cweCell(sheet, 30, 2, 'WORKFLOW STAGES', 9, 'bold', C.MUTED, C.BG, 'left');

  // ── Stage badges row 31, counts row 32 ──────────────────────────────────
  var stageCounts = metrics.byStageCounts || {};
  // Stage labels must match raw values stored in the Claims sheet
  // aliases[] handles alternate spellings in the data
  var stages = [
    { lbl: 'NEW',          bg: '#1a3a5c', color: C.ACCENT, aliases: ['NEW']                               },
    { lbl: 'WORKING',      bg: '#0f3320', color: C.GREEN,  aliases: ['WORKING','IN PROGRESS','In Progress']},
    { lbl: 'PENDING INFO', bg: '#3d2b00', color: C.WARN,   aliases: ['PENDING INFO','PENDING']             },
    { lbl: 'APPEALED',     bg: '#2a1f5e', color: C.PURPLE, aliases: ['APPEALED']                           },
    { lbl: 'ESCALATED',    bg: '#4a1515', color: C.DANGER, aliases: ['ESCALATED','CONTRACT PULLED','Contract Pulled','CONTRACT_PULLED'] },
    { lbl: 'RESOLVED',     bg: '#0d2818', color: C.GREEN,  aliases: ['RESOLVED']                           },
    { lbl: 'CLOSED',       bg: '#1c1c1c', color: C.MUTED,  aliases: ['CLOSED']                             },
  ];
  // Build case-insensitive lookup of stage counts
  var stageCountsUpper = {};
  Object.keys(stageCounts).forEach(function(k) {
    stageCountsUpper[k.toUpperCase().trim()] = stageCounts[k];
  });
  Logger.log('Stage counts: ' + JSON.stringify(stageCountsUpper));

  stages.forEach(function(s, i) {
    var col = 2 + (i * 2); // cols 2,4,6,8,10,12,14
    // Badge
    cweBlock(sheet, 31, col, 1, 1, s.bg, C.BORDER);
    cweCell(sheet, 31, col, s.lbl, 9, 'bold', s.color, s.bg, 'center');
    // Sum counts across all aliases for this stage
    var count = 0;
    s.aliases.forEach(function(a) {
      count += (stageCounts[a] || stageCountsUpper[a.toUpperCase()] || 0);
    });
    sheet.getRange(32, col)
      .setValue(count === 0 ? '—' : count)
      .setNumberFormat('@')
      .setFontSize(11)
      .setFontWeight('bold')
      .setFontColor(count > 0 ? s.color : C.MUTED)
      .setBackground(C.BG)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
  });

  // ════════════════════════════════════════════════════════════════════
  // ROW 29 — FOOTER
  // ════════════════════════════════════════════════════════════════════
  cweBorder(sheet, 34, 2, 1, 19, 'top', C.BORDER);
  sheet.getRange(34, 4).setValue('CWE V2.5  ·  Use the Claims Engine menu to log issues and open the dashboard  ·  Admin Tools → Refresh Metrics to update')
    .setFontSize(9).setFontColor(C.BORDER).setBackground(C.BG)
    .setHorizontalAlignment('left').setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  Logger.log('Canvas built. open=' + metrics.totalOpen + ' critical=' + metrics.criticalHigh);
}

// ═══════════════════════════════════════════════════════════════════════
// DRAWING HELPERS — no merging ever
// ═══════════════════════════════════════════════════════════════════════

// Fill a single cell with text + formatting
function cweCell(sheet, row, col, text, size, weight, color, bg, align) {
  var cell = sheet.getRange(row, col);
  cell.setValue(text)
    .setFontSize(size)
    .setFontWeight(weight)
    .setFontColor(color)
    .setBackground(bg)
    .setHorizontalAlignment(align)
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
}

// Fill a rectangular block with background + border (no text, no merging)
function cweBlock(sheet, row, col, numRows, numCols, bg, borderColor) {
  var range = sheet.getRange(row, col, numRows, numCols);
  range.setBackground(bg);
  if (borderColor) {
    range.setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);
  }
}

// Fill a full row with background
function cweRow(sheet, row, col, numCols, bg) {
  sheet.getRange(row, col, 1, numCols).setBackground(bg);
}

// Add a single border to one side of a range
function cweBorder(sheet, row, col, numRows, numCols, side, color) {
  var range = sheet.getRange(row, col, numRows, numCols);
  var top = side === 'top', bot = side === 'bottom', left = side === 'left', right = side === 'right';
  range.setBorder(top, left, bot, right, false, false, color, SpreadsheetApp.BorderStyle.SOLID);
}

// ═══════════════════════════════════════════════════════════════════════
// DATA HELPERS
// ═══════════════════════════════════════════════════════════════════════

function cweGetMetrics(ss) {
  try {
    var d = getDashboardData();
    return {
      totalOpen:      d.totalOpen      || 0,
      criticalHigh:   d.criticalHigh   || 0,
      escalatedCount: d.escalatedCount || 0,
      totalVariance:  d.totalVariance  || 0,
      byStageCounts:  d.byStageCounts  || {}
    };
  } catch(e) {
    Logger.log('cweGetMetrics error: ' + e.message);
    return { totalOpen: '—', criticalHigh: '—', escalatedCount: '—', totalVariance: 0, byStageCounts: {} };
  }
}

function cweFmt(n) {
  if (typeof n !== 'number') return String(n);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(0);
}

function cweSetChrome(ss) {
  var name = ss.getName();
  if (name.toLowerCase().indexOf('sheet') > -1 || name.toLowerCase().indexOf('untitled') > -1) {
    ss.rename('Claims Workflow Engine V2.4');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// INTERNAL REFERENCE SHEET OPENERS
// Assign these to drawing buttons or call from menu
// ═══════════════════════════════════════════════════════════════════════

function openRefCARC() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-CARC');
  if (!sheet) { SpreadsheetApp.getUi().alert('REF-CARC sheet not found.'); return; }
  sheet.showSheet();
  ss.setActiveSheet(sheet);
}

function openRefMACs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-MACs');
  if (!sheet) { SpreadsheetApp.getUi().alert('REF-MACs sheet not found.'); return; }
  sheet.showSheet();
  ss.setActiveSheet(sheet);
}

function openRefMassHealth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-MassHealth');
  if (!sheet) { SpreadsheetApp.getUi().alert('REF-MassHealth sheet not found.'); return; }
  sheet.showSheet();
  ss.setActiveSheet(sheet);
}

function openRefGlobalPeriods() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-GlobalPeriods');
  if (!sheet) { SpreadsheetApp.getUi().alert('REF-GlobalPeriods sheet not found.'); return; }
  sheet.showSheet();
  ss.setActiveSheet(sheet);
}