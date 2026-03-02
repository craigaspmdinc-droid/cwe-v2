/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.5                              ║
 * ║                      CWE-Forms.gs                                     ║
 * ║  PURPOSE: Form/sidebar launchers and workflow decision tree builders  ║
 * ║  HTML: See IntakeForm.html and Sidebar.html                           ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════
// FORM LAUNCHERS
// ═══════════════════════════════════════════════════════════════════════

function showNewIssueForm() {
  var user = getCurrentUser();
  var visibleUsers = getVisibleUsers(user);
  var practices = getPractices();

  var practiceOptions = practices.map(function(p) {
    return '<option value="' + p.id + '" data-state="' + p.state + '" data-npi="' + p.npi + '">' + p.name + '</option>';
  }).join('');

  var userOptions = visibleUsers.map(function(name) {
    return '<option value="' + name + '">' + name + '</option>';
  }).join('');

  var template = HtmlService.createTemplateFromFile('IntakeForm');
  template.practiceOptions = practiceOptions;
  template.userOptions = userOptions;
  template.existing = {};
  template.editRow = null;

  var html = template.evaluate().setWidth(650).setHeight(750);
  SpreadsheetApp.getUi().showModalDialog(html, '➕ Log New Issue');
}

function showEditIssueForm(row) {
  var user = getCurrentUser();
  var visibleUsers = getVisibleUsers(user);
  var practices = getPractices();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  var data = sheet.getRange(row, 1, 1, COL.TOTAL_COLS + 2).getValues()[0];

  var existing = {
    issueType:           data[COL.ISSUE_TYPE],
    practice:            data[COL.PRACTICE],
    practiceNPI:         data[COL.PRACTICE_NPI],
    provider:            data[COL.PROVIDER],
    providerNPI:         data[COL.PROVIDER_NPI],
    payerName:           data[COL.PAYER],
    cpt:                 data[COL.CPT],
    dos:                 data[COL.DOS] ? Utilities.formatDate(new Date(data[COL.DOS]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
    expectedAmount:      data[COL.EXPECTED_AMT],
    paidAmount:          data[COL.PAID_AMT],
    rootCause:           data[COL.ROOT_CAUSE],
    accountNumber:       data[COL.ACCOUNT_NUMBER],
    denialCategory:      data[COL.DENIAL_CATEGORY],
    denialRejectionDate: data[COL.DENIAL_DATE] ? Utilities.formatDate(new Date(data[COL.DENIAL_DATE]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
    coverageType:        data[COL.COVERAGE_TYPE],
    carcCode:            data[COL.ISSUE_DETAILS],
    carcDescription:     data[COL.CARC_DESCRIPTION],
    rarcCode:            data[COL.RARC_CODE],
    rarcDescription:     data[COL.RARC_DESCRIPTION],
    carcGroupCode:       data[COL.CARC_GROUP_CODE],
    assignedTo:          data[COL.ASSIGNED_TO],
    batchId:             data[COL.BATCH_ID],
    state:               data[COL.STATE]
  };

  var practiceOptions = practices.map(function(p) {
    return '<option value="' + p.id + '" data-state="' + p.state + '" data-npi="' + p.npi + '">' + p.name + '</option>';
  }).join('');

  var userOptions = visibleUsers.map(function(name) {
    return '<option value="' + name + '">' + name + '</option>';
  }).join('');

  var template = HtmlService.createTemplateFromFile('IntakeForm');
  template.practiceOptions = practiceOptions;
  template.userOptions = userOptions;
  template.existing = existing;
  template.editRow = row;

  var html = template.evaluate().setWidth(650).setHeight(750);
  SpreadsheetApp.getUi().showModalDialog(html, '✏️ Edit Issue');
}

// ═══════════════════════════════════════════════════════════════════════
// SIDEBAR LAUNCHERS
// ═══════════════════════════════════════════════════════════════════════

function openWorkflowSidebar() {
  openDashboardSidebar();
}

function openWorkflowSidebarById(issueId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === issueId) {
      ss.setActiveSheet(sheet);
      sheet.setActiveRange(sheet.getRange(i + 1, 1));
      openDashboardSidebar();
      return;
    }
  }
}

function openWorkflowSidebarByRow(row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Claims');
  ss.setActiveSheet(sheet);
  sheet.setActiveRange(sheet.getRange(row, 1));
  openDashboardSidebar();
}

// ═══════════════════════════════════════════════════════════════════════
// SIDEBAR HELPER BUILDERS
// ═══════════════════════════════════════════════════════════════════════

function getTypeColor(issueType) {
  return {
    'Denial':   '#ef4444',
    'Rejection':'#f59e0b',
    'Payment':  '#10b981',
    'Internal': '#8b5cf6'
  }[issueType] || '#6b7280';
}

function buildClaimOptions(issue, user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var claimsSheet = ss.getSheetByName('Claims');
  var allClaims = claimsSheet.getDataRange().getValues();

  return allClaims.slice(1)
    .filter(function(r) {
      return !r[COL.DATE_RESOLVED] && (r[COL.ASSIGNED_TO] === user.name || r[COL.ASSIGNED_TO] === issue.assignedTo);
    })
    .map(function(r, i) {
      var row = i + 2;
      var marker = r[COL.ISSUE_ID] === issue.issueId ? ' ← current' : '';
      var selected = r[COL.ISSUE_ID] === issue.issueId ? 'selected' : '';
      return '<option value="' + row + '" ' + selected + '>' +
        r[COL.PRACTICE] + ' | ' + (r[COL.ACCOUNT_NUMBER] || 'No Acct#') + ' | ' + r[COL.ISSUE_TYPE] + marker +
        '</option>';
    })
    .join('');
}

function buildUserOptions(user) {
  return getVisibleUsers(user).map(function(name) {
    return '<option value="' + name + '">' + name + '</option>';
  }).join('');
}

function buildPayerInfo(issue) {
  if (!issue.state || !issue.payerName) return '';

  var payers = getPayersByState(issue.state);
  if (payers.length === 0) return '';

  var payer = payers[0];
  var today = new Date();
  today.setHours(0,0,0,0);

  var timelyFilingCountdown = '';
  var appealCountdown = '';

  if (issue.dos) {
    var dos = new Date(issue.dos);
    dos.setHours(0,0,0,0);
    var timelyFilingDeadline = new Date(dos);
    timelyFilingDeadline.setDate(timelyFilingDeadline.getDate() + parseInt(payer.timelyFiling));
    var timelyDaysLeft = Math.floor((timelyFilingDeadline - today) / (1000 * 60 * 60 * 24));
    var timelyColor = timelyDaysLeft <= 15 ? '#ef4444' : timelyDaysLeft <= 30 ? '#f59e0b' : '#10b981';
    timelyFilingCountdown = '<span style="color:' + timelyColor + '; font-weight:700;">' + timelyDaysLeft + ' days left</span>';
  }

  if (issue.appealDueDate) {
    var appealDate = new Date(issue.appealDueDate);
    appealDate.setHours(0,0,0,0);
    var appealDaysLeft = Math.floor((appealDate - today) / (1000 * 60 * 60 * 24));
    var appealColor = appealDaysLeft <= 15 ? '#ef4444' : appealDaysLeft <= 30 ? '#f59e0b' : '#10b981';
    appealCountdown = '<span style="color:' + appealColor + '; font-weight:700;">' + appealDaysLeft + ' days left</span>';
  }

  return '<div style="background:#f0f9ff; padding:12px; border-radius:6px; margin:12px 0; border-left:3px solid #0ea5e9;">' +
    '<div style="font-size:12px; font-weight:600; color:#0369a1; margin-bottom:6px;">📊 PAYER INTELLIGENCE</div>' +
    '<div style="font-size:11px; color:#0c4a6e; line-height:1.6;">' +
    '<strong>Timely Filing:</strong> ' + payer.timelyFiling + ' days ' + timelyFilingCountdown + '<br>' +
    '<strong>Level 1 Appeal:</strong> ' + payer.level1Name + ' (' + payer.level1Days + ' days) ' + appealCountdown + '<br>' +
    '<strong>Level 2 Appeal:</strong> ' + payer.level2Name + ' (' + payer.level2Days + ' days)' +
    '</div></div>';
}

function buildMACInfo(issue) {
  if (!issue.state || !issue.payerName) return '';
  if (issue.payerName.toLowerCase().indexOf('medicare') === -1) return '';

  var macs = getMACsForState(issue.state);
  if (macs.length === 0) return '';

  return '<div style="background:#f0f9ff; padding:12px; border-radius:6px; margin:12px 0; border-left:3px solid #0ea5e9;">' +
    '<div style="font-size:12px; font-weight:600; color:#0369a1; margin-bottom:8px;">📞 MAC REFERENCE</div>' +
    macs.map(function(mac) {
      return '<div style="background:white; border-radius:5px; padding:8px 10px; margin-bottom:6px;">' +
        '<div style="font-size:10px; font-weight:700; color:#0369a1; text-transform:uppercase; letter-spacing:0.5px;">' + mac.billingType + '</div>' +
        '<div style="font-size:12px; font-weight:600; color:#1e3a5f; margin:2px 0;">' + mac.name + '</div>' +
        '<div style="font-size:11px; color:#6b7280;">Jurisdiction ' + mac.jurisdiction + '</div>' +
        '<a href="tel:' + mac.phone + '" style="font-size:11px; color:#0ea5e9; text-decoration:none;">📞 ' + mac.phone + '</a>' +
        '</div>';
    }).join('') +
    '</div>';
}

// ═══════════════════════════════════════════════════════════════════════
// WORKFLOW ROUTER
// ═══════════════════════════════════════════════════════════════════════

function buildRootCauseWorkflow(issue, color) {
  if (issue.rootCause === 'Research & Investigation') {
    return buildResearchWorkflow(issue, color);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var refSheet = ss.getSheetByName('REF-Denials');
  var suggestedAction = '';

  if (refSheet && issue.denialCategory) {
    var refData = refSheet.getDataRange().getValues();
    for (var i = 1; i < refData.length; i++) {
      if (refData[i][0] === issue.denialCategory) {
        suggestedAction = refData[i][2];
        break;
      }
    }
    if (!suggestedAction) {
      for (var i = 1; i < refData.length; i++) {
        if (refData[i][4] === issue.denialCategory) {
          suggestedAction = refData[i][6];
          break;
        }
      }
    }
  }

  switch(suggestedAction) {
    case 'Patient Contact Required':        return buildPatientContactWorkflow(issue, color);
    case 'Provider Contact Required':       return buildProviderContactWorkflow(issue, color);
    case 'Resubmit with Corrections':       return buildResubmitWorkflow(issue, color);
    case 'Appeal Needed':                   return buildAppealWorkflow(issue, color);
    case 'No Action Required / Close Claim':return buildDuplicateWorkflow(issue, color);
    case 'Send Requested Information':      return buildSendInfoWorkflow(issue, color);
    case 'Reconsideration / Dispute':       return buildDisputeWorkflow(issue, color);
    case 'Send to Patient':                 return buildPatientRespWorkflow(issue, color);
    case 'Enter claim on MassHealth portal':return buildMassHealthWorkflow(issue, color);
    case 'Send to Credentialing':           return buildCredentialingWorkflow(issue, color);
    case 'Send to Programming':             return buildProgrammingWorkflow(issue, color);
    default:                                return buildGenericWorkflow(issue, color);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PROGRESS BAR HELPER
// ═══════════════════════════════════════════════════════════════════════

function buildProgressBar(steps, currentStage) {
  var html = '<div class="progress-bar">';
  var currentIndex = -1;

  for (var i = 0; i < steps.length; i++) {
    if (steps[i].stages.indexOf(currentStage) > -1) {
      currentIndex = i;
      break;
    }
  }

  for (var i = 0; i < steps.length; i++) {
    var stepClass = i < currentIndex ? 'completed' : (i === currentIndex ? 'current' : '');
    if (i > 0) {
      html += '<div class="progress-connector ' + (i <= currentIndex ? 'completed' : '') + '"></div>';
    }
    html += '<div class="progress-step ' + stepClass + '">';
    html += '<div class="dot">' + (i < currentIndex ? '✓' : (i + 1)) + '</div>';
    html += '<div class="step-label">' + steps[i].label + '</div>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// ═══════════════════════════════════════════════════════════════════════
// WORKFLOW BUILDERS
// ═══════════════════════════════════════════════════════════════════════

function buildResearchWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">🔍 Research & Investigation</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Document Facts', stages: ['New'] },
    { label: 'Identify Gaps',  stages: ['Known Facts Documented'] },
    { label: 'Research',       stages: ['Gaps Identified'] },
    { label: 'Route Claim',    stages: ['Research Complete'] },
    { label: 'Resolved',       stages: ['Escalated'] }
  ];
  html += buildProgressBar(steps, stage);

  if (stage === 'New') {
    html += `<div class="info">📋 Root cause unclear — investigation required before action can be taken.</div>
      <div class="alert">⚡ Step 1: Document What Is Known</div>
      <div class="option-desc" style="margin-bottom:12px;">Pull all available information — RA/EOB, claim history, prior notes, denial codes.</div>
      <button class="btn btn-primary" onclick="moveToStage('Known Facts Documented')">✓ Known Facts Documented</button>`;
  } else if (stage === 'Known Facts Documented') {
    html += `<div class="success">✓ Known facts documented</div>
      <div class="alert">⚡ Step 2: Identify What Is Missing or Conflicting</div>
      <button class="btn btn-primary" onclick="moveToStage('Gaps Identified')">✓ Gaps Identified</button>`;
  } else if (stage === 'Gaps Identified') {
    html += `<div class="success">✓ Gaps identified</div>
      <div class="alert">⚡ Step 3: Research — Select Source</div>
      <div class="option-desc" style="margin-bottom:12px;">Prioritize web portal and online sources before making phone calls.</div>
      <div class="workflow-option" onclick="showResearchSource('portal')"><div class="option-label">🌐 Payer Web Portal</div><div class="option-desc">Check claim status, history, and notes on payer portal</div></div>
      <div class="workflow-option" onclick="showResearchSource('ai')"><div class="option-label">🤖 AI Research</div><div class="option-desc">Use AI to research denial codes, policies, or billing rules</div></div>
      <div class="workflow-option" onclick="showResearchSource('internet')"><div class="option-label">🔎 Internet Search</div><div class="option-desc">Search payer policies, LCD/NCD, or billing guidelines</div></div>
      <div class="workflow-option" onclick="showResearchSource('phone')"><div class="option-label">📞 Phone Call</div><div class="option-desc">Call payer or provider — use as last resort</div></div>
      <div id="researchSourceForm" style="display:none; margin-top:16px;">
        <div id="portalForm" style="display:none;">
          <div class="alert">🌐 Payer Web Portal</div>
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Portal URL</label>
          <input type="text" id="portalUrl" placeholder="https://..." style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;margin-bottom:8px;">
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Date Obtained</label>
          <input type="date" id="portalDate" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;margin-bottom:8px;">
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Findings</label>
          <textarea id="portalFindings" placeholder="What did you find?" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;min-height:60px;"></textarea>
          <button class="btn btn-primary" style="margin-top:8px;" onclick="saveResearch('portal')">💾 Save Research</button>
        </div>
        <div id="aiForm" style="display:none;">
          <div class="alert">🤖 AI Research</div>
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Which AI Tool?</label>
          <select id="aiTool" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;margin-bottom:8px;"><option value="">Select...</option><option>Claude</option><option>ChatGPT</option><option>Gemini</option><option>Copilot</option><option>Other</option></select>
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Question Asked</label>
          <textarea id="aiQuestion" placeholder="What did you ask the AI?" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;min-height:60px;margin-bottom:8px;"></textarea>
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Findings</label>
          <textarea id="aiFindings" placeholder="What did you find?" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;min-height:60px;"></textarea>
          <button class="btn btn-primary" style="margin-top:8px;" onclick="saveResearch('ai')">💾 Save Research</button>
        </div>
        <div id="internetForm" style="display:none;">
          <div class="alert">🔎 Internet Search</div>
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Search Parameters Used</label>
          <input type="text" id="searchParams" placeholder="e.g., 'CO-50 denial Medicare 2026'" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;margin-bottom:8px;">
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Top Sources Referenced</label>
          <textarea id="internetSources" placeholder="List URLs or source names used..." style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;min-height:60px;margin-bottom:8px;"></textarea>
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Findings</label>
          <textarea id="internetFindings" placeholder="What did you find?" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;min-height:60px;"></textarea>
          <button class="btn btn-primary" style="margin-top:8px;" onclick="saveResearch('internet')">💾 Save Research</button>
        </div>
        <div id="phoneForm" style="display:none;">
          <div class="alert">📞 Phone Call</div>
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Phone Number Called</label>
          <input type="text" id="phoneNumber" placeholder="e.g., 800-555-1234" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;margin-bottom:8px;">
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Representative Spoken To</label>
          <input type="text" id="phoneRep" placeholder="Name and/or ID" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;margin-bottom:8px;">
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Reference Number</label>
          <input type="text" id="phoneRef" placeholder="Call reference or confirmation #" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;margin-bottom:8px;">
          <label style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:block;">Findings</label>
          <textarea id="phoneFindings" placeholder="What did you find?" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:7px;font-size:12px;min-height:60px;"></textarea>
          <button class="btn btn-primary" style="margin-top:8px;" onclick="saveResearch('phone')">💾 Save Research</button>
        </div>
      </div>`;
  } else if (stage === 'Research Complete') {
    html += `<div class="success">✓ Research complete — root cause determined</div>
      <div class="alert">⚡ Step 4: Route to Appropriate Workflow</div>
      <div class="option-desc" style="margin-bottom:12px;">Change the Root Cause in Quick Actions below to route this claim to the correct workflow.</div>
      <div class="workflow-option" onclick="doChangeRootCauseAndReload('Administrative/Front End')"><div class="option-label">Administrative/Front End</div><div class="option-desc">Eligibility, authorization, demographic issue</div></div>
      <div class="workflow-option" onclick="doChangeRootCauseAndReload('Coding/Billing')"><div class="option-label">Coding/Billing</div><div class="option-desc">CPT, modifier, diagnosis, duplicate</div></div>
      <div class="workflow-option" onclick="doChangeRootCauseAndReload('Clinical/Documentation')"><div class="option-label">Clinical/Documentation</div><div class="option-desc">Medical necessity, missing records</div></div>
      <div class="workflow-option" onclick="doChangeRootCauseAndReload('Payer Issue/System Error')"><div class="option-label">Payer Issue/System Error</div><div class="option-desc">Payer error, wrong fee schedule</div></div>
      <div class="workflow-option" onclick="doChangeRootCauseAndReload('Patient Responsibility')"><div class="option-label">Patient Responsibility</div><div class="option-desc">Deductible, copay, non-covered service</div></div>
      <div class="workflow-option" onclick="doChangeRootCauseAndReload('Credentialing/Contracting')"><div class="option-label">Credentialing/Contracting</div><div class="option-desc">Provider not credentialed, contract dispute</div></div>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div>
      <button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Research</button>
      <button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildPatientContactWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">📞 Patient Contact Required</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Contact Patient', stages: ['New', 'Category Selected'] },
    { label: 'Verify Info',     stages: ['Patient Contacted'] },
    { label: 'Correct Info',    stages: ['Information Verified', 'Patient Unreachable'] },
    { label: 'Resubmit',        stages: ['Information Corrected'] },
    { label: 'Monitor',         stages: ['Resubmitted'] },
    { label: 'Resolved',        stages: ['Escalated'] }
  ];
  html += buildProgressBar(steps, stage);
  if (stage === 'New') {
    html += `<div class="info">📋 <strong>Reason:</strong> ${issue.denialCategory}</div><div class="alert">⚡ Step 1: Contact Patient</div><button class="btn btn-primary" onclick="moveToStage('Patient Contacted')">📞 Patient Contacted</button>`;
  } else if (stage === 'Patient Contacted') {
    html += `<div class="success">✓ Patient contacted</div><div class="alert">⚡ Step 2: Verify Information</div><button class="btn btn-primary" onclick="moveToStage('Information Verified')">✓ Information Verified</button><button class="btn btn-secondary" onclick="moveToStage('Patient Unreachable')">❌ Unable to Reach Patient</button>`;
  } else if (stage === 'Patient Unreachable') {
    html += `<div class="alert">⚠️ Patient unreachable</div><button class="btn btn-primary" onclick="moveToStage('Patient Contacted')">🔄 Try Again</button><button class="btn btn-secondary" onclick="moveToStage('Escalated')">→ Escalate to Supervisor</button>`;
  } else if (stage === 'Information Verified') {
    html += `<div class="success">✓ Information verified</div><div class="alert">⚡ Step 3: Correct Information in System</div><button class="btn btn-primary" onclick="moveToStage('Information Corrected')">✓ Information Corrected</button>`;
  } else if (stage === 'Information Corrected') {
    html += `<div class="success">✓ Information corrected</div><div class="alert">⚡ Step 4: Resubmit Claim</div><button class="btn btn-primary" onclick="moveToStage('Resubmitted')">📤 Claim Resubmitted</button>`;
  } else if (stage === 'Resubmitted') {
    html += `<div class="success">✓ Claim resubmitted</div><div class="alert">⚡ Step 5: Monitor for Payment (14 days)</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Paid — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('New')">❌ Still Denied — Restart</button>`;
  } else if (stage === 'Escalated') {
    html += `<div class="alert">⚠️ Escalated to supervisor</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Resolved</button>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildProviderContactWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">📋 Provider Contact Required</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Contact Provider', stages: ['New', 'Category Selected'] },
    { label: 'Obtain Auth',      stages: ['Provider Contacted'] },
    { label: 'Update Claim',     stages: ['Auth Obtained', 'Auth Pending'] },
    { label: 'Resubmit',         stages: ['Claim Updated'] },
    { label: 'Monitor',          stages: ['Resubmitted'] },
    { label: 'Resolved',         stages: ['Auth Denied', 'Appeal Filed', 'Escalated'] }
  ];
  html += buildProgressBar(steps, stage);
  if (stage === 'New') {
    html += `<div class="info">📋 <strong>Reason:</strong> ${issue.denialCategory}</div><div class="alert">⚡ Step 1: Contact Provider Office</div><button class="btn btn-primary" onclick="moveToStage('Provider Contacted')">📞 Provider Contacted</button>`;
  } else if (stage === 'Provider Contacted') {
    html += `<div class="success">✓ Provider contacted</div><div class="alert">⚡ Step 2: Obtain Auth/Referral</div>
      <div class="workflow-option" onclick="moveToStage('Auth Obtained')"><div class="option-label">Auth/Referral Obtained</div><div class="option-desc">Have the number — ready to update claim</div></div>
      <div class="workflow-option" onclick="moveToStage('Auth Pending')"><div class="option-label">Auth/Referral Pending</div><div class="option-desc">Provider submitted, awaiting approval</div></div>
      <div class="workflow-option" onclick="moveToStage('Auth Denied')"><div class="option-label">Auth/Referral Denied</div><div class="option-desc">Payer refused to authorize</div></div>`;
  } else if (stage === 'Auth Pending') {
    html += `<div class="alert">⚠️ Auth pending — monitor until received</div><button class="btn btn-primary" onclick="moveToStage('Auth Obtained')">✓ Auth Received</button><button class="btn btn-secondary" onclick="moveToStage('Escalated')">→ Escalate — No Response</button>`;
  } else if (stage === 'Auth Obtained') {
    html += `<div class="success">✓ Auth/Referral obtained</div><div class="alert">⚡ Step 3: Update Claim with Auth Number</div><button class="btn btn-primary" onclick="moveToStage('Claim Updated')">✓ Claim Updated</button>`;
  } else if (stage === 'Claim Updated') {
    html += `<div class="success">✓ Claim updated</div><div class="alert">⚡ Step 4: Resubmit Claim</div><button class="btn btn-primary" onclick="moveToStage('Resubmitted')">📤 Claim Resubmitted</button>`;
  } else if (stage === 'Resubmitted') {
    html += `<div class="success">✓ Claim resubmitted</div><div class="alert">⚡ Step 5: Monitor for Payment (14 days)</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Paid — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('Escalated')">❌ Still Denied — Escalate to Appeal</button>`;
  } else if (stage === 'Auth Denied') {
    html += `<div class="alert">⚠️ Authorization denied by payer</div><button class="btn btn-primary" onclick="moveToStage('Appeal Filed')">→ File Appeal</button><button class="btn btn-secondary" onclick="moveToStage('Patient Notified')">→ Notify Patient</button>`;
  } else if (stage === 'Appeal Filed') {
    html += `<div class="success">✓ Appeal filed</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Approved — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('Escalated')">❌ Denied Again — Escalate</button>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildResubmitWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">🔄 Resubmit with Corrections</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Identify Error', stages: ['New', 'Category Selected', 'Coding Error', 'Patient Info Error', 'Format Error'] },
    { label: 'Correct Claim',  stages: ['Claim Corrected'] },
    { label: 'Resubmit',       stages: ['Resubmitted'] },
    { label: 'Monitor',        stages: ['Monitoring'] },
    { label: 'Resolved',       stages: ['Resolved'] }
  ];
  html += buildProgressBar(steps, stage);
  if (stage === 'New' && !issue.denialCategory) {
    html += `<div class="alert">⚡ Step 1: Identify Specific Error</div>
      <div class="workflow-option" onclick="moveToStage('Coding Error')"><div class="option-label">Coding Error</div><div class="option-desc">Incorrect CPT, modifier, or diagnosis code</div></div>
      <div class="workflow-option" onclick="moveToStage('Patient Info Error')"><div class="option-label">Patient/Payer ID Error</div><div class="option-desc">Wrong member ID, group number, or payer address</div></div>
      <div class="workflow-option" onclick="moveToStage('Format Error')"><div class="option-label">Technical/Format Error</div><div class="option-desc">Missing NPI, invalid POS code, formatting issue</div></div>`;
  } else if (stage === 'New' && issue.denialCategory) {
    html += `<div class="info">📋 <strong>Reason:</strong> ${issue.denialCategory}</div><div class="alert">⚡ Step 1: Correct the Claim</div><button class="btn btn-primary" onclick="moveToStage('Claim Corrected')">✓ Claim Corrected</button>`;
  } else if (stage === 'Coding Error' || stage === 'Patient Info Error' || stage === 'Format Error') {
    html += `<div class="success">✓ Error identified: ${stage}</div><div class="alert">⚡ Step 2: Correct the Claim</div><button class="btn btn-primary" onclick="moveToStage('Claim Corrected')">✓ Claim Corrected</button>`;
  } else if (stage === 'Claim Corrected') {
    html += `<div class="success">✓ Claim corrected</div><div class="alert">⚡ Step 3: Resubmit as Corrected Claim (Frequency 7)</div><button class="btn btn-primary" onclick="moveToStage('Resubmitted')">📤 Resubmitted (Freq 7)</button>`;
  } else if (stage === 'Resubmitted') {
    html += `<div class="success">✓ Claim resubmitted</div><div class="alert">⚡ Step 4: Monitor for Payment (14 days)</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Paid — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('New')">❌ Still Denied — Review Correction</button>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildAppealWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">⚖️ Appeal Required</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Review EOB',      stages: ['New', 'Category Selected'] },
    { label: 'Gather Docs',     stages: ['EOB Reviewed'] },
    { label: 'Write Appeal',    stages: ['Docs Gathered'] },
    { label: 'Submit',          stages: ['Letter Written'] },
    { label: 'Confirm Receipt', stages: ['Level 1 Filed', 'Level 2 Filed', 'Level 3 Filed'] },
    { label: 'Monitor',         stages: ['Receipt Confirmed', 'No Receipt', 'No Response'] },
    { label: 'Resolved',        stages: ['Escalated'] }
  ];
  html += buildProgressBar(steps, stage);
  if (stage === 'New') {
    html += `<div class="info">📋 <strong>Reason:</strong> ${issue.denialCategory}</div><div class="alert">⚡ Step 1: Pull RA/EOB — Confirm Denial Reason</div><button class="btn btn-primary" onclick="moveToStage('EOB Reviewed')">✓ RA/EOB Reviewed</button>`;
  } else if (stage === 'EOB Reviewed') {
    html += `<div class="success">✓ RA/EOB reviewed</div><div class="alert">⚡ Step 2: Gather Supporting Documentation</div><div class="option-desc" style="margin-bottom:12px;">Collect: Progress notes, lab results, imaging, consults, original claim details, RA/EOB and denial letters, patient ABNs or authorizations, LCD/NCD policy references.</div><button class="btn btn-primary" onclick="moveToStage('Docs Gathered')">✓ Documentation Ready</button>`;
  } else if (stage === 'Docs Gathered') {
    html += `<div class="success">✓ Documentation gathered</div><div class="alert">⚡ Step 3: Write Appeal Letter</div><div class="option-desc" style="margin-bottom:12px;">Include: Patient name/ID/DOS, CPT codes/charges, denial reference, justification, list of attachments.</div><button class="btn btn-primary" onclick="moveToStage('Letter Written')">✓ Appeal Letter Ready</button>`;
  } else if (stage === 'Letter Written') {
    html += `<div class="success">✓ Appeal letter written</div><div class="alert">⚡ Step 4: Submit to Correct Appeal Level</div>
      <div class="workflow-option" onclick="moveToStage('Level 1 Filed')"><div class="option-label">Level 1 — Redetermination</div><div class="option-desc">First appeal — filed with Medicare contractor or payer</div></div>
      <div class="workflow-option" onclick="moveToStage('Level 2 Filed')"><div class="option-label">Level 2 — Reconsideration</div><div class="option-desc">Second level — Qualified Independent Contractor (QIC)</div></div>
      <div class="workflow-option" onclick="moveToStage('Level 3 Filed')"><div class="option-label">Level 3 — ALJ Hearing</div><div class="option-desc">Administrative Law Judge hearing</div></div>`;
  } else if (stage === 'Level 1 Filed' || stage === 'Level 2 Filed' || stage === 'Level 3 Filed') {
    html += `<div class="success">✓ Appeal submitted: ${stage}</div><div class="alert">⚡ Step 5: Track + Confirm Receipt</div><button class="btn btn-primary" onclick="moveToStage('Receipt Confirmed')">✓ Receipt Confirmed</button><button class="btn btn-secondary" onclick="moveToStage('No Receipt')">⚠️ No Confirmation Received</button>`;
  } else if (stage === 'No Receipt') {
    html += `<div class="alert">⚠️ No receipt confirmed — follow up immediately</div><button class="btn btn-primary" onclick="moveToStage('Receipt Confirmed')">✓ Now Confirmed</button><button class="btn btn-secondary" onclick="moveToStage('Letter Written')">🔄 Resubmit Appeal</button>`;
  } else if (stage === 'Receipt Confirmed') {
    html += `<div class="success">✓ Receipt confirmed</div><div class="alert">⚡ Step 6: Monitor for Response</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Approved — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('Letter Written')">❌ Denied Again — Next Level</button><button class="btn btn-secondary" onclick="moveToStage('No Response')">⏱ No Response Yet</button>`;
  } else if (stage === 'No Response') {
    html += `<div class="alert">⚠️ No response from payer — follow up</div><button class="btn btn-primary" onclick="moveToStage('Receipt Confirmed')">✓ Response Received</button><button class="btn btn-secondary" onclick="moveToStage('Escalated')">→ Escalate to Supervisor</button>`;
  } else if (stage === 'Escalated') {
    html += `<div class="alert">⚠️ Claim escalated — review needed</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildDuplicateWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">🔁 Duplicate Claim</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Identify Type', stages: ['New', 'Category Selected'] },
    { label: 'Investigate',   stages: ['True Duplicate', 'Same Day Encounters', 'Missing Frequency Code', 'Replacement Needed'] },
    { label: 'Take Action',   stages: ['Awaiting Acknowledgement', 'Modifiers Needed', 'Box 19 Needed', 'Void Confirmed'] },
    { label: 'Resubmit',      stages: ['Resubmitted'] },
    { label: 'Resolved',      stages: ['Original Paid', 'Original Denied', 'Escalated'] }
  ];
  html += buildProgressBar(steps, stage);
  if (stage === 'New') {
    html += `<div class="info">📋 Pull the original claim — check ICN/claim number on RA/EOB</div><div class="alert">⚡ Step 1: Identify Duplicate Type</div>
      <div class="workflow-option" onclick="moveToStage('True Duplicate')"><div class="option-label">True Duplicate — Same Claim Sent Multiple Times</div></div>
      <div class="workflow-option" onclick="moveToStage('Same Day Encounters')"><div class="option-label">Same-Day Multiple Encounters</div></div>
      <div class="workflow-option" onclick="moveToStage('Missing Frequency Code')"><div class="option-label">Corrected Claim Without Frequency Code</div></div>
      <div class="workflow-option" onclick="moveToStage('Replacement Needed')"><div class="option-label">Replacement After Payment</div></div>`;
  } else if (stage === 'True Duplicate') {
    html += `<div class="success">✓ Type: True Duplicate</div>
      <div class="workflow-option" onclick="moveToStage('Awaiting Acknowledgement')"><div class="option-label">First Batch Still Awaiting Acknowledgement</div><div class="option-desc">Do not resubmit — monitor</div></div>
      <div class="workflow-option" onclick="moveToStage('Original Paid')"><div class="option-label">Original Already Paid</div><div class="option-desc">Close duplicate — no action needed</div></div>
      <div class="workflow-option" onclick="moveToStage('Original Denied')"><div class="option-label">Original Was Denied</div><div class="option-desc">Work original claim as separate issue</div></div>`;
  } else if (stage === 'Awaiting Acknowledgement') {
    html += `<div class="alert">⏱ Waiting for first batch acknowledgement — do not resubmit</div><button class="btn btn-primary" onclick="moveToStage('Original Paid')">✓ First Batch Acknowledged + Paid</button><button class="btn btn-secondary" onclick="moveToStage('Original Denied')">❌ First Batch Denied</button>`;
  } else if (stage === 'Original Paid') {
    html += `<div class="success">✓ Original claim paid</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Close Duplicate — No Action Needed</button>`;
  } else if (stage === 'Original Denied') {
    html += `<div class="alert">⚠️ Original claim was denied — work separately</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Close This Duplicate</button>`;
  } else if (stage === 'Same Day Encounters') {
    html += `<div class="success">✓ Type: Same-Day Multiple Encounters</div>
      <div class="workflow-option" onclick="moveToStage('Modifiers Needed')"><div class="option-label">Modifiers Required</div><div class="option-desc">Add modifier 25, 59, or X[EPSU] as appropriate</div></div>
      <div class="workflow-option" onclick="moveToStage('Box 19 Needed')"><div class="option-label">Box 19 Note Required</div><div class="option-desc">Add note explaining separate encounters</div></div>
      <div class="workflow-option" onclick="moveToStage('True Duplicate')"><div class="option-label">Not Distinct — True Duplicate</div></div>`;
  } else if (stage === 'Modifiers Needed' || stage === 'Box 19 Needed') {
    html += `<div class="success">✓ Correction identified: ${stage}</div><div class="alert">⚡ Apply corrections and resubmit</div><button class="btn btn-primary" onclick="moveToStage('Resubmitted')">📤 Corrected and Resubmitted</button>`;
  } else if (stage === 'Missing Frequency Code') {
    html += `<div class="success">✓ Type: Corrected Claim Without Frequency Code</div><div class="alert">⚡ Resubmit as Frequency 7 with original ICN</div><button class="btn btn-primary" onclick="moveToStage('Resubmitted')">📤 Resubmitted as Freq 7</button>`;
  } else if (stage === 'Replacement Needed') {
    html += `<div class="success">✓ Type: Replacement After Payment</div><div class="alert">⚡ Void original claim through payer portal</div><button class="btn btn-primary" onclick="moveToStage('Void Confirmed')">✓ Void Accepted</button>`;
  } else if (stage === 'Void Confirmed') {
    html += `<div class="success">✓ Original claim voided</div><div class="alert">⚡ Resubmit Correctly</div><button class="btn btn-primary" onclick="moveToStage('Resubmitted')">📤 Resubmitted Correctly</button>`;
  } else if (stage === 'Resubmitted') {
    html += `<div class="success">✓ Claim resubmitted</div><div class="alert">⚡ Monitor for Payment (14 days)</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Paid — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('New')">❌ Still Denied — Re-examine</button>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildSendInfoWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">📁 Additional Documentation Required</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Identify Request', stages: ['New', 'Category Selected'] },
    { label: 'Gather Docs',      stages: ['Request Identified'] },
    { label: 'Submit to Payer',  stages: ['Docs Gathered'] },
    { label: 'Confirm Receipt',  stages: ['Submitted to Payer'] },
    { label: 'Monitor',          stages: ['Receipt Confirmed', 'No Receipt', 'No Response'] },
    { label: 'Resolved',         stages: ['Appeal Filed', 'Escalated'] }
  ];
  html += buildProgressBar(steps, stage);
  if (stage === 'New') {
    html += `<div class="info">📋 <strong>Reason:</strong> ${issue.denialCategory}</div><div class="alert">⚡ Step 1: Identify What Was Requested</div><button class="btn btn-primary" onclick="moveToStage('Request Identified')">✓ Request Identified</button>`;
  } else if (stage === 'Request Identified') {
    html += `<div class="success">✓ Request identified</div><div class="alert">⚡ Step 2: Gather Requested Documents</div><button class="btn btn-primary" onclick="moveToStage('Docs Gathered')">✓ Documents Gathered</button>`;
  } else if (stage === 'Docs Gathered') {
    html += `<div class="success">✓ Documents gathered</div><div class="alert">⚡ Step 3: Submit to Payer</div><button class="btn btn-primary" onclick="moveToStage('Submitted to Payer')">📤 Submitted to Payer</button>`;
  } else if (stage === 'Submitted to Payer') {
    html += `<div class="success">✓ Submitted to payer</div><div class="alert">⚡ Step 4: Confirm Receipt</div><button class="btn btn-primary" onclick="moveToStage('Receipt Confirmed')">✓ Receipt Confirmed</button><button class="btn btn-secondary" onclick="moveToStage('No Receipt')">⚠️ No Confirmation</button>`;
  } else if (stage === 'No Receipt') {
    html += `<div class="alert">⚠️ No confirmation — resubmit documentation</div><button class="btn btn-primary" onclick="moveToStage('Submitted to Payer')">🔄 Resubmit Documents</button>`;
  } else if (stage === 'Receipt Confirmed') {
    html += `<div class="success">✓ Receipt confirmed</div><div class="alert">⚡ Step 5: Monitor for Response (30 days)</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Paid — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('Appeal Filed')">❌ Denied Again — File Appeal</button><button class="btn btn-secondary" onclick="moveToStage('No Response')">⏱ No Response Yet</button>`;
  } else if (stage === 'No Response') {
    html += `<div class="alert">⚠️ No response — follow up with payer</div><button class="btn btn-primary" onclick="moveToStage('Receipt Confirmed')">✓ Response Received</button>`;
  } else if (stage === 'Appeal Filed') {
    html += `<div class="success">✓ Appeal filed</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Approved — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('Escalated')">❌ Denied Again — Escalate</button>`;
  } else if (stage === 'Escalated') {
    html += `<div class="alert">⚠️ Escalated</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Resolved</button>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildDisputeWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">💲 Reconsideration / Dispute</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Pull Contract',  stages: ['New', 'Category Selected'] },
    { label: 'Calculate',      stages: ['Contract Pulled'] },
    { label: 'File Dispute',   stages: ['Discrepancy Documented'] },
    { label: 'Follow Up',      stages: ['Dispute Filed', 'No Response'] },
    { label: 'Resolved',       stages: ['Escalated'] }
  ];
  html += buildProgressBar(steps, stage);
  if (stage === 'New') {
    html += `<div class="info">📋 <strong>Reason:</strong> ${issue.denialCategory}</div><div class="alert">⚡ Step 1: Pull Contract / Fee Schedule</div><button class="btn btn-primary" onclick="moveToStage('Contract Pulled')">✓ Contract/Fee Schedule Retrieved</button>`;
  } else if (stage === 'Contract Pulled') {
    html += `<div class="success">✓ Contract retrieved</div><div class="alert">⚡ Step 2: Calculate Correct Payment</div><button class="btn btn-primary" onclick="moveToStage('Discrepancy Documented')">✓ Discrepancy Documented</button>`;
  } else if (stage === 'Discrepancy Documented') {
    html += `<div class="success">✓ Discrepancy documented</div><div class="alert">⚡ Step 3: File Formal Dispute with Payer</div><button class="btn btn-primary" onclick="moveToStage('Dispute Filed')">📤 Dispute Filed</button>`;
  } else if (stage === 'Dispute Filed') {
    html += `<div class="success">✓ Dispute filed</div><div class="alert">⚡ Step 4: Follow Up (30 days)</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Corrected — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('Escalated')">❌ Upheld — Escalate</button><button class="btn btn-secondary" onclick="moveToStage('No Response')">⏱ No Response Yet</button>`;
  } else if (stage === 'No Response') {
    html += `<div class="alert">⚠️ No response — follow up with payer</div><button class="btn btn-primary" onclick="moveToStage('Dispute Filed')">✓ Response Received</button>`;
  } else if (stage === 'Escalated') {
    html += `<div class="alert">⚠️ Escalated to contract review</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Resolved</button>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildPatientRespWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">💰 Patient Responsibility</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Verify Balance',  stages: ['New', 'Category Selected'] },
    { label: 'Notify Patient',  stages: ['Balance Verified'] },
    { label: 'Collect Payment', stages: ['Patient Notified'] },
    { label: 'Resolved',        stages: ['Payment Received', 'Payment Plan', 'No Response', 'Sent to Collections'] }
  ];
  html += buildProgressBar(steps, stage);
  if (stage === 'New') {
    html += `<div class="info">📋 <strong>Reason:</strong> ${issue.denialCategory}</div><div class="alert">⚡ Step 1: Verify Patient Responsibility Amount</div><button class="btn btn-primary" onclick="moveToStage('Balance Verified')">✓ Balance Verified</button>`;
  } else if (stage === 'Balance Verified') {
    html += `<div class="success">✓ Balance verified</div><div class="alert">⚡ Step 2: Notify Patient of Balance</div><button class="btn btn-primary" onclick="moveToStage('Patient Notified')">✓ Patient Notified</button>`;
  } else if (stage === 'Patient Notified') {
    html += `<div class="success">✓ Patient notified</div><div class="alert">⚡ Step 3: Collect Payment</div>
      <div class="workflow-option" onclick="moveToStage('Payment Received')"><div class="option-label">Payment Received</div></div>
      <div class="workflow-option" onclick="moveToStage('Payment Plan')"><div class="option-label">Set Up Payment Plan</div></div>
      <div class="workflow-option" onclick="moveToStage('No Response')"><div class="option-label">No Response from Patient</div></div>`;
  } else if (stage === 'Payment Plan') {
    html += `<div class="success">✓ Payment plan established</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved — Monitor Plan</button>`;
  } else if (stage === 'No Response') {
    html += `<div class="alert">⚠️ No response from patient</div><button class="btn btn-secondary" onclick="moveToStage('Sent to Collections')">→ Send to Collections</button><button class="btn btn-primary" onclick="moveToStage('Patient Notified')">🔄 Try Again</button>`;
  } else if (stage === 'Sent to Collections') {
    html += `<div class="alert">→ Sent to collections</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  } else if (stage === 'Payment Received') {
    html += `<div class="success">✓ Payment received</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Paid — Mark Resolved</button>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildMassHealthWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">🏥 MassHealth — Carrier Code Missing/Incorrect</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Check EVS',         stages: ['New', 'Category Selected'] },
    { label: 'Identify Payer',    stages: ['EVS Checked'] },
    { label: 'Find Code',         stages: ['Commercial Primary', 'Medicare Advantage Primary', 'Medicare AB Primary'] },
    { label: 'Update Portal',     stages: ['Code Found', 'Code Not Found'] },
    { label: 'Monitor',           stages: ['Claim Updated'] },
    { label: 'Resolved',          stages: ['Escalated'] }
  ];
  html += buildProgressBar(steps, stage);
  if (stage === 'New') {
    html += `<div class="info">📋 MassHealth requires a valid 7-digit carrier code for members with other health insurance.</div><div class="alert">⚡ Step 1: Check EVS for Correct Carrier Code</div><button class="btn btn-primary" onclick="moveToStage('EVS Checked')">✓ EVS Checked</button>`;
  } else if (stage === 'EVS Checked') {
    html += `<div class="success">✓ EVS checked</div><div class="alert">⚡ Step 2: Determine Primary Payer Type</div>
      <div class="workflow-option" onclick="moveToStage('Commercial Primary')"><div class="option-label">Commercial Insurance</div><div class="option-desc">Use Section I — Commercial Carrier Codes</div></div>
      <div class="workflow-option" onclick="moveToStage('Medicare Advantage Primary')"><div class="option-label">Medicare Advantage (Part C)</div><div class="option-desc">Use Section III — Medicare Advantage Carrier Codes</div></div>
      <div class="workflow-option" onclick="moveToStage('Medicare AB Primary')"><div class="option-label">Original Medicare (Part A/B)</div><div class="option-desc">Use Section II — Medicare Part A and B Carrier Codes</div></div>`;
  } else if (stage === 'Commercial Primary' || stage === 'Medicare Advantage Primary' || stage === 'Medicare AB Primary') {
    html += `<div class="success">✓ Payer type identified: ${stage}</div><div class="alert">⚡ Step 3: Find Correct Carrier Code</div><div class="option-desc" style="margin-bottom:12px;">Look up the carrier code in REF-MassHealth sheet.</div><button class="btn btn-primary" onclick="moveToStage('Code Found')">✓ Carrier Code Found</button><button class="btn btn-secondary" onclick="moveToStage('Code Not Found')">❌ Code Not Listed</button>`;
  } else if (stage === 'Code Not Found') {
    html += `<div class="alert">⚠️ Carrier code not in listing — complete Third Party Carrier Code Request form on MassHealth website.</div><button class="btn btn-secondary" onclick="moveToStage('Escalated')">→ Escalate — Code Request Submitted</button>`;
  } else if (stage === 'Code Found') {
    html += `<div class="success">✓ Carrier code found</div><div class="alert">⚡ Step 4: Update Claim on MassHealth Portal</div><button class="btn btn-primary" onclick="moveToStage('Claim Updated')">✓ Claim Updated on Portal</button>`;
  } else if (stage === 'Claim Updated') {
    html += `<div class="success">✓ Claim updated on portal</div><div class="alert">⚡ Step 5: Monitor for Payment</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Paid — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('EVS Checked')">❌ Still Rejected — Verify Code Again</button>`;
  } else if (stage === 'Escalated') {
    html += `<div class="alert">⚠️ Carrier code request submitted — monitor</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Resolved</button>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildCredentialingWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">✅ Credentialing / Contracting</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Confirm Status',  stages: ['New', 'Category Selected'] },
    { label: 'Escalate',        stages: ['Status Confirmed'] },
    { label: 'Track Progress',  stages: ['Sent to Credentialing'] },
    { label: 'Resubmit',        stages: ['Credentialed'] },
    { label: 'Monitor',         stages: ['Resubmitted'] },
    { label: 'Resolved',        stages: ['Escalated'] }
  ];
  html += buildProgressBar(steps, stage);
  if (stage === 'New') {
    html += `<div class="info">📋 <strong>Reason:</strong> ${issue.denialCategory}</div><div class="alert">⚡ Step 1: Confirm Provider Credentialing Status</div><button class="btn btn-primary" onclick="moveToStage('Status Confirmed')">✓ Status Confirmed</button>`;
  } else if (stage === 'Status Confirmed') {
    html += `<div class="success">✓ Status confirmed</div><div class="alert">⚡ Step 2: Escalate to Credentialing Team</div><button class="btn btn-primary" onclick="moveToStage('Sent to Credentialing')">→ Sent to Credentialing Team</button>`;
  } else if (stage === 'Sent to Credentialing') {
    html += `<div class="success">✓ Sent to credentialing team</div><div class="alert">⚡ Step 3: Track Credentialing Progress</div><button class="btn btn-primary" onclick="moveToStage('Credentialed')">✓ Provider Now Credentialed</button><button class="btn btn-secondary" onclick="moveToStage('Escalated')">⚠️ No Progress — Escalate</button>`;
  } else if (stage === 'Credentialed') {
    html += `<div class="success">✓ Provider credentialed</div><div class="alert">⚡ Step 4: Resubmit Claim</div><button class="btn btn-primary" onclick="moveToStage('Resubmitted')">📤 Claim Resubmitted</button>`;
  } else if (stage === 'Resubmitted') {
    html += `<div class="success">✓ Claim resubmitted</div><div class="alert">⚡ Monitor for Payment</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Paid — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('Escalated')">❌ Denied — Review Network Status</button>`;
  } else if (stage === 'Escalated') {
    html += `<div class="alert">⚠️ Escalated</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Resolved</button>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildProgrammingWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">⚙️ Programming Error</div>';
  var stage = issue.workflowStage;
  var steps = [
    { label: 'Document Error',       stages: ['New', 'Category Selected'] },
    { label: 'Escalate',             stages: ['Error Documented'] },
    { label: 'Confirm Fix',          stages: ['Sent to Programming'] },
    { label: 'Resubmit',             stages: ['Fix Confirmed'] },
    { label: 'Monitor',              stages: ['Resubmitted'] },
    { label: 'Resolved',             stages: ['Escalated'] }
  ];
  html += buildProgressBar(steps, stage);
  if (stage === 'New') {
    html += `<div class="info">📋 <strong>Reason:</strong> ${issue.denialCategory}</div><div class="alert">⚡ Step 1: Document Error Details</div><div class="option-desc" style="margin-bottom:12px;">Use the Activity Log below to document exactly what the error is, which claims are affected, and any batch/system details.</div><button class="btn btn-primary" onclick="moveToStage('Error Documented')">✓ Error Documented</button>`;
  } else if (stage === 'Error Documented') {
    html += `<div class="success">✓ Error documented</div><div class="alert">⚡ Step 2: Escalate to Programming Team</div><button class="btn btn-primary" onclick="moveToStage('Sent to Programming')">→ Sent to Programming</button>`;
  } else if (stage === 'Sent to Programming') {
    html += `<div class="success">✓ Sent to programming team</div><div class="alert">⚡ Step 3: Confirm Fix Applied</div><button class="btn btn-primary" onclick="moveToStage('Fix Confirmed')">✓ Fix Confirmed</button><button class="btn btn-secondary" onclick="moveToStage('Escalated')">⚠️ No Response — Re-escalate</button>`;
  } else if (stage === 'Fix Confirmed') {
    html += `<div class="success">✓ Fix confirmed</div><div class="alert">⚡ Step 4: Resubmit Affected Claims</div><button class="btn btn-primary" onclick="moveToStage('Resubmitted')">📤 Claims Resubmitted</button>`;
  } else if (stage === 'Resubmitted') {
    html += `<div class="success">✓ Claims resubmitted</div><div class="alert">⚡ Monitor for Payment</div><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Paid — Mark Resolved</button><button class="btn btn-secondary" onclick="moveToStage('Sent to Programming')">❌ Still Failing — Re-escalate</button>`;
  } else if (stage === 'Escalated') {
    html += `<div class="alert">⚠️ Re-escalated to programming</div><button class="btn btn-primary" onclick="moveToStage('Sent to Programming')">🔄 Back to Programming</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Resolved</button>`;
  } else {
    html += `<div class="info">Use the Activity Log below to document progress.</div><button class="btn btn-primary" onclick="moveToStage('New')">🔄 Restart Workflow</button><button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  }
  html += '</div>';
  return html;
}

function buildGenericWorkflow(issue, color) {
  var html = '<div class="card"><div class="section-title">📋 General Workflow</div>';
  html += `<div class="info">No specific workflow found for this claim. Use the Activity Log below to document progress.</div>
    <button class="btn btn-primary" onclick="moveToStage('In Progress')">▶ Start Working</button>
    <button class="btn btn-primary" style="background:#10b981;" onclick="markResolved()">✅ Mark Resolved</button>`;
  html += '</div>';
  return html;
}