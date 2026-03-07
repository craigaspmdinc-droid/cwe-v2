# Claims Workflow Engine — Product Vision & Strategy
## Last Updated: 2026-03-07

This document tracks the strategic vision for CWE — what we're building, why, how it makes money, and where it's going. It is updated every session alongside the technical continuity docs.

---

## What We're Building

A medical billing claims management system built on Google Sheets + Google Apps Script. Billing staff work denied, rejected, underpaid, and internally flagged claims through a persistent sidebar dashboard. Supervisors monitor team performance and practice-level patterns in real time.

**The elevator pitch:**
> CWE turns a Google Sheet into a full claims management platform. No expensive software, no IT setup, no training curve. Billers already know Google Sheets. We just gave it a brain.

---

## Why It's Valuable

Medical billing is a paper-and-spreadsheet industry. Most small-to-mid billing companies manage denials in spreadsheets, sticky notes, and email threads. CWE gives them:

- A structured workflow — every claim has a stage, owner, and audit trail
- Institutional memory — claim patterns, payer behavior, denial trends are captured automatically
- Intelligence — the system learns which CPT codes get denied, which payers are problematic, which practices have documentation issues
- Portability — runs in Google Workspace, which the entire industry already uses

---

## Three-Layer Architecture

| Layer | What | Status |
|-------|------|--------|
| Layer 1 | Practice data (specialty packages, CPT reference, payer rules) | In progress |
| Layer 2 | Workflow engine (sidebar, intake, stage management, activity log) | ✅ Complete |
| Layer 3 | Intelligence layer (PIR, analytics, pattern detection, alerts) | In progress |

**We built middle-out.** Layer 2 (the workflow engine) was built first because it generates the data that Layers 1 and 3 need. Layer 1 enriches the input. Layer 3 analyzes the output.

---

## The Data Flywheel

Every claim logged through CWE passively builds a practice intelligence profile:
- Which CPT codes are being billed
- Which payers are denying and why
- How long each issue type takes to resolve
- Which billers are most effective on which claim types
- Which denial categories repeat across practices

Over time, the system knows things about a practice that no individual biller consciously tracks. That knowledge becomes the product.

---

## Two Types of Practice Knowledge

| Type | What it is | Where it lives |
|------|-----------|----------------|
| Structured | CPT codes, ICD codes, modifiers, frequency limits, payer rules | REF sheets (rows, filterable) |
| Narrative | Billing system steps, date rules, provider-specific rules, VA/Tricare auth flows | Linked Google Doc per practice (the "Practice Guide") |

**Why not a sheet-per-practice:** Google Sheets degrades at 40+ sheets. Universal updates would require editing every practice sheet individually. The hybrid model solves both problems.

---

## Practice Data Architecture (Decided 2026-03-07)

**Hybrid model:**
- Structured CPT/ICD/modifier data → expanded REF-Practices sheet (rows per practice, filterable by practice name)
- Narrative operational rules → one linked Google Doc per practice, surfaced in the workflow view as a one-click "Practice Guide" card
- Practice intelligence → generated from live CWE claim data via the Practice Intelligence Report

**Two real practices analyzed as prototypes:**
- **Mohamed (Pain Management/Spine)** — highly structured coding reference (CPT codes, modifiers, frequency limits, ICD vocabulary). Maps cleanly to REF sheet rows.
- **Reimer (Nephrology/ESRD)** — narrative operations manual (AMOS billing steps, CPT decision logic by scenario, date rules, provider rules, VA auth rules). Maps to a practice guide document.

---

## Specialty Packages

The practice data model enables a specialty package concept: pre-built REF data and practice guide templates for specific specialties.

**Prototype specialties from existing data:**
- Pain Management / Spine Surgery (Mohamed file)
- Nephrology / ESRD (Reimer file)

**Package contents per specialty:**
- Pre-loaded CPT codes with typical billing patterns
- Common denial codes and suggested responses
- Payer-specific rules for that specialty
- Practice Guide template with specialty-specific billing steps

Specialty packages are a natural upsell and a forcing function for building out Layer 1 data.

---

## Practice Intelligence Report (PIR)

Built 2026-03-07. The first concrete product of the intelligence layer.

**10 sections:**
1. Practice Profile
2. Claim Volume & Type Breakdown
3. CPT Codes — Volume & Denial Rate (with flag column)
4. Top Denial Reasons (by volume + by dollar impact)
5. Payer Performance
6. Resolution Patterns
7. Financial Summary
8. Escalation Profile
9. Coding Alerts (auto-generated from denial rate thresholds)
10. Operational Notes (auto-detected patterns + practice guide link)

**Two delivery modes:**
- Full report: generated on demand, opens as modal, printable/shareable
- Sidebar strip: always-on intelligence summary at bottom of supervisor dashboard, updates with practice filter

**Why this matters strategically:** The PIR is the first thing a potential client can hold in their hands. It's tangible proof that the system generates value beyond just tracking claims. It's also the demo piece for the monetization conversation.

---

## Three Monetization Models

### Model A — License & Hand Off (Preferred)
Sell the configured system to a billing company or practice for a one-time setup fee + optional monthly support retainer. They own it, they run it.

- Setup fee: $2,500–$5,000 per client (configuration, REF data loading, training)
- Monthly retainer: $200–$500/month (updates, new features, support)
- Realistic first-year per client: $5,000–$8,000

### Model B — White Label SaaS
Bill companies pay per seat or per practice. We host (via their own Google Workspace), they subscribe.

- Lower upfront friction
- Requires more ongoing support infrastructure
- Better long-term recurring revenue
- More complex to manage across multiple client Workspaces

### Model C — Data & Intelligence Product
Aggregate anonymized denial pattern data across clients to build industry benchmarks. Sell the benchmark data or use it to improve the specialty packages.

- Longest time horizon
- Requires network of clients first
- High value once achieved — "what's the denial rate for CPT 27447 at Cigna nationally?"

**Preferred direction: Model A first, then layer in Model B.**
Get 3–5 paying clients via Model A. Use their real-world usage to validate the product and build case studies. Then productize into Model B with proven ROI story.

---

## Realistic Revenue Range (Near Term)

| Scenario | Clients | Per Client (Year 1) | Annual |
|----------|---------|---------------------|--------|
| Conservative | 3 | $4,000 | $12,000 |
| Base | 5 | $6,000 | $30,000 |
| Optimistic | 8 | $7,500 | $60,000 |

Not life-changing money on its own, but as a side business with minimal ongoing overhead, $30–60K/year is very achievable once the product is polished and has a demo story.

---

## Roadmap to Market (6 Phases)

**Phase 1 — Production Ready** *(current)*
- PIR tested and working
- AI Polish enabled
- Production sheet clean and ready for billers
- Training Center live

**Phase 2 — Internal Validation**
- A3MB and Accudoc teams using it daily
- Collect feedback on pain points
- Fix anything that creates friction

**Phase 3 — Practice Data Build-Out**
- Load Mohamed specialty data into REF-Practices
- Build Reimer practice guide document
- Establish the hybrid model in production with real practices

**Phase 4 — PIR as Demo Piece**
- Generate a sample PIR from real (anonymized) data
- Use it as the primary demo artifact for prospective clients
- Build a one-page sales sheet around the PIR

**Phase 5 — First External Client**
- Target: small billing company, 2–5 practices, currently on spreadsheets
- Offer a discounted "founding client" setup in exchange for feedback and a case study
- Goal: prove the setup/onboarding process works without Craig doing everything manually

**Phase 6 — Productize**
- Document the setup process
- Build a configuration checklist
- Price the specialty packages
- Explore Model B (white label SaaS) if demand warrants

---

## Open Strategic Questions

| Question | Status |
|----------|--------|
| Who is the ideal first external client? | Open — billing company vs. independent practice? |
| What does the demo experience look like? | PIR is the anchor, but need a walk-through story |
| How do we handle multi-client data separation in a single Workspace? | Open — separate Sheets per client is likely answer |
| What's the right price for a specialty package? | Open — depends on how much data we load |
| Should we pursue HIPAA compliance as a selling point? | Open — Google Workspace has BAA option; needs research |
| What's the migration story for clients on practice management software? | Open — export/import flow not yet designed |

---

## Continuity Note

The companion document `CWE_Monetization_Strategy_v2.docx` is the polished stakeholder-facing version of this strategy. This `.md` file is the living scratchpad for Claude sessions. When major strategic decisions are made in a session, update this file. When you need a formal document for a stakeholder conversation, refer to or update the `.docx`.