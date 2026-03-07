# Claims Workflow Engine — Project Instructions
## Current Version: V2.5 (Release Candidate)
## Last Updated: 2026-03-07

---

## Project Overview

A Google Sheets-based claims management system. Billing staff work denied, rejected, underpaid, and internally flagged claims through a persistent sidebar dashboard. All workflow actions happen through the sidebar — billers never touch the Claims sheet directly.

**Repo:** `https://github.com/craigaspmdinc-droid/cwe-v2`
**Raw file URL pattern:** `https://raw.githubusercontent.com/craigaspmdinc-droid/cwe-v2/main/[filename]`

**Environments:**
- `Claims Workflow Engine V2.5` — **Production** (shared with billers, clean data)
- `CWE V2.5 — Sandbox` — **Development/Testing** (safe to break)

---

## Architecture

### Sheet Tabs
| Tab | Purpose | Who Edits |
|-----|---------|-----------|
| CWE App | Live canvas — team-wide metrics and stage counts | System (auto) |
| Claims | Backend claim data — never edit directly | System via sidebar |
| Activity Log | Full audit trail of all actions and edits | System (auto) |
| REF-Practices | Practice names, addresses, states | Supervisor only |
| REF-Payers | Payer rules, timely filing, appeal windows | Supervisor only |
| REF-CARC | Denial codes and suggested actions | Supervisor only |
| REF-MACs | Medicare Administrative Contractors by state | Supervisor only |
| REF-GlobalPeriods | CPT global period lengths | Supervisor only |
| REF-Denials | Denial and rejection categories | Supervisor only |

### Column Map (Claims Sheet) — AUTHORITATIVE
Source of truth: `COL` object in `CWE-Main.js`. All indexes are zero-based.
**Verified directly from codebase on 2026-03-07. Previous versions of this doc had an incorrect column map.**

| Index | Col | Constant | Notes |
|-------|-----|----------|-------|
| 0 | A | ISSUE_ID | Auto-generated |
| 1 | B | DATE_LOGGED | Auto |
| 2 | C | LOGGED_BY | |
| 3 | D | ISSUE_TYPE | Denial / Rejection / Payment Issue / Internal |
| 4 | E | PRACTICE | |
| 5 | F | PRACTICE_NPI | |
| 6 | G | PROVIDER | |
| 7 | H | PROVIDER_NPI | |
| 8 | I | PAYER | |
| 9 | J | CPT | |
| 10 | K | DOS | Date of Service |
| 11 | L | EXPECTED_AMT | |
| 12 | M | PAID_AMT | |
| 13 | N | VARIANCE | Auto-calculated |
| 14 | O | ROOT_CAUSE | |
| 15 | P | WORKFLOW_STAGE | NEW / WORKING / PENDING INFO / APPEALED / ESCALATED / RESOLVED / CLOSED |
| 16 | Q | PRIORITY | Critical / High / Medium / Low |
| 17 | R | ASSIGNED_TO | |
| 18 | S | DATE_RESOLVED | |
| 19 | T | DAYS_OPEN | |
| 20 | U | ISSUE_DETAILS | Also used as CARC code for denials |
| 21 | V | BATCH_ID | Internal issues |
| 22 | W | STATE | |
| 23 | X | ACCOUNT_NUMBER | |
| 24 | Y | DENIAL_CATEGORY | |
| 25 | Z | DENIAL_DATE | |
| 26 | AA | APPEAL_DUE | |
| 27 | AB | RESUBMISSION_DATE | |
| 28 | AC | COVERAGE_TYPE | |
| 29 | AD | CARC_DESCRIPTION | |
| 30 | AE | RARC_CODE | |
| 31 | AF | RARC_DESCRIPTION | |
| 32 | AG | CARC_GROUP_CODE | |
| — | — | TOTAL_COLS = 33 | Always fetch at least 33 columns |

### Key Constants (CWE-Main.js)
```javascript
var DASH_OPEN_STAGES = ['NEW', 'WORKING', 'ESCALATED', 'APPEALED', 'PENDING', 'PENDING INFO', 'IN PROGRESS', 'CONTRACT PULLED', 'CONTRACT_PULLED'];
var DASH_QUEUE_MAX   = 15;
var COL.TOTAL_COLS   = 33;
```

---

## Files & Responsibilities

| File | Purpose |
|------|---------|
| `CWE-Main.js` | COL constants, USERS config, menu setup (`onOpen`), permissions |
| `CWE-Dashboard.js` | Dashboard rendering, queue logic, metrics, Viewing As |
| `CWE-Workflows.js` | Claim stage transitions, activity logging, resolution |
| `CWE-Forms.js` | Intake form and edit form template rendering |
| `CWE-Reference.js` | REF sheet lookups, test claim data generation |
| `CWE-PIR.js` | Practice Intelligence Report — data engine + menu launcher (added 2026-03-07) |
| `IntakeForm.html` | Log New Issue modal — all four claim types |
| `CWEApp.html` | Sidebar dashboard — queue, metrics, workflow view, PIR strip |
| `PIR.html` | Practice Intelligence Report template (added 2026-03-07) |
| `CWERefViewer.html` | Reference data viewer |
| `CWE_V2_Training.html` | Full training center (V2.5 — current) |
| `Sidebar.html` | Legacy — superseded by CWEApp.html |
| `Dashboard.html` | Legacy — superseded by CWEApp.html |

---

## Users & Permission Levels

Defined in `USERS` object in `CWE-Main.js`.

| Group | Level | Members |
|-------|-------|---------|
| ASP | Admin | Craig, Chris, Nate, Peter, Kara |
| A3MB | Analyst | Pia, Belle, Angel, Ynna, Allen, Ella, Yvette, Minnie, Sheila |
| Accudoc | Analyst | Yaseen, Praveen, Anitha, Vijay |

Admins see all claims. Analysts see their own + their group's claims. Blocked users get access denied alert.

---

## Completed Features (V2.5)

- ✅ Persistent sidebar dashboard — auto-opens on sheet load
- ✅ Log New Issue → IntakeForm modal (all 4 claim types)
- ✅ New claim auto-opens in workflow view after submission
- ✅ Dashboard metrics: Total Open, Critical/High, Escalated, $ Variance
- ✅ Queue: capped at 15 (DASH_QUEUE_MAX), sorted by priority then aging
- ✅ By Stage / By Priority breakdown bars
- ✅ Supervisor "Viewing As" dropdown
- ✅ Edit Claim Details — prefills all fields correctly
- ✅ Resolution Form — action, outcome, notes with AI Polish option
- ✅ Activity Log — field-level change tracking
- ✅ Canvas auto-refresh on new claim
- ✅ Field validation on intake form
- ✅ Test Claim button (Admin-only)
- ✅ MAC lookup for Medicare claims
- ✅ CARC action guidance — decision tree by denial type
- ✅ Global Period alerts at intake
- ✅ Training Center V2.5 — 1,438 lines, 27 sections, First Time Setup, 8 scenarios, 25-question quiz
- ✅ Practice Intelligence Report — built 2026-03-07, **not yet tested**
  - Full report modal: 10 sections, live data from Claims sheet
  - Sidebar strip: collapsible, headline stats + top alert + "Open Full Report" button
  - Admin menu entry point: `openPracticeIntelligenceReport()`
  - Sidebar data endpoint: `getPIRSummary(practiceName)`

---

## PIR — Pending Test Checklist

- [ ] clasp push all changes
- [ ] Menu item appears in Admin Tools after reload
- [ ] Practice selector prompt lists all practices
- [ ] Valid practice name → full report modal with live data
- [ ] Blank input → ALL practices report
- [ ] Invalid name → graceful error, no crash
- [ ] PIR strip visible at bottom of dashboard (collapsed)
- [ ] Click strip → expands, loads, renders stats
- [ ] "Open Full Report →" triggers modal
- [ ] Practice with zero claims → graceful error, no crash

---

## Known Limitations / Deferred

| Feature | Status | Notes |
|---------|--------|-------|
| AI Polish | Deferred | Add `ANTHROPIC_API_KEY` to Script Properties |
| Timely filing alerts | Deferred | Date compare against REF-Payers |
| Duplicate account# detection | Deferred | |
| PIR strip auto-refresh on Viewing As change | Deferred | Hook `loadPIRStrip()` into `onViewingChange()` |
| Rename CWE-Docs.js → CWE-Docs.md | Pending | It's a doc file, not a script |

---

## Deployment

```bash
clasp push
git add .
git commit -m "message"
git push
```

### Adding PIR Menu Item (Still Required)
In `CWE-Main.js` `onOpen()`, inside the Admin submenu:
```javascript
.addItem('📈 Practice Intelligence Report', 'openPracticeIntelligenceReport')
```

### First-Time Authorization
1. Claims Engine menu → Open Dashboard
2. Google OAuth → "Google hasn't verified this app" → Advanced → Go to app (unsafe)
3. Continue → Select All → Continue (one-time only)

### Clearing Production Data
1. Delete all rows below header in Claims sheet and Activity Log
2. Admin Tools → Refresh Metrics
3. Verify 0 open claims before sharing with billers

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Sidebar as primary UI | Billers stay out of raw Claims sheet; all actions audited |
| Queue capped at 15 | Performance on full sheet scan |
| TOTAL_COLS = 33 | Must update if columns added |
| CacheService for auto-open | HtmlService and Apps Script don't share memory |
| PropertiesService for API key | Correct location for secrets |
| Two environments | Live billers not disrupted by dev changes |
| PIR hybrid data model | Structured data in REF sheets; narrative rules in linked Google Doc per practice |

---

## Session History

### 2026-03-04
Resolution flow, new claim auto-open, Canvas refresh, supervisor metrics sync, edit form prefill, plan type column, field validation, test claim button, queue cap.

### 2026-03-06
Training Center full rewrite. First Time Setup guide. Production/Sandbox split.

### 2026-03-07
Practice data architecture (hybrid model) decided. Monetization strategy v2 built. PIR mockup approved. CWE-PIR.js + PIR.html built. Sidebar intelligence strip integrated into CWEApp.html. COL constants verified — previous column map was incorrect, now corrected. Three continuity docs established: ProjectInstructions, Docs, Vision.

---

## Session-End Ritual (Every Session — No Exceptions)
1. Update `CWE-ProjectInstructions.md`
2. Update `CWE-Docs.md`
3. Update `CWE-Vision.md`
4. Upload all three to Claude project to replace previous versions