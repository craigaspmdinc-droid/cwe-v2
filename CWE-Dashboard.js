/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.5                              ║
 * ║                    CWE-Dashboard.gs                                   ║
 * ║  PURPOSE: Dashboard data provider + launcher helpers                  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * SETUP — two small edits to existing files:
 *
 * 1. In CWE-Main.gs → onOpen(), add ONE line before menu.addToUi():
 *       openDashboardSidebar();
 *
 * 2. In CWE-Main.gs → onOpen() menu, the item '📊 Refresh Dashboard'
 *    already calls 'refreshDashboard'. Change it to 'openDashboardSidebar'
 *    so the menu re-opens the sidebar dashboard instead of the old sheet:
 *       .addItem('📊 Open Dashboard', 'openDashboardSidebar')
 *
 * That's it. No other files need to change.
 */

// ── Open stages (claims that count toward metrics) ───────────────────
var DASH_OPEN_STAGES = ['NEW', 'WORKING', 'ESCALATED', 'APPEALED', 'PENDING', 'PENDING INFO', 'IN PROGRESS', 'CONTRACT PULLED', 'CONTRACT_PULLED'];
var DASH_QUEUE_MAX   = 15;


// ═══════════════════════════════════════════════════════════════════════
// openDashboardSidebar()
// Called from onOpen() and from the menu
// Now opens CWE-App.html — the unified persistent sidebar
// ═══════════════════════════════════════════════════════════════════════
function openDashboardSidebar() {
  var html = HtmlService
    .createHtmlOutputFromFile('CWE-App')
    .setTitle('CWE V2.5')
    .setWidth(450);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ═══════════════════════════════════════════════════════════════════════
// getWorkflowData(row)
// Called from CWE-App.html when user clicks a claim in the queue.
// Bundles issue data + all server-side HTML builders into one payload.
// ═══════════════════════════════════════════════════════════════════════
function getWorkflowData(row) {
  var errors = [];

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  if (!sheet) return { error: 'Claims sheet not found.' };

  ss.setActiveSheet(sheet);
  sheet.setActiveRange(sheet.getRange(row, 1));

  var user, issueData, typeColor;
  try { user      = getCurrentUser();   } catch(e) { return { error: 'Could not get user: ' + e.message }; }
  try { issueData = getIssueData(row);  } catch(e) { return { error: 'Could not load claim: ' + e.message }; }
  try { typeColor = getTypeColor(issueData.issueType); } catch(e) { typeColor = '#8b949e'; }

  if (!canViewClaim(issueData, user)) return { error: 'You do not have permission to view this claim.' };

  var claimOptions = '', userOptions = '', payerInfo = '', macInfo = '', workflowHTML = '';

  try { claimOptions = buildClaimOptions(issueData, user); } catch(e) { errors.push('claimOptions: '+e.message); }
  try { userOptions  = buildUserOptions(user);             } catch(e) { errors.push('userOptions: '+e.message); }
  try { payerInfo    = buildPayerInfoDark(issueData);      } catch(e) { errors.push('payerInfo: '+e.message); }
  try { macInfo      = buildMACInfoDark(issueData);        } catch(e) { errors.push('macInfo: '+e.message); }
  try {
    workflowHTML = buildWorkflowHTMLDark(issueData, typeColor);
  } catch(e) {
    errors.push('workflowHTML dark: '+e.message);
    try {
      workflowHTML = buildRootCauseWorkflow(issueData, typeColor);
    } catch(e2) {
      errors.push('workflowHTML raw: '+e2.message);
      workflowHTML = '';
    }
  }

  if (errors.length) Logger.log('getWorkflowData warnings: ' + errors.join(' | '));

  return {
    issue:        issueData,
    claimOptions: claimOptions,
    userOptions:  userOptions,
    payerInfo:    payerInfo,
    macInfo:      macInfo,
    workflowHTML: workflowHTML,
    errors:       errors
  };
}

// ── Dark-theme payer intel card ──────────────────────────────────────
function buildPayerInfoDark(issue) {
  if (!issue.state || !issue.payerName) return '';
  var payers = getPayersByState(issue.state);
  if (!payers || payers.length === 0) return '';

  var payer = payers[0];
  var today = new Date(); today.setHours(0,0,0,0);
  var timelyHtml = '', appealHtml = '';

  if (issue.dos) {
    var dos = new Date(issue.dos);
    if (!isNaN(dos)) {
      dos.setHours(0,0,0,0);
      var deadline = new Date(dos);
      deadline.setDate(deadline.getDate() + parseInt(payer.timelyFiling||90));
      var daysLeft = Math.floor((deadline - today) / 86400000);
      var cls = daysLeft <= 15 ? 'danger' : daysLeft <= 30 ? 'warn' : 'ok';
      timelyHtml = ' <span class="intel-val '+cls+'">'+daysLeft+' days left</span>';
    }
  }
  if (issue.appealDueDate) {
    var ap = new Date(issue.appealDueDate);
    if (!isNaN(ap)) {
      ap.setHours(0,0,0,0);
      var adl = Math.floor((ap - today) / 86400000);
      var acls = adl <= 15 ? 'danger' : adl <= 30 ? 'warn' : 'ok';
      appealHtml = ' <span class="intel-val '+acls+'">'+adl+' days left</span>';
    }
  }

  return '<div class="intel-card">' +
    '<div class="intel-title">📊 Payer Intelligence</div>' +
    '<div class="intel-row"><span class="intel-key">Timely Filing</span><span>' + (payer.timelyFiling||'?') + ' days'+timelyHtml+'</span></div>' +
    '<div class="intel-row"><span class="intel-key">Level 1 Appeal</span><span>' + (payer.level1Name||'—') + ' ('+( payer.level1Days||'?')+' days)'+appealHtml+'</span></div>' +
    '<div class="intel-row"><span class="intel-key">Level 2 Appeal</span><span>' + (payer.level2Name||'—') + ' ('+(payer.level2Days||'?')+' days)</span></div>' +
    '</div>';
}

// ── Dark-theme MAC card ──────────────────────────────────────────────
function buildMACInfoDark(issue) {
  if (!issue.state || !issue.payerName) return '';
  if (issue.payerName.toLowerCase().indexOf('medicare') === -1) return '';
  var macs = getMACsForState(issue.state);
  if (!macs || macs.length === 0) return '';

  return '<div class="intel-card">' +
    '<div class="intel-title">📞 Medicare Administrative Contractors</div>' +
    macs.map(function(mac) {
      return '<div class="mac-item">' +
        '<div class="mac-type">'+mac.billingType+'</div>' +
        '<div class="mac-name">'+mac.name+'</div>' +
        '<div class="mac-juris">Jurisdiction '+mac.jurisdiction+'</div>' +
        '<a href="tel:'+mac.phone+'" class="mac-phone">📞 '+mac.phone+'</a>' +
        '</div>';
    }).join('') + '</div>';
}

// ── Dark-theme workflow decision tree ────────────────────────────────
// Wraps the existing server-side HTML builders with dark-theme CSS
// by replacing the light-mode inline styles with CWE-App class names
function buildWorkflowHTMLDark(issue, color) {
  var raw = buildRootCauseWorkflow(issue, color);
  return raw
    // section title
    .replace(/class="section-title"/g, 'class="card-title"')
    // callouts — simple class swap, no extra divs
    .replace(/class="alert"/g,   'class="callout warn"')
    .replace(/class="info"/g,    'class="callout info"')
    .replace(/class="success"/g, 'class="callout success"')
    // workflow options
    .replace(/class="workflow-option"/g, 'class="wf-option"')
    .replace(/class="option-label"/g,    'class="wf-opt-label"')
    .replace(/class="option-desc"/g,     'class="wf-opt-desc"')
    // buttons — success first (more specific) then primary then secondary
    .replace(/class="btn btn-primary" style="background:#10b981;"/g, 'class="wf-btn wf-btn-success"')
    .replace(/class="btn btn-primary" style="background:#10b981"/g,  'class="wf-btn wf-btn-success"')
    .replace(/class="btn btn-primary"/g,   'class="wf-btn wf-btn-primary"')
    .replace(/class="btn btn-secondary"/g, 'class="wf-btn wf-btn-secondary"')
    // research form inputs
    .replace(/style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;margin-bottom:8px;"/g, 'class="wf-input"')
    .replace(/style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;min-height:60px;margin-bottom:8px;"/g, 'class="wf-input"')
    .replace(/style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;min-height:60px;"/g, 'class="wf-input"')
    .replace(/style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;"/g, 'class="wf-input"');
}


// ═══════════════════════════════════════════════════════════════════════
// getDashboardData()
// Called by Dashboard.html via google.script.run
// Uses COL (CWE-Main.gs), getCurrentUser(), canViewClaim()
// ═══════════════════════════════════════════════════════════════════════
function getDashboardData() {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Claims');
    if (!sheet) throw new Error('Claims sheet not found.');

    var user  = getCurrentUser();
    var today = new Date();

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return emptyDashboard_(user);

    // Read all data (skip header row 1); fetch COL.TOTAL_COLS + 2 to be safe
    var data = sheet
      .getRange(2, 1, lastRow - 1, COL.TOTAL_COLS + 2)
      .getValues();

    var totalOpen        = 0;
    var criticalHigh     = 0;
    var escalatedCount   = 0;
    var totalVariance    = 0;
    var byStageCounts    = {};
    var byPriorityCounts = {};
    var myQueue          = [];

    data.forEach(function(row, idx) {
      var stage    = String(row[COL.WORKFLOW_STAGE] || '').trim().toUpperCase();
      var priority = String(row[COL.PRIORITY]       || '').trim().toUpperCase();
      var assignee = String(row[COL.ASSIGNED_TO]    || '').trim();
      var variance = Math.abs(parseFloat(row[COL.VARIANCE]) || 0);

      // Skip closed/resolved claims
      if (DASH_OPEN_STAGES.indexOf(stage) === -1) return;

      // Respect group-level visibility (Analysts see only their group)
      var claimObj = { assignedTo: row[COL.ASSIGNED_TO] };
      if (!canViewClaim(claimObj, user)) return;

      totalOpen++;
      if (variance > 0) totalVariance += variance;
      if (priority.indexOf('CRITICAL') > -1 || priority.indexOf('HIGH') > -1) criticalHigh++;
      if (stage === 'ESCALATED') escalatedCount++;

      // Stage breakdown — raw display value for canvas matching
      var stageRaw = String(row[COL.WORKFLOW_STAGE] || '').trim();
      if (stageRaw) {
        byStageCounts[stageRaw] = (byStageCounts[stageRaw] || 0) + 1;
      }

      // Priority breakdown
      if (priority) {
        byPriorityCounts[priority] = (byPriorityCounts[priority] || 0) + 1;
      }

      // My Queue — match by user.name (how ASSIGNED_TO is stored)
      var isMe = (assignee.toLowerCase() === user.name.toLowerCase());
      if (isMe && myQueue.length < DASH_QUEUE_MAX) {
        var agingDays = null;
        var dateVal   = row[COL.DATE_LOGGED];
        if (dateVal instanceof Date && !isNaN(dateVal)) {
          agingDays = Math.floor((today - dateVal) / (1000 * 60 * 60 * 24));
        }
        myQueue.push({
          row:       idx + 2,  // 1-based sheet row (data starts at row 2)
          claimId:   String(row[COL.ISSUE_ID]       || '').trim(),
          stage:     String(row[COL.WORKFLOW_STAGE]  || '').trim(),
          priority:  String(row[COL.PRIORITY]        || '').trim(),
          payer:     String(row[COL.PAYER]            || '').trim(),
          practice:  String(row[COL.PRACTICE]         || '').trim(),
          amount:    variance || null,
          agingDays: agingDays
        });
      }
    });

    // Sort queue: CRITICAL → HIGH → MEDIUM → LOW, then oldest first
    var priOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    myQueue.sort(function(a, b) {
      var pa = (priOrder[a.priority] != null) ? priOrder[a.priority] : 4;
      var pb = (priOrder[b.priority] != null) ? priOrder[b.priority] : 4;
      if (pa !== pb) return pa - pb;
      return (b.agingDays || 0) - (a.agingDays || 0);
    });

    return {
      userName:          user.name,
      userLevel:         user.level,
      userGroup:         user.group,
      totalOpen:         totalOpen,
      criticalHigh:      criticalHigh,
      escalatedCount:    escalatedCount,
      totalVariance:     totalVariance,
      byStageCounts:     byStageCounts,
      byPriorityCounts:  byPriorityCounts,
      myQueue:           myQueue
    };

  } catch(e) {
    Logger.log('getDashboardData error: ' + e.message + '\n' + e.stack);
    throw e;
  }
}


// ═══════════════════════════════════════════════════════════════════════
// ACTION HANDLERS — called by dashboard buttons via google.script.run
// ═══════════════════════════════════════════════════════════════════════

/** Opens the new issue intake form (CWE-Forms.gs) */
function dashboardLogNewIssue() {
  showNewIssueForm();
}

/**
 * Selects the given row in the Claims sheet and opens the workflow sidebar.
 * Uses openWorkflowSidebarByRow() from CWE-Forms.gs
 * @param {number} row - 1-based sheet row
 */
function dashboardOpenSidebarForRow(row) {
  openWorkflowSidebarByRow(row);
}

/** Makes Claims sheet visible and activates it (Admin use) */
function dashboardActivateClaimsSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  if (!sheet) return;
  sheet.showSheet();
  ss.setActiveSheet(sheet);
}


// ═══════════════════════════════════════════════════════════════════════
// PRIVATE
// ═══════════════════════════════════════════════════════════════════════
function emptyDashboard_(user) {
  return {
    userName: user.name, userLevel: user.level, userGroup: user.group,
    totalOpen: 0, criticalHigh: 0, escalatedCount: 0, totalVariance: 0,
    byStageCounts: {}, byPriorityCounts: {}, myQueue: []
  };
}