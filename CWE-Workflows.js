/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.5                              ║
 * ║                    CWE-Workflows.gs                                   ║
 * ║  PURPOSE: Claim data manipulation, activity logging, stage updates,   ║
 * ║           priority calculation, root cause routing                    ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════
// CLAIM CREATION
// ═══════════════════════════════════════════════════════════════════════

function logNewIssue(issue) {
  Logger.log('Received issue object:');
  Logger.log(JSON.stringify(issue));
  Logger.log('Account number field: ' + issue.accountNumber);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  var user = getCurrentUser();

  if (!sheet) {
    throw new Error('Claims sheet not found. Please run Setup System first.');
  }

  var nextRow = sheet.getLastRow() + 1;
  var issueId = 'ISS-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') + '-' + (nextRow - 1);

  var variance = 0;
  if (issue.issueType === 'Payment') {
    variance = issue.paidAmount - issue.expectedAmount;
  }

  var rootCause = determineRootCause(issue);

  // ── Appeal Due Date + Priority Calculation ──────────────────────────
  var appealDueDays = 60;
  var timelyFilingDays = 90;
  var coverageType = (issue.coverageType || '').toLowerCase();

  if (coverageType.indexOf('medicare') !== -1) {
    appealDueDays = 120;
    timelyFilingDays = 365;
  } else if (coverageType.indexOf('medicaid') !== -1) {
    appealDueDays = 90;
    timelyFilingDays = 365;
  }

  var payersSheet = ss.getSheetByName('REF-Payers');
  if (payersSheet) {
    var payersData = payersSheet.getDataRange().getValues();
    for (var i = 1; i < payersData.length; i++) {
      if (payersData[i][1] === issue.coverageType) {
        timelyFilingDays = parseInt(payersData[i][3]) || timelyFilingDays;
        break;
      }
    }
  }

  var autoPriority = calculatePriority(issue.dos, timelyFilingDays);

  var denialRejectionDate = issue.denialRejectionDate ? new Date(issue.denialRejectionDate) : '';
  var appealDueDate = '';
  if (denialRejectionDate) {
    appealDueDate = new Date(denialRejectionDate);
    appealDueDate.setDate(appealDueDate.getDate() + appealDueDays);
  }

  // Look up denial description
  var denialDescription = '';
  if (issue.denialCategory) {
    var refSheet = ss.getSheetByName('REF-Denials');
    if (refSheet) {
      var refData = refSheet.getDataRange().getValues();
      for (var i = 1; i < refData.length; i++) {
        if (refData[i][0] === issue.denialCategory) {
          denialDescription = refData[i][1];
          break;
        } else if (refData[i][4] === issue.denialCategory) {
          denialDescription = refData[i][5];
          break;
        }
      }
    }
  }

  sheet.appendRow([
    issueId,                          // A  - Issue ID
    new Date(),                       // B  - Date Logged
    user.name,                        // C  - Logged By
    issue.issueType,                  // D  - Issue Type
    issue.practice,                   // E  - Practice
    issue.practiceNPI || '',          // F  - Practice NPI
    issue.provider || '',             // G  - Provider
    issue.providerNPI || '',          // H  - Provider NPI
    issue.payerName || '',            // I  - Payer
    issue.cpt || '',                  // J  - CPT
    issue.dos || '',                  // K  - DOS
    issue.expectedAmount || 0,        // L  - Expected $
    issue.paidAmount || 0,            // M  - Paid $
    variance,                         // N  - Variance
    rootCause,                        // O  - Root Cause
    'New',                            // P  - Workflow Stage
    autoPriority,                     // Q  - Priority
    issue.assignedTo || user.name,           // R  - Assigned To
    '',                               // S  - Date Resolved
    '',                               // T  - Days Open (formula below)
    issue.denialCode || issue.rejectionReason || issue.paymentType || issue.errorType || '', // U - Issue Details
    issue.batchId || '',              // V  - Batch ID
    issue.state || '',                // W  - State
    issue.accountNumber || '',        // X  - Account Number
    issue.denialCategory || '',       // Y  - Denial Category
    denialRejectionDate,              // Z  - Denial/Rejection Date
    appealDueDate,                    // AA - Appeal/Follow-Up Due Date
    '',                               // AB - Resubmission Date
    issue.coverageType || '',         // AC - Coverage Type
    issue.denialCodeDesc || '',       // AD - CARC Description
    issue.rarcCode || '',             // AE - RARC Code
    issue.rarcCodeDesc || '',         // AF - RARC Description
    issue.denialCode ? (issue.denialCodeGroup || '') : '' // AG - CARC Group Code
  ]);

  // Days Open formula
  var daysFormula = '=IF(ISBLANK(S' + nextRow + '), INT(TODAY()-K' + nextRow + '), INT(S' + nextRow + '-K' + nextRow + '))';
  sheet.getRange(nextRow, 20).setFormula(daysFormula);

  logActivity(issueId, 'Issue logged: ' + issue.issueType + (issue.notes ? ' - ' + issue.notes : ''));

  if (issue.issueType === 'Internal' && issue.errorType) {
    checkProgrammingAlert(issue.errorType, issue.practice);
  }

  return issueId;
}

// ═══════════════════════════════════════════════════════════════════════
// CLAIM EDITING
// ═══════════════════════════════════════════════════════════════════════

function updateIssue(row, issue) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  if (!sheet) throw new Error('Claims sheet not found');

  var existing = sheet.getRange(row, 1, 1, COL.TOTAL_COLS + 2).getValues()[0];

  var variance = existing[COL.VARIANCE];
  if (issue.issueType === 'Payment') {
    variance = (parseFloat(issue.paidAmount) || 0) - (parseFloat(issue.expectedAmount) || 0);
  }

  // Only update editable fields — preserve Issue ID, Date Logged, Logged By, Stage, etc.
  sheet.getRange(row, COL.ISSUE_TYPE + 1).setValue(issue.issueType         || existing[COL.ISSUE_TYPE]);
  sheet.getRange(row, COL.PRACTICE + 1).setValue(issue.practice            || existing[COL.PRACTICE]);
  sheet.getRange(row, COL.PRACTICE_NPI + 1).setValue(issue.practiceNPI     || existing[COL.PRACTICE_NPI]);
  sheet.getRange(row, COL.PROVIDER + 1).setValue(issue.provider            || existing[COL.PROVIDER]);
  sheet.getRange(row, COL.PROVIDER_NPI + 1).setValue(issue.providerNPI     || existing[COL.PROVIDER_NPI]);
  sheet.getRange(row, COL.PAYER + 1).setValue(issue.payerName              || existing[COL.PAYER]);
  sheet.getRange(row, COL.CPT + 1).setValue(issue.cpt                      || existing[COL.CPT]);
  sheet.getRange(row, COL.DOS + 1).setValue(issue.dos                      || existing[COL.DOS]);
  sheet.getRange(row, COL.EXPECTED_AMT + 1).setValue(issue.expectedAmount  || existing[COL.EXPECTED_AMT]);
  sheet.getRange(row, COL.PAID_AMT + 1).setValue(issue.paidAmount          || existing[COL.PAID_AMT]);
  sheet.getRange(row, COL.VARIANCE + 1).setValue(variance);
  sheet.getRange(row, COL.ASSIGNED_TO + 1).setValue(issue.assignedTo       || existing[COL.ASSIGNED_TO]);
  sheet.getRange(row, COL.ISSUE_DETAILS + 1).setValue(issue.denialCode     || existing[COL.ISSUE_DETAILS]);
  sheet.getRange(row, COL.BATCH_ID + 1).setValue(issue.batchId             || existing[COL.BATCH_ID]);
  sheet.getRange(row, COL.STATE + 1).setValue(issue.state                  || existing[COL.STATE]);
  sheet.getRange(row, COL.ACCOUNT_NUMBER + 1).setValue(issue.accountNumber || existing[COL.ACCOUNT_NUMBER]);
  sheet.getRange(row, COL.DENIAL_CATEGORY + 1).setValue(issue.denialCategory || existing[COL.DENIAL_CATEGORY]);
  sheet.getRange(row, COL.DENIAL_DATE + 1).setValue(issue.denialRejectionDate || existing[COL.DENIAL_DATE]);
  sheet.getRange(row, COL.COVERAGE_TYPE + 1).setValue(issue.coverageType   || existing[COL.COVERAGE_TYPE]);
  sheet.getRange(row, COL.CARC_DESCRIPTION + 1).setValue(issue.denialCodeDesc || existing[COL.CARC_DESCRIPTION]);
  sheet.getRange(row, COL.RARC_CODE + 1).setValue(issue.rarcCode           || existing[COL.RARC_CODE]);
  sheet.getRange(row, COL.RARC_DESCRIPTION + 1).setValue(issue.rarcCodeDesc || existing[COL.RARC_DESCRIPTION]);
  sheet.getRange(row, COL.CARC_GROUP_CODE + 1).setValue(issue.denialCodeGroup || existing[COL.CARC_GROUP_CODE]);

  logActivityFromSidebar(existing[COL.ISSUE_ID], '✏️ Claim edited by ' + getCurrentUser().name);

  return true;
}

// ═══════════════════════════════════════════════════════════════════════
// ROOT CAUSE & PRIORITY
// ═══════════════════════════════════════════════════════════════════════

function determineRootCause(issue) {
  if (issue.suggestedRootCause) return issue.suggestedRootCause;

  if ((issue.issueType === 'Denial' || issue.issueType === 'Payment') && issue.denialCode) {
    var suggestion = lookupDenialSuggestion(issue.denialCode, issue.issueType);
    if (suggestion && suggestion.rootCause) return suggestion.rootCause;
  } else if (issue.issueType === 'Rejection' && issue.rejectionReason) {
    var suggestion = lookupDenialSuggestion(issue.rejectionReason, 'Rejection');
    if (suggestion && suggestion.rootCause) return suggestion.rootCause;
  }

  var defaultRouting = {
    'Denial':   'Clinical/Documentation',
    'Rejection':'Administrative/Front End',
    'Payment':  'Coding/Billing',
    'Internal': 'Payer Issue/System Error'
  };

  return defaultRouting[issue.issueType] || 'Administrative/Front End';
}

function calculatePriority(dos, timelyFilingDays) {
  if (!dos || !timelyFilingDays) return 'Medium';

  var today = new Date();
  today.setHours(0,0,0,0);

  var dosDate = new Date(dos);
  dosDate.setHours(0,0,0,0);

  var deadline = new Date(dosDate);
  deadline.setDate(deadline.getDate() + parseInt(timelyFilingDays));

  var daysLeft = Math.floor((deadline - today) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 15) return 'Critical (Past Due)';
  if (daysLeft <= 30) return 'High (Urgent)';
  if (daysLeft <= 60) return 'Medium';
  return 'Low';
}

// ═══════════════════════════════════════════════════════════════════════
// ACTIVITY LOGGING
// ═══════════════════════════════════════════════════════════════════════

function logActivity(issueId, note, status) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var activitySheet = ss.getSheetByName('Activity Log');
  var user = getCurrentUser();

  if (!activitySheet) return;

  var timestamp = new Date();
  var newEntry = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm') +
    ' - ' + user.name + ': ' + note;

  var data = activitySheet.getDataRange().getValues();
  var existingRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === issueId) {
      existingRow = i + 1;
      break;
    }
  }

  if (existingRow === -1) {
    var claimsSheet = ss.getSheetByName('Claims');
    var assignedTo = '';
    if (claimsSheet) {
      var claimsData = claimsSheet.getDataRange().getValues();
      for (var j = 1; j < claimsData.length; j++) {
        if (claimsData[j][0] === issueId) {
          assignedTo = claimsData[j][COL.ASSIGNED_TO];
          break;
        }
      }
    }

    activitySheet.appendRow([
      timestamp,
      issueId,
      assignedTo,
      note,
      status || 'New',
      newEntry
    ]);
  } else {
    var existingHistory = data[existingRow - 1][5] || '';
    var updatedHistory = existingHistory ? existingHistory + '\n' + newEntry : newEntry;

    activitySheet.getRange(existingRow, 1).setValue(timestamp);
    activitySheet.getRange(existingRow, 4).setValue(note);
    if (status) activitySheet.getRange(existingRow, 5).setValue(status);
    activitySheet.getRange(existingRow, 6).setValue(updatedHistory);
  }
}

function logActivityFromSidebar(issueId, note) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var claimsSheet = ss.getSheetByName('Claims');
  var currentStatus = '';

  if (claimsSheet) {
    var data = claimsSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === issueId) {
        currentStatus = data[i][COL.WORKFLOW_STAGE];
        break;
      }
    }
  }

  logActivity(issueId, note, currentStatus);
}

// ═══════════════════════════════════════════════════════════════════════
// FIELD UPDATES & RESOLUTION
// ═══════════════════════════════════════════════════════════════════════

function updateIssueField(row, field, value) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Claims');

  var fieldMap = {
    'assignedTo':    COL.ASSIGNED_TO + 1,
    'priority':      COL.PRIORITY + 1,
    'rootCause':     COL.ROOT_CAUSE + 1,
    'workflowStage': COL.WORKFLOW_STAGE + 1
  };

  var col = fieldMap[field];
  if (col) {
    sheet.getRange(row, col).setValue(value);
    var issueId = sheet.getRange(row, 1).getValue();
    var currentStatus = sheet.getRange(row, COL.WORKFLOW_STAGE + 1).getValue();
    logActivity(issueId, field + ' changed to: ' + value, currentStatus);
  }
}

function resolveIssue(row) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Claims');
  sheet.getRange(row, COL.DATE_RESOLVED + 1).setValue(new Date());
  sheet.getRange(row, COL.WORKFLOW_STAGE + 1).setValue('Resolved');

  var issueId = sheet.getRange(row, 1).getValue();
  logActivity(issueId, '✅ Issue marked as RESOLVED', 'Resolved');
}

function logResearchAndAdvance(issueId, row, note) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Claims');
  sheet.getRange(row, COL.WORKFLOW_STAGE + 1).setValue('Research Complete');
  logActivity(issueId, note, 'Research Complete');
}

// ═══════════════════════════════════════════════════════════════════════
// PROGRAMMING ALERTS
// ═══════════════════════════════════════════════════════════════════════

function checkProgrammingAlert(errorType, practice) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var alertsSheet = ss.getSheetByName('Programming Alerts');
  if (!alertsSheet) return;

  var data = alertsSheet.getDataRange().getValues();
  var found = false;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === errorType) {
      alertsSheet.getRange(i + 1, 2).setValue(data[i][1] + 1);
      alertsSheet.getRange(i + 1, 3).setValue(new Date());

      var practices = data[i][4] ? data[i][4].split(', ') : [];
      if (practices.indexOf(practice) === -1) {
        practices.push(practice);
        alertsSheet.getRange(i + 1, 5).setValue(practices.join(', '));
      }
      found = true;
      break;
    }
  }

  if (!found) {
    alertsSheet.appendRow([errorType, 1, new Date(), new Date(), practice, 'Open']);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CLAIM DATA READER
// ═══════════════════════════════════════════════════════════════════════

function getIssueData(row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  var data = sheet.getRange(row, 1, 1, COL.TOTAL_COLS + 2).getValues()[0];

  // Look up denial description
  var denialDescription = '';
  var refSheet = ss.getSheetByName('REF-Denials');
  if (refSheet && data[COL.DENIAL_CATEGORY]) {
    var refData = refSheet.getDataRange().getValues();
    for (var i = 1; i < refData.length; i++) {
      if (refData[i][0] === data[COL.DENIAL_CATEGORY]) {
        denialDescription = refData[i][1];
        break;
      }
    }
  }

  // Recalculate priority
  var autoTimelyDays = 90;
  var payersSheet = ss.getSheetByName('REF-Payers');
  if (payersSheet) {
    var payersData = payersSheet.getDataRange().getValues();
    for (var i = 1; i < payersData.length; i++) {
      if (payersData[i][1] === data[COL.CPT]) {
        autoTimelyDays = parseInt(payersData[i][3]) || autoTimelyDays;
        break;
      }
    }
  }

  var currentCoverageType = (data[COL.COVERAGE_TYPE] || '').toLowerCase();
  if (currentCoverageType.indexOf('medicare') !== -1 || currentCoverageType.indexOf('medicaid') !== -1) {
    autoTimelyDays = 365;
  }

  var recalcPriority = calculatePriority(data[COL.DOS], autoTimelyDays);

  if (recalcPriority !== data[COL.PRIORITY]) {
    sheet.getRange(row, COL.PRIORITY + 1).setValue(recalcPriority);
  }

  return {
    row:                row,
    issueId:            data[COL.ISSUE_ID],
    dateLogged:         data[COL.DATE_LOGGED],
    loggedBy:           data[COL.LOGGED_BY],
    issueType:          data[COL.ISSUE_TYPE],
    practice:           data[COL.PRACTICE],
    practiceNPI:        data[COL.PRACTICE_NPI],
    provider:           data[COL.PROVIDER],
    providerNPI:        data[COL.PROVIDER_NPI],
    payerName:          data[COL.PAYER],
    cpt:                data[COL.CPT],
    dos:                data[COL.DOS] ? new Date(data[COL.DOS]).toLocaleDateString('en-US', {month:'2-digit', day:'2-digit', year:'numeric'}) : '',
    expectedAmount:     data[COL.EXPECTED_AMT],
    paidAmount:         data[COL.PAID_AMT],
    variance:           data[COL.VARIANCE],
    rootCause:          data[COL.ROOT_CAUSE],
    workflowStage:      data[COL.WORKFLOW_STAGE],
    priority:           recalcPriority,
    assignedTo:         data[COL.ASSIGNED_TO],
    dateResolved:       data[COL.DATE_RESOLVED],
    daysOpen:           data[COL.DAYS_OPEN],
    issueDetails:       data[COL.ISSUE_DETAILS],
    batchId:            data[COL.BATCH_ID],
    state:              data[COL.STATE],
    accountNumber:      data[COL.ACCOUNT_NUMBER],
    denialCategory:     data[COL.DENIAL_CATEGORY],
    denialRejectionDate:data[COL.DENIAL_DATE],
    appealDueDate:      data[COL.APPEAL_DUE],
    resubmissionDate:   data[COL.RESUBMISSION_DATE],
    coverageType:       data[COL.COVERAGE_TYPE],
    carcCode:           data[COL.ISSUE_DETAILS],       // Same column as issueDetails for denials
    carcDescription:    data[COL.CARC_DESCRIPTION],
    carcAction:         getCARCAction(data[COL.ISSUE_DETAILS]),
    rarcCode:           data[COL.RARC_CODE],
    rarcDescription:    data[COL.RARC_DESCRIPTION],
    carcGroupCode:      data[COL.CARC_GROUP_CODE],
    denialDescription:  denialDescription
  };
}