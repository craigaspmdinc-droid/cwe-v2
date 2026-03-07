/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.5                              ║
 * ║                    CWE-PIR.gs                                         ║
 * ║  PURPOSE: Practice Intelligence Report — data engine + launcher       ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * SETUP — two steps:
 *
 * 1. Add to onOpen() menu in CWE-Main.gs (inside the Admin submenu):
 *       .addItem('📈 Practice Intelligence Report', 'openPracticeIntelligenceReport')
 *
 * 2. Add PIR.html to your Apps Script project (separate file, provided).
 *
 * That's it. No other files need to change.
 */

// ── Open/closed stage sets (mirrors DASH_OPEN_STAGES in CWE-Dashboard.gs) ──
var PIR_OPEN_STAGES   = ['NEW', 'WORKING', 'ESCALATED', 'APPEALED', 'PENDING', 'PENDING INFO', 'IN PROGRESS', 'CONTRACT PULLED', 'CONTRACT_PULLED'];
var PIR_CLOSED_STAGES = ['RESOLVED', 'CLOSED'];

// ── Expected denial rate thresholds for coding alert generation ──────────
var PIR_ALERT_THRESHOLDS = {
  dangerDenialRate: 45,   // % — red alert
  warnDenialRate:   30,   // % — amber alert
  minClaimsForAlert: 5    // don't flag codes with fewer than this many claims
};


// ═══════════════════════════════════════════════════════════════════════
// MENU ENTRY POINT
// Called from onOpen() menu item
// ═══════════════════════════════════════════════════════════════════════
function openPracticeIntelligenceReport() {
  var user = getCurrentUser();
  if (user.level !== 'Admin' && user.level !== 'Supervisor') {
    SpreadsheetApp.getUi().alert('Practice Intelligence Reports are available to Supervisors and Admins only.');
    return;
  }

  var practices = getPIRPracticeList_();
  if (!practices.length) {
    SpreadsheetApp.getUi().alert('No claims data found. Log some claims first.');
    return;
  }

  // Build practice selector prompt
  var listText = practices.map(function(p, i) { return (i + 1) + '. ' + p; }).join('\n');
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    '📈 Practice Intelligence Report',
    'Enter a practice name from the list below, or leave blank to report on ALL practices:\n\n' + listText,
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() !== ui.Button.OK) return;

  var input = result.getResponseText().trim();
  var selectedPractice = (input === '') ? 'ALL' : input;

  // Validate input against known practices (case-insensitive)
  if (selectedPractice !== 'ALL') {
    var matched = practices.filter(function(p) {
      return p.toLowerCase() === selectedPractice.toLowerCase();
    });
    if (!matched.length) {
      ui.alert('Practice not found: "' + selectedPractice + '"\n\nPlease enter the name exactly as shown in the list.');
      return;
    }
    selectedPractice = matched[0]; // use canonical casing
  }

  // Generate report data and open HTML template
  try {
    var reportData = generatePIRData_(selectedPractice);
    var tmpl = HtmlService.createTemplateFromFile('PIR');
    tmpl.reportDataJson = JSON.stringify(reportData);
    var output = tmpl.evaluate()
      .setWidth(1180)
      .setHeight(860)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
    SpreadsheetApp.getUi().showModalDialog(output, '📈 Practice Intelligence Report — ' + selectedPractice);
  } catch (e) {
    Logger.log('PIR generation error: ' + e.message + '\n' + e.stack);
    SpreadsheetApp.getUi().alert('Error generating report: ' + e.message);
  }
}


// ═══════════════════════════════════════════════════════════════════════
// SIDEBAR STRIP ENTRY POINT
// Called from CWEApp.html via google.script.run.getPIRSummary(practice)
// Returns condensed data for the inline intelligence strip
// ═══════════════════════════════════════════════════════════════════════
function getPIRSummary(practiceName) {
  try {
    var data = generatePIRData_(practiceName || 'ALL');
    return {
      success:      true,
      practiceName: data.profile.name,
      totalClaims:  data.volume.total,
      openClaims:   data.financial.openCount,
      recoveryRate: data.financial.recoveryRate,
      openExposure: data.financial.openExposure,
      topDenial:    data.denials.byVolume[0] || null,
      topAlert:     data.alerts[0]           || null,
      reportPeriod: data.profile.reportPeriod
    };
  } catch (e) {
    Logger.log('getPIRSummary error: ' + e.message);
    return { success: false, error: e.message };
  }
}


// ═══════════════════════════════════════════════════════════════════════
// PRACTICE LIST HELPER
// Used by the prompt and by the sidebar practice selector
// ═══════════════════════════════════════════════════════════════════════
function getPIRPracticeList_() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  if (!sheet || sheet.getLastRow() < 2) return [];

  var data  = sheet.getRange(2, COL.PRACTICE + 1, sheet.getLastRow() - 1, 1).getValues();
  var seen  = {};
  var list  = [];
  data.forEach(function(row) {
    var p = String(row[0] || '').trim();
    if (p && !seen[p]) { seen[p] = true; list.push(p); }
  });
  return list.sort();
}


// ═══════════════════════════════════════════════════════════════════════
// CORE DATA ENGINE
// Reads Claims sheet, calculates all 10 report sections
// Returns a structured plain object (JSON-serializable)
// ═══════════════════════════════════════════════════════════════════════
function generatePIRData_(practiceName) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  if (!sheet) throw new Error('Claims sheet not found.');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('No claims data found.');

  // Read all columns
  var raw = sheet.getRange(2, 1, lastRow - 1, COL.TOTAL_COLS + 2).getValues();

  // Filter to practice
  var rows = (practiceName === 'ALL')
    ? raw.filter(function(r) { return String(r[COL.WORKFLOW_STAGE] || '').trim() !== ''; })
    : raw.filter(function(r) {
        var p = String(r[COL.PRACTICE] || '').trim().toLowerCase();
        return p === practiceName.trim().toLowerCase()
            && String(r[COL.WORKFLOW_STAGE] || '').trim() !== '';
      });

  if (!rows.length) throw new Error('No claims found for: ' + practiceName);

  // ── Helpers ────────────────────────────────────────────────────────
  function toNum(v)    { return parseFloat(v) || 0; }
  function stageUp(r)  { return String(r[COL.WORKFLOW_STAGE] || '').trim().toUpperCase(); }
  function isOpen(r)   { return PIR_OPEN_STAGES.indexOf(stageUp(r))   !== -1; }
  function isClosed(r) { return PIR_CLOSED_STAGES.indexOf(stageUp(r)) !== -1; }
  function isDenial(r) { return String(r[COL.ISSUE_TYPE] || '').toLowerCase().indexOf('denial') !== -1; }

  function countBy(arr, keyFn) {
    return arr.reduce(function(acc, r) {
      var k = keyFn(r);
      if (k) acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }
  function sumBy(arr, keyFn, valFn) {
    return arr.reduce(function(acc, r) {
      var k = keyFn(r);
      if (k) acc[k] = (acc[k] || 0) + valFn(r);
      return acc;
    }, {});
  }
  function topN(obj, n) {
    return Object.keys(obj)
      .map(function(k) { return { key: k, val: obj[k] }; })
      .sort(function(a, b) { return b.val - a.val; })
      .slice(0, n);
  }
  function fmtMoney(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function fmtPct(n) {
    return Math.round(n) + '%';
  }

  // ── 1. Practice Profile ───────────────────────────────────────────
  var logDates = rows
    .map(function(r) { return r[COL.DATE_LOGGED]; })
    .filter(function(d) { return d instanceof Date && !isNaN(d); })
    .sort(function(a, b) { return a - b; });

  var fmtDate = function(d) {
    return d ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
  };
  var firstDate = logDates[0];
  var lastDate  = logDates[logDates.length - 1];

  var totalMonths = (firstDate && lastDate)
    ? Math.max(1, Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24 * 30)))
    : 1;

  var providers = uniqueVals_(rows, COL.PROVIDER);
  var payers    = uniqueVals_(rows, COL.PAYER);
  var cpts      = uniqueVals_(rows, COL.CPT);

  var profile = {
    name:         practiceName === 'ALL' ? 'All Practices' : practiceName,
    reportPeriod: fmtDate(firstDate) + ' – ' + fmtDate(lastDate),
    activeSince:  fmtDate(firstDate),
    totalMonths:  totalMonths,
    providers:    providers.slice(0, 5).join(', ') || '—',
    payers:       payers.slice(0, 4).join(', ')    || '—',
    cptCount:     cpts.length,
    generatedAt:  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  // ── 2. Claim Volume ───────────────────────────────────────────────
  var byTypeRaw  = countBy(rows, function(r) { return String(r[COL.ISSUE_TYPE] || '').trim(); });
  var total      = rows.length;

  // Monthly counts (all time, for sparkline)
  var monthCounts = {};
  rows.forEach(function(r) {
    var d = r[COL.DATE_LOGGED];
    if (!(d instanceof Date) || isNaN(d)) return;
    var key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthCounts[key] = (monthCounts[key] || 0) + 1;
  });
  var monthVals   = Object.keys(monthCounts).map(function(k) { return monthCounts[k]; });
  var peakMonth   = monthVals.length ? Math.max.apply(null, monthVals) : 0;
  var monthlyAvg  = Math.round((total / totalMonths) * 10) / 10;

  var volume = {
    total:      total,
    byType:     Object.keys(byTypeRaw).map(function(t) {
                  return { type: t, count: byTypeRaw[t], pct: Math.round(byTypeRaw[t] / total * 100) };
                }).sort(function(a, b) { return b.count - a.count; }),
    monthlyAvg: monthlyAvg,
    peakMonth:  peakMonth,
    monthCounts: monthCounts
  };

  // ── 3. CPT Analysis ───────────────────────────────────────────────
  var cptKey    = function(r) { return String(r[COL.CPT] || '').trim(); };
  var cptVol    = countBy(rows, cptKey);
  var cptDen    = countBy(rows.filter(isDenial), cptKey);
  var cptBilled = sumBy(rows, cptKey, function(r) { return toNum(r[COL.EXPECTED_AMT]); });
  var cptPaid   = sumBy(rows.filter(isClosed), cptKey, function(r) { return toNum(r[COL.PAID_AMT]); });

  var cptStats = topN(cptVol, 8).map(function(item) {
    var cpt        = item.key;
    var claims     = item.val;
    var denials    = cptDen[cpt]    || 0;
    var billed     = cptBilled[cpt] || 0;
    var paid       = cptPaid[cpt]   || 0;
    var denialRate = claims > 0 ? Math.round(denials / claims * 100) : 0;
    var recovRate  = billed > 0 ? Math.round(paid / billed * 100)   : 0;
    var avgBilled  = claims > 0 ? Math.round(billed / claims)        : 0;
    var flag       = denialRate >= PIR_ALERT_THRESHOLDS.dangerDenialRate ? 'danger'
                   : denialRate >= PIR_ALERT_THRESHOLDS.warnDenialRate   ? 'warn'
                   : '';
    return { cpt: cpt, claims: claims, denialRate: denialRate, avgBilled: fmtMoney(avgBilled), recovRate: recovRate, flag: flag };
  });

  // ── 4. Denial Patterns ────────────────────────────────────────────
  var denialRows = rows.filter(isDenial);
  var carcKey    = function(r) { return String(r[COL.ISSUE_DETAILS] || '').trim(); };
  var catKey     = function(r) { return String(r[COL.DENIAL_CATEGORY] || '').trim(); };

  var byCARC     = countBy(denialRows, carcKey);
  var byCat      = countBy(denialRows, catKey);
  var carcDollar = sumBy(denialRows, carcKey, function(r) { return Math.abs(toNum(r[COL.VARIANCE])); });

  var denials = {
    total:     denialRows.length,
    byVolume:  topN(byCARC, 6).map(function(i) {
                 return { key: i.key, val: i.val, pct: Math.round(i.val / Math.max(denialRows.length, 1) * 100) };
               }),
    byDollar:  topN(carcDollar, 6).map(function(i) {
                 return { key: i.key, val: fmtMoney(i.val) };
               }),
    byCategory: topN(byCat, 5)
  };

  // ── 5. Payer Performance ──────────────────────────────────────────
  var payerKey    = function(r) { return String(r[COL.PAYER] || '').trim(); };
  var payerVol    = countBy(rows, payerKey);
  var payerDen    = countBy(rows.filter(isDenial), payerKey);
  var payerTopDen = {};  // top CARC per payer
  rows.filter(isDenial).forEach(function(r) {
    var p = payerKey(r);
    var c = carcKey(r);
    if (!payerTopDen[p]) payerTopDen[p] = {};
    payerTopDen[p][c] = (payerTopDen[p][c] || 0) + 1;
  });

  // Avg days to resolve per payer
  var payerDaysTot = {};
  var payerDaysCnt = {};
  rows.filter(isClosed).forEach(function(r) {
    var p    = payerKey(r);
    var dl   = r[COL.DATE_LOGGED];
    var dr   = r[COL.DATE_RESOLVED];
    if (!(dl instanceof Date) || !(dr instanceof Date)) return;
    var days = Math.round((dr - dl) / (1000 * 60 * 60 * 24));
    if (days >= 0) {
      payerDaysTot[p] = (payerDaysTot[p] || 0) + days;
      payerDaysCnt[p] = (payerDaysCnt[p] || 0) + 1;
    }
  });

  // Payer paid vs billed (closed only)
  var payerBilled = sumBy(rows, payerKey, function(r) { return toNum(r[COL.EXPECTED_AMT]); });
  var payerPaid   = sumBy(rows.filter(isClosed), payerKey, function(r) { return toNum(r[COL.PAID_AMT]); });

  var payerStats = topN(payerVol, 8).map(function(item) {
    var p          = item.key;
    var claims     = item.val;
    var denCount   = payerDen[p]    || 0;
    var denRate    = claims > 0 ? Math.round(denCount / claims * 100) : 0;
    var avgDays    = payerDaysCnt[p] > 0 ? Math.round(payerDaysTot[p] / payerDaysCnt[p]) : null;
    var billed     = payerBilled[p] || 0;
    var paid       = payerPaid[p]   || 0;
    var recovRate  = billed > 0 ? Math.round(paid / billed * 100) : 0;

    // Top CARC for this payer
    var topCarcEntry = payerTopDen[p] ? topN(payerTopDen[p], 1)[0] : null;
    var topCarc      = topCarcEntry ? topCarcEntry.key : '—';

    var denRateFlag = denRate >= 40 ? 'red' : denRate >= 25 ? 'amber' : 'green';

    return {
      payer:      p,
      claims:     claims,
      denialRate: denRate,
      denRateFlag: denRateFlag,
      avgDays:    avgDays !== null ? avgDays + 'd' : '—',
      topDenial:  topCarc,
      recovRate:  recovRate
    };
  });

  // ── 6. Resolution Patterns ────────────────────────────────────────
  var closedRows = rows.filter(isClosed);

  // Avg days to resolve by issue type
  var typeResolveDays = {};
  var typeResolveCnt  = {};
  closedRows.forEach(function(r) {
    var t  = String(r[COL.ISSUE_TYPE] || '').trim();
    var dl = r[COL.DATE_LOGGED];
    var dr = r[COL.DATE_RESOLVED];
    if (!(dl instanceof Date) || !(dr instanceof Date)) return;
    var d  = Math.round((dr - dl) / (1000 * 60 * 60 * 24));
    if (d >= 0) {
      typeResolveDays[t] = (typeResolveDays[t] || 0) + d;
      typeResolveCnt[t]  = (typeResolveCnt[t]  || 0) + 1;
    }
  });

  var resolutionByType = Object.keys(typeResolveDays).map(function(t) {
    return {
      type: t,
      avgDays: Math.round(typeResolveDays[t] / typeResolveCnt[t])
    };
  }).sort(function(a, b) { return b.avgDays - a.avgDays; });

  // Top resolution actions (ROOT_CAUSE used as proxy; DENIAL_CATEGORY as fallback)
  var actionKey  = function(r) {
    return String(r[COL.ROOT_CAUSE] || r[COL.DENIAL_CATEGORY] || '').trim();
  };
  var actionVol  = countBy(closedRows, actionKey);
  var topActions = topN(actionVol, 6).map(function(i) {
    return { action: i.key, count: i.val, pct: Math.round(i.val / Math.max(closedRows.length, 1) * 100) };
  });

  var resolution = {
    totalClosed:   closedRows.length,
    byType:        resolutionByType,
    topActions:    topActions
  };

  // ── 7. Financial Summary ──────────────────────────────────────────
  var totalBilled   = rows.reduce(function(s, r) { return s + toNum(r[COL.EXPECTED_AMT]); }, 0);
  var totalPaid     = closedRows.reduce(function(s, r) { return s + toNum(r[COL.PAID_AMT]); }, 0);
  var openRows      = rows.filter(isOpen);
  var openExposure  = openRows.reduce(function(s, r) { return s + Math.abs(toNum(r[COL.VARIANCE])); }, 0);

  // Write-offs: closed rows where paid < expected (underpaid or zero)
  var writeOffTotal = closedRows.reduce(function(s, r) {
    var diff = toNum(r[COL.EXPECTED_AMT]) - toNum(r[COL.PAID_AMT]);
    return s + (diff > 0 ? diff : 0);
  }, 0);

  var recoveryRate  = totalBilled > 0 ? Math.round(totalPaid / totalBilled * 100) : 0;

  var financial = {
    totalBilled:   fmtMoney(totalBilled),
    totalRecovered: fmtMoney(totalPaid),
    openExposure:  fmtMoney(openExposure),
    openExposureRaw: openExposure,
    writeOffTotal: fmtMoney(writeOffTotal),
    recoveryRate:  recoveryRate,
    openCount:     openRows.length
  };

  // ── 8. Escalation Profile ─────────────────────────────────────────
  var escalatedRows = rows.filter(function(r) {
    return stageUp(r) === 'ESCALATED';
  });

  // Avg days escalated → resolved
  var escDaysTot = 0;
  var escDaysCnt = 0;
  closedRows.forEach(function(r) {
    // Proxy: if priority contains Critical or High, assume it was escalated
    var pri = String(r[COL.PRIORITY] || '').toUpperCase();
    if (pri.indexOf('CRITICAL') === -1 && pri.indexOf('HIGH') === -1) return;
    var dl = r[COL.DATE_LOGGED];
    var dr = r[COL.DATE_RESOLVED];
    if (!(dl instanceof Date) || !(dr instanceof Date)) return;
    var d  = Math.round((dr - dl) / (1000 * 60 * 60 * 24));
    if (d >= 0) { escDaysTot += d; escDaysCnt++; }
  });

  // Top escalation reason (denial category of escalated claims)
  var escCatVol  = countBy(escalatedRows, catKey);
  var topEscCat  = topN(escCatVol, 1)[0];

  var escalation = {
    count:          escalatedRows.length,
    rate:           total > 0 ? Math.round(escalatedRows.length / total * 100) : 0,
    avgResolveDays: escDaysCnt > 0 ? Math.round(escDaysTot / escDaysCnt) : null,
    topReason:      topEscCat ? topEscCat.key : '—'
  };

  // ── 9. Coding Alerts ──────────────────────────────────────────────
  var alerts = [];
  var thresh = PIR_ALERT_THRESHOLDS;

  cptStats.forEach(function(c) {
    if (c.claims < thresh.minClaimsForAlert) return;
    if (c.denialRate >= thresh.dangerDenialRate) {
      alerts.push({
        level:   'danger',
        title:   c.cpt + ' — Denial rate ' + c.denialRate + '% (' + c.claims + ' claims)',
        body:    'Denial rate is significantly above the expected range (< ' + thresh.warnDenialRate + '%). ' +
                 'Review recent claims for this code — check modifier usage, documentation requirements, ' +
                 'and whether payer-specific billing rules are being applied correctly.'
      });
    } else if (c.denialRate >= thresh.warnDenialRate) {
      alerts.push({
        level:   'warn',
        title:   c.cpt + ' — Denial rate ' + c.denialRate + '% (' + c.claims + ' claims)',
        body:    'Denial rate is elevated. Recommend supervisor spot-check on recent claims before next ' +
                 'billing cycle. Verify documentation and modifier usage are consistent.'
      });
    }
  });

  // High-denial payer alert
  payerStats.forEach(function(p) {
    if (p.claims < thresh.minClaimsForAlert) return;
    if (p.denialRate >= 50) {
      alerts.push({
        level:   'warn',
        title:   p.payer + ' — ' + p.denialRate + '% denial rate (' + p.claims + ' claims)',
        body:    'This payer is denying more than half of submitted claims. Verify payer-specific billing ' +
                 'requirements, prior authorization rules, and timely filing deadlines.'
      });
    }
  });

  // Write-off alert if > 15% of billed
  if (totalBilled > 0 && (writeOffTotal / totalBilled) > 0.15) {
    alerts.push({
      level: 'warn',
      title: 'Write-off rate above 15%',
      body:  'Total write-offs represent ' + Math.round(writeOffTotal / totalBilled * 100) + '% of billed amount. ' +
             'Review write-off patterns by payer and CPT code to identify recoverable claims.'
    });
  }

  // Positive alert if recovery rate is strong
  if (recoveryRate >= 85) {
    alerts.push({
      level: 'ok',
      title: 'Recovery rate strong at ' + recoveryRate + '%',
      body:  'Overall claim recovery is performing well. Continue monitoring high-denial CPT codes and payers flagged above.'
    });
  }

  // ── 10. Operational Notes (placeholder — populated from Practice Guide link) ──
  // Actual notes come from the linked practice guide document.
  // This section surfaces any auto-detectable patterns as structured notes.
  var opsNotes = [];

  // VA/Tricare auth pattern
  var vaRows = rows.filter(function(r) {
    var p = String(r[COL.PAYER] || '').toUpperCase();
    return p.indexOf('VA') !== -1 || p.indexOf('TRICARE') !== -1 || p.indexOf('VETERANS') !== -1;
  });
  if (vaRows.length > 0) {
    var vaDenRate = vaRows.filter(isDenial).length / vaRows.length;
    if (vaDenRate > 0.3) {
      opsNotes.push({
        tag:  'VA / Tricare',
        text: 'VA and Tricare claims have a ' + Math.round(vaDenRate * 100) + '% denial rate. ' +
              'Confirm prior authorization is obtained before claim submission for all VA patients.'
      });
    }
  }

  // Medicare timely filing pattern
  var mcRows   = rows.filter(function(r) {
    return String(r[COL.COVERAGE_TYPE] || '').toLowerCase().indexOf('medicare') !== -1;
  });
  var co29Rows = rows.filter(function(r) {
    return String(r[COL.ISSUE_DETAILS] || '').indexOf('29') !== -1;
  });
  if (co29Rows.length >= 3) {
    opsNotes.push({
      tag:  'Timely Filing',
      text: co29Rows.length + ' CO-29 (timely filing) denials detected. Consider adding a filing deadline ' +
            'reminder step to the intake workflow for this practice.'
    });
  }

  return {
    profile:    profile,
    volume:     volume,
    cptStats:   cptStats,
    denials:    denials,
    payerStats: payerStats,
    resolution: resolution,
    financial:  financial,
    escalation: escalation,
    alerts:     alerts,
    opsNotes:   opsNotes
  };
}


// ═══════════════════════════════════════════════════════════════════════
// PRIVATE HELPERS
// ═══════════════════════════════════════════════════════════════════════
function uniqueVals_(rows, colIdx) {
  var seen = {};
  var out  = [];
  rows.forEach(function(r) {
    var v = String(r[colIdx] || '').trim();
    if (v && !seen[v]) { seen[v] = true; out.push(v); }
  });
  return out.sort();
}