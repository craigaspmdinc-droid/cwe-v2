/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.5                              ║
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
    'App view active! Add drawing buttons over the action tiles.',
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
    var lbl = sheet.getRange(9, t.col);
    lbl.setValue(t.lbl);
    lbl.setFontSize(9);
    lbl.setFontWeight('bold');
    lbl.setFontColor('#8b949e');
    lbl.setBackground('#161b22');
    lbl.setHorizontalAlignment('center');
    lbl.setVerticalAlignment('top');
  });

  var ts = 'Updated  ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM d, yyyy  h:mm a');
  sheet.getRange(1, 8).setValue(ts)
    .setFontSize(9).setFontColor(C.MUTED).setBackground(C.SURFACE)
    .setHorizontalAlignment('right').setVerticalAlignment('middle');

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
    ss.rename('Claims Workflow Engine V2.5');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// INTERNAL REFERENCE SHEET OPENERS
// ═══════════════════════════════════════════════════════════════════════

function openRefSidebar(key) {
  var titles = {
    CARC:          'CARC Reference',
    MACs:          'MAC Jurisdiction Map',
    MassHealth:    'MassHealth Carrier Codes',
    GlobalPeriods: 'Global Period Reference',
  };
  var title = titles[key] || 'Reference Viewer';
  var html = HtmlService.createHtmlOutputFromFile('CWERefViewer')
    .setWidth(800).setHeight(620);
  html.setContent(html.getContent().replace(
    'var key = window.name;',
    'var key = ' + JSON.stringify(key) + ';'
  ));
  SpreadsheetApp.getUi().showModalDialog(html, '📂 ' + title);
}

function openRefCARC()          { openRefSidebar('CARC');          }
function openRefMACs()          { openRefSidebar('MACs');          }
function openRefMassHealth()    { openRefSidebar('MassHealth');    }
function openRefGlobalPeriods() { openRefSidebar('GlobalPeriods'); }

function cweGetRefData(sheetName) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(sheetName + ' sheet not found. Check Admin Tools → Show All Sheets.');
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return data
    .map(function(row) {
      return row.map(function(cell) {
        return cell === null || cell === undefined ? '' : String(cell);
      });
    })
    .filter(function(row) {
      return row.some(function(cell) { return cell.trim() !== ''; });
    });
}

// ═══════════════════════════════════════════════════════════════════════
// CANVAS BUILDER — zero cell merging
// ═══════════════════════════════════════════════════════════════════════

function cweBuildCanvas(ss) {
  var sheet = ss.getSheetByName('CWE App');
  if (!sheet) sheet = ss.insertSheet('CWE App', 0);

  try {
    var mergedRanges = sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).getMergedRanges();
    mergedRanges.forEach(function(r) { try { r.breakApart(); } catch(e) {} });
  } catch(e) { Logger.log('unmerge: ' + e.message); }

  sheet.clearContents();
  sheet.clearNotes();

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
  var colW = [14, 188, 14, 188, 14, 188, 14, 188, 14, 188, 14, 188, 14, 60, 60, 60, 60, 60, 60, 60];
  colW.forEach(function(w, i) { sheet.setColumnWidth(i + 1, w); });

  // ── Row heights ──────────────────────────────────────────────────────
  var rowH = [
    0,   // placeholder
    50,  // 1  top bar
    14,  // 2  spacer
    46,  // 3  hero title
    22,  // 4  subtitle
    14,  // 5  spacer
    18,  // 6  section label: metrics
    6,   // 7  card top pad
    44,  // 8  metric value
    22,  // 9  metric label
    6,   // 10 card bot pad
    14,  // 11 spacer
    6,   // 12 action card top pad
    44,  // 13 action card icon + title
    20,  // 14 action card subtitle
    6,   // 15 action card bot pad
    14,  // 16 spacer
    14,  // 17 spacer
    14,  // 18 spacer
    18,  // 19 section label: resources
    6,   // 20 card top pad
    26,  // 21 resource title
    20,  // 22 resource link
    6,   // 23 card bot pad
    14,  // 24 spacer
    6,   // 25 card top pad row2
    26,  // 26 resource title row2
    20,  // 27 resource link row2
    6,   // 28 card bot pad row2
    14,  // 29 spacer
    18,  // 30 section label: stages
    28,  // 31 stage badges
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
  cweRow(sheet, 1, 1, 25, C.SURFACE);
  cweBorder(sheet, 1, 1, 1, 25, 'bottom', C.BORDER);
  cweCell(sheet, 1, 2, '⚡  CWE V2.5', 13, 'bold', C.ACCENT, C.SURFACE, 'left');
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
    { col: 2, val: metrics.totalOpen,                   lbl: 'OPEN CLAIMS',     color: C.ACCENT },
    { col: 4, val: metrics.criticalHigh,                lbl: 'CRITICAL / HIGH', color: C.DANGER },
    { col: 6, val: metrics.escalatedCount,              lbl: 'ESCALATED',       color: C.WARN   },
    { col: 8, val: '$' + cweFmt(metrics.totalVariance), lbl: 'OPEN EXPOSURE',   color: C.GREEN  },
  ];
  mTiles.forEach(function(t) {
    var cardRange = sheet.getRange(7, t.col, 4, 1);
    cardRange.setBackground(C.SURFACE);
    cardRange.setBorder(true, true, true, true, false, false, C.BORDER, SpreadsheetApp.BorderStyle.SOLID);
    var valCell = sheet.getRange(8, t.col);
    valCell.setValue(t.val).setNumberFormat('@').setFontSize(26).setFontWeight('bold')
      .setFontColor(t.color).setBackground(C.SURFACE)
      .setHorizontalAlignment('center').setVerticalAlignment('middle')
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
    var lblCell = sheet.getRange(9, t.col);
    lblCell.setValue(t.lbl).setFontSize(9).setFontWeight('bold')
      .setFontColor(C.TEXT).setBackground(C.SURFACE)
      .setHorizontalAlignment('center').setVerticalAlignment('top')
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  });
  SpreadsheetApp.flush();

  // ════════════════════════════════════════════════════════════════════
  // ROWS 12-15 — ACTION ZONE CARDS
  // These are styled cell cards. Transparent drawings go on top of each.
  // Open Dashboard (col B, ACCENT border)
  // Log New Issue  (col F, GREEN border)
  // Training Center (col J, PURPLE border)
  // ════════════════════════════════════════════════════════════════════
  var actionCards = [
    {
      col:      2,
      icon:     '📊',
      title:    'Open Dashboard',
      subtitle: 'Queue · Metrics · Filters',
      border:   C.ACCENT,
      color:    C.ACCENT,
    },
    {
      col:      6,
      icon:     '+',
      title:    'Log New Issue',
      subtitle: 'Denial · Rejection · Payment',
      border:   C.GREEN,
      color:    C.GREEN,
    },
    {
      col:      10,
      icon:     '🎓',
      title:    'Training Center',
      subtitle: 'Scenarios · Quiz · Reference',
      border:   C.PURPLE,
      color:    C.PURPLE,
    },
  ];

  actionCards.forEach(function(card) {
    // Card background rows 12-15
    var cardBg = sheet.getRange(12, card.col, 4, 1);
    cardBg.setBackground(C.SURFACE2);
    cardBg.setBorder(true, true, true, true, false, false, card.border, SpreadsheetApp.BorderStyle.SOLID);

    // Icon row (row 12) — large, centered
    sheet.getRange(12, card.col)
      .setValue(card.icon)
      .setFontSize(20)
      .setFontWeight('bold')
      .setFontColor(card.color)
      .setBackground(C.SURFACE2)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    // Title row (row 13)
    sheet.getRange(13, card.col)
      .setValue(card.title)
      .setFontSize(11)
      .setFontWeight('bold')
      .setFontColor(card.color)
      .setBackground(C.SURFACE2)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    // Subtitle row (row 14)
    sheet.getRange(14, card.col)
      .setValue(card.subtitle)
      .setFontSize(9)
      .setFontWeight('normal')
      .setFontColor(C.MUTED)
      .setBackground(C.SURFACE2)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
  });

  // ════════════════════════════════════════════════════════════════════
  // ROW 19 — RESOURCES LABEL
  // ════════════════════════════════════════════════════════════════════
  cweCell(sheet, 19, 2, 'QUICK REFERENCES', 9, 'bold', C.MUTED, C.BG, 'left');

  // ── External cards (rows 20-23) ──────────────────────────────────────
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

  // ── Internal ref cards ───────────────────────────────────────────────
  // Row 1: CARC at col B (rows 20-23)
  // Row 2: MACs col B, MassHealth col F, GlobalPeriods col J (rows 25-28)
  var intCards = [
    { row: 20, col: 2,  icon: '📋', title: 'CARC Reference'           },
    { row: 25, col: 2,  icon: '🗺️', title: 'MAC Jurisdiction Map'    },
    { row: 25, col: 6,  icon: '🏛️', title: 'MassHealth Carrier Codes' },
    { row: 25, col: 10, icon: '📅', title: 'Global Period Reference'  },
  ];
  intCards.forEach(function(r) {
    cweBlock(sheet, r.row, r.col, 4, 1, C.SURFACE, C.BORDER);
    cweCell(sheet, r.row + 1, r.col, r.icon + '  ' + r.title, 10, 'bold', C.TEXT, C.SURFACE, 'left');
    cweCell(sheet, r.row + 2, r.col, '📂  Open internal reference', 9, 'normal', C.ACCENT, C.SURFACE, 'left');
  });

  // ════════════════════════════════════════════════════════════════════
  // ROW 30 — STAGES LABEL
  // ════════════════════════════════════════════════════════════════════
  cweCell(sheet, 30, 2, 'WORKFLOW STAGES', 9, 'bold', C.MUTED, C.BG, 'left');

  // ── Stage badges row 31, counts row 32 ──────────────────────────────
  var stageCounts = metrics.byStageCounts || {};
  var stages = [
    { lbl: 'NEW',          bg: '#1a3a5c', color: C.ACCENT, aliases: ['NEW']                                                             },
    { lbl: 'WORKING',      bg: '#0f3320', color: C.GREEN,  aliases: ['WORKING','IN PROGRESS','In Progress']                             },
    { lbl: 'PENDING INFO', bg: '#3d2b00', color: C.WARN,   aliases: ['PENDING INFO','PENDING']                                          },
    { lbl: 'APPEALED',     bg: '#2a1f5e', color: C.PURPLE, aliases: ['APPEALED']                                                        },
    { lbl: 'ESCALATED',    bg: '#4a1515', color: C.DANGER, aliases: ['ESCALATED','CONTRACT PULLED','Contract Pulled','CONTRACT_PULLED']  },
    { lbl: 'RESOLVED',     bg: '#0d2818', color: C.GREEN,  aliases: ['RESOLVED']                                                        },
    { lbl: 'CLOSED',       bg: '#1c1c1c', color: C.MUTED,  aliases: ['CLOSED']                                                         },
  ];
  var stageCountsUpper = {};
  Object.keys(stageCounts).forEach(function(k) {
    stageCountsUpper[k.toUpperCase().trim()] = stageCounts[k];
  });

  stages.forEach(function(s, i) {
    var col = 2 + (i * 2);
    cweBlock(sheet, 31, col, 1, 1, s.bg, C.BORDER);
    cweCell(sheet, 31, col, s.lbl, 9, 'bold', s.color, s.bg, 'center');
    var count = 0;
    s.aliases.forEach(function(a) {
      count += (stageCounts[a] || stageCountsUpper[a.toUpperCase()] || 0);
    });
    sheet.getRange(32, col)
      .setValue(count === 0 ? '—' : count).setNumberFormat('@')
      .setFontSize(11).setFontWeight('bold')
      .setFontColor(count > 0 ? s.color : C.MUTED)
      .setBackground(C.BG)
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
  });

  // ════════════════════════════════════════════════════════════════════
  // ROW 34 — FOOTER
  // ════════════════════════════════════════════════════════════════════
  cweBorder(sheet, 34, 2, 1, 19, 'top', C.BORDER);
  sheet.getRange(34, 4)
    .setValue('CWE V2.5  ·  Use the Claims Engine menu to log issues and open the dashboard  ·  Admin Tools → Refresh Metrics to update')
    .setFontSize(9).setFontColor(C.BORDER).setBackground(C.BG)
    .setHorizontalAlignment('left').setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);

  Logger.log('Canvas built. open=' + metrics.totalOpen + ' critical=' + metrics.criticalHigh);
}

// ═══════════════════════════════════════════════════════════════════════
// DRAWING HELPERS
// ═══════════════════════════════════════════════════════════════════════

function cweCell(sheet, row, col, text, size, weight, color, bg, align) {
  sheet.getRange(row, col)
    .setValue(text).setFontSize(size).setFontWeight(weight)
    .setFontColor(color).setBackground(bg)
    .setHorizontalAlignment(align).setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
}

function cweBlock(sheet, row, col, numRows, numCols, bg, borderColor) {
  var range = sheet.getRange(row, col, numRows, numCols);
  range.setBackground(bg);
  if (borderColor) {
    range.setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);
  }
}

function cweRow(sheet, row, col, numCols, bg) {
  sheet.getRange(row, col, 1, numCols).setBackground(bg);
}

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