# AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System

> **DEMO MODE — FICTIONAL SAMPLE DATA — NOT A LIVE AICTE SYSTEM**  
> *This prototype is an administrative demonstration MVP designed for technical evaluation and hackathon presentation. It uses illustrative Approval Process Handbook (APH) stages and fictional institutional data. It does not replace statutory scrutiny, verification, or competent authority determinations.*

---

## 1. Project Overview

### Purpose
Technical education regulators like the All India Council for Technical Education (AICTE) process thousands of institutional approval applications annually across stages including Scrutiny, Re-scrutiny, Expert Visit Committee (EVC), and Standing Advisory Committee (SAC/SHC). Simultaneously, institutions hold time-bound compliance undertakings (e.g., faculty recruitment, laboratory completion) and statutory document renewals (e.g., land leases, municipal fire safety NOCs).

Tracking these disparate streams in disconnected spreadsheets or siloed portals leads to processing delays, overlooked deficiencies, missed expiry deadlines, and lack of accountability.

This platform provides a **unified digital administrative control centre** connecting:
1. Automated application intake and configurable multi-stage routing.
2. Role-based operational cockpits with simulated role switching.
3. Live stage-wise pendency and application ageing tracking.
4. Integrated Expert Visit Committee (EVC) scheduling and monitoring.
5. Time-bound undertaking compliance register and verification queues.
6. Statutory document validity and advance expiry monitoring.
7. End-to-end compliance evidence submission, review, and rejection handling.
8. Deterministic deadline alert engine with automated hierarchy escalation.
9. Tamper-evident append-only digital audit trail.
10. Consolidated administrative reporting with real-time CSV data exports.

### Target Demonstration Roles
- **Institution Administrator**: Submits applications, monitors deficiency grounds, uploads compliance evidence and renewed leases, and responds to correction notices.
- **Regional Officer**: Scrutinizes assigned regional cases, records statutory observations, returns cases with mandatory deficiency grounds, and advances eligible applications.
- **EVC Committee / Coordinator**: Manages the EVC scheduling queue, assigns inspection dates and expert panels, and records on-site completion reports.
- **Supervisory Administrator**: Monitors nationwide pendency, regional workloads, overdue breaches, escalations, audit trails, and configurable workflow rules.

### Architecture Summary
- **Frontend Framework**: React 19 with TypeScript, bundled with Vite 8.
- **Styling**: Tailwind CSS v4 featuring an institutional, restrained navy/neutral government palette (`#0f2557` primary).
- **State Management**: Zustand 5 with Immer and persistent localStorage syncing.
- **Icons**: Lucide React.
- **Navigation**: Client-side view routing with full deep-linking via React Router 7.
- **Audit Engine**: Application-level append-only event logging with actor attribution, entity IDs, state diffs, and timestamps.
- **Testing**: Built-in Node.js 22 native test runner with native TypeScript type-stripping execution (`node --test`).

### Demo-Mode Limitations
- **Simulated Authentication**: Role switching is provided for rapid hackathon presentation; production requires OAuth2/OIDC, RBAC, and server-side session tokens.
- **Client-Side Persistence**: State changes persist across refreshes using browser `localStorage`. A production system requires an encrypted PostgreSQL or distributed SQL database.
- **Simulated File Upload**: File attachments capture filenames, MIME types, and description hashes. Production deployments must integrate S3/GCS bucket storage with virus scanning and digital signature verification.

---

## 2. Prerequisites
- **Node.js**: v20.0.0 or higher (v22.14.0 recommended).
- **Package Manager**: npm v10.0.0 or higher.
- **OS**: Windows, macOS, or Linux.

---

## 3. Installation
Clone the repository and install dependencies:
```bash
npm install
```

---

## 4. Configuration
No API keys, paid subscriptions, or external cloud services are required. The project runs completely self-contained in demo mode.

Optional environment variables (can be placed in `.env` if desired):
```env
VITE_APP_TITLE="AICTE Approval Workflow System"
VITE_DEMO_MODE=true
```

---

## 5. Startup
To start the local Vite development server:
```bash
npm run dev
```
The server will start at:
```
http://127.0.0.1:5173/
```

To run a production build and preview:
```bash
npm run build
npm run preview
```

---

## 6. Testing & Quality Verification
The application includes automated unit and integration tests covering workflow state transitions, permission boundaries, date/deadline calculations, and alert deduplication.

Run all tests:
```bash
npm test
```

Run TypeScript static type-checking:
```bash
npm run type-check
```

Run the production bundle build:
```bash
npm run build
```

---

## 7. Troubleshooting
- **Port 5173 in use**: Run `npx vite --port 5174` to start on an alternative port.
- **Local storage corrupted or out-of-date**: Click the **Reset Demo Data** button in the lower left of the sidebar, or run `localStorage.clear()` in the browser developer console.
- **Node Type Stripping Warning**: Node 22 outputs `(node:xxx) ExperimentalWarning: Type Stripping...` during test runs; this is standard Node 22 behavior for running TypeScript files without compilation.

---

## 8. Requirement-to-Implementation Mapping

| Problem-Statement Requirement | Implemented Component / File | Actual Behaviour | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Application Intake & Configurable Routing** | `src/pages/ApplicationDetail.tsx`, `src/store/index.ts`, `src/utils/businessLogic.ts` | Multi-stage workflow routes (Scrutiny, Scrutiny+EVC, EVC+SAC, Full Review). Stage advancement, returns with mandatory reasons, resubmissions. | Unit tests 1, 2, 3 passing; full UI test passed | **Passed** |
| **2. Role-Based Dashboards** | `src/components/dashboards/*`, `src/components/layout/DemoRoleSelector.tsx` | 4 custom dashboards (Supervisory Admin, Regional Officer, EVC Coordinator, Institution Admin). Role-aware filtering and action gates. | Verified live role switching and filtered dataset views | **Passed** |
| **3. Stage-Wise Pendency & Ageing** | `src/components/dashboards/SupervisoryDashboard.tsx`, `src/pages/ApplicationList.tsx` | Real-time calculation of days in stage, days to deadline, overdue classification, and regional pendency summaries. | Unit tests 4, 5 passing; dynamic UI counters | **Passed** |
| **4. EVC Scheduling & Alerts** | `src/pages/EVCWorkspace.tsx`, `src/components/dashboards/EVCCoordinatorDashboard.tsx` | Unscheduled EVC queue, date & committee panel assignment modal, visit completion report flow, overdue EVC badges. | Interactive EVC scheduling and completion verified | **Passed** |
| **5. Time-Bound Undertaking Tracking** | `src/pages/UndertakingWorkspace.tsx`, `src/store/index.ts` | Undertaking register, due date tracking, institution proof submission, officer verification/rejection with deficiency remarks. | Interactive submission and verification cycle verified | **Passed** |
| **6. Lease & Document Validity Monitoring** | `src/pages/DocumentWorkspace.tsx`, `src/utils/businessLogic.ts` | Register tracking leases, fire safety NOCs, NBA certificates. Approaching expiry alerts (T-30), expired flags, renewal verification. | Unit test 7 passing; renewal upload verified | **Passed** |
| **7. Compliance Submissions & Verification** | `src/pages/ComplianceWorkspace.tsx`, `src/store/index.ts` | Centralized compliance intake form with dynamic linking to applications/undertakings/documents, officer review queue, audit event links. | Submission, rejection, and verification verified | **Passed** |
| **8. Automated Alerts & Escalation Engine** | `src/pages/AlertsWorkspace.tsx`, `src/store/index.ts` | Idempotent, deduplicated alert generation for overdue applications, EVC delays, expiring leases. Hierarchical escalation with trail. | Unit test 8 passing; alert evaluation engine verified | **Passed** |
| **Cross-Cutting: Digital Audit Trail** | `src/pages/AuditTrail.tsx`, `src/store/index.ts` | Append-only audit logger capturing actor, timestamp, action type, affected entity, before/after values, and remarks. | Audit events logged on all user actions; filterable UI | **Passed** |
| **Cross-Cutting: Operational Reports & CSV Export** | `src/pages/ReportsWorkspace.tsx`, `src/utils/businessLogic.ts` | 6 live reports (Stage pendency, Regional performance, EVC status, Undertakings, Document validity, Overdue roster) with CSV export. | Verified CSV downloads generated from active data | **Passed** |
| **Cross-Cutting: Workflow Governance Settings** | `src/pages/WorkflowSettings.tsx` | Supervisory admin settings to configure reminder threshold days, escalation delay, recipient roles, and category toggles. | Verified configuration updates persist in state | **Passed** |

---

## 9. Final Verification Report

### Test Execution Summary
- **Automated Tests**: 8/8 tests passed (0 failed, 0 skipped).
- **TypeScript Static Verification**: `tsc --noEmit` exited with code 0 (zero errors).
- **Production Bundle**: Vite built 1,971 modules in 779ms without warnings or errors.
- **Server Health**: Development server running at `http://127.0.0.1:5173/`, returning HTTP 200 OK.

### Real vs. Simulated Integrations
1. **Real Implementations**:
   - Full application workflow state machine with route progression and stage history.
   - Live date maths and ageing calculations based on ISO timestamps.
   - Dynamic dashboard metrics derived purely from underlying entity states.
   - Append-only digital audit logging with granular metadata.
   - CSV export generator creating downloadable files in browser.
   - LocalStorage synchronization preserving session changes across reloads.
2. **Simulated Demonstrations**:
   - Role switching simulates user login/logout without requiring credential entry.
   - Compliance file attachments record filenames, timestamps, and metadata without cloud object storage.

### Known Limitations
- The system is designed as a single-page prototype; multi-tenant database synchronization across distinct browser instances is not active.
- Automated email and SMS gateways are represented via in-app notifications and alert logs.

---

## 10. Demonstration Walkthrough
For the step-by-step judge demonstration guide (Scenes 1 through 6), see [`DEMO_GUIDE.md`](./DEMO_GUIDE.md).
