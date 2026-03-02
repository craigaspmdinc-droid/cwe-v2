/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║           CLAIMS WORKFLOW ENGINE V2.4 - V2.0                 ║
 * ║                    CWE-Setup.gs                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════
// SHEET SETUP WITH ELEGANT HEADERS
// ═══════════════════════════════════════════════════════════════════════

function setupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  setupClaimsSheet(ss);
  setupActivityLogSheet(ss);
  setupProgrammingAlertsSheet(ss);
  setupReferenceDataSheets(ss, false); // false = don't clear if data exists
  setupDashboardSheet(ss);
  
  SpreadsheetApp.getUi().alert('✅ System Setup Complete!\n\n' +
    'Sheets created:\n' +
    '• Claims (main workflow)\n' +
    '• Activity Log\n' +
    '• Programming Alerts\n' +
    '• Reference Data (Practices, Providers, Payers, Denials)\n' +
    '• Dashboard\n\n' +
    'Next steps:\n' +
    '1. Import your reference data (Admin Tools → Import Reference Data)\n' +
    '2. Start logging issues!\n' +
    '3. Open Workflow Guide on any claim to see adaptive workflows');
}

function setupClaimsSheet(ss) {
  var sheet = ss.getSheetByName('Claims');
  if (!sheet) {
    sheet = ss.insertSheet('Claims', 0);
  }
  
  sheet.clear();
  
  var headers = [
    ['Issue ID', 'Date Logged', 'Logged By', 'Issue Type', 'Practice', 'Practice NPI', 'Provider', 'Provider NPI', 
     'Payer', 'CPT', 'DOS', 'Expected $', 'Paid $', 'Variance', 'Root Cause', 'Workflow Stage', 
     'Priority', 'Assigned To', 'Date Resolved', 'Days Open', 'Issue Details', 'Batch ID', 'State', 'Account Number', 'Denial Category',
     'Denial/Rejection Date', 'Appeal/Follow-up Due Date', 'Resubmission Date']
  ];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  
  // ELEGANT HEADER STYLING
  var headerRange = sheet.getRange(1, 1, 1, headers[0].length);
  headerRange.setBackground('#1e293b')
    .setFontColor('#f1f5f9')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  
  // Add gradient effect with borders
  headerRange.setBorder(true, true, true, true, true, true, '#334155', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // Set row height for elegance
  sheet.setRowHeight(1, 40);
  
  // Column widths
  var widths = [110, 120, 100, 90, 160, 110, 140, 110, 160, 70, 90, 85, 85, 85, 160, 140, 130, 120, 120, 75, 200, 90, 60, 120, 200, 120, 150, 120];
  widths.forEach(function(width, i) {
    sheet.setColumnWidth(i + 1, width);
  });
  
  sheet.setFrozenRows(1);
  
  // Add alternating row colors for readability
  var dataRange = sheet.getRange(2, 1, 1000, headers[0].length);
  var rule1 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=MOD(ROW(),2)=0')
    .setBackground('#f8fafc')
    .setRanges([dataRange])
    .build();
  
  sheet.setConditionalFormatRules([rule1]);
  
  // Add issue type formatting
  addIssueTypeFormatting(sheet);
}

function addIssueTypeFormatting(sheet) {
  var typeCol = 4;
  var lastRow = 1000;
  
  var rules = sheet.getConditionalFormatRules();
  
  var denialRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Denial')
    .setBackground('#fee2e2')
    .setFontColor('#991b1b')
    .setBold(true)
    .setRanges([sheet.getRange(2, typeCol, lastRow, 1)])
    .build();
  
  var rejectionRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Rejection')
    .setBackground('#fef3c7')
    .setFontColor('#92400e')
    .setBold(true)
    .setRanges([sheet.getRange(2, typeCol, lastRow, 1)])
    .build();
  
  var paymentRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Payment')
    .setBackground('#d1fae5')
    .setFontColor('#065f46')
    .setBold(true)
    .setRanges([sheet.getRange(2, typeCol, lastRow, 1)])
    .build();
  
  var internalRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Internal')
    .setBackground('#ede9fe')
    .setFontColor('#5b21b6')
    .setBold(true)
    .setRanges([sheet.getRange(2, typeCol, lastRow, 1)])
    .build();
  
  rules.push(denialRule, rejectionRule, paymentRule, internalRule);
  sheet.setConditionalFormatRules(rules);
}

function setupActivityLogSheet(ss) {
  var sheet = ss.getSheetByName('Activity Log');
  if (!sheet) {
    sheet = ss.insertSheet('Activity Log');
  }
  
  sheet.clear();
  
  // 5 visible columns + 1 hidden history column
  var headers = [['Last Updated', 'Issue ID', 'Assigned To', 'Current Action', 'Status', 'History (System)']];
  sheet.getRange(1, 1, 1, 6).setValues(headers);
  
  var headerRange = sheet.getRange(1, 1, 1, 6);
  headerRange.setBackground('#059669')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  
  headerRange.setBorder(true, true, true, true, true, true, '#047857', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.setRowHeight(1, 40);
  
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 130);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 500);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 50); // Narrow — hidden from casual view
  
  // Hide the History column from normal view
  sheet.hideColumns(6);
  
  sheet.setFrozenRows(1);
}

function setupProgrammingAlertsSheet(ss) {
  var sheet = ss.getSheetByName('Programming Alerts');
  if (!sheet) {
    sheet = ss.insertSheet('Programming Alerts');
  }
  
  sheet.clear();
  
  var headers = [['Error Type', 'Count', 'First Occurred', 'Last Occurred', 'Affected Practices', 'Status']];
  sheet.getRange(1, 1, 1, 6).setValues(headers);
  
  // ELEGANT HEADER STYLING
  var headerRange = sheet.getRange(1, 1, 1, 6);
  headerRange.setBackground('#7c3aed')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  
  headerRange.setBorder(true, true, true, true, true, true, '#6d28d9', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.setRowHeight(1, 40);
  
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 300);
  sheet.setColumnWidth(6, 100);
  
  sheet.setFrozenRows(1);
}

function setupReferenceDataSheets(ss) {
  // REF-Practices
  var practicesSheet = ss.getSheetByName('REF-Practices');
  if (!practicesSheet) {
    practicesSheet = ss.insertSheet('REF-Practices');
    practicesSheet.clear();
  }
  
  var headers = [['Code Practice ID', 'Practice', 'State', 'Group NPI', 'TIN', 'Taxonomy']];
  practicesSheet.getRange(1, 1, 1, 6).setValues(headers);
  
  var headerRange = practicesSheet.getRange(1, 1, 1, 6);
  headerRange.setBackground('#0891b2')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center');
  headerRange.setBorder(true, true, true, true, true, true, '#0e7490', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  practicesSheet.setRowHeight(1, 40);
  practicesSheet.setFrozenRows(1);
  
  // REF-Providers
  var providersSheet = ss.getSheetByName('REF-Providers');
  if (!providersSheet) {
    providersSheet = ss.insertSheet('REF-Providers');
    providersSheet.clear();
  }
  
  headers = [['Code Practice ID', 'Provider', 'Individual NPI']];
  providersSheet.getRange(1, 1, 1, 3).setValues(headers);
  
  headerRange = providersSheet.getRange(1, 1, 1, 3);
  headerRange.setBackground('#0891b2')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center');
  headerRange.setBorder(true, true, true, true, true, true, '#0e7490', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  providersSheet.setRowHeight(1, 40);
  providersSheet.setFrozenRows(1);
  
  // REF-Payers
  var payersSheet = ss.getSheetByName('REF-Payers');
  if (!payersSheet) {
    payersSheet = ss.insertSheet('REF-Payers');
    payersSheet.clear();
  }
  headers = [['State', 'Coverage Type', 'Plan Type', 'Timely Filing Days', 'Level 1 Appeal Days', 
              'Level 1 Name', 'Level 2 Appeal Days', 'Level 2 Name']];
  payersSheet.getRange(1, 1, 1, 8).setValues(headers);
  
  headerRange = payersSheet.getRange(1, 1, 1, 8);
  headerRange.setBackground('#0891b2')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center');
  headerRange.setBorder(true, true, true, true, true, true, '#0e7490', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  payersSheet.setRowHeight(1, 40);
  payersSheet.setFrozenRows(1);
  
  // REF-Denials
  var denialsSheet = ss.getSheetByName('REF-Denials');
  if (!denialsSheet) {
    denialsSheet = ss.insertSheet('REF-Denials');
    denialsSheet.clear();
  }
  headers = [['Denials', 'Denial Description', 'Suggested Action', 'Root Cause Denial']];
  denialsSheet.getRange(1, 1, 1, 4).setValues(headers);
  
  headerRange = denialsSheet.getRange(1, 1, 1, 4);
  headerRange.setBackground('#0891b2')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center');
  headerRange.setBorder(true, true, true, true, true, true, '#0e7490', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  denialsSheet.setRowHeight(1, 40);
  denialsSheet.setFrozenRows(1);

  // REF-MACs
  var macsSheet = ss.getSheetByName('REF-MACs');
  if (!macsSheet) {
    macsSheet = ss.insertSheet('REF-MACs');
    macsSheet.clear();
    var macsHeaders = [['MAC Jurisdiction', 'MAC Name', 'State', 'Phone', 'Website', 'Billing Type']];
    macsSheet.getRange(1, 1, 1, 6).setValues(macsHeaders);
    var macsHeader = macsSheet.getRange(1, 1, 1, 6);
    macsHeader.setBackground('#0891b2').setFontColor('#ffffff').setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
    macsSheet.setRowHeight(1, 40);
    macsSheet.setFrozenRows(1);
  }

  // REF-CARC
  var carcSheet = ss.getSheetByName('REF-CARC');
  if (!carcSheet) {
    carcSheet = ss.insertSheet('REF-CARC');
    carcSheet.clear();
    var carcHeaders = [['Group Code', 'CARC Code', 'Description', 'Source']];
    carcSheet.getRange(1, 1, 1, 4).setValues(carcHeaders);
    var carcHeader = carcSheet.getRange(1, 1, 1, 4);
    carcHeader.setBackground('#0891b2').setFontColor('#ffffff').setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
    carcSheet.setRowHeight(1, 40);
    carcSheet.setFrozenRows(1);
  }

  // REF-RARC
  var rarcSheet = ss.getSheetByName('REF-RARC');
  if (!rarcSheet) {
    rarcSheet = ss.insertSheet('REF-RARC');
    rarcSheet.clear();
    var rarcHeaders = [['RARC Code', 'Description', 'Source']];
    rarcSheet.getRange(1, 1, 1, 3).setValues(rarcHeaders);
    var rarcHeader = rarcSheet.getRange(1, 1, 1, 3);
    rarcHeader.setBackground('#0891b2').setFontColor('#ffffff').setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
    rarcSheet.setRowHeight(1, 40);
    rarcSheet.setFrozenRows(1);
  }

  // REF-GlobalPeriods
  var gpSheet = ss.getSheetByName('REF-GlobalPeriods');
  if (!gpSheet) {
    gpSheet = ss.insertSheet('REF-GlobalPeriods');
    gpSheet.clear();
    var gpHeaders = [['CPT Code', 'Global Period (Days)']];
    gpSheet.getRange(1, 1, 1, 2).setValues(gpHeaders);
    var gpHeader = gpSheet.getRange(1, 1, 1, 2);
    gpHeader.setBackground('#0891b2').setFontColor('#ffffff').setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
    gpSheet.setRowHeight(1, 40);
    gpSheet.setFrozenRows(1);
  }

  // REF-MassHealth
  var massHealthSheet = ss.getSheetByName('REF-MassHealth');
  if (!massHealthSheet) {
    massHealthSheet = ss.insertSheet('REF-MassHealth');
    massHealthSheet.clear();
    var massHealthHeaders = [['Carrier Code', 'Carrier Name', 'Address', 'Section']];
    massHealthSheet.getRange(1, 1, 1, 4).setValues(massHealthHeaders);
    var massHealthHeader = massHealthSheet.getRange(1, 1, 1, 4);
    massHealthHeader.setBackground('#0891b2').setFontColor('#ffffff').setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
    massHealthSheet.setRowHeight(1, 40);
    massHealthSheet.setFrozenRows(1);
  }
}

function setupDashboardSheet(ss) {
  var sheet = ss.getSheetByName('Dashboard');
  if (!sheet) {
    sheet = ss.insertSheet('Dashboard');
  }
  
  sheet.clear();
  
  // Title with elegant styling
  sheet.getRange('A1:H1').merge();
  sheet.getRange('A1').setValue('📊 CLAIMS WORKFLOW DASHBOARD');
  sheet.getRange('A1')
    .setFontSize(24)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBackground('#1e293b')
    .setFontColor('#f1f5f9');
  sheet.setRowHeight(1, 60);
  
  sheet.getRange('A3').setValue('Click "Refresh Dashboard" from the menu to update');
  sheet.getRange('A3').setFontStyle('italic').setFontColor('#64748b').setFontSize(10);
  
  refreshDashboard();
}

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD REFRESH
// ═══════════════════════════════════════════════════════════════════════

function refreshDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var claimsSheet = ss.getSheetByName('Claims');
  var dashSheet = ss.getSheetByName('Dashboard');
  var user = getCurrentUser();
  
  if (!claimsSheet || !dashSheet) {
    SpreadsheetApp.getUi().alert('Please run Setup System first');
    return;
  }
  
  var allData = claimsSheet.getDataRange().getValues();
  allData = allData.slice(1);
  
  var data = allData.filter(function(row) {
    var claim = { assignedTo: row[17] };
    return canViewClaim(claim, user);
  });
  
  if (data.length === 0) {
    dashSheet.getRange('A5').setValue('No issues to display. Log your first issue to get started!');
    return;
  }
  
  dashSheet.getRange('A5:Z100').clear();
  
  // Key Metrics with elegant styling
  dashSheet.getRange('A5:B5').merge();
  dashSheet.getRange('A5').setValue('📊 KEY METRICS');
  dashSheet.getRange('A5')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#0891b2')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('left');
  dashSheet.setRowHeight(5, 35);
  
  var totalIssues = data.length;
  var openIssues = data.filter(r => !r[18]).length;
  var resolvedIssues = data.filter(r => r[18]).length;
  var totalVariance = data.reduce((sum, r) => sum + Math.abs(parseFloat(r[13]) || 0), 0);
  var openVariance = data.filter(r => !r[18]).reduce((sum, r) => sum + Math.abs(parseFloat(r[13]) || 0), 0);
  
  dashSheet.getRange('A7:B12').setValues([
    ['Total Issues', totalIssues],
    ['Open Issues', openIssues],
    ['Resolved Issues', resolvedIssues],
    ['', ''],
    ['Total $ at Stake', '$' + totalVariance.toFixed(2)],
    ['Open $ Exposure', '$' + openVariance.toFixed(2)]
  ]);
  
  dashSheet.getRange('A7:A12').setFontWeight('bold').setBackground('#f8fafc');
  dashSheet.getRange('B7:B12').setHorizontalAlignment('right').setFontWeight('bold');
  
  // By Issue Type
  var typeCounts = {};
  data.forEach(function(row) {
    var type = row[3] || 'Unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  dashSheet.getRange('D5:E5').merge();
  dashSheet.getRange('D5').setValue('📋 BY ISSUE TYPE');
  dashSheet.getRange('D5')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#059669')
    .setFontColor('#ffffff');
  
  var typeData = Object.entries(typeCounts).map(([type, count]) => [type, count]);
  if (typeData.length > 0) {
    dashSheet.getRange(7, 4, typeData.length, 2).setValues(typeData);
    dashSheet.getRange(7, 4, typeData.length, 1).setFontWeight('bold').setBackground('#f8fafc');
  }
  
  // By Root Cause
  var rootCauseCounts = {};
  data.forEach(function(row) {
    var cause = row[14] || 'Uncategorized';
    rootCauseCounts[cause] = (rootCauseCounts[cause] || 0) + 1;
  });
  
  dashSheet.getRange('G5:H5').merge();
  dashSheet.getRange('G5').setValue('🎯 BY ROOT CAUSE');
  dashSheet.getRange('G5')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#7c3aed')
    .setFontColor('#ffffff');
  
  var causeData = Object.entries(rootCauseCounts).map(([cause, count]) => [cause, count]);
  if (causeData.length > 0) {
    dashSheet.getRange(7, 7, causeData.length, 2).setValues(causeData);
    dashSheet.getRange(7, 7, causeData.length, 1).setFontWeight('bold').setBackground('#f8fafc');
  }
  
  SpreadsheetApp.getActiveSpreadsheet().toast('Dashboard updated!', '✅');
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN TOOLS
// ═══════════════════════════════════════════════════════════════════════

function showImportGuide() {
  var ui = SpreadsheetApp.getUi();
  var message = '📥 IMPORT REFERENCE DATA\n\n' +
    'To import your existing data:\n\n' +
    '1. REF-Practices: Paste your practice data\n' +
    '   Columns: Code Practice ID | Practice | State | Group NPI | TIN | Taxonomy\n\n' +
    '2. REF-Providers: Paste your provider data\n' +
    '   Columns: Code Practice ID | Provider | Individual NPI\n\n' +
    '3. REF-Payers: Paste your payer intelligence\n' +
    '   Columns: State | Coverage Type | Plan Type | Timely Filing | Level 1 Days | Level 1 Name | etc.\n\n' +
    '4. REF-Denials: Paste your denials reference\n' +
    '   Columns: Denials | Description | Suggested Action | Root Cause\n\n' +
    'TIP: Copy from your existing sheets and paste starting at row 2 (below headers)';
  
  ui.alert(message);
}

function showUserManagement() {
  var user = getCurrentUser();
  var ui = SpreadsheetApp.getUi();
  
  var message = '👥 USER MANAGEMENT\n\n' +
    'Your Profile:\n' +
    'Name: ' + user.name + '\n' +
    'Group: ' + user.group + '\n' +
    'Level: ' + user.level + '\n\n' +
    'To add/modify users:\n' +
    '1. Go to Extensions → Apps Script\n' +
    '2. Edit the USERS object in ClaimsEngine-FINAL-Main.gs\n' +
    '3. Add new users with email, name, group, and level\n' +
    '4. Save and refresh the sheet\n\n' +
    'Groups: ASP, A3MB, Accudoc\n' +
    'Levels: Admin, Supervisor, Analyst';
  
  ui.alert(message);
}

function openProgrammingAlerts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Programming Alerts');
  if (sheet) {
    ss.setActiveSheet(sheet);
  }
}

function openActivityLog() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Activity Log');
  if (sheet) {
    ss.setActiveSheet(sheet);
  }
}