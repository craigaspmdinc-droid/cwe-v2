/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              CLAIMS WORKFLOW ENGINE V2.5                              ║
 * ║                       CWE-Docs.gs                                    ║
 * ║  PURPOSE: Human-readable codebase reference. No executable code.     ║
 * ║           Update this file at the end of every development session.  ║
 * ║  Last Updated: 2026-03-03                                            ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SECTION 1 — FILE OVERVIEW
 * ═══════════════════════════════════════════════════════════════════════
 *
 * CWE-Main.gs
 *   COL constants (zero-based column index map for Claims sheet)
 *   USERS map (email -> { name, group, level })
 *   Permission functions: getCurrentUser, getVisibleUsers, canViewClaim
 *   onOpen menu builder
 *
 * CWE-Workflows.gs
 *   Claim CRUD: logNewIssue, updateIssue, updateIssueField
 *   Resolution: resolveIssue (accepts resolutionData object since V2.5)
 *   Activity logging: logActivity, logActivityFromSidebar, logResearchAndAdvance
 *   Priority + root cause: calculatePriority, determineRootCause
 *   AI polish: polishResolutionNote (server-side Anthropic API via UrlFetchApp)
 *   Data reader: getIssueData
 *   Alerts: checkProgrammingAlert
 *
 * CWE-Dashboard.gs
 *   getDashboardData - builds full dashboard payload for CWEApp.html
 *   getWorkflowData - builds workflow payload for sidebar
 *   openDashboardSidebar - launches CWEApp.html as sidebar
 *   buildPayerInfoDark, buildMACInfoDark, buildWorkflowHTMLDark
 *
 * CWE-Forms.gs
 *   showNewIssueForm - opens IntakeForm.html in new mode
 *   showEditIssueForm - opens IntakeForm.html in edit mode with prefill data
 *   openWorkflowSidebarByRow - calls openDashboardSidebar()
 *   buildClaimOptions, buildUserOptions, buildPayerInfo, buildMACInfo
 *   Workflow builders (one per denial type):
 *     buildRootCauseWorkflow, buildResearchWorkflow, buildPatientContactWorkflow,
 *     buildProviderContactWorkflow, buildResubmitWorkflow, buildAppealWorkflow,
 *     buildDuplicateWorkflow, buildSendInfoWorkflow, buildDisputeWorkflow,
 *     buildPatientRespWorkflow, buildMassHealthWorkflow, buildCredentialingWorkflow,
 *     buildProgrammingWorkflow, buildGenericWorkflow
 *   buildProgressBar, getTypeColor, getCARCAction
 *
 * CWE-Docs.gs (this file)
 *   Comment-only reference. No executable code. Update each session.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SECTION 2 — HTML TEMPLATES
 * ═══════════════════════════════════════════════════════════════════════
 *
 * CWEApp.html
 *   Main dashboard sidebar. Dark theme.
 *   Sections: metrics cards, By Stage breakdown, By Priority breakdown,
 *             claim queue, supervisor Viewing-as bar (Admin only)
 *   Key JS functions:
 *     renderDashboard(d) - populates all sections from getDashboardData()
 *     renderQueueForViewing() - filters queue by viewingUser if set
 *     renderBreakdownsForViewing() - recomputes stage/priority from filtered queue
 *     renderMetricsForViewing() - recomputes top metrics cards from filtered queue
 *     onViewingChange() - fires when supervisor switches Viewing-as dropdown
 *     showWorkflow(row) - loads workflow view for a claim
 *     markResolved() - expands inline resolution capture form (no modal)
 *     polishWithAI() - calls google.script.run.polishResolutionNote()
 *     confirmResolve() - validates and calls resolveIssue()
 *     updateCharCount() - live 600-char counter for resolution notes
 *
 * IntakeForm.html
 *   New claim intake + edit form. Served as modal dialog.
 *   Issue type buttons (Denial/Rejection/Payment/Internal) reveal relevant fields.
 *   Edit mode: prefillForm() populates all fields from existing claim data.
 *   CRITICAL: selectIssueType(type, el) - optional el param avoids
 *     event.currentTarget crash when called programmatically.
 *   ALL JS scriptlets use <?!= ?> never <?= ?> for JSON/JS data.
 *
 * Sidebar.html - Sidebar container/launcher
 * Dashboard.html - Standalone dashboard view
 * CWERefViewer.html - Reference data viewer (CARC, RARC, payers, MACs)
 * CWE_V2_Training.html - Biller training and onboarding guide
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SECTION 3 — COLUMN MAP (Claims Sheet, Zero-Based)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * COL.ISSUE_ID          = 0   (A)  Auto-generated ISS-YYYYMMDD-N
 * COL.DATE_LOGGED       = 1   (B)  DATE - never store as string
 * COL.LOGGED_BY         = 2   (C)
 * COL.ISSUE_TYPE        = 3   (D)  Denial / Rejection / Payment / Internal
 * COL.PRACTICE          = 4   (E)
 * COL.PRACTICE_NPI      = 5   (F)
 * COL.PROVIDER          = 6   (G)
 * COL.PROVIDER_NPI      = 7   (H)
 * COL.PAYER             = 8   (I)
 * COL.CPT               = 9   (J)
 * COL.DOS               = 10  (K)  DATE - serialize carefully
 * COL.EXPECTED_AMT      = 11  (L)
 * COL.PAID_AMT          = 12  (M)
 * COL.VARIANCE          = 13  (N)  Computed: Paid - Expected
 * COL.ROOT_CAUSE        = 14  (O)  Auto from CARC lookup
 * COL.WORKFLOW_STAGE    = 15  (P)  New/In Progress/Research Complete/Escalated/Resolved
 * COL.PRIORITY          = 16  (Q)  Critical (Past Due)/High (Urgent)/Medium/Low
 * COL.ASSIGNED_TO       = 17  (R)
 * COL.DATE_RESOLVED     = 18  (S)  DATE - set with new Date()
 * COL.DAYS_OPEN         = 19  (T)  Sheet formula - do NOT overwrite
 * COL.ISSUE_DETAILS     = 20  (U)  CARC code for denials
 * COL.BATCH_ID          = 21  (V)
 * COL.STATE             = 22  (W)  Used for payer lookup by state
 * COL.ACCOUNT_NUMBER    = 23  (X)  Patient account # in billing system
 * COL.DENIAL_CATEGORY   = 24  (Y)  Maps to REF-Denials sheet
 * COL.DENIAL_DATE       = 25  (Z)  DATE
 * COL.APPEAL_DUE        = 26  (AA) DATE - computed from denial date + payer window
 * COL.RESUBMISSION_DATE = 27  (AB) DATE
 * COL.COVERAGE_TYPE     = 28  (AC) e.g. Medicare Part B, Commercial
 * COL.CARC_DESCRIPTION  = 29  (AD) Looked up from REF-CARC
 * COL.RARC_CODE         = 30  (AE)
 * COL.RARC_DESCRIPTION  = 31  (AF)
 * COL.CARC_GROUP_CODE   = 32  (AG) CO / PR / OA / PI
 * COL.COVERAGE_LEVEL    = 33  (AH) Primary / Secondary / Tertiary
 * COL.PTID              = 34  (AI) Patient ID from PM system
 * COL.RELATED_ACCOUNTS  = 35  (AJ) Comma-separated related account numbers
 * COL.RESOLUTION_ACTION = 36  (AK) What fixed it - added V2.5
 * COL.OUTCOME           = 37  (AL) Paid / Pending / Written Off - added V2.5
 * COL.RESOLUTION_NOTES  = 38  (AM) AI-polished comment <=600 chars - added V2.5
 * COL.TOTAL_COLS        = 39      Always = last column index + 1
 *
 * DATE SERIALIZATION WARNING:
 *   DOS, DATE_LOGGED, DATE_RESOLVED, DENIAL_DATE, APPEAL_DUE, RESUBMISSION_DATE
 *   are Date objects. Always use new Date(value) when reading. Never assume string.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SECTION 4 — DATA FLOW
 * ═══════════════════════════════════════════════════════════════════════
 *
 * NEW CLAIM:
 *   IntakeForm.html -> submitIssue() -> google.script.run.logNewIssue(issue)
 *   -> CWE-Workflows:logNewIssue -> appends row to Claims -> logActivity
 *
 * DASHBOARD LOAD:
 *   CWEApp.html loads -> getDashboardData() -> reads Claims sheet
 *   -> returns { queue[], counts, metrics, teamMembers }
 *   -> renderDashboard() populates metrics, breakdowns, queue
 *
 * WORKFLOW VIEW:
 *   Biller clicks claim -> showWorkflow(row) -> getWorkflowData(row)
 *   -> getIssueData + builds HTML -> renders in workflow panel
 *
 * RESOLVE CLAIM (V2.5):
 *   Mark Resolved -> inline form expands ->
 *   optionally Polish with AI -> polishResolutionNote(context)
 *   -> UrlFetchApp calls Anthropic API -> returns polished comment ->
 *   Confirm & Resolve -> resolveIssue(row, { resolutionAction, outcome, resolutionNotes })
 *   -> writes AK/AL/AM, stage=Resolved, logs activity
 *
 * EDIT CLAIM:
 *   Edit Claim Details -> editClaim() -> showEditIssueForm(row)
 *   -> getIssueData -> passes existing to IntakeForm.html template
 *   -> prefillForm() populates fields -> updateIssue() saves editable fields
 *
 * SUPERVISOR VIEW:
 *   Viewing-as dropdown -> onViewingChange() -> sets viewingUser
 *   -> renderMetricsForViewing() + renderQueueForViewing()
 *   + renderBreakdownsForViewing() all filter client-side from allQueue
 *   No server call on view switch.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SECTION 5 — USER & PERMISSION MODEL
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Admin (ASP): Craig, Chris, Nate, Peter, Kara
 *   See all claims + Viewing-as dropdown
 *
 * Analyst (A3MB): Pia, Belle, Angel, Ynna, Allen, Ella, Yvette, Minnie, Sheila
 *   See own + Craig + Accudoc group
 *
 * Analyst (Accudoc): Yaseen, Praveen, Anitha, Vijay
 *   See own + Craig + A3MB group
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SECTION 6 — CRITICAL BUG HISTORY
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Edit form showed only 4 type buttons, no fields
 *   CAUSE: <?= JSON.stringify(existing) ?> HTML-encoded quotes, broke JSON
 *   FIX:   All JS scriptlets changed to <?!= ?>
 *   RULE:  Never use <?= ?> for JavaScript values
 *
 * selectIssueType crashed on programmatic call from prefillForm
 *   CAUSE: event.currentTarget is null when not triggered by real user click
 *   FIX:   Added optional el parameter to selectIssueType(type, el)
 *
 * AI Polish returned "Could not reach AI"
 *   CAUSE: Browser fetch() blocked by Google iframe sandbox
 *   FIX:   Server-side polishResolutionNote() via UrlFetchApp
 *
 * Date stored as serial number
 *   CAUSE: Date serializes as timestamp through JSON
 *   FIX:   Always new Date(value) when reading date columns
 *
 * Sheet switched on workflow click
 *   CAUSE: Leftover activateClaimsSheet() in openWorkflowSidebarByRow()
 *   FIX:   Removed the call
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SECTION 7 — DESIGN DECISIONS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * AI POLISH ROUTING:
 *   All Anthropic API calls go through UrlFetchApp server-side.
 *   Model: claude-haiku (fast, cheap, sufficient for short comment polish)
 *   API key in Script Properties as ANTHROPIC_API_KEY - never in source code.
 *
 * RESOLUTION FORM UX:
 *   Inline expansion, not modal. Biller sees claim context + form together.
 *   600-char limit matches target billing system comments field.
 *   AI proposes, biller approves - always editable before saving.
 *
 * SUPERVISOR VIEW - CLIENT-SIDE FILTERING:
 *   No server call on view switch. Filters allQueue array already in memory.
 *   Metrics, queue, and breakdowns all recompute client-side instantly.
 *
 * PRIORITY CALCULATION:
 *   Critical (Past Due): <=15 days to timely filing deadline
 *   High (Urgent): 16-30 days
 *   Medium: 31-60 days
 *   Low: >60 days
 *   Medicare/Medicaid: 365-day window
 *   Commercial: payer-specific from REF-Payers, default 90 days
 *   Recalculated on every getIssueData() call.
 *
 * PTID / RELATED ACCOUNTS:
 *   PTID = patient ID from PM system
 *   RELATED_ACCOUNTS = comma-separated account numbers for same patient
 *   Green resolution banner shown in workflow when related accounts exist
 */
