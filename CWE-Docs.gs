/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.4                              ║
 * ║                       CWE-Docs.gs                                     ║
 * ║  PURPOSE: Project documentation, file structure guide, change log,   ║
 * ║           debug function reference                                    ║
 * ║  NOTE:    This file contains no executable code — docs only          ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * HOW TO USE THE DEBUG FILE
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  1. Open Apps Script editor (Extensions → Apps Script)
 *  2. Open CWE-Debug.gs
 *  3. Click inside the function you want to run
 *  4. Click Run (triangle) in the toolbar
 *  5. View results: View → Logs  (or Ctrl+Enter)
 *
 *  Not sure which function to run? Start with debug_runAll() — it runs
 *  every check at once and prints a full diagnostic report to the log.
 *
 *  If something breaks and you don't know why, find the symptom below
 *  and it will tell you exactly which debug function to run.
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SYMPTOM → DEBUG FUNCTION QUICK REFERENCE
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  "Practice dropdown is empty"           → debug_getPractices()
 *                                            debug_testIntakeFormData()
 *
 *  "Provider dropdown doesn't load"       → debug_getProviders()
 *
 *  "Payer dropdown doesn't load"          → debug_getPayers()
 *
 *  "CARC code search returns nothing"     → debug_getCARCLookup()
 *
 *  "Action banner not showing"            → debug_getCARCLookup()
 *
 *  "MAC block missing on Medicare claim"  → debug_getMACLookup()
 *
 *  "My name is wrong / I can't log in"   → debug_getCurrentUser()
 *
 *  "I can't see certain claims"           → debug_getCurrentUser()
 *
 *  "A sheet seems to be missing"          → debug_checkSheets()
 *
 *  "Column data looks shifted or wrong"   → debug_checkClaimsColumns()
 *
 *  "Form opens but throws an error"       → debug_testIntakeFormData()
 *
 *  "Sidebar is blank or throws an error"  → debug_testSidebarForRow()
 *                                            (set testRow at top of function first)
 *
 *  "Something is broken, not sure where"  → debug_runAll()
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DEBUG FUNCTIONS — FULL REFERENCE  (all in CWE-Debug.gs)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *
 *  ── CATCH-ALL ────────────────────────────────────────────────────────
 *
 *  debug_runAll()
 *    Runs every diagnostic check in sequence and prints a full report.
 *    Best first step when something is broken and you're not sure where
 *    to look. Takes about 5-10 seconds. Calls all functions below.
 *
 *
 *  ── REFERENCE DATA ───────────────────────────────────────────────────
 *
 *  debug_getPractices()
 *    Calls getPractices() and prints every practice returned, including
 *    id, name, state, and NPI. Flags any practice missing a required
 *    field. If the list is empty, the practice dropdown in the intake
 *    form will be blank.
 *    Source sheet: REF-Practices
 *    Columns: A (Code/ID)  B (Practice Name)  C (State)  D (NPI)
 *
 *  debug_getProviders()
 *    Calls getProvidersByPractice() for every practice and prints all
 *    providers returned. If a practice returns 0 providers, the provider
 *    dropdown will be blank when that practice is selected in the form.
 *    Source sheet: REF-Providers
 *    Columns: A (Practice ID)  B (Provider Name)  C (NPI)
 *
 *  debug_getPayers()
 *    Calls getPayersByState() using the first practice's state and
 *    prints all payers returned, including coverage type and timely
 *    filing days. If empty, the payer dropdown will be blank.
 *    Source sheet: REF-Payers
 *    Columns: A (Payer Name)  B (State)  C (Coverage Type)
 *             D (Timely Filing Days)  E-H (Appeal level names + days)
 *
 *  debug_getCARCLookup()
 *    Tests lookupCARC() and getCARCAction() against a set of common
 *    CARC codes (1, 2, 4, 16, 29, 45, 97) and prints the description
 *    and suggested action for each. If action is blank, the Action
 *    banner won't appear in the sidebar even when a CARC code is present.
 *    Source sheet: REF-CARC
 *    Columns: A (Code)  B (Description)  C (Group Code)  E (Action)
 *    Note: Column E is required for the Action banner — it is often
 *    missing from downloaded CARC lists and must be added manually.
 *
 *  debug_getMACLookup()
 *    Calls getMACsForState() using the first practice's state and prints
 *    all MAC entries returned (billing type, name, phone). If empty,
 *    the MAC reference block won't appear on Medicare claims.
 *    Source sheet: REF-MACs
 *    Columns: A (State)  B (Billing Type)  C (MAC Name)
 *             D (Phone)  E (Jurisdiction)
 *    Common problem: State column must use abbreviations (MA, RI, CT)
 *    not full names (Massachusetts, Rhode Island, Connecticut).
 *
 *
 *  ── USER & PERMISSIONS ───────────────────────────────────────────────
 *
 *  debug_getCurrentUser()
 *    Prints the active Google account email, the resolved user object
 *    (name, level, practice restrictions), and the list of users visible
 *    to that person in the reassign dropdown. If your email isn't in the
 *    USERS object in CWE-Main.gs, you'll show as level "Blocked" and
 *    won't be able to log or view claims.
 *    Source: USERS object in CWE-Main.gs
 *    Access levels: Admin (all), Manager (all), Biller (own practice),
 *                   Blocked (no access)
 *
 *
 *  ── SHEET STRUCTURE ──────────────────────────────────────────────────
 *
 *  debug_checkSheets()
 *    Checks that all 13 required sheets exist and prints the row count
 *    for each. Missing sheets show as X. If a REF sheet is missing,
 *    run Setup System from the menu to recreate it.
 *    Required: Claims, Activity Log, Programming Alerts, Dashboard,
 *    REF-Practices, REF-Providers, REF-Payers, REF-Denials, REF-CARC,
 *    REF-RARC, REF-MACs, REF-GlobalPeriods, REF-MassHealth
 *
 *  debug_checkClaimsColumns()
 *    Reads the Claims sheet header row and compares every column name
 *    against what the COL constants expect. Any mismatch means data is
 *    being read from the wrong column — this causes wrong values in the
 *    sidebar, incorrect priority calculations, and broken activity logs.
 *    Run this first if claim data looks shifted or out of place.
 *    Source: Claims sheet row 1, COL constants in CWE-Main.gs
 *
 *
 *  ── FORM & SIDEBAR ───────────────────────────────────────────────────
 *
 *  debug_testIntakeFormData()
 *    Simulates exactly what showNewIssueForm() does before opening the
 *    form: resolves the user, loads practices, and builds the
 *    practiceOptions HTML string. Prints the string length and first
 *    option. If practiceOptions length is 0, the dropdown will be
 *    blank — run debug_getPractices() to find out why.
 *
 *  debug_testSidebarForRow()
 *    Loads the full issue data object for a specific row in Claims and
 *    prints every field the sidebar depends on, including typeColor and
 *    the length of the generated workflowHTML string. Change testRow at
 *    the top of the function to test a different claim. If workflowHTML
 *    length is under 50 characters, the sidebar will appear blank.
 *    Note: You must have at least one logged claim to use this.
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * FILE STRUCTURE
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  CWE-Docs.gs      ← this file — documentation only, no executable code
 *  CWE-Main.gs      ← users, permissions, COL constants, menu, onOpen()
 *  CWE-Reference.gs ← all reference data lookups (read-only sheet access)
 *  CWE-Workflows.gs ← claim data writing, activity logging, resolution
 *  CWE-Forms.gs     ← form/sidebar launchers + workflow decision trees
 *  CWE-Setup.gs     ← sheet creation, formatting, dashboard
 *  CWE-Debug.gs     ← diagnostic functions (never called by users)
 *  IntakeForm.html  ← new issue / edit issue form UI
 *  Sidebar.html     ← workflow sidebar UI
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * PRODUCTION FUNCTION DIRECTORY — WHERE TO FIND EVERYTHING
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  CWE-Main.gs
 *    USERS               All user definitions, access levels, and practice
 *                        restrictions. Add new users here.
 *                        Levels: Admin, Manager, Biller, Blocked
 *    COL                 Maps column names to index numbers. Edit here if
 *                        columns are ever added or moved.
 *    getCurrentUser()    Matches active Google email to USERS object.
 *                        Returns name, level, and practice restrictions.
 *    getVisibleUsers()   Returns list of users a person can see and assign
 *                        claims to, based on access level.
 *    canViewClaim()      Returns true/false — checks whether the current
 *                        user has permission to view a specific claim.
 *    onOpen()            Builds the Claims Engine menu on spreadsheet open.
 *                        Add new menu items here.
 *
 *  CWE-Reference.gs
 *    getPractices()                  All practices from REF-Practices.
 *    getProvidersByPractice(id)      Providers for a given practice ID.
 *    getPayersByState(state)         Payer intelligence for a state.
 *    getPayersForForm(state)         Payer names only, for dropdowns.
 *    getCoverageTypesByPayer(payer)  Coverage types for a payer.
 *    getPlanTypesByPayerAndCoverage  Plan types for a payer + coverage combo.
 *    lookupCARC(code)                Description and group code for a CARC.
 *    getCARCAction(code)             Suggested action from REF-CARC col E.
 *    getCARCMatches(query)           CARC search results for the typeahead.
 *    lookupRARC(code)                Description for a RARC code.
 *    getRARCMatches(query)           RARC search results for the typeahead.
 *    saveUserCode(type, code, desc)  Saves a user-entered code to REF sheet.
 *    lookupMAC(state, type)          MAC info for a state and billing type.
 *    getMACsForState(state)          All MACs for a state (Part A and B).
 *    lookupDenialSuggestion(code)    Root cause and action for a denial code.
 *    getDenialCategories()           All denial categories for the dropdown.
 *    getRejectionCategories()        All rejection categories for dropdown.
 *    lookupGlobalPeriod(cpt)         Global period days for a CPT code.
 *    getGlobalPeriodForCPT(cpt)      Wrapper that returns result for form.
 *
 *  CWE-Workflows.gs
 *    logNewIssue(issue)              Creates a new row in Claims. Calculates
 *                                    priority, appeal due date, variance, and
 *                                    root cause. Triggers programming alert
 *                                    check for Internal type issues.
 *    updateIssue(row, issue)         Overwrites editable fields on an existing
 *                                    row. Preserves Issue ID, Date Logged,
 *                                    Stage, and other system fields.
 *    determineRootCause(issue)       Suggests root cause from issue type and
 *                                    denial code. Called during logNewIssue.
 *    calculatePriority(dos, days)    Returns Critical/High/Medium/Low based
 *                                    on days remaining before timely filing.
 *    logActivity(issueId, note)      Appends an activity entry to Activity Log.
 *                                    Creates new row or appends to existing.
 *    logActivityFromSidebar(id,note) Wrapper for logActivity() that looks up
 *                                    the current stage automatically.
 *    updateIssueField(row,field,val) Updates one field on a claim row and logs
 *                                    the change. Used by sidebar buttons.
 *    resolveIssue(row)               Sets Date Resolved, changes stage to
 *                                    Resolved, logs to Activity Log.
 *    logResearchAndAdvance(...)      Saves a research note and advances stage
 *                                    to Research Complete.
 *    checkProgrammingAlert(type)     Tracks Internal error recurrence —
 *                                    increments count or creates new alert row.
 *    getIssueData(row)               Reads all columns for a row and returns
 *                                    a clean named object. Recalculates
 *                                    priority. Used by the sidebar.
 *
 *  CWE-Forms.gs
 *    showNewIssueForm()              Opens the intake form as a modal dialog.
 *                                    Builds practiceOptions and userOptions
 *                                    HTML strings for IntakeForm.html.
 *    showEditIssueForm(row)          Opens the form pre-filled with existing
 *                                    claim data from the given row.
 *    openWorkflowSidebar()           Opens the sidebar for the selected row.
 *                                    Builds all template variables for
 *                                    Sidebar.html.
 *    openWorkflowSidebarById(id)     Finds a claim by Issue ID and opens its
 *                                    sidebar. Called after logNewIssue().
 *    openWorkflowSidebarByRow(row)   Opens sidebar for a specific row. Called
 *                                    when switching claims in the nav bar.
 *    getTypeColor(type)              Hex color for an issue type.
 *                                    Denial=red  Rejection=amber
 *                                    Payment=green  Internal=purple
 *    buildClaimOptions(issue, user)  HTML option list for the claim nav bar.
 *    buildUserOptions(user)          HTML option list for the reassign dropdown.
 *    buildPayerInfo(issue)           Payer Intelligence card HTML — timely
 *                                    filing countdown and appeal levels.
 *    buildMACInfo(issue)             MAC Reference card HTML for Medicare claims.
 *    buildRootCauseWorkflow(...)     Routes to the correct workflow builder
 *                                    based on root cause and denial category.
 *    buildProgressBar(steps, stage)  Step progress bar HTML for workflow cards.
 *    build[Type]Workflow(issue,color) One function per workflow type (13 total):
 *                                    Research, PatientContact, ProviderContact,
 *                                    Resubmit, Appeal, Duplicate, SendInfo,
 *                                    Dispute, PatientResp, MassHealth,
 *                                    Credentialing, Programming, Generic
 *
 *  CWE-Setup.gs
 *    setupAllSheets()                Master setup — runs all sheet setups.
 *                                    Safe to re-run, won't delete data.
 *    setupClaimsSheet()              Creates/formats Claims with headers.
 *    setupActivityLogSheet()         Creates/formats Activity Log.
 *    setupProgrammingAlertsSheet()   Creates/formats Programming Alerts.
 *    setupReferenceDataSheets()      Creates all REF sheets with headers.
 *    setupDashboardSheet()           Creates/formats Dashboard.
 *    refreshDashboard()              Recalculates all metrics from Claims.
 *    showImportGuide()               Modal with reference data import guide.
 *    showUserManagement()            Modal showing current USERS object.
 *    openProgrammingAlerts()         Navigates to Programming Alerts sheet.
 *    openActivityLog()               Navigates to Activity Log sheet.
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * COLUMN REFERENCE  (COL constants defined in CWE-Main.gs)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  COL.ISSUE_ID          = 0   (A)  Auto-generated: ISS-YYYYMMDD-###
 *  COL.DATE_LOGGED       = 1   (B)  Timestamp when issue was logged
 *  COL.LOGGED_BY         = 2   (C)  Name of user who logged it
 *  COL.ISSUE_TYPE        = 3   (D)  Denial / Rejection / Payment / Internal
 *  COL.PRACTICE          = 4   (E)  Practice name
 *  COL.PRACTICE_NPI      = 5   (F)  Practice NPI
 *  COL.PROVIDER          = 6   (G)  Provider name
 *  COL.PROVIDER_NPI      = 7   (H)  Provider NPI
 *  COL.PAYER             = 8   (I)  Payer name
 *  COL.CPT               = 9   (J)  CPT code
 *  COL.DOS               = 10  (K)  Date of service
 *  COL.EXPECTED_AMT      = 11  (L)  Expected payment amount
 *  COL.PAID_AMT          = 12  (M)  Actual paid amount
 *  COL.VARIANCE          = 13  (N)  Paid minus Expected (auto-calculated)
 *  COL.ROOT_CAUSE        = 14  (O)  Root cause category
 *  COL.WORKFLOW_STAGE    = 15  (P)  Current workflow stage
 *  COL.PRIORITY          = 16  (Q)  Auto-calculated from DOS + timely filing
 *  COL.ASSIGNED_TO       = 17  (R)  Assigned biller name
 *  COL.DATE_RESOLVED     = 18  (S)  Timestamp when resolved (blank = open)
 *  COL.DAYS_OPEN         = 19  (T)  Formula: days since DOS or until resolved
 *  COL.ISSUE_DETAILS     = 20  (U)  CARC code (denials) or other detail
 *  COL.BATCH_ID          = 21  (V)  Batch ID for Internal issues
 *  COL.STATE             = 22  (W)  State abbreviation (MA, RI, CT...)
 *  COL.ACCOUNT_NUMBER    = 23  (X)  Patient account number
 *  COL.DENIAL_CATEGORY   = 24  (Y)  Denial or rejection category name
 *  COL.DENIAL_DATE       = 25  (Z)  Date of denial or rejection
 *  COL.APPEAL_DUE        = 26  (AA) Appeal deadline (auto-calculated)
 *  COL.RESUBMISSION_DATE = 27  (AB) Date claim was resubmitted
 *  COL.COVERAGE_TYPE     = 28  (AC) Coverage type (e.g. Medicare Part B)
 *  COL.CARC_DESCRIPTION  = 29  (AD) CARC code long description
 *  COL.RARC_CODE         = 30  (AE) RARC code
 *  COL.RARC_DESCRIPTION  = 31  (AF) RARC code description
 *  COL.CARC_GROUP_CODE   = 32  (AG) CARC group code (CO, PR, OA, CR, PI)
 *  COL.TOTAL_COLS        = 33      Always fetch at least this many columns
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * REFERENCE SHEETS — COLUMN LAYOUTS
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  REF-Practices
 *    A: Code/Practice ID   B: Practice Name   C: State   D: Group NPI
 *
 *  REF-Providers
 *    A: Practice ID   B: Provider Name   C: NPI
 *
 *  REF-Payers
 *    A: Payer Name   B: State   C: Coverage Type   D: Timely Filing Days
 *    E: Level 1 Name   F: Level 1 Days   G: Level 2 Name   H: Level 2 Days
 *
 *  REF-Denials
 *    A: Denial Category   B: Description   C: Suggested Action
 *    D: Root Cause        E: Rejection Category   F: Description
 *    G: Suggested Action  H: Root Cause
 *
 *  REF-CARC
 *    A: Code   B: Description   C: Group Code   D: (unused)
 *    E: Suggested Action   ← required for the Action banner in sidebar
 *
 *  REF-RARC
 *    A: Code   B: Description
 *
 *  REF-MACs
 *    A: State (abbreviation only — MA not Massachusetts)
 *    B: Billing Type   C: MAC Name   D: Phone   E: Jurisdiction
 *
 *  REF-GlobalPeriods
 *    A: CPT Code   B: Global Period Days
 *
 *  REF-MassHealth
 *    A: Section   B: Carrier Name   C: Carrier Code (7-digit)
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CHANGE LOG
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  2026-02 | Reorganization
 *    - Split monolithic files into 5 focused .gs + 2 .html files
 *    - Added COL constants to eliminate magic number column indexes
 *    - Moved HTML templates to separate Sidebar.html / IntakeForm.html
 *    - Added CWE-Debug.gs with full diagnostic function suite
 *    - Fixed broken Log Activity card (missing opening div.card tag)
 *    - Fixed practiceOptions/userOptions not passed as HTML strings
 *    - Fixed typeColor/typeIcon not passed to Sidebar template
 *
 *  2026-02 | Features Added
 *    - CARC Action lookup from REF-CARC Column E (Action banner)
 *    - CARC Group Code displays as CO-29 format in sidebar header
 *    - Fixed column range bug (was fetching 29 cols, now TOTAL_COLS + 2)
 *    - MAC Reference block for Medicare claims with clickable phone numbers
 *    - Fixed state name mismatch in REF-MACs (full names to abbreviations)
 *    - Edit Claim functionality — reopens intake form pre-filled
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * TO DO
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  [ ] Sheet protection — prevent direct cell editing by billers
 *  [ ] Dashboard landing page — replace raw sheet as default view
 *  [ ] Resolution outcome tracking — what fixed it, did it pay
 *  [ ] Denial pattern logging — build institutional knowledge over time
 *  [ ] Practice-specific rules layer
 *  [ ] Address carcCode / issueDetails sharing same column (COL.ISSUE_DETAILS)
 */

// This file intentionally contains no executable code.