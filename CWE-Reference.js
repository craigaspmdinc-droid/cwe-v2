/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.5                              ║
 * ║                    CWE-Reference.gs                                   ║
 * ║  PURPOSE: All reference data lookups (CARC, RARC, MAC, Payers,       ║
 * ║           Practices, Providers, Global Periods, Denials)              ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════
// PRACTICE & PROVIDER LOOKUPS
// ═══════════════════════════════════════════════════════════════════════

function getPractices() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-Practices');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var practices = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][1]) {
      practices.push({
        id:    data[i][0],
        name:  data[i][1],
        state: data[i][2],
        npi:   data[i][3]
      });
    }
  }
  return practices;
}

function getProvidersByPractice(practiceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-Providers');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var providers = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === practiceId) {
      providers.push({
        id:   data[i][0],
        name: data[i][1],
        npi:  data[i][2]
      });
    }
  }
  return providers;
}

// Form-facing wrappers
function getProvidersForForm(practiceId) {
  return getProvidersByPractice(practiceId);
}

// ═══════════════════════════════════════════════════════════════════════
// PAYER LOOKUPS
// ═══════════════════════════════════════════════════════════════════════

function getPayersByState(state) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-Payers');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var payers = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === state || data[i][1] === 'ALL') {
      payers.push({
        payerName:   data[i][0],
        state:       data[i][1],
        coverageType:data[i][2],
        planType:    data[i][3],
        timelyFiling:data[i][4],
        level1Days:  data[i][5],
        level1Name:  data[i][6],
        level2Days:  data[i][7],
        level2Name:  data[i][8],
        level3Days:  data[i][9],
        level3Name:  data[i][10]
      });
    }
  }
  return payers;
}

function getPayersForForm(state) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-Payers');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var payers = [];
  var seen = {};

  for (var i = 1; i < data.length; i++) {
    if ((data[i][1] === state || data[i][1] === 'ALL') && data[i][0]) {
      var payerName = data[i][0];
      if (!seen[payerName]) {
        seen[payerName] = true;
        payers.push(payerName);
      }
    }
  }
  return payers.sort();
}

function getCoverageTypesByPayer(payerName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-Payers');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var coverageTypes = [];
  var seen = {};

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === payerName && data[i][2]) {
      var coverage = data[i][2];
      if (!seen[coverage]) {
        seen[coverage] = true;
        coverageTypes.push(coverage);
      }
    }
  }
  return coverageTypes;
}

function getPlanTypesByPayerAndCoverage(payerName, coverageType) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-Payers');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var planTypes = [];
  var seen = {};

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === payerName && data[i][2] === coverageType && data[i][3]) {
      var plan = data[i][3];
      if (!seen[plan]) {
        seen[plan] = true;
        planTypes.push(plan);
      }
    }
  }
  return planTypes;
}

// ═══════════════════════════════════════════════════════════════════════
// CARC / RARC LOOKUPS
// ═══════════════════════════════════════════════════════════════════════

function lookupCARC(code) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-CARC');
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(code).trim()) {
      return {
        groupCode:   data[i][0],
        code:        data[i][1],
        description: data[i][2],
        source:      data[i][3]
      };
    }
  }
  return null;
}

function getCARCAction(carcCode) {
  if (!carcCode) return '';

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-CARC');
  if (!sheet) return '';

  var data = sheet.getDataRange().getValues();
  var codeStr = carcCode.toString().trim();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === codeStr) {
      return data[i][4] ? data[i][4].toString().trim() : '';
    }
  }
  return '';
}

function getCARCMatches(query) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-CARC');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var results = [];
  var q = String(query).trim().toLowerCase();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase().indexOf(q) > -1 ||
        String(data[i][2]).toLowerCase().indexOf(q) > -1) {
      results.push({
        groupCode:     data[i][0],
        code:          data[i][1],
        description:   data[i][2],
        denialCategory: data[i][5] || ''
      });
      if (results.length >= 10) break;
    }
  }
  return results;
}

function lookupRARC(code) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-RARC');
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(code).trim()) {
      return {
        code:        data[i][0],
        description: data[i][1],
        source:      data[i][2]
      };
    }
  }
  return null;
}

function getRARCMatches(query) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-RARC');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var results = [];
  var q = String(query).trim().toLowerCase();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().indexOf(q) > -1 ||
        String(data[i][1]).toLowerCase().indexOf(q) > -1) {
      results.push({
        code:        data[i][0],
        description: data[i][1]
      });
      if (results.length >= 10) break;
    }
  }
  return results;
}

function saveUserCode(type, code, description) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = type === 'CARC' ? 'REF-CARC' : 'REF-RARC';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;

  if (type === 'CARC') {
    sheet.appendRow(['', code, description, 'User Added']);
  } else {
    sheet.appendRow([code, description, 'User Added']);
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════════════
// MAC LOOKUPS
// ═══════════════════════════════════════════════════════════════════════

function lookupMAC(state, billingType) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-MACs');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim() === String(state).trim()) {
      if (!billingType || data[i][5] === billingType) {
        results.push({
          jurisdiction: data[i][0],
          name:         data[i][1],
          state:        data[i][2],
          phone:        data[i][3],
          website:      data[i][4],
          billingType:  data[i][5]
        });
      }
    }
  }
  return results;
}

function getMACsForState(state) {
  return lookupMAC(state, null); // Returns both Part B and DME
}

// ═══════════════════════════════════════════════════════════════════════
// DENIAL / REJECTION LOOKUPS
// ═══════════════════════════════════════════════════════════════════════

function lookupDenialSuggestion(code, type) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-Denials');
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (type === 'Denial' || type === 'Payment') {
      if (data[i][0] && (data[i][0].toString().toLowerCase().indexOf(code.toLowerCase()) > -1 ||
          (data[i][1] && data[i][1].toString().toLowerCase().indexOf(code.toLowerCase()) > -1))) {
        return {
          rootCause:      data[i][3],
          suggestedAction:data[i][2]
        };
      }
    } else if (type === 'Rejection') {
      if (data[i][4] && (data[i][4].toString().toLowerCase().indexOf(code.toLowerCase()) > -1 ||
          (data[i][5] && data[i][5].toString().toLowerCase().indexOf(code.toLowerCase()) > -1))) {
        return {
          rootCause:      data[i][7],
          suggestedAction:data[i][6]
        };
      }
    }
  }
  return null;
}

function getDenialCategories() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-Denials');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var categories = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      categories.push({
        name:           data[i][0],
        description:    data[i][1],
        suggestedAction:data[i][2],
        rootCause:      data[i][3]
      });
    }
  }
  return categories;
}

function getRejectionCategories() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-Denials');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var categories = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][4]) {
      categories.push({
        name:           data[i][4],
        description:    data[i][5],
        suggestedAction:data[i][6],
        rootCause:      data[i][7]
      });
    }
  }
  return categories;
}

// ═══════════════════════════════════════════════════════════════════════
// GLOBAL PERIOD LOOKUPS
// ═══════════════════════════════════════════════════════════════════════

function lookupGlobalPeriod(cpt) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('REF-GlobalPeriods');
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(cpt).trim()) {
      return { cpt: data[i][0], days: data[i][1] };
    }
  }
  return null;
}

function getGlobalPeriodForCPT(cpt) {
  return lookupGlobalPeriod(cpt);
}