/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.5                              ║
 * ║                  CWE-CARC-Workflows.gs                                ║
 * ║  PURPOSE: CARC-specific decision tree workflows                       ║
 * ║           50 custom trees + 14 pattern templates                      ║
 * ║           Ordered by frequency in multi-specialty outpatient billing  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════
// CARC ROUTER — Entry point from CWE-Dashboard.gs buildWorkflowHTMLDark()
// ═══════════════════════════════════════════════════════════════════════

/**
 * Routes a claim to the correct CARC-specific workflow.
 * Called when issue.carcCode is present.
 * Falls back to pattern-based workflow if no custom tree exists.
 */
function buildCARCWorkflow(issue, color) {
  var code = (issue.carcCode || '').toString().trim().toUpperCase();
  var group = (issue.carcGroupCode || '').toString().trim().toUpperCase();
  var key = group + '-' + code;

  // ── Institutional code guard ─────────────────────────────────────────
  var institutionalCodes = ['69','70','74','75','76','78','135','190','232','A5','A6','A8'];
  if (institutionalCodes.indexOf(code) > -1) {
    return buildCARCNotApplicable(issue, code);
  }

  // ── 50 Custom Decision Trees ─────────────────────────────────────────
  switch(key) {
    case 'CO-45':  return buildCARC_CO45(issue, color);
    case 'CO-29':  return buildCARC_CO29(issue, color);
    case 'PI-97':  return buildCARC_PI97(issue, color);
    case 'CO-50':  return buildCARC_CO50(issue, color);
    case 'CO-16':  return buildCARC_CO16(issue, color);
    case 'PR-1':   return buildCARC_PR1(issue, color);
    case 'PR-2':   return buildCARC_PR2(issue, color);
    case 'PR-3':   return buildCARC_PR3(issue, color);
    case 'PI-197': return buildCARC_PI197(issue, color);
    case 'OA-18':  return buildCARC_OA18(issue, color);
    case 'CO-22':  return buildCARC_CO22(issue, color);
    case 'PR-31':  return buildCARC_PR31(issue, color);
    case 'CO-96':  return buildCARC_CO96(issue, color);
    case 'OA-59':  return buildCARC_OA59(issue, color);
    case 'CO-4':   return buildCARC_CO4(issue, color);
    case 'PI-150': return buildCARC_PI150(issue, color);
    case 'CO-185': return buildCARC_CO185(issue, color);
    case 'PR-27':  return buildCARC_PR27(issue, color);
    case 'PI-198': return buildCARC_PI198(issue, color);
    case 'CO-167': return buildCARC_CO167(issue, color);
    case 'OA-A1':  return buildCARC_OAA1(issue, color);
    case 'OA-11':  return buildCARC_OA11(issue, color);
    case 'PI-151': return buildCARC_PI151(issue, color);
    case 'CR-129': return buildCARC_CR129(issue, color);
    case 'CO-170': return buildCARC_CO170(issue, color);
    case 'OA-109': return buildCARC_OA109(issue, color);
    case 'PR-26':  return buildCARC_PR26(issue, color);
    case 'CO-49':  return buildCARC_CO49(issue, color);
    case 'CO-55':  return buildCARC_CO55(issue, color);
    case 'CO-58':  return buildCARC_CO58(issue, color);
    case 'OA-4':   return buildCARC_CO4(issue, color);   // Same logic as CO-4
    case 'OA-5':   return buildCARC_OA5(issue, color);
    case 'CO-119': return buildCARC_CO119(issue, color);
    case 'PR-35':  return buildCARC_PR35(issue, color);
    case 'CO-183': return buildCARC_CO183(issue, color);
    case 'CO-184': return buildCARC_CO184(issue, color);
    case 'OA-B12': return buildCARC_OAB12(issue, color);
    case 'CO-B16': return buildCARC_COB16(issue, color);
    case 'OA-B13': return buildCARC_OAB13(issue, color);
    case 'CO-236': return buildCARC_CO236(issue, color);
    case 'CO-231': return buildCARC_CO231(issue, color);
    case 'OA-40':  return buildCARC_OA40(issue, color);
    case 'CO-242': return buildCARC_CO242(issue, color);
    case 'CO-243': return buildCARC_CO243(issue, color);
    case 'PI-112': return buildCARC_PI112(issue, color);
    case 'CO-146': return buildCARC_CO146(issue, color);
    case 'PR-204': return buildCARC_PR204(issue, color);
    case 'CO-252': return buildCARC_CO252(issue, color);
    case 'OA-95':  return buildCARC_OA95(issue, color);
    default:       return buildCARCPatternWorkflow(issue, color);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SHARED HELPER — Decision node builder
// ═══════════════════════════════════════════════════════════════════════

function carcHeader(code, group, title, desc) {
  return '<div class="card">' +
    '<div class="section-title">' + title + '</div>' +
    '<div class="callout info" style="margin-bottom:12px;">' +
      '<span class="callout-icon">🔖</span>' +
      '<div><strong>' + group + '-' + code + '</strong> — ' + desc + '</div>' +
    '</div>';
}

function carcQuestion(q) {
  return '<div class="callout warn"><span class="callout-icon">❓</span><div><strong>' + q + '</strong></div></div>';
}

function carcStep(num, text) {
  return '<div class="callout action"><span class="callout-icon">' + num + '</span><div>' + text + '</div></div>';
}

function carcSuccess(text) {
  return '<div class="callout success"><span class="callout-icon">✅</span><div>' + text + '</div></div>';
}

function carcDanger(text) {
  return '<div class="callout danger"><span class="callout-icon">⛔</span><div>' + text + '</div></div>';
}

function carcLink(url, label) {
  return '<a href="' + url + '" target="_blank" style="color:var(--accent);font-size:12px;">🔗 ' + label + '</a>';
}

function carcYesNo(yesLabel, yesAction, noLabel, noAction) {
  return '<div style="display:flex;gap:8px;margin-top:10px;">' +
    '<button class="wf-btn wf-btn-primary" style="flex:1;" onclick="' + yesAction + '">✅ ' + yesLabel + '</button>' +
    '<button class="wf-btn wf-btn-secondary" style="flex:1;" onclick="' + noAction + '">❌ ' + noLabel + '</button>' +
    '</div>';
}

// ═══════════════════════════════════════════════════════════════════════
// TOP 50 CUSTOM CARC DECISION TREES
// ═══════════════════════════════════════════════════════════════════════

// ── #1 CO-45 — Exceeds Fee Schedule ─────────────────────────────────
function buildCARC_CO45(issue, color) {
  var html = carcHeader('45', 'CO', '💰 CO-45 — Exceeds Fee Schedule', 'Charge exceeds fee schedule/maximum allowable or contracted fee');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Is this a contracted payer?');
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Check REF-Payers to confirm contracted status. If contracted, the payer must pay per contract rate.</div></div>';
    html += carcYesNo('Yes — Contracted', "moveToStage('CO45-Contracted')", 'No — Non-Contracted', "moveToStage('CO45-NonContracted')");
  } else if (stage === 'CO45-Contracted') {
    html += carcSuccess('Contracted payer identified');
    html += carcQuestion('Is the payment below the contracted rate?');
    html += carcStep('1️⃣', 'Pull the contracted fee schedule for this payer and CPT code. Compare contracted rate to amount paid.');
    html += carcYesNo('Yes — Underpaid', "moveToStage('CO45-Dispute')", 'No — Payment is Correct', "moveToStage('CO45-Correct')");
  } else if (stage === 'CO45-Dispute') {
    html += carcSuccess('Underpayment confirmed');
    html += carcStep('1️⃣', 'Document the contracted rate vs. amount paid.');
    html += carcStep('2️⃣', 'Submit a payment dispute/reconsideration with the contract rate and supporting fee schedule.');
    html += carcStep('3️⃣', 'If payer does not correct, escalate to billing manager for contract dispute.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Dispute Filed</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO45-NonContracted') {
    html += carcStep('1️⃣', 'Verify patient benefits for out-of-network services.');
    html += carcStep('2️⃣', 'Bill patient for the balance per OON benefit structure.');
    html += carcStep('3️⃣', 'If balance billing is prohibited (e.g. No Surprises Act), write off the balance.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved / Write Off</button>';
  } else if (stage === 'CO45-Correct') {
    html += carcSuccess('Payment is correct per fee schedule. No further action needed.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Close Claim</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #2 CO-29 — Timely Filing ─────────────────────────────────────────
function buildCARC_CO29(issue, color) {
  var html = carcHeader('29', 'CO', '⏱️ CO-29 — Timely Filing Expired', 'The time limit for filing has expired');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Do you have proof of timely filing?');
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Acceptable proof: clearinghouse acceptance report, payer portal confirmation with timestamp, certified mail receipt, or prior EOB showing claim was received.</div></div>';
    html += carcYesNo('Yes — Have Proof', "moveToStage('CO29-HaveProof')", 'No — No Proof', "moveToStage('CO29-NoProof')");
  } else if (stage === 'CO29-HaveProof') {
    html += carcSuccess('Proof of timely filing available');
    html += carcStep('1️⃣', 'Gather clearinghouse acceptance report or portal confirmation showing original submission date.');
    html += carcStep('2️⃣', 'Submit a timely filing appeal to the payer with proof attached.');
    html += carcStep('3️⃣', 'Follow up in 30 days if no response.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO29-NoProof') {
    html += carcQuestion('Was the timely filing caused by a payer or system error?');
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Examples: Payer portal was down, payer rejected claim incorrectly, EDI clearinghouse failure. Document with screenshots or system logs.</div></div>';
    html += carcYesNo('Yes — Payer/System Error', "moveToStage('CO29-Exception')", 'No — No Exception', "moveToStage('CO29-WriteOff')");
  } else if (stage === 'CO29-Exception') {
    html += carcSuccess('Timely filing exception identified');
    html += carcStep('1️⃣', 'Document the exception: payer error, system outage, or EDI failure.');
    html += carcStep('2️⃣', 'Submit appeal with exception documentation and any available evidence.');
    html += carcStep('3️⃣', 'Escalate to billing manager if appeal is denied.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Exception Appeal Filed</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO29-WriteOff') {
    html += carcDanger('No proof of timely filing. No exception identified. This claim cannot be recovered.');
    html += carcStep('⚠️', 'Document the write-off reason in the Activity Log. Notify billing manager. Review internal processes to prevent future timely filing denials.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #3 PI-97 — Bundled Service ───────────────────────────────────────
function buildCARC_PI97(issue, color) {
  var html = carcHeader('97', 'PI', '📦 PI-97 — Bundled Service', 'Benefit for this service is included in payment for another service already adjudicated');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Is the bundling due to an NCCI edit or payer-specific policy?');
    html += '<div class="callout info"><span class="callout-icon">🔗</span><div>Check NCCI edit tables to determine if a modifier override is allowed. ' + carcLink('https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits/medicare-ncci-procedure-procedure-edits', 'CMS NCCI Edit Tables') + '</div></div>';
    html += carcYesNo('NCCI Edit', "moveToStage('PI97-NCCI')", 'Payer Policy', "moveToStage('PI97-PayerPolicy')");
  } else if (stage === 'PI97-NCCI') {
    html += carcQuestion('Does the NCCI table allow a modifier override for this code pair?');
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Column 1 edits (indicator 0) = modifier NOT allowed. Column 2 edits (indicator 1) = modifier MAY be used if services are distinct.</div></div>';
    html += carcYesNo('Yes — Modifier Allowed', "moveToStage('PI97-AddModifier')", 'No — Modifier Not Allowed', "moveToStage('PI97-WriteOff')");
  } else if (stage === 'PI97-AddModifier') {
    html += carcSuccess('Modifier override is allowed');
    html += carcStep('1️⃣', 'Verify the services were truly distinct and separate (different site, different session, or different procedure).');
    html += carcStep('2️⃣', 'Add appropriate modifier: 59 (distinct service), XE (separate encounter), XS (separate structure), XP (separate practitioner), or XU (unusual non-overlapping service).');
    html += carcStep('3️⃣', 'Resubmit claim as a corrected claim with modifier and documentation supporting distinct service.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected Claim Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PI97-PayerPolicy') {
    html += carcQuestion('Was the service truly distinct from the bundled service?');
    html += carcStep('1️⃣', 'Review payer\'s bundling policy for these codes.');
    html += carcYesNo('Yes — Distinct Service', "moveToStage('PI97-Appeal')", 'No — Correctly Bundled', "moveToStage('PI97-WriteOff')");
  } else if (stage === 'PI97-Appeal') {
    html += carcSuccess('Distinct service confirmed');
    html += carcStep('1️⃣', 'Gather documentation supporting that services were distinct (separate notes, different anatomy, separate time).');
    html += carcStep('2️⃣', 'Submit appeal with clinical documentation and coding rationale.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PI97-WriteOff') {
    html += carcDanger('Service cannot be unbundled. No modifier override available.');
    html += carcStep('⚠️', 'Write off the bundled service. Document in Activity Log. Review coding practices to prevent future bundling denials.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #4 CO-50 — Medical Necessity ─────────────────────────────────────
function buildCARC_CO50(issue, color) {
  var html = carcHeader('50', 'CO', '🏥 CO-50 — Medical Necessity', 'Not deemed medically necessary by the payer');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Does the documentation support medical necessity for this service?');
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Review: physician notes, diagnosis codes, LCD/NCD criteria, and prior auth if required. Check CMS LCD: ' + carcLink('https://www.cms.gov/medicare-coverage-database/', 'CMS Coverage Database') + '</div></div>';
    html += carcYesNo('Yes — Docs Support', "moveToStage('CO50-Appeal')", 'No — Docs Insufficient', "moveToStage('CO50-WeakDocs')");
  } else if (stage === 'CO50-Appeal') {
    html += carcSuccess('Documentation supports medical necessity');
    html += carcStep('1️⃣', 'Compile: physician encounter notes, relevant diagnosis codes, test results, and prior treatment history.');
    html += carcStep('2️⃣', 'Reference the applicable LCD/NCD coverage criteria in your appeal letter.');
    html += carcStep('3️⃣', 'Submit appeal with complete clinical documentation.');
    html += carcStep('4️⃣', 'Request peer-to-peer review with the payer medical director if first-level appeal is denied.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO50-WeakDocs') {
    html += carcQuestion('Was an ABN (Advance Beneficiary Notice) signed by the patient?');
    html += carcYesNo('Yes — ABN Signed', "moveToStage('CO50-BillPatient')", 'No — No ABN', "moveToStage('CO50-WriteOff')");
  } else if (stage === 'CO50-BillPatient') {
    html += carcSuccess('ABN on file');
    html += carcStep('1️⃣', 'Bill patient for the non-covered service per the signed ABN.');
    html += carcStep('2️⃣', 'Document ABN in Activity Log with date signed.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else if (stage === 'CO50-WriteOff') {
    html += carcDanger('No ABN on file. Service cannot be billed to patient. Must write off.');
    html += carcStep('⚠️', 'Write off the balance. Notify provider to obtain ABN for future non-covered services. Document in Activity Log.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #5 CO-16 — Missing Information ───────────────────────────────────
function buildCARC_CO16(issue, color) {
  var html = carcHeader('16', 'CO', '📋 CO-16 — Missing/Incomplete Information', 'Claim/service lacks information or has submission/billing error(s)');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Always check the RARC code(s) on the EOB — they will identify the specific missing information. Common causes: missing modifier, incorrect POS, facility address missing, invalid date span.</div></div>';
    html += carcQuestion('Have you identified what specific information is missing (via RARC)?');
    html += carcYesNo('Yes — Issue Identified', "moveToStage('CO16-Fix')", 'No — Need More Info', "moveToStage('CO16-Research')");
  } else if (stage === 'CO16-Research') {
    html += carcStep('1️⃣', 'Call the payer to identify the exact missing information.');
    html += carcStep('2️⃣', 'Document what the payer says is missing in the Activity Log.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'CO16-Fix\')">✓ Issue Identified</button>';
  } else if (stage === 'CO16-Fix') {
    html += carcSuccess('Missing information identified');
    html += carcStep('1️⃣', 'Correct the identified issue on the claim (modifier, POS, address, date, NPI, etc.).');
    html += carcStep('2️⃣', 'Resubmit as a corrected claim with all required information.');
    html += carcStep('3️⃣', 'Document the correction in the Activity Log.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected Claim Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #6 PR-1 — Deductible ─────────────────────────────────────────────
function buildCARC_PR1(issue, color) {
  var html = carcHeader('1', 'PR', '💵 PR-1 — Deductible Amount', 'Patient deductible applies to this service');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Does the patient have a secondary insurance?');
    html += carcYesNo('Yes — Has Secondary', "moveToStage('PR1-Secondary')", 'No — Bill Patient', "moveToStage('PR1-BillPatient')");
  } else if (stage === 'PR1-Secondary') {
    html += carcStep('1️⃣', 'Submit claim to secondary insurance with primary EOB attached.');
    html += carcStep('2️⃣', 'Secondary may cover all or part of the deductible amount.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Submitted to Secondary</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PR1-BillPatient') {
    html += carcStep('1️⃣', 'Bill patient for deductible amount per EOB.');
    html += carcStep('2️⃣', 'Send patient statement with explanation.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #7 PR-2 — Coinsurance ─────────────────────────────────────────────
function buildCARC_PR2(issue, color) {
  var html = carcHeader('2', 'PR', '💵 PR-2 — Coinsurance Amount', 'Patient coinsurance applies to this service');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Does the patient have a secondary insurance?');
    html += carcYesNo('Yes — Has Secondary', "moveToStage('PR2-Secondary')", 'No — Bill Patient', "moveToStage('PR2-BillPatient')");
  } else if (stage === 'PR2-Secondary') {
    html += carcStep('1️⃣', 'Submit claim to secondary insurance with primary EOB attached.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Submitted to Secondary</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PR2-BillPatient') {
    html += carcStep('1️⃣', 'Bill patient for coinsurance amount per EOB.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #8 PR-3 — Copayment ───────────────────────────────────────────────
function buildCARC_PR3(issue, color) {
  var html = carcHeader('3', 'PR', '💵 PR-3 — Copayment Amount', 'Patient copayment applies to this service');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Copays should typically be collected at time of service. Verify if copay was collected by the front desk.</div></div>';
    html += carcQuestion('Was the copay collected at time of service?');
    html += carcYesNo('Yes — Collected', "moveToStage('PR3-Collected')", 'No — Not Collected', "moveToStage('PR3-BillPatient')");
  } else if (stage === 'PR3-Collected') {
    html += carcSuccess('Copay was collected at time of service');
    html += carcStep('1️⃣', 'Post the copay payment in the billing system.');
    html += carcStep('2️⃣', 'Close the patient balance.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Posted & Close</button>';
  } else if (stage === 'PR3-BillPatient') {
    html += carcStep('1️⃣', 'Bill patient for copay amount.');
    html += carcStep('2️⃣', 'Notify front desk to collect copay at future visits.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #9 PI-197 — Authorization Absent ─────────────────────────────────
function buildCARC_PI197(issue, color) {
  var html = carcHeader('197', 'PI', '🔒 PI-197 — Authorization Absent', 'Precertification/authorization not obtained prior to service');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Was an authorization actually obtained before the service?');
    html += carcYesNo('Yes — Auth Was Obtained', "moveToStage('PI197-HaveAuth')", 'No — No Auth Obtained', "moveToStage('PI197-NoAuth')");
  } else if (stage === 'PI197-HaveAuth') {
    html += carcSuccess('Authorization was obtained');
    html += carcStep('1️⃣', 'Locate the authorization number and approval documentation.');
    html += carcStep('2️⃣', 'Call payer to reopen the claim and provide the authorization number.');
    html += carcStep('3️⃣', 'Or resubmit claim with authorization number in the appropriate field.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Resubmitted with Auth</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PI197-NoAuth') {
    html += carcQuestion('Is retroactive authorization available from this payer?');
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Some payers allow retro-auth for emergency or urgent care situations. Call the payer\'s authorization line to inquire.</div></div>';
    html += carcYesNo('Yes — Retro Auth Available', "moveToStage('PI197-RetroAuth')", 'No — No Retro Auth', "moveToStage('PI197-WriteOff')");
  } else if (stage === 'PI197-RetroAuth') {
    html += carcStep('1️⃣', 'Call payer to request retroactive authorization.');
    html += carcStep('2️⃣', 'Provide clinical justification for the service.');
    html += carcStep('3️⃣', 'Once retro auth is approved, resubmit claim with authorization number.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📞 Retro Auth Requested</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PI197-WriteOff') {
    html += carcDanger('No authorization obtained. Retro auth not available. Claim cannot be recovered.');
    html += carcStep('⚠️', 'Write off the balance. Notify provider and staff of authorization requirement. Review auth process to prevent future occurrences.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #10 OA-18 — Duplicate Claim ───────────────────────────────────────
function buildCARC_OA18(issue, color) {
  var html = carcHeader('18', 'OA', '🔁 OA-18 — Duplicate Claim', 'Exact duplicate claim/service');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Was this claim previously processed?');
    html += carcYesNo('Yes — Previously Processed', "moveToStage('OA18-CheckStatus')", 'No — Submitted Once', "moveToStage('OA18-InError')");
  } else if (stage === 'OA18-CheckStatus') {
    html += carcQuestion('What was the outcome of the previously processed claim?');
    html += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">' +
      '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'OA18-PaidBefore\')">💰 Previously Paid</button>' +
      '<button class="wf-btn wf-btn-secondary" onclick="moveToStage(\'OA18-DeniedBefore\')">❌ Previously Denied</button>' +
      '</div>';
  } else if (stage === 'OA18-PaidBefore') {
    html += carcSuccess('Claim was previously paid');
    html += carcStep('1️⃣', 'Verify payment was posted correctly in billing system.');
    html += carcStep('2️⃣', 'Close this duplicate as no further action needed.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Verified & Close</button>';
  } else if (stage === 'OA18-DeniedBefore') {
    html += carcStep('1️⃣', 'Identify the denial reason on the original claim.');
    html += carcStep('2️⃣', 'Work the original denial reason — do not resubmit as duplicate again.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">🔄 Working Original Denial</button>';
  } else if (stage === 'OA18-InError') {
    html += carcSuccess('Claim was submitted only once — duplicate denial is in error');
    html += carcStep('1️⃣', 'Call payer to reopen the claim.');
    html += carcStep('2️⃣', 'Provide original claim submission date and confirmation number.');
    html += carcStep('3️⃣', 'Request claim be processed as the only submission.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📞 Called Payer to Reopen</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #11 CO-22 — Coordination of Benefits ─────────────────────────────
function buildCARC_CO22(issue, color) {
  var html = carcHeader('22', 'CO', '🔄 CO-22 — Coordination of Benefits', 'This care may be covered by another payer per COB');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Do you know which insurance should be primary?');
    html += carcYesNo('Yes — Know Primary', "moveToStage('CO22-KnowPrimary')", 'No — Need to Determine', "moveToStage('CO22-Research')");
  } else if (stage === 'CO22-Research') {
    html += carcStep('1️⃣', 'Check eligibility portal for all active insurances on the account.');
    html += carcStep('2️⃣', 'Verify COB order using the Birthday Rule or Medicare Secondary Payer rules.');
    html += carcStep('3️⃣', 'Contact patient if COB information cannot be confirmed from portals.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'CO22-KnowPrimary\')">✓ Primary Identified</button>';
  } else if (stage === 'CO22-KnowPrimary') {
    html += carcSuccess('Primary insurance identified');
    html += carcStep('1️⃣', 'Submit claim to correct primary payer if not yet done.');
    html += carcStep('2️⃣', 'Once primary pays, submit to secondary with primary EOB if applicable.');
    html += carcStep('3️⃣', 'Update COB information in billing system for future claims.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Submitted to Correct Payer</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #12 PR-31 — Patient Not Identified ───────────────────────────────
function buildCARC_PR31(issue, color) {
  var html = carcHeader('31', 'PR', '🪪 PR-31 — Patient Not Identified', 'Patient cannot be identified as our insured');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Check eligibility portal using patient date of birth and name variations.');
    html += carcStep('2️⃣', 'Verify Member ID, subscriber name, and date of birth on the claim match what is on file with payer.');
    html += carcQuestion('Was an eligibility error found?');
    html += carcYesNo('Yes — Found Error', "moveToStage('PR31-FixAndResubmit')", 'No — Appears Correct', "moveToStage('PR31-CallPayer')");
  } else if (stage === 'PR31-FixAndResubmit') {
    html += carcStep('1️⃣', 'Correct the patient demographic information (Member ID, name, DOB).');
    html += carcStep('2️⃣', 'Resubmit as a new claim with corrected information.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PR31-CallPayer') {
    html += carcStep('1️⃣', 'Call payer to verify what information they have on file for this patient.');
    html += carcStep('2️⃣', 'Update claim with correct information as provided by payer.');
    html += carcStep('3️⃣', 'Resubmit as a new claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📞 Called Payer / Working</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #13 CO-96 — Non-Covered Charge ───────────────────────────────────
function buildCARC_CO96(issue, color) {
  var html = carcHeader('96', 'CO', '🚫 CO-96 — Non-Covered Charge', 'Non-covered charge(s) — service not a benefit of the plan');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Check RARC for the specific reason. Verify payer\'s benefit plan for this service. CO-96 is a broad denial — the RARC will tell you the real reason.</div></div>';
    html += carcQuestion('Is the denial for a covered service that should be payable?');
    html += carcYesNo('Yes — Should Be Covered', "moveToStage('CO96-Appeal')", 'No — Confirmed Non-Covered', "moveToStage('CO96-PatientBill')");
  } else if (stage === 'CO96-Appeal') {
    html += carcStep('1️⃣', 'Review payer\'s benefit plan and policy for this specific service.');
    html += carcStep('2️⃣', 'Gather documentation: clinical notes, diagnosis, medical necessity.');
    html += carcStep('3️⃣', 'Submit appeal arguing the service is a covered benefit with supporting documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO96-PatientBill') {
    html += carcQuestion('Was an ABN signed by the patient prior to service?');
    html += carcYesNo('Yes — ABN Signed', "moveToStage('CO96-BillPatient')", 'No — No ABN', "moveToStage('CO96-WriteOff')");
  } else if (stage === 'CO96-BillPatient') {
    html += carcStep('1️⃣', 'Bill patient for non-covered service per signed ABN.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else if (stage === 'CO96-WriteOff') {
    html += carcDanger('Non-covered service with no ABN. Cannot bill patient. Write off required.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #14 OA-59 — Multiple Procedure Reduction ─────────────────────────
function buildCARC_OA59(issue, color) {
  var html = carcHeader('59', 'OA', '✂️ OA-59 — Multiple Procedure Reduction', 'Processed based on multiple or concurrent procedure rules');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Multiple procedure reductions are often contractual and expected. Verify the payment is correct before taking action. Check NCCI: ' + carcLink('https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits', 'CMS NCCI Edits') + '</div></div>';
    html += carcQuestion('Is the multiple procedure reduction correct per contract or Medicare guidelines?');
    html += carcYesNo('Yes — Reduction is Correct', "moveToStage('OA59-Correct')", 'No — Reduction is Wrong', "moveToStage('OA59-Dispute')");
  } else if (stage === 'OA59-Correct') {
    html += carcSuccess('Multiple procedure reduction is correct. No action needed.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Close Claim</button>';
  } else if (stage === 'OA59-Dispute') {
    html += carcQuestion('Were the procedures performed in separate sessions or anatomical sites?');
    html += carcYesNo('Yes — Distinct Procedures', "moveToStage('OA59-Appeal')", 'No — Same Session', "moveToStage('OA59-Correct')");
  } else if (stage === 'OA59-Appeal') {
    html += carcStep('1️⃣', 'Document that procedures were distinct (separate notes for each, separate anatomy).');
    html += carcStep('2️⃣', 'Add modifier 59 or X-modifier (XE, XS, XP, XU) to the secondary procedure.');
    html += carcStep('3️⃣', 'Resubmit as corrected claim with modifier and supporting documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #15 CO-4 / OA-4 — Modifier Inconsistent ──────────────────────────
function buildCARC_CO4(issue, color) {
  var group = issue.carcGroupCode || 'CO';
  var html = carcHeader('4', group, '🔧 ' + group + '-4 — Modifier Inconsistent with Procedure', 'Procedure code is inconsistent with the modifier used');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Pull the claim and identify which modifier is in question.');
    html += carcStep('2️⃣', 'Verify the modifier is valid for that CPT code per CMS or payer guidelines.');
    html += carcQuestion('Is the modifier correct for the procedure?');
    html += carcYesNo('Yes — Modifier is Correct', "moveToStage('CO4-Appeal')", 'No — Wrong Modifier', "moveToStage('CO4-Fix')");
  } else if (stage === 'CO4-Fix') {
    html += carcStep('1️⃣', 'Identify the correct modifier for the procedure.');
    html += carcStep('2️⃣', 'Correct the modifier on the claim.');
    html += carcStep('3️⃣', 'Resubmit as corrected claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO4-Appeal') {
    html += carcStep('1️⃣', 'Gather coding guidelines supporting the modifier usage (CPT manual, CMS guidelines).');
    html += carcStep('2️⃣', 'Submit appeal with documentation supporting correct modifier use.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #16 PI-150 — Documentation Doesn't Support Level of Service ───────
function buildCARC_PI150(issue, color) {
  var html = carcHeader('150', 'PI', '📄 PI-150 — Level of Service Not Supported', 'Payer deems information does not support this level of service');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Review E&M documentation guidelines. The level of service must be supported by medical decision making (MDM) or total time. Check LCD/NCD: ' + carcLink('https://www.cms.gov/medicare-coverage-database/', 'CMS Coverage Database') + '</div></div>';
    html += carcQuestion('Does the clinical documentation support the level of service billed?');
    html += carcYesNo('Yes — Documentation Supports', "moveToStage('PI150-Appeal')", 'No — Insufficient Docs', "moveToStage('PI150-Downcode')");
  } else if (stage === 'PI150-Appeal') {
    html += carcStep('1️⃣', 'Compile complete encounter documentation: history, exam, MDM or total time.');
    html += carcStep('2️⃣', 'Reference AMA E&M guidelines (2021+) or payer-specific guidelines in appeal letter.');
    html += carcStep('3️⃣', 'Submit appeal with complete clinical documentation.');
    html += carcStep('4️⃣', 'If denied again, request peer-to-peer with payer medical director.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PI150-Downcode') {
    html += carcStep('1️⃣', 'Determine the appropriate lower level of service supported by documentation.');
    html += carcStep('2️⃣', 'Resubmit as corrected claim with the supported E&M level.');
    html += carcStep('3️⃣', 'Notify provider to improve documentation for future claims.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Downcoded & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #17 CO-185 — Rendering Provider Not Eligible ──────────────────────
function buildCARC_CO185(issue, color) {
  var html = carcHeader('185', 'CO', '👤 CO-185 — Rendering Provider Not Eligible', 'The rendering provider is not eligible to perform the service billed');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Is the NPI on the claim correct?');
    html += carcYesNo('Yes — NPI is Correct', "moveToStage('CO185-CheckCred')", 'No — Wrong NPI', "moveToStage('CO185-FixNPI')");
  } else if (stage === 'CO185-FixNPI') {
    html += carcStep('1️⃣', 'Correct the NPI to the rendering provider\'s individual NPI.');
    html += carcStep('2️⃣', 'Resubmit as corrected claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO185-CheckCred') {
    html += carcQuestion('Is the provider credentialed/enrolled with this payer?');
    html += carcYesNo('Yes — Credentialed', "moveToStage('CO185-CallPayer')", 'No — Not Credentialed', "moveToStage('CO185-Credential')");
  } else if (stage === 'CO185-CallPayer') {
    html += carcStep('1️⃣', 'Call payer to verify provider enrollment status and effective date.');
    html += carcStep('2️⃣', 'Confirm PTAN/Medicare enrollment is active.');
    html += carcStep('3️⃣', 'Request claim be reprocessed if provider is confirmed enrolled.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📞 Called Payer / Working</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO185-Credential') {
    html += carcDanger('Provider is not credentialed with this payer.');
    html += carcStep('1️⃣', 'Refer to Credentialing department immediately.');
    html += carcStep('2️⃣', 'Do not resubmit until credentialing is complete.');
    html += carcStep('3️⃣', 'Once credentialed, resubmit claim — some payers allow retroactive effective dates.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📋 Sent to Credentialing</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #18 PR-27 — Coverage Terminated ──────────────────────────────────
function buildCARC_PR27(issue, color) {
  var html = carcHeader('27', 'PR', '📅 PR-27 — Coverage Terminated', 'Expenses incurred after coverage terminated');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Verify patient coverage termination date on eligibility portal.');
    html += carcQuestion('Was the DOS within the coverage period?');
    html += carcYesNo('Yes — DOS Within Coverage', "moveToStage('PR27-Appeal')", 'No — DOS After Termination', "moveToStage('PR27-FindCoverage')");
  } else if (stage === 'PR27-Appeal') {
    html += carcSuccess('DOS is within coverage period — denial is in error');
    html += carcStep('1️⃣', 'Obtain eligibility confirmation showing active coverage on DOS.');
    html += carcStep('2️⃣', 'Submit appeal with eligibility documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PR27-FindCoverage') {
    html += carcQuestion('Does the patient have other active insurance on the DOS?');
    html += carcYesNo('Yes — Other Insurance', "moveToStage('PR27-OtherIns')", 'No — No Coverage', "moveToStage('PR27-BillPatient')");
  } else if (stage === 'PR27-OtherIns') {
    html += carcStep('1️⃣', 'Identify active insurance on the date of service.');
    html += carcStep('2️⃣', 'Resubmit claim to correct payer.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Submitted to Correct Payer</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PR27-BillPatient') {
    html += carcStep('1️⃣', 'Bill patient for services rendered after coverage termination.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #19 PI-198 — Authorization Exceeded ──────────────────────────────
function buildCARC_PI198(issue, color) {
  var html = carcHeader('198', 'PI', '🔒 PI-198 — Authorization Exceeded', 'Precertification/authorization exceeded — services beyond what was approved');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Pull the authorization and verify the approved units/visits/services.');
    html += carcQuestion('Were the services billed within the authorized amount?');
    html += carcYesNo('Yes — Within Auth', "moveToStage('PI198-CallPayer')", 'No — Exceeded Auth', "moveToStage('PI198-Exceeded')");
  } else if (stage === 'PI198-CallPayer') {
    html += carcSuccess('Services are within authorization — denial may be in error');
    html += carcStep('1️⃣', 'Call payer to reopen claim and provide authorization number and approved units.');
    html += carcStep('2️⃣', 'Request claim be reprocessed with correct authorization information.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📞 Called Payer to Reopen</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PI198-Exceeded') {
    html += carcQuestion('Is additional/extended authorization available?');
    html += carcYesNo('Yes — Can Get More Auth', "moveToStage('PI198-GetAuth')", 'No — Cannot Get Auth', "moveToStage('PI198-WriteOff')");
  } else if (stage === 'PI198-GetAuth') {
    html += carcStep('1️⃣', 'Request additional authorization from payer for the exceeded services.');
    html += carcStep('2️⃣', 'Once approved, resubmit claim with new authorization number.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📞 Auth Extension Requested</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PI198-WriteOff') {
    html += carcDanger('Services exceeded authorization. No additional auth available.');
    html += carcStep('⚠️', 'Write off the non-authorized services. Notify provider and staff of auth limits. Review process for tracking authorization units.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #20 CO-167 — Diagnosis Not Covered ───────────────────────────────
function buildCARC_CO167(issue, color) {
  var html = carcHeader('167', 'CO', '🩺 CO-167 — Diagnosis Not Covered', 'This diagnosis is not covered');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Is the diagnosis code correct for the service rendered?');
    html += carcYesNo('Yes — Diagnosis is Correct', "moveToStage('CO167-CheckPolicy')", 'No — Wrong Diagnosis', "moveToStage('CO167-FixDx')");
  } else if (stage === 'CO167-FixDx') {
    html += carcStep('1️⃣', 'Review medical record to identify the correct diagnosis code.');
    html += carcStep('2️⃣', 'Correct the diagnosis code on the claim.');
    html += carcStep('3️⃣', 'Resubmit as corrected claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO167-CheckPolicy') {
    html += carcQuestion('Does the payer\'s policy exclude this diagnosis for this service?');
    html += carcYesNo('Yes — Excluded by Policy', "moveToStage('CO167-WriteOff')", 'No — Should Be Covered', "moveToStage('CO167-Appeal')");
  } else if (stage === 'CO167-Appeal') {
    html += carcStep('1️⃣', 'Review payer\'s coverage policy for the diagnosis/service combination.');
    html += carcStep('2️⃣', 'Gather clinical documentation supporting medical necessity.');
    html += carcStep('3️⃣', 'Submit appeal with documentation and policy references.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO167-WriteOff') {
    html += carcDanger('Diagnosis is excluded from coverage per payer policy.');
    html += carcStep('⚠️', 'Check if an ABN was signed. If yes, bill patient. If no ABN, write off.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off / Bill Patient</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #21 OA-A1 — General Denial ────────────────────────────────────────
function buildCARC_OAA1(issue, color) {
  var html = carcHeader('A1', 'OA', '⚠️ OA-A1 — General Denial', 'Claim/Service denied — use only when no more specific code is available');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout warn"><span class="callout-icon">⚠️</span><div>OA-A1 is a generic denial code. You MUST check the RARC code on the EOB to find the real denial reason before taking action.</div></div>';
    html += carcStep('1️⃣', 'Review the RARC code(s) on the EOB.');
    html += carcStep('2️⃣', 'Call payer if RARC is missing or unclear.');
    html += carcQuestion('Have you identified the specific denial reason from the RARC?');
    html += carcYesNo('Yes — Reason Identified', "moveToStage('OAA1-Route')", 'No — Need More Info', "moveToStage('OAA1-CallPayer')");
  } else if (stage === 'OAA1-CallPayer') {
    html += carcStep('1️⃣', 'Call payer and request specific denial reason.');
    html += carcStep('2️⃣', 'Document the reason provided in the Activity Log.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'OAA1-Route\')">✓ Reason Identified</button>';
  } else if (stage === 'OAA1-Route') {
    html += carcSuccess('Denial reason identified');
    html += carcStep('📋', 'Update the CARC code in Quick Actions to the specific code and reload the workflow for targeted guidance.');
    html += carcStep('Or', 'Work the denial based on the identified reason and document steps in the Activity Log.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">🔄 Working Denial</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #22 OA-11 — Diagnosis Inconsistent with Procedure ─────────────────
function buildCARC_OA11(issue, color) {
  var html = carcHeader('11', 'OA', '🩺 OA-11 — Diagnosis Inconsistent with Procedure', 'The diagnosis is inconsistent with the procedure');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Review the medical record to verify the diagnosis supports the procedure billed.');
    html += carcQuestion('Is the diagnosis code correct for the procedure performed?');
    html += carcYesNo('Yes — Diagnosis is Correct', "moveToStage('OA11-Appeal')", 'No — Wrong Diagnosis', "moveToStage('OA11-FixDx')");
  } else if (stage === 'OA11-FixDx') {
    html += carcStep('1️⃣', 'Identify the correct diagnosis from the medical record.');
    html += carcStep('2️⃣', 'Correct the diagnosis code and resubmit as corrected claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'OA11-Appeal') {
    html += carcStep('1️⃣', 'Gather clinical documentation supporting the diagnosis-procedure relationship.');
    html += carcStep('2️⃣', 'Reference clinical guidelines or LCD/NCD supporting the combination.');
    html += carcStep('3️⃣', 'Submit appeal with documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #23 PI-151 — Frequency Exceeded ──────────────────────────────────
function buildCARC_PI151(issue, color) {
  var html = carcHeader('151', 'PI', '🔢 PI-151 — Frequency Exceeded', 'Payer deems information does not support this many/frequency of services');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Check the LCD/NCD for allowed frequency. Some payers allow more frequent services if medical necessity is documented. ' + carcLink('https://www.cms.gov/medicare-coverage-database/', 'CMS Coverage Database') + '</div></div>';
    html += carcQuestion('Is the frequency medically justified and documented in the chart?');
    html += carcYesNo('Yes — Medically Justified', "moveToStage('PI151-Appeal')", 'No — Exceeds Guidelines', "moveToStage('PI151-WriteOff')");
  } else if (stage === 'PI151-Appeal') {
    html += carcStep('1️⃣', 'Compile documentation supporting medical necessity for additional frequency.');
    html += carcStep('2️⃣', 'Reference applicable LCD/NCD and any exceptions for the additional frequency.');
    html += carcStep('3️⃣', 'Submit appeal with clinical documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PI151-WriteOff') {
    html += carcDanger('Frequency exceeds guidelines and is not medically justified.');
    html += carcStep('⚠️', 'Write off excess services. Notify provider of frequency limitations. Review scheduling practices.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #24 CR-129 — Prior Processing Incorrect ───────────────────────────
function buildCARC_CR129(issue, color) {
  var html = carcHeader('129', 'CR', '🔄 CR-129 — Prior Processing Incorrect', 'Prior processing information appears incorrect');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>This code indicates the payer believes a prior claim was processed incorrectly. Review prior claims for this patient and service.</div></div>';
    html += carcStep('1️⃣', 'Pull all prior claims for this patient and service from the payer.');
    html += carcStep('2️⃣', 'Identify which prior claim is in question.');
    html += carcQuestion('Was the prior claim processed incorrectly?');
    html += carcYesNo('Yes — Prior Claim Wrong', "moveToStage('CR129-CorrectPrior')", 'No — Prior Claim Was Correct', "moveToStage('CR129-Appeal')");
  } else if (stage === 'CR129-CorrectPrior') {
    html += carcStep('1️⃣', 'Correct the prior claim if needed (corrected claim submission).');
    html += carcStep('2️⃣', 'Resubmit the current claim with accurate prior processing information.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CR129-Appeal') {
    html += carcStep('1️⃣', 'Document that prior claim was processed correctly with EOB evidence.');
    html += carcStep('2️⃣', 'Call payer to reopen and reprocess current claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📞 Called Payer to Reopen</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #25 CO-170 — Provider Type Not Covered ───────────────────────────
function buildCARC_CO170(issue, color) {
  var html = carcHeader('170', 'CO', '👤 CO-170 — Provider Type Not Covered', 'Payment is denied when performed/billed by this type of provider');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Is the provider type correct on the claim?');
    html += carcYesNo('Yes — Provider Type Correct', "moveToStage('CO170-CheckPolicy')", 'No — Wrong Provider Type', "moveToStage('CO170-Fix')");
  } else if (stage === 'CO170-Fix') {
    html += carcStep('1️⃣', 'Correct the provider type/specialty/taxonomy on the claim.');
    html += carcStep('2️⃣', 'Resubmit as corrected claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO170-CheckPolicy') {
    html += carcQuestion('Can the service be billed under a different eligible provider in the same group?');
    html += carcYesNo('Yes — Other Provider Available', "moveToStage('CO170-Rebill')", 'No — No Other Provider', "moveToStage('CO170-WriteOff')");
  } else if (stage === 'CO170-Rebill') {
    html += carcStep('1️⃣', 'Identify an eligible provider type in the group for this service.');
    html += carcStep('2️⃣', 'Resubmit claim under the eligible provider\'s NPI if appropriate per incident-to or supervision rules.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Rebilled Under Eligible Provider</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO170-WriteOff') {
    html += carcDanger('Service is not covered for this provider type. No alternative provider available.');
    html += carcStep('⚠️', 'Write off. Notify practice of coverage limitations for this provider type.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #26 OA-109 — Wrong Payer ──────────────────────────────────────────
function buildCARC_OA109(issue, color) {
  var html = carcHeader('109', 'OA', '🏢 OA-109 — Wrong Payer', 'Claim not covered by this payer/contractor — send to correct payer');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Check patient eligibility on payer portals to identify active coverage.');
    html += carcStep('2️⃣', 'Determine which payer/contractor should have received this claim.');
    html += carcQuestion('Have you identified the correct payer?');
    html += carcYesNo('Yes — Found Correct Payer', "moveToStage('OA109-Resubmit')", 'No — Cannot Identify', "moveToStage('OA109-CallPayer')");
  } else if (stage === 'OA109-Resubmit') {
    html += carcStep('1️⃣', 'Update payer information in billing system.');
    html += carcStep('2️⃣', 'Submit claim to correct payer as a new claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Submitted to Correct Payer</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'OA109-CallPayer') {
    html += carcStep('1️⃣', 'Call the original payer for guidance on the correct payer/contractor.');
    html += carcStep('2️⃣', 'For Medicare: check ' + carcLink('https://www.cms.gov/medicare/billing/medicaremedicaidcoord', 'CMS Medicare/Medicaid Coordination') + ' for correct MAC jurisdiction.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'OA109-Resubmit\')">✓ Correct Payer Identified</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #27 PR-26 — Prior to Coverage ─────────────────────────────────────
function buildCARC_PR26(issue, color) {
  var html = carcHeader('26', 'PR', '📅 PR-26 — Prior to Coverage', 'Expenses incurred prior to coverage effective date');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Verify coverage effective date on eligibility portal.');
    html += carcQuestion('Was the DOS before the coverage effective date?');
    html += carcYesNo('Yes — Before Coverage', "moveToStage('PR26-FindCoverage')", 'No — DOS Within Coverage', "moveToStage('PR26-Appeal')");
  } else if (stage === 'PR26-Appeal') {
    html += carcSuccess('DOS is within coverage period — denial is in error');
    html += carcStep('1️⃣', 'Obtain eligibility confirmation showing coverage effective date.');
    html += carcStep('2️⃣', 'Submit appeal with eligibility documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PR26-FindCoverage') {
    html += carcQuestion('Does the patient have other active coverage on the DOS?');
    html += carcYesNo('Yes — Other Coverage', "moveToStage('PR26-OtherIns')", 'No — Uninsured on DOS', "moveToStage('PR26-BillPatient')");
  } else if (stage === 'PR26-OtherIns') {
    html += carcStep('1️⃣', 'Identify active insurance on DOS.');
    html += carcStep('2️⃣', 'Resubmit to correct payer.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Submitted to Correct Payer</button>';
  } else if (stage === 'PR26-BillPatient') {
    html += carcStep('1️⃣', 'Bill patient for services rendered before coverage began.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #28 CO-49 — Routine/Preventive Exam ──────────────────────────────
function buildCARC_CO49(issue, color) {
  var html = carcHeader('49', 'CO', '🩺 CO-49 — Routine/Preventive Exam', 'Non-covered — routine/preventive exam or screening done with routine exam');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Common cause: E&M billed on same day as preventive visit without modifier 25. Or a diagnostic service was done purely for screening without a symptom-based diagnosis.</div></div>';
    html += carcQuestion('Was a separate problem-oriented E&M performed on the same day as a preventive visit?');
    html += carcYesNo('Yes — Separate E&M', "moveToStage('CO49-AddMod25')", 'No — Preventive Only', "moveToStage('CO49-PatientBill')");
  } else if (stage === 'CO49-AddMod25') {
    html += carcStep('1️⃣', 'Add modifier 25 to the problem-oriented E&M code to indicate it was a separate, significant service.');
    html += carcStep('2️⃣', 'Ensure the E&M is supported by documentation of a separate problem addressed.');
    html += carcStep('3️⃣', 'Resubmit as corrected claim with modifier 25.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO49-PatientBill') {
    html += carcQuestion('Was an ABN signed for the non-covered screening?');
    html += carcYesNo('Yes — ABN Signed', "moveToStage('CO49-BillPatient')", 'No — No ABN', "moveToStage('CO49-WriteOff')");
  } else if (stage === 'CO49-BillPatient') {
    html += carcStep('1️⃣', 'Bill patient for non-covered screening per ABN.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else if (stage === 'CO49-WriteOff') {
    html += carcDanger('Non-covered preventive service with no ABN. Write off required.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #29 CO-55 — Experimental/Investigational ─────────────────────────
function buildCARC_CO55(issue, color) {
  var html = carcHeader('55', 'CO', '🔬 CO-55 — Experimental/Investigational', 'Procedure/treatment/drug is deemed experimental or investigational by the payer');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Review payer\'s coverage policy for the service.');
    html += carcStep('2️⃣', 'Check FDA approval status and CMS coverage determination.');
    html += carcQuestion('Is the service FDA-approved and covered by CMS or other authoritative guideline?');
    html += carcYesNo('Yes — Has Coverage Support', "moveToStage('CO55-Appeal')", 'No — Truly Experimental', "moveToStage('CO55-WriteOff')");
  } else if (stage === 'CO55-Appeal') {
    html += carcStep('1️⃣', 'Compile: FDA approval documentation, published clinical evidence, CMS/NCD coverage determinations, and peer-reviewed literature.');
    html += carcStep('2️⃣', 'Submit appeal arguing the service meets clinical coverage criteria.');
    html += carcStep('3️⃣', 'Request peer-to-peer with payer\'s medical director.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO55-WriteOff') {
    html += carcQuestion('Was an ABN signed?');
    html += carcYesNo('Yes — ABN Signed', "moveToStage('CO55-BillPatient')", 'No — No ABN', "moveToStage('CO55-WriteOffFinal')");
  } else if (stage === 'CO55-BillPatient') {
    html += carcStep('1️⃣', 'Bill patient per signed ABN.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else if (stage === 'CO55-WriteOffFinal') {
    html += carcDanger('Experimental service with no ABN. Write off required.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #30 CO-58 — Wrong Place of Service ───────────────────────────────
function buildCARC_CO58(issue, color) {
  var html = carcHeader('58', 'CO', '📍 CO-58 — Inappropriate Place of Service', 'Treatment rendered in an inappropriate or invalid place of service');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Is the place of service code correct on the claim?');
    html += carcYesNo('Yes — POS is Correct', "moveToStage('CO58-Appeal')", 'No — Wrong POS', "moveToStage('CO58-Fix')");
  } else if (stage === 'CO58-Fix') {
    html += carcStep('1️⃣', 'Identify the correct place of service code for where the service was rendered.');
    html += carcStep('2️⃣', 'Correct the POS code on the claim and resubmit as corrected claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO58-Appeal') {
    html += carcStep('1️⃣', 'Gather documentation confirming where the service was rendered.');
    html += carcStep('2️⃣', 'Review payer policy for acceptable places of service for this procedure.');
    html += carcStep('3️⃣', 'Submit appeal with documentation supporting the place of service.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #31 OA-5 — POS Inconsistent with Procedure ────────────────────────
function buildCARC_OA5(issue, color) {
  var html = carcHeader('5', 'OA', '📍 OA-5 — POS Inconsistent with Procedure', 'Procedure code/type of bill is inconsistent with place of service');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Review the CPT code billed and the place of service code.');
    html += carcQuestion('Is the combination of CPT and POS clinically appropriate?');
    html += carcYesNo('Yes — Combination is Correct', "moveToStage('OA5-Appeal')", 'No — Coding Error', "moveToStage('OA5-Fix')");
  } else if (stage === 'OA5-Fix') {
    html += carcStep('1️⃣', 'Correct the CPT code or POS code based on where and what was rendered.');
    html += carcStep('2️⃣', 'Resubmit as corrected claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'OA5-Appeal') {
    html += carcStep('1️⃣', 'Document clinical rationale for the CPT-POS combination.');
    html += carcStep('2️⃣', 'Submit appeal with clinical documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #32 CO-119 — Benefit Maximum Reached ─────────────────────────────
function buildCARC_CO119(issue, color) {
  var html = carcHeader('119', 'CO', '🔢 CO-119 — Benefit Maximum Reached', 'Benefit maximum for this time period or occurrence has been reached');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Verify benefit maximum for the plan period on eligibility portal.');
    html += carcQuestion('Has the patient truly reached the benefit maximum?');
    html += carcYesNo('Yes — Max Reached', "moveToStage('CO119-BillPatient')", 'No — Error', "moveToStage('CO119-Appeal')");
  } else if (stage === 'CO119-Appeal') {
    html += carcStep('1️⃣', 'Obtain eligibility documentation showing remaining benefits.');
    html += carcStep('2️⃣', 'Submit appeal with benefit verification.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO119-BillPatient') {
    html += carcStep('1️⃣', 'Bill patient for services exceeding the benefit maximum.');
    html += carcStep('2️⃣', 'Notify provider to advise patients of benefit limitations before future visits.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #33 PR-35 — Lifetime Maximum Reached ─────────────────────────────
function buildCARC_PR35(issue, color) {
  var html = carcHeader('35', 'PR', '🔢 PR-35 — Lifetime Maximum Reached', 'Lifetime benefit maximum has been reached');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Note: ACA prohibited lifetime limits on essential health benefits for most plans after 2010. This may be a plan error if the service is an essential health benefit.</div></div>';
    html += carcQuestion('Is this service an ACA Essential Health Benefit (EHB)?');
    html += carcYesNo('Yes — EHB', "moveToStage('PR35-Appeal')", 'No — Non-EHB', "moveToStage('PR35-BillPatient')");
  } else if (stage === 'PR35-Appeal') {
    html += carcStep('1️⃣', 'Verify plan type (grandfathered plans may still have lifetime limits).');
    html += carcStep('2️⃣', 'If non-grandfathered plan, appeal citing ACA prohibition on lifetime limits for EHBs.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PR35-BillPatient') {
    html += carcStep('1️⃣', 'Bill patient for services exceeding the lifetime maximum.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #34 CO-183 — Referring Provider Not Eligible ──────────────────────
function buildCARC_CO183(issue, color) {
  var html = carcHeader('183', 'CO', '👤 CO-183 — Referring Provider Not Eligible', 'The referring provider is not eligible to refer the service billed');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Is the referring provider NPI correct on the claim?');
    html += carcYesNo('Yes — NPI is Correct', "moveToStage('CO183-CheckElig')", 'No — Wrong NPI', "moveToStage('CO183-FixNPI')");
  } else if (stage === 'CO183-FixNPI') {
    html += carcStep('1️⃣', 'Correct the referring provider NPI.');
    html += carcStep('2️⃣', 'Resubmit as corrected claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO183-CheckElig') {
    html += carcStep('1️⃣', 'Verify referring provider\'s enrollment and referral eligibility with the payer.');
    html += carcQuestion('Is the referring provider enrolled with this payer and eligible to refer?');
    html += carcYesNo('Yes — Is Enrolled', "moveToStage('CO183-CallPayer')", 'No — Not Enrolled', "moveToStage('CO183-WriteOff')");
  } else if (stage === 'CO183-CallPayer') {
    html += carcStep('1️⃣', 'Call payer to verify enrollment status.');
    html += carcStep('2️⃣', 'Request claim be reprocessed once enrollment is confirmed.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📞 Called Payer</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO183-WriteOff') {
    html += carcDanger('Referring provider is not eligible. Cannot recover this claim without an eligible referring provider.');
    html += carcStep('⚠️', 'Write off or obtain a new referral from an eligible provider and resubmit.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #35 CO-184 — Prescribing Provider Not Eligible ────────────────────
function buildCARC_CO184(issue, color) {
  var html = carcHeader('184', 'CO', '👤 CO-184 — Prescribing Provider Not Eligible', 'The prescribing/ordering provider is not eligible to prescribe/order the service billed');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Is the prescribing provider NPI correct on the claim?');
    html += carcYesNo('Yes — NPI Correct', "moveToStage('CO184-CheckDEA')", 'No — Wrong NPI', "moveToStage('CO184-FixNPI')");
  } else if (stage === 'CO184-FixNPI') {
    html += carcStep('1️⃣', 'Correct the prescribing/ordering provider NPI.');
    html += carcStep('2️⃣', 'Resubmit as corrected claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO184-CheckDEA') {
    html += carcStep('1️⃣', 'Verify provider\'s DEA number, license, and prescribing authority for the service.');
    html += carcQuestion('Is the provider licensed and eligible to prescribe/order this service?');
    html += carcYesNo('Yes — Is Eligible', "moveToStage('CO184-Appeal')", 'No — Not Eligible', "moveToStage('CO184-WriteOff')");
  } else if (stage === 'CO184-Appeal') {
    html += carcStep('1️⃣', 'Obtain documentation confirming prescribing eligibility (license, DEA, NPI).');
    html += carcStep('2️⃣', 'Submit appeal with eligibility documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO184-WriteOff') {
    html += carcDanger('Prescribing provider is not eligible. Cannot recover this claim.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #36 OA-B12 — Not Documented in Medical Records ────────────────────
function buildCARC_OAB12(issue, color) {
  var html = carcHeader('B12', 'OA', '📄 OA-B12 — Not Documented in Medical Records', 'Services not documented in patient\'s medical records');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Pull the complete medical record for the date of service.');
    html += carcQuestion('Is the service documented in the medical record?');
    html += carcYesNo('Yes — Documentation Exists', "moveToStage('OAB12-Submit')", 'No — Not Documented', "moveToStage('OAB12-WriteOff')");
  } else if (stage === 'OAB12-Submit') {
    html += carcStep('1️⃣', 'Compile the complete encounter documentation.');
    html += carcStep('2️⃣', 'Submit appeal with full medical record documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal with Records Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'OAB12-WriteOff') {
    html += carcDanger('Service is not documented in the medical record. Cannot appeal without documentation.');
    html += carcStep('⚠️', 'Write off. Notify provider that all services MUST be documented at time of service. This is a compliance issue.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #37 CO-B16 — New Patient Qualifications Not Met ───────────────────
function buildCARC_COB16(issue, color) {
  var html = carcHeader('B16', 'CO', '👤 CO-B16 — New Patient Qualifications Not Met', "'New Patient' qualifications were not met");
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>A new patient is one who has not received professional services from the physician or another physician of the same specialty in the same group within the past 3 years.</div></div>';
    html += carcQuestion('Has this patient been seen by any provider in the same group/specialty within the past 3 years?');
    html += carcYesNo('Yes — Seen Before', "moveToStage('COB16-Recode')", 'No — Truly New Patient', "moveToStage('COB16-Appeal')");
  } else if (stage === 'COB16-Recode') {
    html += carcStep('1️⃣', 'Recode to the appropriate established patient E&M code.');
    html += carcStep('2️⃣', 'Resubmit as corrected claim with established patient code.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Recoded & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'COB16-Appeal') {
    html += carcStep('1️⃣', 'Document that the patient has not been seen by any provider in the group within 3 years.');
    html += carcStep('2️⃣', 'Submit appeal with documentation supporting new patient status.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #38 OA-B13 — Previously Paid ─────────────────────────────────────
function buildCARC_OAB13(issue, color) {
  var html = carcHeader('B13', 'OA', '💰 OA-B13 — Previously Paid', 'Payment for this claim/service may have been provided in a previous payment');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Check billing system and payer portal for prior payment on this claim.');
    html += carcQuestion('Was this claim previously paid?');
    html += carcYesNo('Yes — Previously Paid', "moveToStage('OAB13-Verify')", 'No — Not Previously Paid', "moveToStage('OAB13-Appeal')");
  } else if (stage === 'OAB13-Verify') {
    html += carcStep('1️⃣', 'Verify the prior payment was posted correctly in the billing system.');
    html += carcStep('2️⃣', 'Ensure no duplicate payment was made.');
    html += carcStep('3️⃣', 'Close this claim as the prior payment is valid.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Verified & Close</button>';
  } else if (stage === 'OAB13-Appeal') {
    html += carcStep('1️⃣', 'Pull payment history from payer portal showing no prior payment.');
    html += carcStep('2️⃣', 'Submit appeal with payment history documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #39 CO-236 — NCCI Incompatible Procedure ─────────────────────────
function buildCARC_CO236(issue, color) {
  var html = carcHeader('236', 'CO', '🔧 CO-236 — NCCI Incompatible Procedure', 'Procedure/modifier combination not compatible with another procedure per NCCI');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">🔗</span><div>Check NCCI edit table to determine if a modifier override is allowed for this code pair. ' + carcLink('https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits/medicare-ncci-procedure-procedure-edits', 'CMS NCCI Edit Tables') + '</div></div>';
    html += carcQuestion('Does the NCCI table allow a modifier override for this code pair?');
    html += carcYesNo('Yes — Modifier Allowed', "moveToStage('CO236-AddModifier')", 'No — No Override', "moveToStage('CO236-WriteOff')");
  } else if (stage === 'CO236-AddModifier') {
    html += carcStep('1️⃣', 'Verify the services were truly distinct (separate site, session, or procedure).');
    html += carcStep('2️⃣', 'Add correct modifier: 59, XE, XS, XP, or XU.');
    html += carcStep('3️⃣', 'Resubmit as corrected claim with modifier and documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO236-WriteOff') {
    html += carcDanger('NCCI edit does not allow modifier override for this code pair.');
    html += carcStep('⚠️', 'Write off the secondary procedure. Review coding practices for this procedure combination.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #40 CO-231 — Mutually Exclusive Procedures ───────────────────────
function buildCARC_CO231(issue, color) {
  var html = carcHeader('231', 'CO', '🔧 CO-231 — Mutually Exclusive Procedures', 'Mutually exclusive procedures cannot be done in the same day/setting');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Mutually exclusive procedures are clinically impossible or inappropriate to perform together. Unlike bundled codes, modifier 59 typically does NOT override mutually exclusive edits.</div></div>';
    html += carcQuestion('Were the procedures performed on separate days?');
    html += carcYesNo('Yes — Separate Days', "moveToStage('CO231-SeparateDays')", 'No — Same Day', "moveToStage('CO231-WriteOff')");
  } else if (stage === 'CO231-SeparateDays') {
    html += carcStep('1️⃣', 'Correct the date of service on the appropriate claim line.');
    html += carcStep('2️⃣', 'Resubmit as corrected claim with accurate dates.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO231-WriteOff') {
    html += carcDanger('Mutually exclusive procedures performed same day. Cannot override with modifier.');
    html += carcStep('⚠️', 'Write off the lower-value procedure. Review coding practices with provider.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #41 OA-40 — Not Emergent/Urgent ──────────────────────────────────
function buildCARC_OA40(issue, color) {
  var html = carcHeader('40', 'OA', '🚨 OA-40 — Not Emergent/Urgent', 'Charges do not meet qualifications for emergent/urgent care');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Review the clinical documentation for the visit — specifically the chief complaint, presenting symptoms, and provider assessment.');
    html += carcQuestion('Does the documentation support an emergent or urgent presentation?');
    html += carcYesNo('Yes — Clinical Support Exists', "moveToStage('OA40-Appeal')", 'No — Non-Emergent', "moveToStage('OA40-Recode')");
  } else if (stage === 'OA40-Appeal') {
    html += carcStep('1️⃣', 'Compile clinical documentation showing the prudent layperson standard was met (patient reasonably believed it was an emergency).');
    html += carcStep('2️⃣', 'Reference applicable state prudent layperson standard law in appeal.');
    html += carcStep('3️⃣', 'Submit appeal with complete clinical documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'OA40-Recode') {
    html += carcStep('1️⃣', 'Determine if the visit qualifies as an urgent care or office visit level.');
    html += carcStep('2️⃣', 'Recode to appropriate non-emergency service and resubmit as corrected claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Recoded & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #42 CO-242 — Out of Network ───────────────────────────────────────
function buildCARC_CO242(issue, color) {
  var html = carcHeader('242', 'CO', '🏢 CO-242 — Out of Network', 'Services not provided by network/primary care providers');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Is the provider actually in-network with this plan?');
    html += carcYesNo('Yes — Is In-Network', "moveToStage('CO242-Appeal')", 'No — Out of Network', "moveToStage('CO242-OON')");
  } else if (stage === 'CO242-Appeal') {
    html += carcStep('1️⃣', 'Obtain provider\'s in-network credentialing confirmation from the payer.');
    html += carcStep('2️⃣', 'Submit appeal with in-network documentation and contract effective dates.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO242-OON') {
    html += carcQuestion('Was the OON service due to lack of in-network provider availability (No Surprises Act)?');
    html += carcYesNo('Yes — No In-Network Alternative', "moveToStage('CO242-NSA')", 'No — Patient Choice', "moveToStage('CO242-BillPatient')");
  } else if (stage === 'CO242-NSA') {
    html += carcStep('1️⃣', 'Document that no in-network provider was available for this service.');
    html += carcStep('2️⃣', 'Submit appeal citing No Surprises Act protections if applicable.');
    html += carcStep('3️⃣', 'Initiate Independent Dispute Resolution (IDR) if appeal is denied.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 NSA Appeal Filed</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO242-BillPatient') {
    html += carcStep('1️⃣', 'Apply OON benefit structure per patient\'s plan.');
    html += carcStep('2️⃣', 'Bill patient for OON cost-sharing after insurance payment.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #43 CO-243 — Not Authorized by PCP ───────────────────────────────
function buildCARC_CO243(issue, color) {
  var html = carcHeader('243', 'CO', '📋 CO-243 — Referral/Authorization Absent from PCP', 'Services not authorized by network/primary care providers');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Was a PCP referral or authorization obtained before the service?');
    html += carcYesNo('Yes — Referral Was Obtained', "moveToStage('CO243-HaveReferral')", 'No — No Referral', "moveToStage('CO243-NoReferral')");
  } else if (stage === 'CO243-HaveReferral') {
    html += carcStep('1️⃣', 'Locate the referral/authorization number and documentation.');
    html += carcStep('2️⃣', 'Resubmit claim with referral number in the appropriate field.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Resubmitted with Referral</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO243-NoReferral') {
    html += carcQuestion('Can a retro referral be obtained from the PCP?');
    html += carcYesNo('Yes — Can Get Retro Referral', "moveToStage('CO243-GetReferral')", 'No — Cannot Get Referral', "moveToStage('CO243-WriteOff')");
  } else if (stage === 'CO243-GetReferral') {
    html += carcStep('1️⃣', 'Contact PCP to obtain retroactive referral.');
    html += carcStep('2️⃣', 'Once obtained, resubmit claim with referral documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📞 Requesting Retro Referral</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'CO243-WriteOff') {
    html += carcDanger('No referral obtained. Cannot recover. Write off required.');
    html += carcStep('⚠️', 'Write off. Notify provider and staff of referral requirements for HMO/gatekeeper plans.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #44 PI-112 — Not Documented / Not Furnished Directly ──────────────
function buildCARC_PI112(issue, color) {
  var html = carcHeader('112', 'PI', '📄 PI-112 — Not Documented / Not Furnished Directly', 'Service not furnished directly to the patient and/or not documented');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcQuestion('Is the service documented in the medical record and was it rendered directly to the patient?');
    html += carcYesNo('Yes — Documented & Rendered', "moveToStage('PI112-Appeal')", 'No — Documentation Issue', "moveToStage('PI112-WriteOff')");
  } else if (stage === 'PI112-Appeal') {
    html += carcStep('1️⃣', 'Compile complete documentation: encounter notes, provider attestation, and any supporting records.');
    html += carcStep('2️⃣', 'Submit appeal with full documentation proving the service was rendered and documented.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal with Documentation</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PI112-WriteOff') {
    html += carcDanger('Service is not documented or was not rendered directly. Cannot appeal without documentation.');
    html += carcStep('⚠️', 'Write off. This is a significant compliance concern — notify provider immediately.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #45 CO-146 — Invalid Diagnosis for DOS ───────────────────────────
function buildCARC_CO146(issue, color) {
  var html = carcHeader('146', 'CO', '🩺 CO-146 — Invalid Diagnosis for Date of Service', 'Diagnosis was invalid for the date(s) of service reported');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>ICD-10 codes are updated annually (October 1). A code valid in one year may be deleted or changed the following year.</div></div>';
    html += carcStep('1️⃣', 'Verify the ICD-10 code was valid on the date of service.');
    html += carcStep('2️⃣', 'Identify the correct valid diagnosis code for that date of service.');
    html += carcQuestion('Have you identified the correct valid diagnosis code?');
    html += carcYesNo('Yes — Found Correct Code', "moveToStage('CO146-Fix')", 'No — Need Research', "moveToStage('CO146-Research')");
  } else if (stage === 'CO146-Research') {
    html += carcStep('1️⃣', 'Look up the correct ICD-10 code valid for the DOS using CMS ICD-10 lookup: ' + carcLink('https://www.cms.gov/medicare/coding-billing/icd-10-codes', 'CMS ICD-10 Codes'));
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'CO146-Fix\')">✓ Correct Code Found</button>';
  } else if (stage === 'CO146-Fix') {
    html += carcStep('1️⃣', 'Update the diagnosis code to the valid code for the date of service.');
    html += carcStep('2️⃣', 'Resubmit as corrected claim.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #46 PR-204 — Not Covered Under Benefit Plan ───────────────────────
function buildCARC_PR204(issue, color) {
  var html = carcHeader('204', 'PR', '🚫 PR-204 — Not Covered Under Benefit Plan', "This service/equipment/drug is not covered under the patient's current benefit plan");
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += carcStep('1️⃣', 'Verify the patient\'s benefit plan on eligibility portal.');
    html += carcStep('2️⃣', 'Confirm the service is not a covered benefit.');
    html += carcQuestion('Is the denial correct — is this truly not covered?');
    html += carcYesNo('Yes — Not Covered', "moveToStage('PR204-PatientBill')", 'No — Should Be Covered', "moveToStage('PR204-Appeal')");
  } else if (stage === 'PR204-Appeal') {
    html += carcStep('1️⃣', 'Obtain patient\'s benefit summary showing the service is covered.');
    html += carcStep('2️⃣', 'Submit appeal with benefit documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else if (stage === 'PR204-PatientBill') {
    html += carcQuestion('Was an ABN or financial consent signed?');
    html += carcYesNo('Yes — Consent Signed', "moveToStage('PR204-BillPatient')", 'No — No Consent', "moveToStage('PR204-WriteOff')");
  } else if (stage === 'PR204-BillPatient') {
    html += carcStep('1️⃣', 'Bill patient for non-covered service per signed consent/ABN.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  } else if (stage === 'PR204-WriteOff') {
    html += carcDanger('Non-covered service with no ABN/consent. Write off required.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #47 CO-252 — Attachment Required ─────────────────────────────────
function buildCARC_CO252(issue, color) {
  var html = carcHeader('252', 'CO', '📎 CO-252 — Attachment Required', 'An attachment/other documentation is required to adjudicate this claim/service');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>Check the RARC for the specific attachment required. Common attachments: operative reports, lab results, prior auth documentation, referral letters, medical records.</div></div>';
    html += carcStep('1️⃣', 'Identify the required attachment from the RARC code or payer correspondence.');
    html += carcQuestion('Do you have the required attachment available?');
    html += carcYesNo('Yes — Have Attachment', "moveToStage('CO252-Submit')", 'No — Need to Obtain', "moveToStage('CO252-Gather')");
  } else if (stage === 'CO252-Gather') {
    html += carcStep('1️⃣', 'Request the required documentation from the provider or appropriate source.');
    html += carcStep('2️⃣', 'Monitor timely filing deadline while gathering documentation.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'CO252-Submit\')">✓ Documentation Obtained</button>';
  } else if (stage === 'CO252-Submit') {
    html += carcStep('1️⃣', 'Submit the claim with the required attachment per payer\'s submission method (electronic, fax, or mail).');
    html += carcStep('2️⃣', 'Document submission confirmation in Activity Log.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Claim + Attachment Submitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #48 OA-95 — Plan Procedures Not Followed ─────────────────────────
function buildCARC_OA95(issue, color) {
  var html = carcHeader('95', 'OA', '📋 OA-95 — Plan Procedures Not Followed', 'Plan procedures not followed');
  var stage = issue.workflowStage;

  if (stage === 'New') {
    html += '<div class="callout info"><span class="callout-icon">💡</span><div>This is a broad code. Check RARC for specifics. Common causes: wrong claim form used, incorrect billing format, coordination of benefits not followed, or plan-specific submission rules not met.</div></div>';
    html += carcStep('1️⃣', 'Call payer to identify the specific plan procedure not followed.');
    html += carcStep('2️⃣', 'Review payer\'s provider manual for submission requirements.');
    html += carcQuestion('Have you identified the specific plan procedure violation?');
    html += carcYesNo('Yes — Issue Identified', "moveToStage('OA95-Fix')", 'No — Still Unclear', "moveToStage('OA95-CallPayer')");
  } else if (stage === 'OA95-CallPayer') {
    html += carcStep('1️⃣', 'Call payer\'s provider services line for specific denial reason.');
    html += carcStep('2️⃣', 'Document what they tell you in the Activity Log.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'OA95-Fix\')">✓ Issue Identified</button>';
  } else if (stage === 'OA95-Fix') {
    html += carcStep('1️⃣', 'Correct the identified plan procedure violation.');
    html += carcStep('2️⃣', 'Resubmit claim following the correct plan procedures.');
    html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected & Resubmitted</button>';
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  } else {
    html += carcStep('📋', 'Use Activity Log to document progress.');
    html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Mark Resolved</button>';
  }
  html += '</div>';
  return html;
}

// ── #49 & #50 — Covered in Pattern Templates ─────────────────────────
// (CO-210 Auth Not Timely and OA-B15 Qualifying Service Missing
//  are routed to PT-AUTH and PT-CODING patterns respectively)

// ═══════════════════════════════════════════════════════════════════════
// INSTITUTIONAL / NOT APPLICABLE
// ═══════════════════════════════════════════════════════════════════════

function buildCARCNotApplicable(issue, code) {
  return '<div class="card">' +
    '<div class="section-title">🏥 Institutional Code — Not Applicable</div>' +
    '<div class="callout warn"><span class="callout-icon">⚠️</span>' +
    '<div>CARC <strong>' + code + '</strong> is an institutional billing code and does not apply to outpatient professional billing. ' +
    'If you are seeing this code on a claim, it may have been received in error. Contact the payer for clarification.</div></div>' +
    '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Close Claim</button>' +
    '</div>';
}

// ═══════════════════════════════════════════════════════════════════════
// PATTERN-BASED WORKFLOW ROUTER
// Routes all non-custom CARC codes to the appropriate pattern template
// ═══════════════════════════════════════════════════════════════════════

function buildCARCPatternWorkflow(issue, color) {
  var code   = (issue.carcCode || '').toString().trim();
  var group  = (issue.carcGroupCode || '').toString().trim().toUpperCase();
  var codeNum = parseInt(code) || 0;

  // ── Pattern 1: Patient Responsibility ────────────────────────────────
  var pt1Codes = ['1','2','3','26','27','31','32','33','34','35','85','140',
                  '149','166','177','200','201','204','229','238','241','247','248','275'];
  if (group === 'PR' || pt1Codes.indexOf(code) > -1) {
    return buildPatternPatientResp(issue);
  }

  // ── Pattern 2: Timely Filing ──────────────────────────────────────────
  if (code === '29' || code === 'B4') {
    return buildPatternTimelyFiling(issue);
  }

  // ── Pattern 3: Authorization ──────────────────────────────────────────
  var pt3Codes = ['39','197','198','210','243','284','287','288','296','302'];
  if (pt3Codes.indexOf(code) > -1) {
    return buildPatternAuthorization(issue);
  }

  // ── Pattern 4: Medical Necessity ─────────────────────────────────────
  var pt4Codes = ['50','51','55','56','150','151','152','153','154','167','193'];
  if (pt4Codes.indexOf(code) > -1) {
    return buildPatternMedicalNecessity(issue);
  }

  // ── Pattern 5: Coding/Bundling ────────────────────────────────────────
  var pt5Codes = ['4','5','6','7','8','9','10','11','12','16','59','97','107',
                  '110','146','181','182','199','236','231','234','282'];
  if (pt5Codes.indexOf(code) > -1) {
    return buildPatternCoding(issue);
  }

  // ── Pattern 6: Eligibility/Coverage ──────────────────────────────────
  var pt6Codes = ['22','24','26','27','31','32','33','34','109','119','200',
                  '204','242','258','272','273','279'];
  if (pt6Codes.indexOf(code) > -1) {
    return buildPatternEligibility(issue);
  }

  // ── Pattern 7: Credentialing ──────────────────────────────────────────
  var pt7Codes = ['170','171','172','183','184','185','283','299','B7','B23'];
  if (pt7Codes.indexOf(code) > -1) {
    return buildPatternCredentialing(issue);
  }

  // ── Pattern 8: Duplicate ──────────────────────────────────────────────
  if (code === '18' || code === 'B13') {
    return buildPatternDuplicate(issue);
  }

  // ── Pattern 9: Non-Covered Service ───────────────────────────────────
  var pt9Codes = ['49','50','53','54','55','56','58','60','78','96','111',
                  '114','117','157','158','159','160','167','202','211','212',
                  '256','261','269'];
  if (pt9Codes.indexOf(code) > -1) {
    return buildPatternNonCovered(issue);
  }

  // ── Pattern 10: COB/Other Payer ───────────────────────────────────────
  var pt10Codes = ['22','23','100','109','136','215','228','276','303'];
  if (pt10Codes.indexOf(code) > -1) {
    return buildPatternCOB(issue);
  }

  // ── Pattern 11: Documentation Missing ────────────────────────────────
  var pt11Codes = ['16','112','148','163','164','226','227','250','251','252','B12'];
  if (pt11Codes.indexOf(code) > -1) {
    return buildPatternDocumentation(issue);
  }

  // ── Pattern 12: Fee Schedule/Contract Dispute ─────────────────────────
  var pt12Codes = ['45','94','101','131','147'];
  if (pt12Codes.indexOf(code) > -1) {
    return buildPatternFeeSchedule(issue);
  }

  // ── Pattern 13: Informational / No Action ────────────────────────────
  var pt13Codes = ['44','74','75','90','91','95','100','101','103','104','105',
                   '130','132','133','137','143','144','161','169','186','187',
                   '192','194','195','203','205','209','225','235','253','259',
                   '260','262','263','264','265','266','271','295','A0'];
  if (pt13Codes.indexOf(code) > -1 || group === 'OA') {
    return buildPatternInformational(issue);
  }

  // ── Pattern 14: Workers Comp / P&C ───────────────────────────────────
  if (code.indexOf('P') === 0) {
    return buildPatternWorkersComp(issue);
  }

  // ── Default: Generic ──────────────────────────────────────────────────
  return buildPatternGeneric(issue);
}

// ═══════════════════════════════════════════════════════════════════════
// PATTERN TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

// ── Pattern 1: Patient Responsibility ────────────────────────────────
function buildPatternPatientResp(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">💵 Patient Responsibility</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'PR') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Patient is responsible for this amount') + '</div></div>';
  html += carcStep('1️⃣', 'Verify patient\'s secondary insurance on eligibility portal.');
  html += carcStep('2️⃣', 'If secondary insurance exists, submit with primary EOB attached.');
  html += carcStep('3️⃣', 'If no secondary, bill patient for the patient responsibility amount.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Submitted to Secondary</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  html += '</div>';
  return html;
}

// ── Pattern 2: Timely Filing ──────────────────────────────────────────
function buildPatternTimelyFiling(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">⏱️ Timely Filing</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'CO') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Timely filing limit has expired') + '</div></div>';
  html += carcStep('1️⃣', 'Locate proof of timely filing: clearinghouse report, payer portal confirmation, or certified mail receipt.');
  html += carcStep('2️⃣', 'If proof exists, submit appeal with timely filing documentation.');
  html += carcStep('3️⃣', 'If no proof exists and no payer/system error occurred, write off the claim.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal with Proof Submitted</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">⛔ Write Off & Close</button>';
  html += '</div>';
  return html;
}

// ── Pattern 3: Authorization ──────────────────────────────────────────
function buildPatternAuthorization(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">🔒 Authorization Issue</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'PI') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Authorization/precertification issue') + '</div></div>';
  html += carcStep('1️⃣', 'Locate the authorization number and approval documentation.');
  html += carcStep('2️⃣', 'If authorization was obtained, call payer to reopen and provide auth number.');
  html += carcStep('3️⃣', 'If auth was not obtained, request retroactive authorization from payer.');
  html += carcStep('4️⃣', 'If no retro auth available, appeal with medical necessity documentation or write off.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Working Auth Issue</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved / Write Off</button>';
  html += '</div>';
  return html;
}

// ── Pattern 4: Medical Necessity ─────────────────────────────────────
function buildPatternMedicalNecessity(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">🏥 Medical Necessity</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'CO') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Service not deemed medically necessary') + '</div></div>';
  html += carcStep('1️⃣', 'Review clinical documentation against LCD/NCD criteria for this service.');
  html += carcStep('2️⃣', 'If documentation supports medical necessity, submit appeal with clinical records.');
  html += carcStep('3️⃣', 'Request peer-to-peer review with payer medical director if appeal denied.');
  html += carcStep('4️⃣', 'If documentation does not support, check for ABN. Bill patient if ABN exists, write off if not.');
  html += '<div style="margin-top:8px;">' + carcLink('https://www.cms.gov/medicare-coverage-database/', 'CMS LCD/NCD Coverage Database') + '</div>';
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved / Write Off</button>';
  html += '</div>';
  return html;
}

// ── Pattern 5: Coding/Bundling ────────────────────────────────────────
function buildPatternCoding(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">🔧 Coding / Bundling Issue</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'CO') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Coding or bundling issue identified') + '</div></div>';
  html += carcStep('1️⃣', 'Review the specific coding issue: modifier, bundling, diagnosis-procedure relationship, or billing error.');
  html += carcStep('2️⃣', 'Check NCCI edits if bundling is involved: ' + carcLink('https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits', 'CMS NCCI Edits'));
  html += carcStep('3️⃣', 'Correct the coding error and resubmit as corrected claim, OR add appropriate modifier if services are distinct.');
  html += carcStep('4️⃣', 'If coding was correct, appeal with coding guidelines and clinical documentation.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected / Appeal Submitted</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  html += '</div>';
  return html;
}

// ── Pattern 6: Eligibility/Coverage ──────────────────────────────────
function buildPatternEligibility(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">🪪 Eligibility / Coverage Issue</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'CO') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Eligibility or coverage issue') + '</div></div>';
  html += carcStep('1️⃣', 'Verify patient eligibility on payer portal: coverage dates, benefit limits, and active plans.');
  html += carcStep('2️⃣', 'Correct any eligibility errors and resubmit as a new claim to the correct payer.');
  html += carcStep('3️⃣', 'If eligibility is confirmed and denial is in error, appeal with eligibility documentation.');
  html += carcStep('4️⃣', 'If patient has no coverage, bill patient directly.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Corrected / Resubmitted</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Billed Patient / Close</button>';
  html += '</div>';
  return html;
}

// ── Pattern 7: Credentialing ──────────────────────────────────────────
function buildPatternCredentialing(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">👤 Credentialing Issue</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'CO') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Provider credentialing or enrollment issue') + '</div></div>';
  html += carcStep('1️⃣', 'Verify provider NPI, PTAN, and credentialing status with the payer.');
  html += carcStep('2️⃣', 'If provider is credentialed, call payer to reprocess with correct provider information.');
  html += carcStep('3️⃣', 'If provider is NOT credentialed, refer to Credentialing department immediately.');
  html += carcStep('4️⃣', 'Hold claim until credentialing is complete — some payers allow retroactive effective dates.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📋 Sent to Credentialing</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  html += '</div>';
  return html;
}

// ── Pattern 8: Duplicate ──────────────────────────────────────────────
function buildPatternDuplicate(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">🔁 Duplicate Claim</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'OA') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Duplicate claim or service') + '</div></div>';
  html += carcStep('1️⃣', 'Check billing system and payer portal for prior submission of this claim.');
  html += carcStep('2️⃣', 'If previously paid, verify payment is posted and close claim.');
  html += carcStep('3️⃣', 'If previously denied, work the original denial reason.');
  html += carcStep('4️⃣', 'If submitted only once and denial is in error, call payer to reopen.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📞 Called Payer to Reopen</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Verified & Close</button>';
  html += '</div>';
  return html;
}

// ── Pattern 9: Non-Covered Service ───────────────────────────────────
function buildPatternNonCovered(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">🚫 Non-Covered Service</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'CO') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Non-covered service') + '</div></div>';
  html += carcStep('1️⃣', 'Verify the service is not covered under the patient\'s benefit plan.');
  html += carcStep('2️⃣', 'If denial is incorrect, appeal with benefit documentation and clinical records.');
  html += carcStep('3️⃣', 'If denial is correct, check for signed ABN or financial consent.');
  html += carcStep('4️⃣', 'If ABN/consent exists, bill patient. If not, write off.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Appeal Submitted</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Bill Patient / Write Off</button>';
  html += '</div>';
  return html;
}

// ── Pattern 10: COB/Other Payer ───────────────────────────────────────
function buildPatternCOB(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">🔄 Coordination of Benefits</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'CO') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Another payer is responsible') + '</div></div>';
  html += carcStep('1️⃣', 'Verify correct COB order using eligibility portal and Birthday Rule or Medicare Secondary Payer rules.');
  html += carcStep('2️⃣', 'Submit claim to the correct primary payer.');
  html += carcStep('3️⃣', 'Once primary pays, submit to secondary with primary EOB if applicable.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Submitted to Correct Payer</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  html += '</div>';
  return html;
}

// ── Pattern 11: Documentation Missing ────────────────────────────────
function buildPatternDocumentation(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">📄 Documentation Missing or Incomplete</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'CO') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Required documentation not received') + '</div></div>';
  html += carcStep('1️⃣', 'Identify the specific documentation required from the RARC code or payer correspondence.');
  html += carcStep('2️⃣', 'Obtain the required documentation from the provider or appropriate source.');
  html += carcStep('3️⃣', 'Resubmit claim with complete documentation per payer\'s submission requirements.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Resubmitted with Documentation</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  html += '</div>';
  return html;
}

// ── Pattern 12: Fee Schedule / Contract Dispute ───────────────────────
function buildPatternFeeSchedule(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">💰 Fee Schedule / Contract Dispute</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'CO') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Payment does not match expected fee schedule') + '</div></div>';
  html += carcStep('1️⃣', 'Pull contracted fee schedule for this payer and CPT code from REF-Payers.');
  html += carcStep('2️⃣', 'Compare contracted rate to amount paid on EOB.');
  html += carcStep('3️⃣', 'If underpaid, submit payment dispute/reconsideration with contract rate documentation.');
  html += carcStep('4️⃣', 'Escalate to billing manager if payer does not correct payment.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Dispute Filed</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  html += '</div>';
  return html;
}

// ── Pattern 13: Informational / No Action Required ────────────────────
function buildPatternInformational(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">ℹ️ Informational Adjustment</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + (issue.carcGroupCode||'OA') + '-' + code + '</strong> — ' + (issue.carcDescription || 'Informational adjustment — no action typically required') + '</div></div>';
  html += '<div class="callout success"><span class="callout-icon">✅</span><div>This is an informational or contractual adjustment code. No action is typically required unless the payment amount is incorrect.</div></div>';
  html += carcStep('1️⃣', 'Verify the adjustment amount is correct per contract or plan guidelines.');
  html += carcStep('2️⃣', 'If the amount is incorrect, file a payment dispute with supporting documentation.');
  html += carcStep('3️⃣', 'If the amount is correct, close the claim.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">📤 Dispute Filed</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Amount Correct / Close</button>';
  html += '</div>';
  return html;
}

// ── Pattern 14: Workers Comp / P&C ───────────────────────────────────
function buildPatternWorkersComp(issue) {
  var code = issue.carcCode || '';
  var html = '<div class="card"><div class="section-title">⚒️ Workers\' Compensation / Property & Casualty</div>';
  html += '<div class="callout warn"><span class="callout-icon">⚠️</span><div><strong>P-' + code + '</strong> — This code is specific to Workers\' Compensation or Property & Casualty claims.</div></div>';
  html += carcStep('1️⃣', 'Verify whether this practice handles Workers\' Comp or P&C claims.');
  html += carcStep('2️⃣', 'If yes, review the specific P-code reason and work per WC/P&C billing guidelines.');
  html += carcStep('3️⃣', 'If no, submit to patient\'s primary health insurance and bill patient if no coverage.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">🔄 Working per WC/P&C Guidelines</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved</button>';
  html += '</div>';
  return html;
}

// ── Generic Fallback ──────────────────────────────────────────────────
function buildPatternGeneric(issue) {
  var code = issue.carcCode || '';
  var group = issue.carcGroupCode || '';
  var html = '<div class="card"><div class="section-title">📋 Denial Workflow</div>';
  html += '<div class="callout info"><span class="callout-icon">🔖</span><div><strong>' + group + '-' + code + '</strong> — ' + (issue.carcDescription || 'Review EOB for denial details') + '</div></div>';
  if (issue.carcAction) {
    html += '<div class="callout action"><span class="callout-icon">💡</span><div><strong>Recommended Action:</strong> ' + issue.carcAction + '</div></div>';
  }
  html += carcStep('1️⃣', 'Review the full EOB and RARC code for denial specifics.');
  html += carcStep('2️⃣', 'Call payer if denial reason is unclear.');
  html += carcStep('3️⃣', 'Correct any errors and resubmit, or submit appeal with supporting documentation.');
  html += carcStep('4️⃣', 'If unrecoverable, write off and document reason in Activity Log.');
  html += '<button class="wf-btn wf-btn-primary" onclick="moveToStage(\'In Progress\')">🔄 Working Denial</button>';
  html += '<button class="wf-btn wf-btn-secondary" onclick="markResolved()">✅ Resolved / Write Off</button>';
  html += '</div>';
  return html;
}