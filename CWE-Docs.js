/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.5                              ║
 * ║                       CWE-Docs.gs                                     ║
 * ║  PURPOSE: Master reference — file structure, all functions,           ║
 * ║           sheet schema, menu map, change log, debug reference         ║
 * ║  NOTE:    No executable code — documentation only                     ║
 * ║  UPDATED: March 2026                                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * This file is the single source of truth for the CWE project.
 * Share ONLY this file with Claude at the start of any new session.
 * Then upload only the specific .gs files being changed that session.
 * TESTING GS CODE SYNC
 *
 * ═══════════════════════════════════════════════════════════════════════
 * APPS SCRIPT FILES
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  CWE-Docs.gs           THIS FILE. No code, docs only. Update every session.
 *  CWE-Main.gs           Users, permissions, COL constants, menu, onOpen()
 *  CWE-AppView.gs        Canvas sheet, live metrics, ref sheet openers  [V2.4+]
 *  CWE-Dashboard.gs      getDashboardData(), sidebar builders, HTML generators
 *  CWE-Reference.gs      All REF sheet lookups (read-only)
 *  CWE-Workflows.gs      Claim writing, stage transitions, activity logging
 *  CWE-Forms.gs          Intake form, sidebar launcher, workflow UI builders
 *  CWE-Setup.gs          Sheet creation, column formatting, legacy dashboard
 *  CWE-CARC-Workflows.gs 297 CARC decision trees (binary yes/no steps)
 *  CWE-Debug.gs          Diagnostic functions only, never user-facing
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * HTML FILES
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  CWEApp.html           Unified sidebar shell. Loads Dashboard by default.
 *                        Tab navigation, queue list, claim detail view.
 *  CWE_V2_Training.html  Training center. Modal dialog 1100x700.
 *                        Scenarios, quiz, CARC/RARC quick reference.
 *  IntakeForm.html       New issue / edit issue form. Modal dialog.
 *                        CARC field first — denial category auto-fills.
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SPREADSHEET SHEETS
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  CWE App               Interactive canvas (built by CWE-AppView.gs)
 *  Claims                Main data. One row per claim.
 *  Activity Log          Append-only log of all actions.
 *  Programming Alerts    Payer-level billing alerts shown in sidebar.
 *  REF-Practices         A:Code  B:Name  C:State  D:NPI
 *  REF-Providers         A:Practice ID  B:Provider Name  C:NPI
 *  REF-Payers            A:Name  B:State  C:Coverage Type
 *                        D:Timely Filing Days  E-H:Appeal levels+days
 *  REF-Denials           A:Category  B:Description  C:Suggested Action
 *  REF-CARC              A:Code  B:Description  C:Group Code  E:Action
 *                        NOTE: Column E required for action banner in sidebar
 *  REF-RARC              A:Code  B:Description
 *  REF-MACs              A:State  B:Billing Type  C:MAC Name  D:Phone  E:Jurisdiction
 *                        NOTE: State must use abbreviation (MA not Massachusetts)
 *  REF-GlobalPeriods     CPT global period reference data
 *  REF-MassHealth        MassHealth carrier codes reference
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CLAIMS SHEET COLUMNS (COL constants in CWE-Main.gs, 0-indexed)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  COL.ISSUE_ID          A  Unique ID (ISS-YYYYMMDD-N)
 *  COL.DATE_LOGGED       B  Date claim was logged
 *  COL.PRACTICE          C  Practice name
 *  COL.PROVIDER          D  Provider name
 *  COL.PATIENT           E  Patient name
 *  COL.DOS               F  Date of service
 *  COL.PAYER             G  Payer name
 *  COL.ISSUE_TYPE        H  Denial / Rejection / Payment Variance / etc.
 *  COL.DENIAL_CATEGORY   I  Denial category (from REF-Denials)
 *  COL.CARC              J  CARC code
 *  COL.RARC              K  RARC code
 *  COL.PRIORITY          L  Critical (Past Due) / High / Medium / Low
 *  COL.WORKFLOW_STAGE    M  NEW / WORKING / IN PROGRESS / CONTRACT PULLED /
 *                           PENDING INFO / APPEALED / ESCALATED / RESOLVED / CLOSED
 *  COL.ASSIGNED_TO       N  User name (must match USERS object exactly)
 *  COL.VARIANCE          O  Dollar variance amount
 *  COL.NOTES             P  Free text notes
 *  COL.DATE_RESOLVED     Q  Date resolved (set automatically on resolution)
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * USER ACCESS LEVELS (USERS object in CWE-Main.gs)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Admin      Full access. All claims, all sheets, Admin Tools menu.
 *  Supervisor Same as Admin for claim viewing. Gets Admin Tools. Badge: ASP
 *  Manager    All claims visible. No Admin Tools.
 *  Biller     Own practice claims only. No Admin Tools.
 *  Blocked    No access.
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * MENU STRUCTURE
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Claims Engine
 *    Log New Issue          showNewIssueForm()          CWE-Forms.gs
 *    Open Dashboard         openDashboardSidebar()      CWE-Dashboard.gs
 *    Training Center        openTrainingCenter()        CWE-AppView.gs
 *    View Activity Log      openActivityLog()           CWE-Workflows.gs
 *    References
 *      CARC Reference       openRefCARC()               CWE-AppView.gs
 *      MAC Jurisdiction Map openRefMACs()               CWE-AppView.gs
 *      MassHealth Carrier   openRefMassHealth()         CWE-AppView.gs
 *      Global Period Ref    openRefGlobalPeriods()      CWE-AppView.gs
 *    Admin Tools  [Admin/Supervisor only]
 *      Setup System         setupAllSheets()            CWE-Setup.gs
 *      Activate App View    setupAppView()              CWE-AppView.gs
 *      Refresh Metrics      refreshMetrics()            CWE-AppView.gs
 *      Rebuild Canvas       refreshCanvas()             CWE-AppView.gs
 *      Show All Sheets      showAllSheets()             CWE-AppView.gs
 *      Hide Data Sheets     hideDataSheets()            CWE-AppView.gs
 *      Import Reference Data showImportGuide()          CWE-Setup.gs
 *      Manage Users         showUserManagement()        CWE-Main.gs
 *      Programming Alerts   openProgrammingAlerts()     CWE-Workflows.gs
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * FUNCTION DIRECTORY
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  CWE-Main.gs
 *    USERS {}             Email → { name, level, practices[] }. Add users here.
 *    COL {}               Column name → 0-based index. Edit if columns change.
 *    getCurrentUser()     Active email → { name, level, practices[], email }
 *    getVisibleUsers(u)   Users visible for reassignment based on level
 *    canViewClaim(c,u)    true/false — Billers blocked from other practices
 *    onOpen()             Builds menu. Simple trigger — no UI permissions.
 *
 *  CWE-AppView.gs
 *    setupAppView()       Hides sheets, builds canvas, sets chrome. Run once.
 *    refreshMetrics()     Updates 4 metric cells + stage counts + timestamp.
 *                         SAFE — preserves all drawings. Run routinely.
 *    refreshCanvas()      Full canvas rebuild. WIPES drawings. Use sparingly.
 *    openTrainingCenter() Opens CWE_V2_Training.html modal 1100x700
 *    showAllSheets()      Admin: unhide all sheets
 *    hideDataSheets()     Admin: hide everything except CWE App
 *    openRefCARC()        Shows REF-CARC sheet
 *    openRefMACs()        Shows REF-MACs sheet
 *    openRefMassHealth()  Shows REF-MassHealth sheet
 *    openRefGlobalPeriods() Shows REF-GlobalPeriods sheet
 *    cweBuildCanvas(ss)   Full canvas builder. No cell merging. 34 rows.
 *    cweGetMetrics(ss)    Calls getDashboardData(), returns metrics object
 *    cweFmt(n)            Number formatter: 1234→"1.2K", 1234567→"1.2M"
 *    cweCell/cweBlock/cweRow/cweBorder   Drawing primitives (no merging)
 *
 *  CWE-Dashboard.gs
 *    openDashboardSidebar()     Opens CWEApp.html sidebar (width 450)
 *    getDashboardData()         Reads Claims, returns metrics + queue
 *                               DASH_OPEN_STAGES: NEW, WORKING, ESCALATED,
 *                               APPEALED, PENDING, PENDING INFO,
 *                               IN PROGRESS, CONTRACT PULLED
 *                               criticalHigh: uses indexOf() for "Critical (Past Due)"
 *                               byStageCounts: raw cell value, case-sensitive
 *    getWorkflowData(row)       Full claim payload for sidebar click
 *    buildPayerInfoDark(issue)  HTML: payer details block
 *    buildMACInfoDark(issue)    HTML: MAC info for Medicare claims
 *    buildWorkflowHTMLDark(i,c) HTML: CARC decision tree steps
 *    dashboardLogNewIssue()     → showNewIssueForm() from sidebar
 *    dashboardOpenSidebarForRow(row)
 *    dashboardActivateClaimsSheet()
 *
 *  CWE-Reference.gs
 *    getPractices()             All practices from REF-Practices
 *    getProvidersByPractice(id) Providers by practice ID
 *    getPayersByState(state)    Payers by state abbreviation
 *    lookupCARC(code)           { description, groupCode, action }
 *    getCARCAction(code)        Action string only
 *    getMACsForState(state)     MAC entries for state
 *    getDenialCategories()      All REF-Denials rows
 *    getCARCMatches(carc)       Returns { denialCategory } for auto-fill
 *
 *  CWE-Workflows.gs
 *    saveIssue(data)            Write new or updated claim
 *    resolveIssue(row, data)    Mark resolved, set date
 *    moveToStage(stage)         Update WORKFLOW_STAGE
 *    logActivity(id, msg, type) Append to Activity Log
 *    openActivityLog()          Show Activity Log sheet
 *    openProgrammingAlerts()    Show Programming Alerts sheet
 *    getIssueData(row)          Full claim object for row
 *    getTypeColor(issueType)    Hex color for issue type badge
 *
 *  CWE-Forms.gs
 *    showNewIssueForm()         Open IntakeForm.html modal
 *    showEditIssueForm(row)     Open IntakeForm pre-filled
 *    buildClaimOptions(i,u)     HTML: action buttons for sidebar
 *    buildUserOptions(user)     HTML: reassign dropdown
 *    buildRootCauseWorkflow(i,c) Fallback workflow HTML
 *
 *  CWE-CARC-Workflows.gs
 *    buildWorkflowHTMLDark(issue, color)
 *      50 custom CARC decision trees + 14 pattern templates.
 *      Called by getWorkflowData() in CWE-Dashboard.gs.
 *
 *  CWE-Setup.gs
 *    setupAllSheets()           Create all sheets, apply formatting
 *    showImportGuide()          Modal: REF data import instructions
 *    showUserManagement()       Modal: add/edit users
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CANVAS LAYOUT — CWE App Sheet
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Column widths: A=14px margin, B/D/F/H/J/L=188px tiles, C/E/G/I/K/M=14px gaps
 *
 *  Row 1     Top bar: CWE V2.5 | CLAIMS WORKFLOW ENGINE | timestamp
 *  Row 3     Hero title (OVERFLOW)
 *  Row 4     Subtitle (OVERFLOW)
 *  Row 6     LIVE METRICS label
 *  Rows 7-10 Metric tiles — B:Open Claims, D:Critical/High, F:Escalated, H:Exposure
 *  Row 8     Values (font 26, OVERFLOW, hardcoded hex colors)
 *  Row 9     Labels (font 9, muted)
 *  Rows 13-17 ACTION ZONE — drawing buttons float here
 *  Row 19    QUICK REFERENCES label
 *  Rows 20-23 Cards row 1: B=CARC(internal), F=CMS Coverage(external), J=NCCI(external)
 *  Rows 25-28 Cards row 2: B=MACs(internal), F=MassHealth(internal), J=GlobalPeriods(internal)
 *  Row 30    WORKFLOW STAGES label
 *  Row 31    Stage badges: B=NEW, D=WORKING, F=PENDING INFO, H=APPEALED,
 *                          J=ESCALATED, L=RESOLVED, N=CLOSED
 *  Row 32    Live counts per stage
 *  Row 34    Footer (OVERFLOW)
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DESIGN SYSTEM — COLORS
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  BG:      #0d1117   SURFACE:  #161b22   SURFACE2: #21262d   BORDER: #30363d
 *  ACCENT:  #58a6ff   GREEN:    #3fb950   WARN:     #d29922   DANGER: #f85149
 *  PURPLE:  #a5a3ff   TEXT:     #e6edf3   MUTED:    #8b949e
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * KNOWN ISSUES AND DECISIONS
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  onSelectionChange trigger CANNOT call showSidebar() or showModalDialog().
 *    Use drawing buttons with assigned scripts for action tiles instead.
 *
 *  Cell merges cause rebuild errors.
 *    Zero merges anywhere in canvas. All layout uses OVERFLOW wrap strategy.
 *
 *  "In Progress" and "Contract Pulled" are valid stage values from CWE-Forms.gs.
 *    Both included in DASH_OPEN_STAGES as of V2.4.
 *    Stage aliases in refreshMetrics()/cweBuildCanvas() handle variants.
 *
 *  criticalHigh uses indexOf() not === to catch "Critical (Past Due)".
 *
 *  Installable triggers (onOpen, openDashboardSidebar) required for sidebar
 *    auto-open. DO NOT delete. Simple trigger onOpen() builds menu only.
 *
 *  refreshMetrics() SAFE — preserves drawings.
 *  refreshCanvas() / setupAppView() WIPE drawings — re-add after running.
 *
 *  Metric value colors hardcoded as hex in refreshMetrics() mTiles array.
 *    (C.COLOR references don't resolve reliably in installable trigger context)
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CHANGE LOG
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  V2.5  March 2026
 *    - B3/B4 hero text: OVERFLOW wrap (no merging)
 *    - Subtitle: "Multi-specialty outpatient billing" only
 *    - Internal ref cards: "📂 Open internal reference" label (no function name)
 *    - NCCI URL corrected: /national-correct-coding-initiative-ncci-edits
 *    - CWE-Docs.gs rewritten as full master reference (this file)
 *
 *  V2.4  March 2026
 *    - CWE-AppView.gs created: single-screen interactive canvas
 *    - refreshMetrics() safe update, refreshCanvas() full rebuild
 *    - 6 resource cards (2 external, 4 internal)
 *    - Stage badges with live counts
 *    - References submenu in Claims Engine menu
 *    - DASH_OPEN_STAGES expanded, criticalHigh indexOf fix
 *
 *  V2.3  Feb 2026
 *    - CWEApp.html unified sidebar
 *    - Date serialization fix in getDashboardData
 *
 *  V2.2  Feb 2026
 *    - CWE-CARC-Workflows.gs: 50 custom trees + 14 templates
 *    - IntakeForm: CARC first, denial auto-fill
 *    - REF-CARC: 297 codes with actions
 *
 *  V2.1  Jan 2026
 *    - GitHub dark theme, priority system, Programming Alerts, MAC block
 *
 *  V2.0  Jan 2026
 *    - Full rebuild: multi-practice, USERS object, COL constants
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DEBUG QUICK REFERENCE (all functions in CWE-Debug.gs)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  "Practice dropdown empty"      debug_getPractices()
 *  "Provider dropdown empty"      debug_getProviders()
 *  "Payer dropdown empty"         debug_getPayers()
 *  "CARC search returns nothing"  debug_getCARCLookup()
 *  "Action banner not showing"    debug_getCARCLookup()
 *  "MAC block missing"            debug_getMACLookup()
 *  "Wrong name / can't log in"    debug_getCurrentUser()
 *  "Can't see certain claims"     debug_getCurrentUser()
 *  "Sheet missing"                debug_checkSheets()
 *  "Column data shifted"          debug_checkClaimsColumns()
 *  "Form throws error"            debug_testIntakeFormData()
 *  "Sidebar blank or errors"      debug_testSidebarForRow()
 *  "Not sure where to start"      debug_runAll()
 *
 *
 * ═══════════════════════════════════════════════════════════════════════
 * NEW SESSION HANDOFF INSTRUCTIONS
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  1. Upload CWE-Docs.gs only — gives full project context
 *  2. Upload only the specific .gs or .html files being changed
 *  3. State current version: V2.5
 *  4. Files changed most often:
 *       Canvas / metrics / ref sheets  →  CWE-AppView.gs
 *       Menu structure                 →  CWE-Main.gs
 *       Dashboard / sidebar data       →  CWE-Dashboard.gs
 *       Claim writing / stages         →  CWE-Workflows.gs
 *       Intake form UI                 →  CWE-Forms.gs + IntakeForm.html
 *       CARC decision trees            →  CWE-CARC-Workflows.gs
 *       Sheet setup / structure        →  CWE-Setup.gs
 *       Add / change users             →  CWE-Main.gs (USERS object)
 */