# AICTE Approval Workflow Automation & Compliance System
## Hackathon Judge Demonstration Script (3–4 Minute Guided Walkthrough)

> **DEMO MODE NOTICE**: This application operates in simulated Demonstration Mode with fictional institutional records, illustrative Approval Process Handbook (APH) stages, and deterministic sample data. It is not connected to internal AICTE servers or live databases.

---

### Scene 1 — Operational Overview (Supervisory Admin Console)
- **Starting Role**: Open the application at `http://127.0.0.1:5173/`. Verify the top role badge displays **Supervisory Admin**.
- **Action**: Observe the **Overview Dashboard** (`/dashboard`):
  - **Live Dynamic Metrics**: 12 total applications tracked, 10 pending processing, 3 overdue statutory actions, 3 approaching deadlines.
  - **EVC Inspection Queue**: 5 pending on-site visits across various regions.
  - **Institutional Compliance**: 1 pending undertaking verification, 4 document expiry/deficiency flags.
  - **Pendency & Regional Distribution**: View the **Stage-wise Pendency** progress bars (Scrutiny, EVC, SAC/SHC) and **Region-wise Performance** breakdown (North, West, South, East).
  - **Point of Pride for Judges**: All metric cards, progress bars, and lists are derived dynamically in real time from the shared Zustand store with zero hardcoded numbers.

---

### Scene 2 — Automated Application Routing & Stage Progression
- **Role**: Switch to **Regional Officer** using the dropdown selector in the top bar.
- **Action**:
  1. Click on **Applications** in the sidebar navigation (`/applications`).
  2. Notice the table filters automatically to regional officer responsibilities with color-coded ageing indicators and overdue alerts.
  3. Select application `APP-2025-001` (**Shri Vivekananda Institute of Technology** — B.Tech CSE with AI).
  4. View the **Workflow Path Stepper** showing the configured route (*Scrutiny → EVC → Approved*).
  5. Click **Complete Stage & Forward**.
  6. Enter Scrutiny Observation remarks: *"Infrastructure documentation verified compliant. Recommended for physical EVC inspection."*
  7. Submit. Notice:
     - Stage immediately transitions from **Scrutiny** to **EVC** (`awaiting_evc`).
     - A new EVC record is automatically initialized in the EVC queue.
     - The event is immediately appended to the digital audit trail.

---

### Scene 3 — Deficiency Handling & Institutional Correction Loop
- **Role**: Switch back to **Regional Officer**.
- **Action**:
  1. Open application `APP-2025-004` (**Netaji Subhas Engineering College**).
  2. Click **Return for Deficiency**.
  3. Enter mandatory deficiency reason: *"Building Safety NOC is illegible; Faculty cadre ratio calculation sheet missing annexure IV."*
  4. Submit. Notice status changes to `returned_for_deficiency`.
  5. **Switch Role to Institution Admin** (represents *SVIT / Institutional Representative*).
  6. The dashboard alerts the institution with red deficiency banners detailing exactly what is pending and why.
  7. Open `APP-2025-002` (or the returned application) and click **Resubmit Application**.
  8. Enter correction remarks: *"Re-uploaded high-resolution certified NOC and updated cadre annexure."*
  9. Submit. Notice application status transitions to `resubmitted`, returning it to the Regional Officer's re-scrutiny queue.

---

### Scene 4 — EVC Scheduling & On-site Verification
- **Role**: Switch to **EVC Coordinator**.
- **Action**:
  1. Navigate to **EVC Scheduling** (`/evc`).
  2. View the **Unscheduled Queue** tab.
  3. Locate `APP-2025-003` (**Dr. APJ Abdul Kalam Polytechnic**).
  4. Click **Schedule Visit**. Select an inspection date (e.g., 5 days from today) and enter committee team details: *"3-member expert panel: Prof. Sharma (Civil), Prof. Rao (Electrical), Regional Officer."*
  5. Click **Confirm Inspection Schedule**.
  6. Switch to the **Scheduled Visits** tab and locate the visit.
  7. Click **Complete EVC**, enter report findings: *"Physical laboratory equipment and built-up area verified compliant with APH norms."*
  8. Click **Mark EVC Completed**. Notice the application advances automatically to the next configured review stage (`pending_sac` or `approved`).

---

### Scene 5 — Time-Bound Undertakings & Document Expiry Governance
- **Role**: Switch to **Institution Admin**.
- **Action**:
  1. Navigate to **Undertakings** (`/undertakings`).
  2. Select `UND-001` (Undertaking to construct additional lab block). Click **Submit Evidence**.
  3. Enter evidence description: *"Structural engineer completion report ref #SE-2025-9981 with geo-tagged lab photographs."*
  4. Submit. Status transitions to `awaiting_verification`.
  5. Navigate to **Document Validity** (`/documents`).
  6. Locate `DOC-002` (Fire Safety NOC — Expired). Click **Submit Renewal**.
  7. Enter renewal reference number and click **Submit Renewal**. Status transitions to `renewal_pending_verification`.
  8. **Switch Role to Regional Officer or Supervisory Admin**:
     - Navigate to **Compliance** (`/compliance`).
     - In the **Verification Queue**, review the newly submitted proof.
     - Click **Verify** to authenticate and fulfill the undertaking. Notice the undertaking register updates immediately.

---

### Scene 6 — Deadline Alerts, Automated Escalation & Digital Audit Trail
- **Role**: Switch to **Supervisory Admin**.
- **Action**:
  1. Navigate to **Alerts & Escalations** (`/alerts`).
  2. Notice the automated alerts:
     - Overdue Scrutiny: `critical` severity, level 1 escalation.
     - Expired Lease/NOC: `critical` statutory breach notice.
     - Approaching Deadlines: `medium` severity proactive reminders.
  3. Click **Escalation Trail** on an escalated alert to review the full escalation lineage (*Regional Officer → Supervisory Admin*).
  4. Click **Acknowledge** or **Resolve** on an alert and watch it update live.
  5. Click **Run Alert Evaluation Engine** to demonstrate idempotent recalculation of deadline rules across all records.
  6. Navigate to **Reports** (`/reports`) and click **Export Current Report as CSV** to demonstrate real file generation.
  7. Navigate to **Audit Trail** (`/audit`) and filter by action or actor. Show that every single action performed during Scenes 1–5 was captured with immutable timestamps, actor roles, old/new states, and remarks.
