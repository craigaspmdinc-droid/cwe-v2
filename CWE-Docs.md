# Claims Workflow Engine — Code Reference
## Last Updated: 2026-03-07

This document is the technical reference for the CWE codebase. It covers function inventory, file responsibilities, sidebar patterns, and architectural notes. It is updated every session alongside CWE-ProjectInstructions.md.

---

## File Inventory

### CWE-Main.js
**Purpose:** Foundation file. Loaded first by Apps Script. Contains all shared constants, the user registry, permission logic, and the menu.

**Key contents:**
- `USERS` — email-keyed object with name, group, level for every authorized user
- `COL` — zero-based column index constants for the Claims sheet (33 columns, TOTAL_COLS = 33)
- `DASH_OPEN_STAGES` — array of stage strings considered "open" for queue and metrics
- `DASH_QUEUE_MAX = 15`

**Functions:**
| Function | Purpose |
|----------|---------|
| `onOpen()` | Builds the Claims Engine menu; blocked users get access denied alert |
| `getCurrentUser()` | Returns user object from USERS, or Blocked if email not found |
| `getVisibleUsers(user)` | Returns list of names visible to given user (Admins see all; Analysts see own group) |
| `canViewClaim(claim, user)` | Returns true if user has permission to view the given claim |

---

### CWE-Dashboard.js
**Purpose:** All sidebar dashboard logic — metrics calculation, queue building, stage/priority breakdown bars, Viewing As selector.

**Key constants (local to this file):**
```javascript
var DASH_OPEN_STAGES = [...]; // mirrors CWE-Main.js
var DASH_QUEUE_MAX   = 15;
```

**Functions:**
| Function | Purpose |
|----------|---------|
| `openDashboardSidebar()` | Opens CWEApp.html as sidebar |
| `getDashboardData(viewingAs)` | Main data endpoint — returns metrics, queue, stage/priority rows |
| `refreshMetrics()` | Recalculates and writes metrics to the CWE App canvas sheet |
| `onViewingChange()` | Client-side handler when supervisor changes Viewing As dropdown |

---

### CWE-Workflows.js
**Purpose:** All claim state changes — stage transitions, editing, resolving, escalating. Every action writes to the Activity Log.

**Functions:**
| Function | Purpose |
|----------|---------|
| `logNewIssue()` | Menu entry point — opens IntakeForm modal |
| `submitNewIssue(formData)` | Writes new claim row to Claims sheet; triggers canvas refresh |
| `updateClaimStage(issueId, newStage)` | Transitions stage; logs change |
| `resolveIssue(issueId, resolutionData)` | Sets stage to RESOLVED/CLOSED; writes resolution fields |
| `editClaimDetails(issueId, updates)` | Field-level edit; logs each changed field to Activity Log |
| `getClaimById(issueId)` | Returns full claim row as object |
| `logActivity(issueId, action, details, user)` | Writes one row to Activity Log |

---

### CWE-Forms.js
**Purpose:** Generates HTML for the intake form and edit form. Returns populated template strings to the sidebar.

**Functions:**
| Function | Purpose |
|----------|---------|
| `showNewIssueForm()` | Entry point — loads IntakeForm.html with reference data pre-populated |
| `getIntakeFormData()` | Returns all REF data needed to populate form dropdowns |
| `showEditForm(issueId)` | Loads edit form pre-filled with current claim data |
| `getEditFormData(issueId)` | Returns claim data + REF data for edit form population |

---

### CWE-Reference.js
**Purpose:** REF sheet lookups and test claim generation.

**Functions:**
| Function | Purpose |
|----------|---------|
| `getRefPractices()` | Returns practice list from REF-Practices |
| `getRefPayers()` | Returns payer list from REF-Payers |
| `getRefCARCs()` | Returns CARC codes + descriptions from REF-CARC |
| `getMACForState(state)` | Returns Part B MAC name for given state abbreviation |
| `getGlobalPeriod(cptCode)` | Returns global period length for CPT code, or null |
| `logTestClaim()` | Admin-only — generates realistic test claim from REF data |

---

### CWE-PIR.js *(added 2026-03-07)*
**Purpose:** Practice Intelligence Report data engine. Reads Claims sheet, calculates all 10 report sections, returns structured data. Also serves as the menu entry point for the full report and the data endpoint for the sidebar strip.

**Alert thresholds:**
```javascript
var PIR_ALERT_THRESHOLDS = {
  dangerDenialRate:  45,  // % — red alert
  warnDenialRate:    30,  // % — amber alert
  minClaimsForAlert:  5   // don't flag codes with fewer claims than this
};
```

**Public functions (called from menu or sidebar):**
| Function | Purpose |
|----------|---------|
| `openPracticeIntelligenceReport()` | Menu entry point. Prompts for practice, generates data, opens PIR.html modal |
| `getPIRSummary(practiceName)` | Sidebar strip endpoint. Returns condensed data object for strip rendering |
| `getPIRPracticeList_()` | Returns sorted array of unique practice names from Claims sheet (private helper, but useful to know) |

**Private functions:**
| Function | Purpose |
|----------|---------|
| `generatePIRData_(practiceName)` | Core engine. Returns full 10-section data object. Pass 'ALL' for all practices |
| `uniqueVals_(rows, colIdx)` | Returns sorted unique non-empty values from a column across all rows |

**Return shape of `generatePIRData_`:**
```javascript
{
  profile:    { name, reportPeriod, activeSince, totalMonths, providers, payers, cptCount, generatedAt },
  volume:     { total, byType[], monthlyAvg, peakMonth, monthCounts{} },
  cptStats:   [ { cpt, claims, denialRate, avgBilled, recovRate, flag } ],
  denials:    { total, byVolume[], byDollar[], byCategory[] },
  payerStats: [ { payer, claims, denialRate, denRateFlag, avgDays, topDenial, recovRate } ],
  resolution: { totalClosed, byType[], topActions[] },
  financial:  { totalBilled, totalRecovered, openExposure, openExposureRaw, writeOffTotal, recoveryRate, openCount },
  escalation: { count, rate, avgResolveDays, topReason },
  alerts:     [ { level, title, body } ],   // level: 'danger' | 'warn' | 'ok'
  opsNotes:   [ { tag, text } ]
}
```

---

### IntakeForm.html
**Purpose:** Log New Issue modal. Supports all four claim types: Denial, Rejection, Payment Issue, Internal. Dynamic field show/hide based on claim type selection. Validates required fields before submit.

**Key behaviors:**
- Account# OR PTID — at least one required, not both
- CARC code OR Denial Category — at least one required for Denial type
- Global Period alert fires if CPT code matches REF-GlobalPeriods
- MAC lookup fires if Coverage Type is Medicare and practice state is set

---

### CWEApp.html
**Purpose:** The sidebar. Single-file HTML/CSS/JS app. Opens as a persistent 450px sidebar. All biller interaction happens here.

**Views (toggled by JS):**
- `#view-dashboard` — default; metrics, queue, PIR strip
- `#view-workflow` — single claim detail; stage transitions, edit, resolve
- `#view-reference` — REF data viewer

**Design tokens (CSS variables):**
```css
--bg, --surface, --surface2, --border, --accent, --accent2,
--text, --muted, --warn, --danger, --mono, --sans
```

**Server call pattern:**
```javascript
google.script.run
  .withSuccessHandler(callbackFn)
  .withFailureHandler(errFn)
  .serverFunctionName(args);
```

**PIR strip functions (added 2026-03-07):**
| Function | Purpose |
|----------|---------|
| `togglePIRStrip()` | Opens/closes strip; triggers first load on first open |
| `loadPIRStrip(practiceName)` | Calls `getPIRSummary()` server function; shows loading state |
| `renderPIRStrip(data)` | Renders strip content from returned data object |
| `statHTML(label, val, cls)` | Helper — returns stat card HTML string |
| `openFullPIR()` | Calls `openPracticeIntelligenceReport()` server function |

---

### PIR.html *(added 2026-03-07)*
**Purpose:** Full Practice Intelligence Report template. Loaded as a modal dialog (1180×860). Receives data via Apps Script template injection (`<?= reportDataJson ?>`). All rendering is client-side JavaScript.

**Design:** DM Serif Display + DM Sans + DM Mono. Light theme, dark header. Matches approved mockup.

**10 sections rendered:**
1. Practice Profile — metadata grid
2. Claim Volume — donut legend + monthly sparkline
3. CPT Codes — table with inline denial rate bars + flag column
4. Denial Patterns — top by volume + top by dollar impact (side by side)
5. Payer Performance — table with color-coded denial rates
6. Resolution Patterns — avg days by type + top resolution pathways
7. Financial Summary — 4-card grid (billed, recovered, exposure, write-offs)
8. Escalation Profile — 3-card grid
9. Coding Alerts — auto-generated from PIR_ALERT_THRESHOLDS
10. Operational Notes — practice guide link + auto-detected patterns

---

## Sidebar Architecture Notes

- Sidebar opens via: `HtmlService.createHtmlOutputFromFile('CWEApp').setTitle('CWE V2.5').setWidth(450)`
- Auto-open on sheet load uses `CacheService` to persist state across context boundary
- All server calls are async (`google.script.run`) — UI must handle loading states
- No direct sheet access from client side — all data comes through server functions

---

## Activity Log Schema

Every claim action writes one row:
| Column | Content |
|--------|---------|
| A | Timestamp |
| B | Issue ID |
| C | Action type (LOGGED / STAGE_CHANGE / EDIT / RESOLVED / etc.) |
| D | User name |
| E | Field changed (for EDIT actions) |
| F | Old value |
| G | New value |
| H | Notes / details |

---

## Known Technical Debt

- `Sidebar.html` and `Dashboard.html` are legacy files — can be deleted after confirming no references remain
- Column map in older versions of CWE-ProjectInstructions.md was incorrect — corrected 2026-03-07
- `CWE-Docs.js` should be renamed to `CWE-Docs.md` in the repo (`git mv`)
- PIR sidebar strip should auto-reload when Viewing As practice changes — needs hook into `onViewingChange()`