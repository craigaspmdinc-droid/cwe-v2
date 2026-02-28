/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.4                              ║
 * ║                      CWE-Debug.gs                                     ║
 * ║  PURPOSE: Diagnostic and test functions — never called by users       ║
 * ║  USAGE:   Run manually from Apps Script editor → Run menu             ║
 * ║           View results in View → Logs (Ctrl+Enter)                    ║
 * ║  NOTE:    All functions prefixed with debug_ to distinguish from      ║
 * ║           production code. Safe to delete in a production-only copy.  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════
// REFERENCE DATA DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════════════

function debug_getPractices() {
  var practices = getPractices();
  Logger.log('══ getPractices() ══════════════════════');
  Logger.log('Count: ' + practices.length);
  if (practices.length === 0) {
    Logger.log('⚠️  No practices returned — check REF-Practices sheet');
    Logger.log('   Sheet must exist and have data in column B (Practice name)');
  } else {
    practices.forEach(function(p, i) {
      Logger.log('[' + i + '] id="' + p.id + '" name="' + p.name + '" state="' + p.state + '" npi="' + p.npi + '"');
      if (!p.id)   Logger.log('     ⚠️  Missing id (Code Practice ID — column A)');
      if (!p.name) Logger.log('     ⚠️  Missing name (Practice — column B)');
      if (!p.state)Logger.log('     ⚠️  Missing state (column C)');
    });
  }
}

function debug_getProviders() {
  var practices = getPractices();
  if (practices.length === 0) {
    Logger.log('⚠️  No practices found — run debug_getPractices() first');
    return;
  }
  Logger.log('══ getProvidersByPractice() ════════════');
  practices.forEach(function(p) {
    var providers = getProvidersByPractice(p.id);
    Logger.log('Practice "' + p.name + '" (id=' + p.id + '): ' + providers.length + ' providers');
    providers.forEach(function(prov) {
      Logger.log('  → name="' + prov.name + '" npi="' + prov.npi + '"');
    });
  });
}

function debug_getPayers() {
  var practices = getPractices();
  if (practices.length === 0) {
    Logger.log('⚠️  No practices found — run debug_getPractices() first');
    return;
  }
  // Use the first practice's state
  var state = practices[0].state;
  Logger.log('══ getPayersByState() ══════════════════');
  Logger.log('Testing with state: "' + state + '"');
  var payers = getPayersByState(state);
  Logger.log('Count: ' + payers.length);
  payers.forEach(function(p) {
    Logger.log('  → "' + p.payerName + '" | coverage: "' + p.coverageType + '" | timely filing: ' + p.timelyFiling + ' days');
  });
}

function debug_getCARCLookup() {
  Logger.log('══ getCARCAction() ═════════════════════');
  // Test a few common codes
  var testCodes = ['1', '2', '4', '16', '29', '45', '97'];
  testCodes.forEach(function(code) {
    var action = getCARCAction(code);
    var result = lookupCARC(code);
    Logger.log('CARC ' + code + ':');
    Logger.log('  description: "' + (result ? result.description : 'NOT FOUND') + '"');
    Logger.log('  action:      "' + (action || 'none') + '"');
  });
}

function debug_getMACLookup() {
  Logger.log('══ getMACsForState() ═══════════════════');
  var practices = getPractices();
  if (practices.length === 0) {
    Logger.log('⚠️  No practices found');
    return;
  }
  var state = practices[0].state;
  Logger.log('Testing with state: "' + state + '"');
  var macs = getMACsForState(state);
  Logger.log('Count: ' + macs.length);
  macs.forEach(function(mac) {
    Logger.log('  → ' + mac.billingType + ' | ' + mac.name + ' | ' + mac.phone);
  });
  if (macs.length === 0) {
    Logger.log('⚠️  No MACs found — check REF-MACs sheet uses state abbreviations (e.g. MA not Massachusetts)');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// USER & PERMISSION DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════════════

function debug_getCurrentUser() {
  Logger.log('══ getCurrentUser() ════════════════════');
  var email = Session.getActiveUser().getEmail();
  Logger.log('Active email: "' + email + '"');
  var user = getCurrentUser();
  Logger.log('Resolved user: ' + JSON.stringify(user));
  if (user.level === 'Blocked') {
    Logger.log('⚠️  Email not found in USERS object in CWE-Main.gs');
  }
  var visibleUsers = getVisibleUsers(user);
  Logger.log('Visible users (' + visibleUsers.length + '): ' + visibleUsers.join(', '));
}

// ═══════════════════════════════════════════════════════════════════════
// SHEET DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════════════

function debug_checkSheets() {
  Logger.log('══ Sheet Check ═════════════════════════');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var required = [
    'Claims', 'Activity Log', 'Programming Alerts', 'Dashboard',
    'REF-Practices', 'REF-Providers', 'REF-Payers', 'REF-Denials',
    'REF-CARC', 'REF-RARC', 'REF-MACs', 'REF-GlobalPeriods', 'REF-MassHealth'
  ];
  required.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      Logger.log('❌ MISSING: ' + name);
    } else {
      var rows = sheet.getLastRow();
      Logger.log('✅ ' + name + ' — ' + (rows - 1) + ' data rows');
    }
  });
}

function debug_checkClaimsColumns() {
  Logger.log('══ Claims Column Check ═════════════════');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  if (!sheet) { Logger.log('❌ Claims sheet not found'); return; }

  var headers = sheet.getRange(1, 1, 1, 35).getValues()[0];
  var expectedHeaders = [
    'Issue ID', 'Date Logged', 'Logged By', 'Issue Type', 'Practice',
    'Practice NPI', 'Provider', 'Provider NPI', 'Payer', 'CPT', 'DOS',
    'Expected $', 'Paid $', 'Variance', 'Root Cause', 'Workflow Stage',
    'Priority', 'Assigned To', 'Date Resolved', 'Days Open', 'Issue Details',
    'Batch ID', 'State', 'Account Number', 'Denial Category',
    'Denial/Rejection Date', 'Appeal/Follow-up Due Date', 'Resubmission Date',
    'Coverage Type', 'CARC Description', 'RARC Code', 'RARC Description', 'CARC Group Code'
  ];

  var allGood = true;
  expectedHeaders.forEach(function(expected, i) {
    var actual = headers[i] || '(empty)';
    if (actual !== expected) {
      Logger.log('⚠️  Col ' + (i+1) + ': expected "' + expected + '" got "' + actual + '"');
      allGood = false;
    }
  });
  if (allGood) Logger.log('✅ All column headers match COL constants');
}

// ═══════════════════════════════════════════════════════════════════════
// FORM & SIDEBAR DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════════════

function debug_testIntakeFormData() {
  Logger.log('══ Intake Form Data Check ══════════════');
  var user = getCurrentUser();
  Logger.log('User: ' + user.name + ' (' + user.level + ')');

  var visibleUsers = getVisibleUsers(user);
  Logger.log('Visible users: ' + visibleUsers.length);

  var practices = getPractices();
  Logger.log('Practices: ' + practices.length);

  // Simulate what showNewIssueForm() does
  var practiceOptions = practices.map(function(p) {
    return '<option value="' + p.id + '" data-state="' + p.state + '" data-npi="' + p.npi + '">' + p.name + '</option>';
  }).join('');

  Logger.log('practiceOptions HTML length: ' + practiceOptions.length);
  if (practiceOptions.length === 0) {
    Logger.log('⚠️  practiceOptions is empty — form dropdown will be blank');
    Logger.log('   Check REF-Practices has data and column B (Practice) is not empty');
  } else {
    Logger.log('✅ practiceOptions looks good');
    Logger.log('First option: ' + practiceOptions.substring(0, 150));
  }
}

function debug_testSidebarForRow() {
  // Change this row number to test a specific claim
  var testRow = 2;

  Logger.log('══ Sidebar Data Check (row ' + testRow + ') ═══');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  if (!sheet || sheet.getLastRow() < testRow) {
    Logger.log('⚠️  No claim data at row ' + testRow + ' — log a claim first');
    return;
  }

  var issueData = getIssueData(testRow);
  Logger.log('issueId:      ' + issueData.issueId);
  Logger.log('issueType:    ' + issueData.issueType);
  Logger.log('practice:     ' + issueData.practice);
  Logger.log('payerName:    ' + issueData.payerName);
  Logger.log('state:        ' + issueData.state);
  Logger.log('rootCause:    ' + issueData.rootCause);
  Logger.log('workflowStage:' + issueData.workflowStage);
  Logger.log('priority:     ' + issueData.priority);
  Logger.log('carcCode:     ' + issueData.carcCode);
  Logger.log('carcAction:   ' + issueData.carcAction);

  var typeColor = getTypeColor(issueData.issueType);
  Logger.log('typeColor:    ' + typeColor);

  var workflowHTML = buildRootCauseWorkflow(issueData, typeColor);
  Logger.log('workflowHTML length: ' + workflowHTML.length);
  if (workflowHTML.length < 50) {
    Logger.log('⚠️  workflowHTML seems too short — check buildRootCauseWorkflow()');
  } else {
    Logger.log('✅ workflowHTML looks good');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SUBMISSION DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════════════

function debug_testLogNewIssue() {
  // Simulate a minimal test issue submission
  var issue = {
    issueType: 'Denial',
    practice: 'Nauset Family Practice',
    practiceNPI: '1760411482',
    state: 'MA',
    provider: 'John Reynolds',
    providerNPI: '1881787984',
    payerName: 'Aetna',
    coverageType: 'Commercial',
    cpt: '99213',
    dos: '2026-01-15',
    denialRejectionDate: '2026-02-01',
    denialCategory: '',
    accountNumber: '12345',
    assignedTo: 'Craig',
    notes: 'Debug test'
  };

  try {
    var result = logNewIssue(issue);
    Logger.log('✅ Success! Issue ID: ' + result);
  } catch(e) {
    Logger.log('❌ Error: ' + e.message);
    Logger.log('Stack: ' + e.stack);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// RUN ALL CHECKS AT ONCE
// ═══════════════════════════════════════════════════════════════════════

function debug_runAll() {
  Logger.log('╔══════════════════════════════════════╗');
  Logger.log('║   CWE FULL DIAGNOSTIC RUN             ║');
  Logger.log('╚══════════════════════════════════════╝');
  debug_getCurrentUser();
  debug_checkSheets();
  debug_checkClaimsColumns();
  debug_getPractices();
  debug_getProviders();
  debug_getPayers();
  debug_testIntakeFormData();
  Logger.log('══ Diagnostic complete ═════════════════');
}