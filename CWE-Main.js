/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.5                              ║
 * ║                    CWE-Main.gs                                        ║
 * ║  PURPOSE: Users, permissions, menu, and core app initialization       ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION - USERS & PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════

var USERS = {
  // ASP Team (Admin level)
  'craig.aspmdinc@gmail.com': { name: 'Craig', group: 'ASP', level: 'Admin' },
  'chris@asp.com':            { name: 'Chris', group: 'ASP', level: 'Admin' },
  'nate@asp.com':             { name: 'Nate',  group: 'ASP', level: 'Admin' },
  'peter@asp.com':            { name: 'Peter', group: 'ASP', level: 'Admin' },
  'kara@asp.com':             { name: 'Kara',  group: 'ASP', level: 'Admin' },

  // A3MB Team (Analyst level)
  'piaancheta@gmail.com':       { name: 'Pia',    group: 'A3MB', level: 'Analyst' },
  'dbelle.a3@gmail.com':        { name: 'Belle',  group: 'A3MB', level: 'Analyst' },
  'gemian.a3@gmail.com':        { name: 'Angel',  group: 'A3MB', level: 'Analyst' },
  'ynayanynna.a3@gmail.com':    { name: 'Ynna',   group: 'A3MB', level: 'Analyst' },
  'floralyncarlos.a3@gmail.com':{ name: 'Allen',  group: 'A3MB', level: 'Analyst' },
  'nouella.a3@gmail.com':       { name: 'Ella',   group: 'A3MB', level: 'Analyst' },
  'yvettea.a3@gmail.com':       { name: 'Yvette', group: 'A3MB', level: 'Analyst' },
  'minniey.a3@gmail.com':       { name: 'Minnie', group: 'A3MB', level: 'Analyst' },
  'shevila.a3@gmail.com':       { name: 'Sheila', group: 'A3MB', level: 'Analyst' },

  // Accudoc Team (Analyst level)
  'yazeen4ever@gmail.com':    { name: 'Yaseen',  group: 'Accudoc', level: 'Analyst' },
  'impraveen.7@gmail.com':    { name: 'Praveen', group: 'Accudoc', level: 'Analyst' },
  'anithamaria1311@gmail.com':{ name: 'Anitha',  group: 'Accudoc', level: 'Analyst' },
  'vijaympfernandez@gmail.com':{ name: 'Vijay',  group: 'Accudoc', level: 'Analyst' }
};

// ── Column index constants (zero-based, matches getRange data arrays) ──
// Use these instead of magic numbers throughout all scripts
var COL = {
  ISSUE_ID:          0,   // A
  DATE_LOGGED:       1,   // B
  LOGGED_BY:         2,   // C
  ISSUE_TYPE:        3,   // D
  PRACTICE:          4,   // E
  PRACTICE_NPI:      5,   // F
  PROVIDER:          6,   // G
  PROVIDER_NPI:      7,   // H
  PAYER:             8,   // I
  CPT:               9,   // J
  DOS:               10,  // K
  EXPECTED_AMT:      11,  // L
  PAID_AMT:          12,  // M
  VARIANCE:          13,  // N
  ROOT_CAUSE:        14,  // O
  WORKFLOW_STAGE:    15,  // P
  PRIORITY:          16,  // Q
  ASSIGNED_TO:       17,  // R
  DATE_RESOLVED:     18,  // S
  DAYS_OPEN:         19,  // T
  ISSUE_DETAILS:     20,  // U  (also CARC code for denials)
  BATCH_ID:          21,  // V
  STATE:             22,  // W
  ACCOUNT_NUMBER:    23,  // X
  DENIAL_CATEGORY:   24,  // Y
  DENIAL_DATE:       25,  // Z
  APPEAL_DUE:        26,  // AA
  RESUBMISSION_DATE: 27,  // AB
  COVERAGE_TYPE:     28,  // AC
  CARC_DESCRIPTION:  29,  // AD
  RARC_CODE:         30,  // AE
  RARC_DESCRIPTION:  31,  // AF
  CARC_GROUP_CODE:   32,  // AG
  TOTAL_COLS:        33   // Always fetch at least this many columns
};

// ═══════════════════════════════════════════════════════════════════════
// USER & PERMISSION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

function getCurrentUser() {
  var email = Session.getActiveUser().getEmail();
  return USERS[email] || { name: 'Unauthorized User', group: 'None', level: 'Blocked' };
}

function getVisibleUsers(user) {
  var visible = [];

  if (user.level === 'Admin') {
    for (var email in USERS) {
      visible.push(USERS[email].name);
    }
  } else {
    visible.push('Craig'); // Admin always visible

    for (var email in USERS) {
      var u = USERS[email];
      if (u.group === user.group) {
        visible.push(u.name);
      }
    }

    // Add other groups as labels
    if (user.group === 'A3MB') {
      visible.push('Accudoc');
    } else if (user.group === 'Accudoc') {
      visible.push('A3MB');
    }
  }

  return visible.sort();
}

function canViewClaim(claim, user) {
  if (user.level === 'Admin') return true;
  if (claim.assignedTo === user.name) return true;
  if (claim.assignedTo === user.group) return true;
  if (!claim.assignedTo || claim.assignedTo === '') return true;

  for (var email in USERS) {
    var u = USERS[email];
    if (u.group === user.group && u.name === claim.assignedTo) {
      return true;
    }
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════════════
// MENU & INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var user = getCurrentUser();

  if (user.level === 'Blocked') {
    ui.alert('🔒 Access Denied',
      'Your email (' + Session.getActiveUser().getEmail() + ') is not authorized.\n\n' +
      'Please contact Craig (craig.aspmdinc@gmail.com) to request access.',
      ui.ButtonSet.OK);
    return;
  }

  var menu = ui.createMenu('🏥 Claims Engine')
    .addItem('➕ Log New Issue',           'showNewIssueForm')
    .addItem('📊 Open Dashboard',          'openDashboardSidebar')
    .addSeparator()
    .addItem('🎓 Training Center',         'openTrainingCenter')
    .addSeparator()
    .addItem('📝 View Activity Log',       'openActivityLog')
    .addSeparator()
    .addSubMenu(ui.createMenu('📚 References')
        .addItem('📋 CARC Reference',             'openRefCARC')
        .addItem('🗺️ MAC Jurisdiction Map',       'openRefMACs')
        .addItem('🏛️ MassHealth Carrier Codes',   'openRefMassHealth')
        .addItem('📅 Global Period Reference',    'openRefGlobalPeriods'));

  if (user.level === 'Admin' || user.level === 'Supervisor') {
    menu.addSeparator()
      .addSubMenu(ui.createMenu('🛠 Admin Tools')
        .addItem('⚙️ Setup System',            'setupAllSheets')
        .addItem('🎨 Activate App View',        'setupAppView')
        .addItem('🔄 Refresh Metrics',          'refreshMetrics')
        .addItem('🔁 Rebuild Canvas',           'refreshCanvas')
        .addSeparator()
        .addItem('🔓 Show All Sheets',          'showAllSheets')
        .addItem('🔒 Hide Data Sheets',         'hideDataSheets')
        .addSeparator()
        .addItem('📥 Import Reference Data',    'showImportGuide')
        .addItem('👥 Manage Users',             'showUserManagement')
        .addItem('🔧 Programming Alerts',       'openProgrammingAlerts'));
  }

  menu.addToUi();
}