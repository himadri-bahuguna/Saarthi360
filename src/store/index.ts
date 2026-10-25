// ============================================================
// AICTE Workflow System — Zustand Store with Seed Data
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppState, DemoRole, Application, EVCRecord, Undertaking, Document,
  ComplianceSubmission, Alert, AuditEvent, AlertType, AuditActionType,
  WorkflowRoute, WorkflowConfig, Institution,
} from '../types/index.ts';
import {
  generateAlertId, daysAgoISO, daysFromNowISO, getNextStage,
  getDaysUntil, isOverdue,
} from '../utils/businessLogic.ts';
import { generateId } from '../utils/id.ts';

const DATA_VERSION = '1.1.0';

// ============================================================
// Seed Data
// ============================================================

const INSTITUTIONS: Institution[] = [
  { id: 'INST001', name: 'Shri Vivekananda Institute of Technology', code: 'SVIT', region: 'North', type: 'Engineering', contactEmail: 'admin@svit.edu.in', address: 'Plot 12, Dwarka Sector 23, New Delhi - 110077' },
  { id: 'INST002', name: 'Rajendra Technical College', code: 'RTC', region: 'West', type: 'Engineering', contactEmail: 'registrar@rtc.ac.in', address: '45 Andheri East Industrial Area, Mumbai - 400069' },
  { id: 'INST003', name: 'Dr. APJ Abdul Kalam Polytechnic', code: 'AAPK', region: 'South', type: 'Polytechnic', contactEmail: 'principal@apjpoly.edu.in', address: '78 Anna Salai, Chennai - 600002' },
  { id: 'INST004', name: 'Netaji Subhas Engineering College', code: 'NSEC', region: 'East', type: 'Engineering', contactEmail: 'director@nsec.edu', address: '1 Techno Campus, Kolkata - 700152' },
];

const WORKFLOW_ROUTES: WorkflowRoute[] = [
  { id: 'ROUTE001', name: 'Scrutiny Only', stages: ['scrutiny', 'approved'], requiresEVC: false, description: 'Application reviewed at scrutiny stage only.' },
  { id: 'ROUTE002', name: 'Scrutiny + EVC', stages: ['scrutiny', 'evc', 'approved'], requiresEVC: true, description: 'Scrutiny followed by Expert Visit Committee inspection.' },
  { id: 'ROUTE003', name: 'EVC + SAC/SHC', stages: ['evc', 'sac_shc', 'approved'], requiresEVC: true, description: 'EVC inspection followed by Standing Advisory Committee review.' },
  { id: 'ROUTE004', name: 'Only EVC', stages: ['evc', 'approved'], requiresEVC: true, description: 'Direct Expert Visit Committee review.' },
  { id: 'ROUTE005', name: 'Full Review', stages: ['scrutiny', 'evc', 'sac_shc', 'approved'], requiresEVC: true, description: 'Complete review: scrutiny, EVC inspection, and SAC/SHC.' },
];

const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  id: 'wc-default',
  reminderThresholdDays: 7,
  overdueThresholdDays: 0,
  escalationDelayDays: 3,
  escalationRecipientRole: 'supervisory_admin',
  enabledAlertCategories: [
    'pending_action', 'approaching_deadline', 'overdue_application',
    'evc_unscheduled', 'evc_deadline', 'evc_overdue',
    'undertaking_upcoming', 'undertaking_overdue',
    'document_expiry', 'document_expired', 'document_renewal_missing',
    'compliance_pending', 'escalation',
  ] as AlertType[],
  updatedAt: new Date().toISOString(),
};

function makeHistory(appId: string, entries: Array<{ stage: string; status: Application['currentStatus']; role: DemoRole; name: string; ts: string; remarks: string; deficiency?: string; prev?: string }>): import('../types/index.ts').StageHistoryEntry[] {
  return entries.map((e, i) => ({
    id: `hist-${appId}-${i}`,
    applicationId: appId,
    stage: e.stage,
    status: e.status,
    actorRole: e.role,
    actorName: e.name,
    timestamp: e.ts,
    remarks: e.remarks,
    deficiencyReason: e.deficiency,
    previousStage: e.prev,
  }));
}

function seedApplications(): Application[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'APP-2025-001',
      applicationId: 'AICTE/2025/NR/001',
      institutionId: 'INST001',
      institutionName: 'Shri Vivekananda Institute of Technology',
      region: 'North',
      applicationType: 'New Programme Approval — B.Tech (CSE with AI)',
      submissionDate: daysAgoISO(60),
      currentStage: 'scrutiny',
      currentStatus: 'under_scrutiny',
      assignedOfficerId: 'OFF001',
      assignedOfficerName: 'Sh. Rajan Mehta',
      stageEntryDate: daysAgoISO(58),
      stageDeadline: daysAgoISO(28), // 30 days ago — OVERDUE
      workflowRouteId: 'ROUTE002',
      remarks: 'Application under primary scrutiny. Deficiency in land documents pending.',
      deficiencyReasons: [],
      processingHistory: makeHistory('APP-2025-001', [
        { stage: 'scrutiny', status: 'submitted', role: 'institution_admin', name: 'SVIT Admin', ts: daysAgoISO(60), remarks: 'Application submitted for B.Tech (CSE with AI) new programme.', prev: undefined },
        { stage: 'scrutiny', status: 'under_scrutiny', role: 'regional_officer', name: 'Sh. Rajan Mehta', ts: daysAgoISO(58), remarks: 'Application taken up for scrutiny. Documents under review.', prev: 'submitted' },
      ]),
      createdAt: daysAgoISO(60),
      updatedAt: daysAgoISO(20),
    },
    {
      id: 'APP-2025-002',
      applicationId: 'AICTE/2025/WR/002',
      institutionId: 'INST002',
      institutionName: 'Rajendra Technical College',
      region: 'West',
      applicationType: 'Increase in Intake — B.Tech (Mechanical)',
      submissionDate: daysAgoISO(45),
      currentStage: 'scrutiny',
      currentStatus: 'returned_for_deficiency',
      assignedOfficerId: 'OFF002',
      assignedOfficerName: 'Smt. Priya Sharma',
      stageEntryDate: daysAgoISO(43),
      stageDeadline: daysFromNowISO(7),
      workflowRouteId: 'ROUTE001',
      remarks: 'Application returned due to deficiency in infrastructure compliance documents.',
      deficiencyReasons: [
        'Building completion certificate not submitted.',
        'Faculty appointment letters for additional intake not attached.',
        'Fire safety NOC expired — please submit renewed NOC.',
      ],
      processingHistory: makeHistory('APP-2025-002', [
        { stage: 'scrutiny', status: 'submitted', role: 'institution_admin', name: 'RTC Registrar', ts: daysAgoISO(45), remarks: 'Application submitted for increase in intake.', prev: undefined },
        { stage: 'scrutiny', status: 'under_scrutiny', role: 'regional_officer', name: 'Smt. Priya Sharma', ts: daysAgoISO(43), remarks: 'Application under scrutiny. Checking documents.', prev: 'submitted' },
        { stage: 'scrutiny', status: 'returned_for_deficiency', role: 'regional_officer', name: 'Smt. Priya Sharma', ts: daysAgoISO(10), remarks: 'Returning application due to missing/invalid documents.', deficiency: 'Building completion certificate not submitted. Faculty appointment letters for additional intake not attached. Fire safety NOC expired.', prev: 'under_scrutiny' },
      ]),
      createdAt: daysAgoISO(45),
      updatedAt: daysAgoISO(10),
    },
    {
      id: 'APP-2025-003',
      applicationId: 'AICTE/2025/SR/003',
      institutionId: 'INST003',
      institutionName: 'Dr. APJ Abdul Kalam Polytechnic',
      region: 'South',
      applicationType: 'EVC + SAC — Diploma in Electronics',
      submissionDate: daysAgoISO(30),
      currentStage: 'evc',
      currentStatus: 'awaiting_evc',
      assignedOfficerId: 'OFF003',
      assignedOfficerName: 'Dr. Suresh Kumar',
      stageEntryDate: daysAgoISO(20),
      stageDeadline: daysAgoISO(5), // 5 days overdue
      workflowRouteId: 'ROUTE003',
      remarks: 'EVC inspection pending. Application ready for scheduling.',
      deficiencyReasons: [],
      processingHistory: makeHistory('APP-2025-003', [
        { stage: 'evc', status: 'submitted', role: 'institution_admin', name: 'AAPK Principal', ts: daysAgoISO(30), remarks: 'Application submitted.', prev: undefined },
        { stage: 'evc', status: 'awaiting_evc', role: 'regional_officer', name: 'Dr. Suresh Kumar', ts: daysAgoISO(20), remarks: 'Application eligible for EVC. Forwarded to EVC Coordinator.', prev: 'submitted' },
      ]),
      createdAt: daysAgoISO(30),
      updatedAt: daysAgoISO(20),
    },
    {
      id: 'APP-2025-004',
      applicationId: 'AICTE/2025/ER/004',
      institutionId: 'INST004',
      institutionName: 'Netaji Subhas Engineering College',
      region: 'East',
      applicationType: 'Full Review — New Campus Extension',
      submissionDate: daysAgoISO(15),
      currentStage: 'scrutiny',
      currentStatus: 'under_scrutiny',
      assignedOfficerId: 'OFF001',
      assignedOfficerName: 'Sh. Rajan Mehta',
      stageEntryDate: daysAgoISO(13),
      stageDeadline: daysFromNowISO(5), // Approaching deadline
      workflowRouteId: 'ROUTE005',
      remarks: 'Under scrutiny. Deadline approaching in 5 days.',
      deficiencyReasons: [],
      processingHistory: makeHistory('APP-2025-004', [
        { stage: 'scrutiny', status: 'submitted', role: 'institution_admin', name: 'NSEC Director', ts: daysAgoISO(15), remarks: 'Application submitted for campus extension approval.', prev: undefined },
        { stage: 'scrutiny', status: 'under_scrutiny', role: 'regional_officer', name: 'Sh. Rajan Mehta', ts: daysAgoISO(13), remarks: 'Application taken for scrutiny.', prev: 'submitted' },
      ]),
      createdAt: daysAgoISO(15),
      updatedAt: daysAgoISO(13),
    },
    {
      id: 'APP-2025-005',
      applicationId: 'AICTE/2025/NR/005',
      institutionId: 'INST001',
      institutionName: 'Shri Vivekananda Institute of Technology',
      region: 'North',
      applicationType: 'EVC Only — B.Tech (Biomedical)',
      submissionDate: daysAgoISO(25),
      currentStage: 'evc',
      currentStatus: 'evc_scheduled',
      assignedOfficerId: 'EVC001',
      assignedOfficerName: 'Prof. A.K. Singh (EVC Lead)',
      stageEntryDate: daysAgoISO(18),
      stageDeadline: daysFromNowISO(12),
      workflowRouteId: 'ROUTE004',
      remarks: 'EVC scheduled for 5 days from now.',
      deficiencyReasons: [],
      processingHistory: makeHistory('APP-2025-005', [
        { stage: 'evc', status: 'submitted', role: 'institution_admin', name: 'SVIT Admin', ts: daysAgoISO(25), remarks: 'Application submitted.', prev: undefined },
        { stage: 'evc', status: 'awaiting_evc', role: 'regional_officer', name: 'Sh. Rajan Mehta', ts: daysAgoISO(18), remarks: 'EVC required. Forwarded to EVC Coordinator.', prev: 'submitted' },
        { stage: 'evc', status: 'evc_scheduled', role: 'evc_coordinator', name: 'EVC Coordinator', ts: daysAgoISO(3), remarks: 'EVC visit scheduled.', prev: 'awaiting_evc' },
      ]),
      createdAt: daysAgoISO(25),
      updatedAt: daysAgoISO(3),
    },
    {
      id: 'APP-2025-006',
      applicationId: 'AICTE/2025/WR/006',
      institutionId: 'INST002',
      institutionName: 'Rajendra Technical College',
      region: 'West',
      applicationType: 'Scrutiny + EVC — B.Tech (Data Science)',
      submissionDate: daysAgoISO(90),
      currentStage: 'approved',
      currentStatus: 'approved',
      assignedOfficerId: 'ADMIN001',
      assignedOfficerName: 'Supervisory Admin',
      stageEntryDate: daysAgoISO(10),
      stageDeadline: daysFromNowISO(0),
      workflowRouteId: 'ROUTE002',
      remarks: 'Application approved. All stages completed successfully.',
      deficiencyReasons: [],
      processingHistory: makeHistory('APP-2025-006', [
        { stage: 'scrutiny', status: 'submitted', role: 'institution_admin', name: 'RTC Registrar', ts: daysAgoISO(90), remarks: 'Application submitted.', prev: undefined },
        { stage: 'scrutiny', status: 'under_scrutiny', role: 'regional_officer', name: 'Smt. Priya Sharma', ts: daysAgoISO(85), remarks: 'Application under scrutiny.', prev: 'submitted' },
        { stage: 'evc', status: 'awaiting_evc', role: 'regional_officer', name: 'Smt. Priya Sharma', ts: daysAgoISO(60), remarks: 'Scrutiny completed. Forwarded to EVC.', prev: 'scrutiny' },
        { stage: 'evc', status: 'evc_scheduled', role: 'evc_coordinator', name: 'EVC Coordinator', ts: daysAgoISO(45), remarks: 'EVC visit scheduled.', prev: 'awaiting_evc' },
        { stage: 'evc', status: 'evc_completed', role: 'evc_coordinator', name: 'EVC Coordinator', ts: daysAgoISO(30), remarks: 'EVC inspection completed. Report submitted.', prev: 'evc_scheduled' },
        { stage: 'approved', status: 'approved', role: 'supervisory_admin', name: 'Supervisory Admin', ts: daysAgoISO(10), remarks: 'Application approved by competent authority.', prev: 'evc' },
      ]),
      createdAt: daysAgoISO(90),
      updatedAt: daysAgoISO(10),
    },
    {
      id: 'APP-2025-007',
      applicationId: 'AICTE/2025/SR/007',
      institutionId: 'INST003',
      institutionName: 'Dr. APJ Abdul Kalam Polytechnic',
      region: 'South',
      applicationType: 'New Programme — Diploma (Civil)',
      submissionDate: daysAgoISO(2),
      currentStage: 'scrutiny',
      currentStatus: 'submitted',
      assignedOfficerId: 'OFF003',
      assignedOfficerName: 'Dr. Suresh Kumar',
      stageEntryDate: daysAgoISO(2),
      stageDeadline: daysFromNowISO(28),
      workflowRouteId: 'ROUTE001',
      remarks: 'Newly submitted application. Awaiting officer assignment and scrutiny.',
      deficiencyReasons: [],
      processingHistory: makeHistory('APP-2025-007', [
        { stage: 'scrutiny', status: 'submitted', role: 'institution_admin', name: 'AAPK Principal', ts: daysAgoISO(2), remarks: 'Application submitted for new Diploma (Civil) programme.', prev: undefined },
      ]),
      createdAt: daysAgoISO(2),
      updatedAt: daysAgoISO(2),
    },
    {
      id: 'APP-2025-008',
      applicationId: 'AICTE/2025/ER/008',
      institutionId: 'INST004',
      institutionName: 'Netaji Subhas Engineering College',
      region: 'East',
      applicationType: 'EVC + SAC — M.Tech (VLSI)',
      submissionDate: daysAgoISO(50),
      currentStage: 'sac_shc',
      currentStatus: 'pending_sac',
      assignedOfficerId: 'SAC001',
      assignedOfficerName: 'SAC Committee',
      stageEntryDate: daysAgoISO(5),
      stageDeadline: daysFromNowISO(25),
      workflowRouteId: 'ROUTE003',
      remarks: 'EVC completed. Pending SAC/SHC review.',
      deficiencyReasons: [],
      processingHistory: makeHistory('APP-2025-008', [
        { stage: 'evc', status: 'submitted', role: 'institution_admin', name: 'NSEC Director', ts: daysAgoISO(50), remarks: 'Application submitted.', prev: undefined },
        { stage: 'evc', status: 'awaiting_evc', role: 'regional_officer', name: 'Sh. Rajan Mehta', ts: daysAgoISO(42), remarks: 'Eligible for EVC.', prev: 'submitted' },
        { stage: 'evc', status: 'evc_scheduled', role: 'evc_coordinator', name: 'EVC Coordinator', ts: daysAgoISO(30), remarks: 'EVC scheduled.', prev: 'awaiting_evc' },
        { stage: 'evc', status: 'evc_completed', role: 'evc_coordinator', name: 'EVC Coordinator', ts: daysAgoISO(10), remarks: 'EVC completed. Positive report.', prev: 'evc_scheduled' },
        { stage: 'sac_shc', status: 'pending_sac', role: 'regional_officer', name: 'Sh. Rajan Mehta', ts: daysAgoISO(5), remarks: 'Forwarded to SAC/SHC for review.', prev: 'evc' },
      ]),
      createdAt: daysAgoISO(50),
      updatedAt: daysAgoISO(5),
    },
    {
      id: 'APP-2025-009',
      applicationId: 'AICTE/2025/NR/009',
      institutionId: 'INST001',
      institutionName: 'Shri Vivekananda Institute of Technology',
      region: 'North',
      applicationType: 'Scrutiny + EVC — MBA (Innovation)',
      submissionDate: daysAgoISO(35),
      currentStage: 'scrutiny',
      currentStatus: 'resubmitted',
      assignedOfficerId: 'OFF001',
      assignedOfficerName: 'Sh. Rajan Mehta',
      stageEntryDate: daysAgoISO(5),
      stageDeadline: daysFromNowISO(25),
      workflowRouteId: 'ROUTE002',
      remarks: 'Application resubmitted after deficiency correction.',
      deficiencyReasons: [],
      processingHistory: makeHistory('APP-2025-009', [
        { stage: 'scrutiny', status: 'submitted', role: 'institution_admin', name: 'SVIT Admin', ts: daysAgoISO(35), remarks: 'Application submitted.', prev: undefined },
        { stage: 'scrutiny', status: 'under_scrutiny', role: 'regional_officer', name: 'Sh. Rajan Mehta', ts: daysAgoISO(33), remarks: 'Under scrutiny.', prev: 'submitted' },
        { stage: 'scrutiny', status: 'returned_for_deficiency', role: 'regional_officer', name: 'Sh. Rajan Mehta', ts: daysAgoISO(20), remarks: 'Returning for deficiency.', deficiency: 'Affidavit for infrastructure compliance not submitted. Faculty qualification documents incomplete.', prev: 'under_scrutiny' },
        { stage: 'scrutiny', status: 'resubmitted', role: 'institution_admin', name: 'SVIT Admin', ts: daysAgoISO(5), remarks: 'All deficiencies addressed. Resubmitting for review.', prev: 'returned_for_deficiency' },
      ]),
      createdAt: daysAgoISO(35),
      updatedAt: daysAgoISO(5),
    },
    {
      id: 'APP-2025-010',
      applicationId: 'AICTE/2025/WR/010',
      institutionId: 'INST002',
      institutionName: 'Rajendra Technical College',
      region: 'West',
      applicationType: 'Full Review — B.Tech (Robotics)',
      submissionDate: daysAgoISO(40),
      currentStage: 'evc',
      currentStatus: 'awaiting_evc',
      assignedOfficerId: 'EVC001',
      assignedOfficerName: 'EVC Coordinator',
      stageEntryDate: daysAgoISO(25),
      stageDeadline: daysAgoISO(10), // EVC overdue
      workflowRouteId: 'ROUTE005',
      remarks: 'EVC inspection overdue. No schedule received yet.',
      deficiencyReasons: [],
      processingHistory: makeHistory('APP-2025-010', [
        { stage: 'scrutiny', status: 'submitted', role: 'institution_admin', name: 'RTC Registrar', ts: daysAgoISO(40), remarks: 'Application submitted.', prev: undefined },
        { stage: 'scrutiny', status: 'under_scrutiny', role: 'regional_officer', name: 'Smt. Priya Sharma', ts: daysAgoISO(38), remarks: 'Under scrutiny.', prev: 'submitted' },
        { stage: 'evc', status: 'awaiting_evc', role: 'regional_officer', name: 'Smt. Priya Sharma', ts: daysAgoISO(25), remarks: 'Scrutiny done. EVC required.', prev: 'scrutiny' },
      ]),
      createdAt: daysAgoISO(40),
      updatedAt: daysAgoISO(25),
    },
    {
      id: 'APP-2025-011',
      applicationId: 'AICTE/2025/SR/011',
      institutionId: 'INST003',
      institutionName: 'Dr. APJ Abdul Kalam Polytechnic',
      region: 'South',
      applicationType: 'Scrutiny Only — Increase in Intake (Electronics)',
      submissionDate: daysAgoISO(28),
      currentStage: 'scrutiny',
      currentStatus: 'under_scrutiny',
      assignedOfficerId: 'OFF003',
      assignedOfficerName: 'Dr. Suresh Kumar',
      stageEntryDate: daysAgoISO(26),
      stageDeadline: daysFromNowISO(4), // Approaching — 4 days
      workflowRouteId: 'ROUTE001',
      remarks: 'Under scrutiny. Deadline approaching in 4 days.',
      deficiencyReasons: [],
      processingHistory: makeHistory('APP-2025-011', [
        { stage: 'scrutiny', status: 'submitted', role: 'institution_admin', name: 'AAPK Principal', ts: daysAgoISO(28), remarks: 'Application submitted for intake increase.', prev: undefined },
        { stage: 'scrutiny', status: 'under_scrutiny', role: 'regional_officer', name: 'Dr. Suresh Kumar', ts: daysAgoISO(26), remarks: 'Under scrutiny.', prev: 'submitted' },
      ]),
      createdAt: daysAgoISO(28),
      updatedAt: daysAgoISO(26),
    },
    {
      id: 'APP-2025-012',
      applicationId: 'AICTE/2025/ER/012',
      institutionId: 'INST004',
      institutionName: 'Netaji Subhas Engineering College',
      region: 'East',
      applicationType: 'Scrutiny + EVC — B.Tech (Aerospace)',
      submissionDate: daysAgoISO(35),
      currentStage: 'evc',
      currentStatus: 'evc_scheduled',
      assignedOfficerId: 'EVC001',
      assignedOfficerName: 'EVC Coordinator',
      stageEntryDate: daysAgoISO(15),
      stageDeadline: daysFromNowISO(10),
      workflowRouteId: 'ROUTE002',
      remarks: 'EVC scheduled for next week.',
      deficiencyReasons: [],
      processingHistory: makeHistory('APP-2025-012', [
        { stage: 'scrutiny', status: 'submitted', role: 'institution_admin', name: 'NSEC Director', ts: daysAgoISO(35), remarks: 'Application submitted.', prev: undefined },
        { stage: 'scrutiny', status: 'under_scrutiny', role: 'regional_officer', name: 'Sh. Rajan Mehta', ts: daysAgoISO(33), remarks: 'Under scrutiny.', prev: 'submitted' },
        { stage: 'evc', status: 'awaiting_evc', role: 'regional_officer', name: 'Sh. Rajan Mehta', ts: daysAgoISO(15), remarks: 'Scrutiny complete. EVC required.', prev: 'scrutiny' },
        { stage: 'evc', status: 'evc_scheduled', role: 'evc_coordinator', name: 'EVC Coordinator', ts: daysAgoISO(2), remarks: 'EVC scheduled.', prev: 'awaiting_evc' },
      ]),
      createdAt: daysAgoISO(35),
      updatedAt: daysAgoISO(2),
    },
  ];
}

function seedEVCRecords(): EVCRecord[] {
  return [
    {
      id: 'EVC-001',
      applicationId: 'APP-2025-005',
      institutionId: 'INST001',
      institutionName: 'Shri Vivekananda Institute of Technology',
      region: 'North',
      scheduledDate: daysFromNowISO(5),
      status: 'scheduled',
      coordinator: 'Prof. A.K. Singh',
      remarks: 'EVC team of 3 experts scheduled. Institution notified.',
      deadline: daysFromNowISO(12),
      createdAt: daysAgoISO(3),
      updatedAt: daysAgoISO(3),
    },
    {
      id: 'EVC-002',
      applicationId: 'APP-2025-003',
      institutionId: 'INST003',
      institutionName: 'Dr. APJ Abdul Kalam Polytechnic',
      region: 'South',
      status: 'overdue',
      coordinator: 'EVC Coordinator',
      remarks: 'EVC scheduling overdue. No response from institution for visit dates.',
      deadline: daysAgoISO(5),
      createdAt: daysAgoISO(20),
      updatedAt: daysAgoISO(5),
    },
    {
      id: 'EVC-003',
      applicationId: 'APP-2025-010',
      institutionId: 'INST002',
      institutionName: 'Rajendra Technical College',
      region: 'West',
      status: 'overdue',
      coordinator: 'EVC Coordinator',
      remarks: 'EVC pending. Deadline passed.',
      deadline: daysAgoISO(10),
      createdAt: daysAgoISO(25),
      updatedAt: daysAgoISO(10),
    },
    {
      id: 'EVC-004',
      applicationId: 'APP-2025-012',
      institutionId: 'INST004',
      institutionName: 'Netaji Subhas Engineering College',
      region: 'East',
      scheduledDate: daysFromNowISO(7),
      status: 'scheduled',
      coordinator: 'Prof. D. Ghosh',
      remarks: 'EVC team confirmed. Physical verification of aerospace lab required.',
      deadline: daysFromNowISO(10),
      createdAt: daysAgoISO(2),
      updatedAt: daysAgoISO(2),
    },
    {
      id: 'EVC-005',
      applicationId: 'APP-2025-006',
      institutionId: 'INST002',
      institutionName: 'Rajendra Technical College',
      region: 'West',
      scheduledDate: daysAgoISO(30),
      completionDate: daysAgoISO(25),
      status: 'completed',
      coordinator: 'Prof. M. Patil',
      remarks: 'EVC completed. Facilities found adequate. Positive report submitted.',
      deadline: daysAgoISO(20),
      createdAt: daysAgoISO(45),
      updatedAt: daysAgoISO(25),
    },
  ];
}

function seedUndertakings(): Undertaking[] {
  return [
    {
      id: 'UND-001',
      institutionId: 'INST001',
      institutionName: 'Shri Vivekananda Institute of Technology',
      relatedApplicationId: 'APP-2025-001',
      description: 'Undertaking to complete construction of additional lab block within 12 months of approval',
      dateRecorded: daysAgoISO(60),
      dueDate: daysFromNowISO(3), // approaching
      requiredEvidence: 'Completion certificate from licensed structural engineer, photographs',
      submissionStatus: 'pending',
      verificationStatus: 'pending',
      assignedVerifier: 'Sh. Rajan Mehta',
      verificationRemarks: '',
      evidenceDescription: '',
      escalationHistory: [],
      createdAt: daysAgoISO(60),
      updatedAt: daysAgoISO(60),
    },
    {
      id: 'UND-002',
      institutionId: 'INST002',
      institutionName: 'Rajendra Technical College',
      relatedApplicationId: 'APP-2025-006',
      description: 'Undertaking to appoint additional faculty members for expanded intake within 30 days',
      dateRecorded: daysAgoISO(40),
      dueDate: daysAgoISO(10), // overdue
      requiredEvidence: 'Appointment letters, qualification certificates, joining report',
      submissionStatus: 'overdue',
      verificationStatus: 'pending',
      assignedVerifier: 'Smt. Priya Sharma',
      verificationRemarks: '',
      evidenceDescription: '',
      escalationHistory: [
        { escalatedAt: daysAgoISO(5), escalatedTo: 'supervisory_admin', reason: 'Undertaking deadline passed without submission.' },
      ],
      createdAt: daysAgoISO(40),
      updatedAt: daysAgoISO(5),
    },
    {
      id: 'UND-003',
      institutionId: 'INST003',
      institutionName: 'Dr. APJ Abdul Kalam Polytechnic',
      relatedApplicationId: 'APP-2025-007',
      description: 'Undertaking to secure fire safety certification before student enrollment',
      dateRecorded: daysAgoISO(20),
      dueDate: daysFromNowISO(15),
      requiredEvidence: 'Fire safety NOC from competent authority',
      submissionStatus: 'awaiting_verification',
      verificationStatus: 'awaiting_verification',
      assignedVerifier: 'Dr. Suresh Kumar',
      verificationRemarks: '',
      submittedAt: daysAgoISO(3),
      evidenceDescription: 'Fire Safety NOC from Chennai Municipal Corporation dated ' + new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString() + '. Reference: CMC/FSO/2025/4421.',
      escalationHistory: [],
      createdAt: daysAgoISO(20),
      updatedAt: daysAgoISO(3),
    },
    {
      id: 'UND-004',
      institutionId: 'INST004',
      institutionName: 'Netaji Subhas Engineering College',
      relatedApplicationId: 'APP-2025-006',
      description: 'Undertaking to install high-speed internet connectivity in all laboratories',
      dateRecorded: daysAgoISO(100),
      dueDate: daysAgoISO(20),
      requiredEvidence: 'Internet service provider agreement, network topology, speed test results',
      submissionStatus: 'verified',
      verificationStatus: 'verified',
      assignedVerifier: 'Sh. Rajan Mehta',
      verificationRemarks: 'All labs verified to have 1 Gbps connectivity. Requirement fulfilled.',
      submittedAt: daysAgoISO(30),
      verifiedAt: daysAgoISO(22),
      evidenceDescription: 'ISP agreement with Reliance Jio for 1 Gbps leased line. Speed test results attached.',
      escalationHistory: [],
      createdAt: daysAgoISO(100),
      updatedAt: daysAgoISO(22),
    },
    {
      id: 'UND-005',
      institutionId: 'INST001',
      institutionName: 'Shri Vivekananda Institute of Technology',
      relatedApplicationId: 'APP-2025-009',
      description: 'Undertaking to submit audited financial statements showing adequate corpus fund',
      dateRecorded: daysAgoISO(15),
      dueDate: daysFromNowISO(7),
      requiredEvidence: 'CA-certified financial statements, FDR receipts',
      submissionStatus: 'rejected',
      verificationStatus: 'rejected',
      assignedVerifier: 'Sh. Rajan Mehta',
      verificationRemarks: 'Documents submitted were not CA-certified. Plain copies are not acceptable. Please resubmit with certified copies.',
      submittedAt: daysAgoISO(8),
      evidenceDescription: 'Scanned copy of financial statement 2024-25 showing corpus fund of Rs. 50 lakhs.',
      escalationHistory: [],
      createdAt: daysAgoISO(15),
      updatedAt: daysAgoISO(4),
    },
  ];
}

function seedDocuments(): Document[] {
  return [
    {
      id: 'DOC-001',
      institutionId: 'INST001',
      institutionName: 'Shri Vivekananda Institute of Technology',
      documentType: 'Land Lease Agreement',
      relatedApplicationId: 'APP-2025-001',
      issueDate: daysAgoISO(1825), // 5 years ago
      expiryDate: daysFromNowISO(10), // expiring in 10 days
      submissionStatus: 'expiring_soon',
      verificationStatus: 'valid',
      renewalRequired: true,
      renewalHistory: [],
      createdAt: daysAgoISO(1825),
      updatedAt: daysAgoISO(30),
    },
    {
      id: 'DOC-002',
      institutionId: 'INST002',
      institutionName: 'Rajendra Technical College',
      documentType: 'Fire Safety NOC',
      relatedApplicationId: 'APP-2025-002',
      issueDate: daysAgoISO(395), // issued ~13 months ago
      expiryDate: daysAgoISO(30), // expired 30 days ago
      submissionStatus: 'expired',
      verificationStatus: 'expired',
      renewalRequired: true,
      renewalHistory: [],
      createdAt: daysAgoISO(395),
      updatedAt: daysAgoISO(30),
    },
    {
      id: 'DOC-003',
      institutionId: 'INST003',
      institutionName: 'Dr. APJ Abdul Kalam Polytechnic',
      documentType: 'Building Plan Approval',
      relatedApplicationId: 'APP-2025-007',
      issueDate: daysAgoISO(365),
      expiryDate: daysFromNowISO(200), // valid
      submissionStatus: 'valid',
      verificationStatus: 'valid',
      renewalRequired: false,
      renewalHistory: [],
      createdAt: daysAgoISO(365),
      updatedAt: daysAgoISO(365),
    },
    {
      id: 'DOC-004',
      institutionId: 'INST004',
      institutionName: 'Netaji Subhas Engineering College',
      documentType: 'Land Lease Agreement',
      relatedApplicationId: 'APP-2025-008',
      issueDate: daysAgoISO(3650), // 10 years ago
      expiryDate: daysAgoISO(15), // expired 15 days ago
      submissionStatus: 'renewal_pending_verification',
      verificationStatus: 'renewal_pending_verification',
      renewalRequired: true,
      renewalEvidenceDescription: 'Renewed lease agreement with DDA dated 5 days ago. Ref: DDA/LD/2025/8821.',
      submittedAt: daysAgoISO(5),
      renewalHistory: [],
      createdAt: daysAgoISO(3650),
      updatedAt: daysAgoISO(5),
    },
    {
      id: 'DOC-005',
      institutionId: 'INST001',
      institutionName: 'Shri Vivekananda Institute of Technology',
      documentType: 'Affidavit — No Adverse Court Proceedings',
      relatedApplicationId: 'APP-2025-001',
      issueDate: daysAgoISO(360),
      expiryDate: daysFromNowISO(5), // expiring in 5 days
      submissionStatus: 'expiring_soon',
      verificationStatus: 'valid',
      renewalRequired: true,
      renewalHistory: [],
      createdAt: daysAgoISO(360),
      updatedAt: daysAgoISO(30),
    },
    {
      id: 'DOC-006',
      institutionId: 'INST002',
      institutionName: 'Rajendra Technical College',
      documentType: 'Accreditation Certificate (NBA)',
      relatedApplicationId: undefined,
      issueDate: daysAgoISO(730),
      expiryDate: daysAgoISO(60), // expired
      submissionStatus: 'missing',
      verificationStatus: 'missing',
      renewalRequired: true,
      renewalHistory: [],
      createdAt: daysAgoISO(730),
      updatedAt: daysAgoISO(60),
    },
  ];
}

function seedComplianceSubmissions(): ComplianceSubmission[] {
  return [
    {
      id: 'CS-001',
      institutionId: 'INST003',
      institutionName: 'Dr. APJ Abdul Kalam Polytechnic',
      relatedUndertakingId: 'UND-003',
      relatedApplicationId: 'APP-2025-007',
      submissionType: 'undertaking',
      description: 'Submission of Fire Safety NOC as per undertaking requirements',
      fileName: 'CMC_FireSafetyNOC_2025_AAPK.pdf',
      submittedBy: 'AAPK Principal',
      submittedByRole: 'institution_admin',
      submittedAt: daysAgoISO(3),
      status: 'awaiting_verification',
      previousAttempts: [],
      createdAt: daysAgoISO(3),
      updatedAt: daysAgoISO(3),
    },
    {
      id: 'CS-002',
      institutionId: 'INST004',
      institutionName: 'Netaji Subhas Engineering College',
      relatedDocumentId: 'DOC-004',
      relatedApplicationId: 'APP-2025-008',
      submissionType: 'document',
      description: 'Renewal of Land Lease Agreement with DDA for 30 additional years',
      fileName: 'DDA_LeaseRenewal_NSEC_2025.pdf',
      submittedBy: 'NSEC Director',
      submittedByRole: 'institution_admin',
      submittedAt: daysAgoISO(5),
      status: 'awaiting_verification',
      previousAttempts: [],
      createdAt: daysAgoISO(5),
      updatedAt: daysAgoISO(5),
    },
    {
      id: 'CS-003',
      institutionId: 'INST001',
      institutionName: 'Shri Vivekananda Institute of Technology',
      relatedUndertakingId: 'UND-005',
      relatedApplicationId: 'APP-2025-009',
      submissionType: 'undertaking',
      description: 'CA-certified financial statements showing corpus fund adequacy',
      fileName: 'SVIT_FinancialStatements_CAcertified_2025.pdf',
      submittedBy: 'SVIT Admin',
      submittedByRole: 'institution_admin',
      submittedAt: daysAgoISO(8),
      status: 'rejected',
      verifier: 'Sh. Rajan Mehta',
      verificationRemarks: 'Documents submitted were not CA-certified. Plain copies are not acceptable.',
      verifiedAt: daysAgoISO(4),
      previousAttempts: [],
      createdAt: daysAgoISO(8),
      updatedAt: daysAgoISO(4),
    },
    {
      id: 'CS-004',
      institutionId: 'INST004',
      institutionName: 'Netaji Subhas Engineering College',
      relatedUndertakingId: 'UND-004',
      relatedApplicationId: 'APP-2025-006',
      submissionType: 'undertaking',
      description: 'Internet connectivity evidence — ISP agreement and speed test results',
      fileName: 'NSEC_ISP_Agreement_SpeedTest_2025.zip',
      submittedBy: 'NSEC Director',
      submittedByRole: 'institution_admin',
      submittedAt: daysAgoISO(30),
      status: 'verified',
      verifier: 'Sh. Rajan Mehta',
      verificationRemarks: 'All labs verified to have 1 Gbps connectivity. Requirements met.',
      verifiedAt: daysAgoISO(22),
      previousAttempts: [],
      createdAt: daysAgoISO(30),
      updatedAt: daysAgoISO(22),
    },
  ];
}

function seedAuditEvents(): AuditEvent[] {
  const events: AuditEvent[] = [
    {
      id: 'AUD-001',
      timestamp: daysAgoISO(60),
      actorRole: 'institution_admin',
      actorName: 'SVIT Admin',
      actionType: 'application_created',
      affectedEntityType: 'Application',
      affectedEntityId: 'APP-2025-001',
      affectedEntityName: 'AICTE/2025/NR/001',
      remarks: 'Application submitted for B.Tech (CSE with AI) new programme approval.',
    },
    {
      id: 'AUD-002',
      timestamp: daysAgoISO(58),
      actorRole: 'regional_officer',
      actorName: 'Sh. Rajan Mehta',
      actionType: 'stage_changed',
      affectedEntityType: 'Application',
      affectedEntityId: 'APP-2025-001',
      affectedEntityName: 'AICTE/2025/NR/001',
      previousValue: 'submitted',
      newValue: 'under_scrutiny',
      remarks: 'Application taken up for scrutiny.',
    },
    {
      id: 'AUD-003',
      timestamp: daysAgoISO(45),
      actorRole: 'institution_admin',
      actorName: 'RTC Registrar',
      actionType: 'application_created',
      affectedEntityType: 'Application',
      affectedEntityId: 'APP-2025-002',
      affectedEntityName: 'AICTE/2025/WR/002',
      remarks: 'Application submitted for increase in intake.',
    },
    {
      id: 'AUD-004',
      timestamp: daysAgoISO(10),
      actorRole: 'regional_officer',
      actorName: 'Smt. Priya Sharma',
      actionType: 'application_returned',
      affectedEntityType: 'Application',
      affectedEntityId: 'APP-2025-002',
      affectedEntityName: 'AICTE/2025/WR/002',
      previousValue: 'under_scrutiny',
      newValue: 'returned_for_deficiency',
      remarks: 'Building completion certificate not submitted. Faculty appointment letters missing.',
    },
    {
      id: 'AUD-005',
      timestamp: daysAgoISO(5),
      actorRole: 'institution_admin',
      actorName: 'SVIT Admin',
      actionType: 'application_resubmitted',
      affectedEntityType: 'Application',
      affectedEntityId: 'APP-2025-009',
      affectedEntityName: 'AICTE/2025/NR/009',
      previousValue: 'returned_for_deficiency',
      newValue: 'resubmitted',
      remarks: 'All deficiencies addressed. Resubmitting.',
    },
    {
      id: 'AUD-006',
      timestamp: daysAgoISO(3),
      actorRole: 'evc_coordinator',
      actorName: 'EVC Coordinator',
      actionType: 'evc_scheduled',
      affectedEntityType: 'EVCRecord',
      affectedEntityId: 'EVC-001',
      affectedEntityName: 'EVC for APP-2025-005',
      remarks: 'EVC visit scheduled for Shri Vivekananda Institute of Technology.',
    },
    {
      id: 'AUD-007',
      timestamp: daysAgoISO(3),
      actorRole: 'institution_admin',
      actorName: 'AAPK Principal',
      actionType: 'undertaking_submitted',
      affectedEntityType: 'Undertaking',
      affectedEntityId: 'UND-003',
      affectedEntityName: 'Fire Safety NOC — AAPK',
      remarks: 'Fire Safety NOC submitted as evidence.',
    },
    {
      id: 'AUD-008',
      timestamp: daysAgoISO(5),
      actorRole: 'institution_admin',
      actorName: 'NSEC Director',
      actionType: 'document_submitted',
      affectedEntityType: 'Document',
      affectedEntityId: 'DOC-004',
      affectedEntityName: 'Land Lease Agreement — NSEC',
      previousValue: 'expired',
      newValue: 'renewal_pending_verification',
      remarks: 'Land lease renewal document submitted.',
    },
    {
      id: 'AUD-009',
      timestamp: daysAgoISO(22),
      actorRole: 'regional_officer',
      actorName: 'Sh. Rajan Mehta',
      actionType: 'undertaking_verified',
      affectedEntityType: 'Undertaking',
      affectedEntityId: 'UND-004',
      affectedEntityName: 'Internet Connectivity — NSEC',
      previousValue: 'awaiting_verification',
      newValue: 'verified',
      remarks: 'All labs verified to have 1 Gbps connectivity.',
    },
    {
      id: 'AUD-010',
      timestamp: daysAgoISO(4),
      actorRole: 'regional_officer',
      actorName: 'Sh. Rajan Mehta',
      actionType: 'compliance_rejected',
      affectedEntityType: 'ComplianceSubmission',
      affectedEntityId: 'CS-003',
      affectedEntityName: 'Financial Statements — SVIT',
      remarks: 'Documents were plain copies, not CA-certified.',
    },
    {
      id: 'AUD-011',
      timestamp: daysAgoISO(10),
      actorRole: 'supervisory_admin',
      actorName: 'Supervisory Admin',
      actionType: 'stage_changed',
      affectedEntityType: 'Application',
      affectedEntityId: 'APP-2025-006',
      affectedEntityName: 'AICTE/2025/WR/006',
      previousValue: 'evc_completed',
      newValue: 'approved',
      remarks: 'Application approved by competent authority after successful EVC.',
    } as AuditEvent,
  ];
  return events;
}

function seedAlerts(applications: Application[], evcRecords: EVCRecord[], undertakings: Undertaking[], documents: Document[]): Alert[] {
  const alerts: Alert[] = [];

  // Overdue application alert
  const overdueApp = applications.find(a => a.id === 'APP-2025-001');
  if (overdueApp) {
    alerts.push({
      id: generateAlertId('overdue_application', overdueApp.id, 'stage'),
      alertType: 'overdue_application',
      relatedEntityType: 'Application',
      relatedEntityId: overdueApp.id,
      relatedEntityName: overdueApp.applicationId,
      responsibleRole: 'regional_officer',
      createdAt: daysAgoISO(28),
      deadline: overdueApp.stageDeadline,
      severity: 'critical',
      message: `Application ${overdueApp.applicationId} at ${overdueApp.institutionName} is overdue at scrutiny stage by 28 days.`,
      status: 'escalated',
      escalationLevel: 1,
      escalationTimestamp: daysAgoISO(20),
      escalationHistory: [
        {
          id: 'ESC-001',
          alertId: generateAlertId('overdue_application', overdueApp.id, 'stage'),
          escalatedAt: daysAgoISO(20),
          escalatedFrom: 'regional_officer',
          escalatedTo: 'supervisory_admin',
          reason: 'Application overdue by 8 days with no update from assigned officer.',
          status: 'open',
        },
      ],
    });
  }

  // EVC overdue alerts
  evcRecords.filter(e => e.status === 'overdue').forEach(evc => {
    alerts.push({
      id: generateAlertId('evc_overdue', evc.id, 'deadline'),
      alertType: 'evc_overdue',
      relatedEntityType: 'EVCRecord',
      relatedEntityId: evc.id,
      relatedEntityName: `EVC for ${evc.institutionName}`,
      responsibleRole: 'evc_coordinator',
      createdAt: evc.deadline,
      deadline: evc.deadline,
      severity: 'high',
      message: `EVC for ${evc.institutionName} is overdue. No inspection scheduled.`,
      status: 'open',
      escalationLevel: 0,
      escalationHistory: [],
    });
  });

  // Undertaking overdue
  undertakings.filter(u => u.submissionStatus === 'overdue').forEach(und => {
    alerts.push({
      id: generateAlertId('undertaking_overdue', und.id, 'due'),
      alertType: 'undertaking_overdue',
      relatedEntityType: 'Undertaking',
      relatedEntityId: und.id,
      relatedEntityName: und.description.substring(0, 60),
      responsibleRole: 'supervisory_admin',
      createdAt: und.dueDate,
      deadline: und.dueDate,
      severity: 'high',
      message: `Undertaking from ${und.institutionName} is overdue: ${und.description.substring(0, 80)}`,
      status: 'escalated',
      escalationLevel: 1,
      escalationTimestamp: daysAgoISO(5),
      escalationHistory: [
        {
          id: generateId('esc'),
          alertId: generateAlertId('undertaking_overdue', und.id, 'due'),
          escalatedAt: daysAgoISO(5),
          escalatedFrom: 'regional_officer',
          escalatedTo: 'supervisory_admin',
          reason: 'Undertaking deadline passed without submission.',
          status: 'open',
        },
      ],
    });
  });

  // Approaching undertaking
  undertakings.filter(u => {
    const d = getDaysUntil(u.dueDate);
    return d >= 0 && d <= 7 && u.submissionStatus === 'pending';
  }).forEach(und => {
    alerts.push({
      id: generateAlertId('undertaking_upcoming', und.id, 'due'),
      alertType: 'undertaking_upcoming',
      relatedEntityType: 'Undertaking',
      relatedEntityId: und.id,
      relatedEntityName: und.description.substring(0, 60),
      responsibleRole: 'institution_admin',
      createdAt: daysAgoISO(2),
      deadline: und.dueDate,
      severity: 'medium',
      message: `Undertaking due in ${getDaysUntil(und.dueDate)} days: ${und.description.substring(0, 80)}`,
      status: 'open',
      escalationLevel: 0,
      escalationHistory: [],
    });
  });

  // Document expiring
  documents.filter(d => d.submissionStatus === 'expiring_soon').forEach(doc => {
    alerts.push({
      id: generateAlertId('document_expiry', doc.id, 'expiry'),
      alertType: 'document_expiry',
      relatedEntityType: 'Document',
      relatedEntityId: doc.id,
      relatedEntityName: `${doc.documentType} — ${doc.institutionName}`,
      responsibleRole: 'institution_admin',
      createdAt: daysAgoISO(3),
      deadline: doc.expiryDate,
      severity: 'high',
      message: `${doc.documentType} for ${doc.institutionName} expires in ${getDaysUntil(doc.expiryDate)} days.`,
      status: 'open',
      escalationLevel: 0,
      escalationHistory: [],
    });
  });

  // Document expired
  documents.filter(d => d.submissionStatus === 'expired' || d.submissionStatus === 'missing').forEach(doc => {
    alerts.push({
      id: generateAlertId('document_expired', doc.id, 'expiry'),
      alertType: 'document_expired',
      relatedEntityType: 'Document',
      relatedEntityId: doc.id,
      relatedEntityName: `${doc.documentType} — ${doc.institutionName}`,
      responsibleRole: 'supervisory_admin',
      createdAt: doc.expiryDate,
      deadline: doc.expiryDate,
      severity: 'critical',
      message: `${doc.documentType} for ${doc.institutionName} has EXPIRED. Renewal required immediately.`,
      status: 'open',
      escalationLevel: 0,
      escalationHistory: [],
    });
  });

  // Approaching application deadline
  applications.filter(a => {
    const d = getDaysUntil(a.stageDeadline);
    return d >= 0 && d <= 7 && !['approved', 'rejected', 'withdrawn'].includes(a.currentStatus);
  }).forEach(app => {
    alerts.push({
      id: generateAlertId('approaching_deadline', app.id, 'stage'),
      alertType: 'approaching_deadline',
      relatedEntityType: 'Application',
      relatedEntityId: app.id,
      relatedEntityName: app.applicationId,
      responsibleRole: 'regional_officer',
      createdAt: daysAgoISO(2),
      deadline: app.stageDeadline,
      severity: 'medium',
      message: `Application ${app.applicationId} (${app.institutionName}) deadline in ${getDaysUntil(app.stageDeadline)} days.`,
      status: 'open',
      escalationLevel: 0,
      escalationHistory: [],
    });
  });

  return alerts;
}

// ============================================================
// Store interface
// ============================================================

interface StoreActions {
  setRole: (role: DemoRole) => void;
  advanceApplicationStage: (appId: string, remarks: string, actorRole: DemoRole, actorName: string) => void;
  returnApplicationForDeficiency: (appId: string, deficiencyReason: string, remarks: string, actorRole: DemoRole, actorName: string) => void;
  resubmitApplication: (appId: string, remarks: string, actorRole: DemoRole, actorName: string) => void;
  scheduleEVC: (evcId: string, scheduledDate: string, remarks: string, actorRole: DemoRole, actorName: string) => void;
  completeEVC: (evcId: string, remarks: string, actorRole: DemoRole, actorName: string) => void;
  submitUndertakingEvidence: (undertakingId: string, evidenceDescription: string, actorRole: DemoRole, actorName: string) => void;
  verifyUndertaking: (undertakingId: string, remarks: string, actorRole: DemoRole, actorName: string) => void;
  rejectUndertaking: (undertakingId: string, reason: string, actorRole: DemoRole, actorName: string) => void;
  submitDocumentRenewal: (docId: string, evidenceDescription: string, actorRole: DemoRole, actorName: string) => void;
  verifyDocument: (docId: string, remarks: string, actorRole: DemoRole, actorName: string) => void;
  rejectDocument: (docId: string, reason: string, actorRole: DemoRole, actorName: string) => void;
  submitCompliance: (data: Partial<ComplianceSubmission>, actorRole: DemoRole, actorName: string) => void;
  verifyCompliance: (submissionId: string, remarks: string, actorRole: DemoRole, actorName: string) => void;
  rejectCompliance: (submissionId: string, reason: string, actorRole: DemoRole, actorName: string) => void;
  acknowledgeAlert: (alertId: string, actorRole: DemoRole, actorName: string) => void;
  resolveAlert: (alertId: string, actorRole: DemoRole, actorName: string) => void;
  evaluateAndCreateAlerts: () => void;
  updateWorkflowConfig: (config: Partial<WorkflowConfig>) => void;
  resetDemoData: () => void;
  addAuditEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
}

type Store = AppState & StoreActions;

// ============================================================
// Generate initial state
// ============================================================

function generateInitialState(): AppState {
  const institutions = INSTITUTIONS;
  const workflowRoutes = WORKFLOW_ROUTES;
  const applications = seedApplications();
  const evcRecords = seedEVCRecords();
  const undertakings = seedUndertakings();
  const documents = seedDocuments();
  const complianceSubmissions = seedComplianceSubmissions();
  const auditEvents = seedAuditEvents();
  const alerts = seedAlerts(applications, evcRecords, undertakings, documents);

  return {
    institutions,
    applications,
    evcRecords,
    undertakings,
    documents,
    complianceSubmissions,
    alerts,
    auditEvents,
    workflowRoutes,
    workflowConfig: DEFAULT_WORKFLOW_CONFIG,
    currentRole: 'supervisory_admin',
    currentDemoUser: 'Demo Supervisory Admin',
    dataVersion: DATA_VERSION,
  };
}

// ============================================================
// Zustand store
// ============================================================

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...generateInitialState(),

      // ---- Role ----
      setRole: (role) => {
        const roleNames: Record<DemoRole, string> = {
          institution_admin: 'Demo Institution Admin (SVIT)',
          regional_officer: 'Demo Regional Officer (North)',
          evc_coordinator: 'Demo EVC Coordinator',
          supervisory_admin: 'Demo Supervisory Admin',
        };
        set({ currentRole: role, currentDemoUser: roleNames[role] });
      },

      // ---- Audit ----
      addAuditEvent: (event) => {
        const newEvent: AuditEvent = {
          ...event,
          id: generateId('aud'),
          timestamp: new Date().toISOString(),
        };
        set(state => ({ auditEvents: [newEvent, ...state.auditEvents] }));
      },

      // ---- Application Workflow ----
      advanceApplicationStage: (appId, remarks, actorRole, actorName) => {
        const { applications, workflowRoutes } = get();
        const app = applications.find(a => a.id === appId);
        if (!app) return;

        const nextStage = getNextStage(app.currentStage, app.workflowRouteId, workflowRoutes);
        if (!nextStage) return;

        const terminalStage = nextStage === 'approved';

        // Determine new status based on next stage
        let newStatus: Application['currentStatus'] = 'under_scrutiny';
        if (nextStage === 'evc') newStatus = 'awaiting_evc';
        else if (nextStage === 'sac_shc') newStatus = 'pending_sac';
        else if (nextStage === 'approved') newStatus = 'approved';
        else newStatus = 'under_scrutiny';

        const deadlineDays = nextStage === 'scrutiny' ? 30 : nextStage === 'evc' ? 30 : nextStage === 'sac_shc' ? 45 : 0;
        const newDeadline = terminalStage ? new Date().toISOString() : daysFromNowISO(deadlineDays);

        const historyEntry: import('../types/index.ts').StageHistoryEntry = {
          id: generateId('hist'),
          applicationId: appId,
          stage: nextStage,
          status: newStatus,
          actorRole,
          actorName,
          timestamp: new Date().toISOString(),
          remarks,
          previousStage: app.currentStage,
        };

        const updatedApp: Application = {
          ...app,
          currentStage: nextStage,
          currentStatus: newStatus,
          stageEntryDate: new Date().toISOString(),
          stageDeadline: newDeadline,
          remarks,
          processingHistory: [...app.processingHistory, historyEntry],
          updatedAt: new Date().toISOString(),
        };

        set(state => ({
          applications: state.applications.map(a => a.id === appId ? updatedApp : a),
        }));

        // If moving to EVC stage, create EVC record if not exists
        if (nextStage === 'evc') {
          const { evcRecords } = get();
          const existingEvc = evcRecords.find(e => e.applicationId === appId);
          if (!existingEvc) {
            const newEvc: EVCRecord = {
              id: generateId('evc'),
              applicationId: appId,
              institutionId: app.institutionId,
              institutionName: app.institutionName,
              region: app.region,
              status: 'pending',
              coordinator: 'EVC Coordinator',
              remarks: '',
              deadline: daysFromNowISO(30),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            set(state => ({ evcRecords: [...state.evcRecords, newEvc] }));
          }
        }

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'stage_changed',
          affectedEntityType: 'Application',
          affectedEntityId: appId,
          affectedEntityName: app.applicationId,
          previousValue: `${app.currentStage} / ${app.currentStatus}`,
          newValue: `${nextStage} / ${newStatus}`,
          remarks,
        });
      },

      returnApplicationForDeficiency: (appId, deficiencyReason, remarks, actorRole, actorName) => {
        const { applications } = get();
        const app = applications.find(a => a.id === appId);
        if (!app) return;

        const historyEntry: import('../types/index.ts').StageHistoryEntry = {
          id: generateId('hist'),
          applicationId: appId,
          stage: app.currentStage,
          status: 'returned_for_deficiency',
          actorRole,
          actorName,
          timestamp: new Date().toISOString(),
          remarks,
          deficiencyReason,
          previousStage: app.currentStage,
        };

        const updatedApp: Application = {
          ...app,
          currentStatus: 'returned_for_deficiency',
          deficiencyReasons: [...app.deficiencyReasons, deficiencyReason],
          remarks,
          processingHistory: [...app.processingHistory, historyEntry],
          updatedAt: new Date().toISOString(),
        };

        set(state => ({
          applications: state.applications.map(a => a.id === appId ? updatedApp : a),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'application_returned',
          affectedEntityType: 'Application',
          affectedEntityId: appId,
          affectedEntityName: app.applicationId,
          previousValue: app.currentStatus,
          newValue: 'returned_for_deficiency',
          remarks: deficiencyReason,
        });
      },

      resubmitApplication: (appId, remarks, actorRole, actorName) => {
        const { applications } = get();
        const app = applications.find(a => a.id === appId);
        if (!app || app.currentStatus !== 'returned_for_deficiency') return;

        const historyEntry: import('../types/index.ts').StageHistoryEntry = {
          id: generateId('hist'),
          applicationId: appId,
          stage: app.currentStage,
          status: 'resubmitted',
          actorRole,
          actorName,
          timestamp: new Date().toISOString(),
          remarks,
          previousStage: app.currentStage,
        };

        const updatedApp: Application = {
          ...app,
          currentStatus: 'resubmitted',
          deficiencyReasons: [],
          remarks,
          processingHistory: [...app.processingHistory, historyEntry],
          updatedAt: new Date().toISOString(),
        };

        set(state => ({
          applications: state.applications.map(a => a.id === appId ? updatedApp : a),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'application_resubmitted',
          affectedEntityType: 'Application',
          affectedEntityId: appId,
          affectedEntityName: app.applicationId,
          previousValue: 'returned_for_deficiency',
          newValue: 'resubmitted',
          remarks,
        });
      },

      // ---- EVC ----
      scheduleEVC: (evcId, scheduledDate, remarks, actorRole, actorName) => {
        const { evcRecords, applications } = get();
        const evc = evcRecords.find(e => e.id === evcId);
        if (!evc) return;

        const updatedEvc: EVCRecord = {
          ...evc,
          scheduledDate,
          status: 'scheduled',
          remarks,
          updatedAt: new Date().toISOString(),
        };

        // Update application status
        const app = applications.find(a => a.id === evc.applicationId);
        if (app) {
          const histEntry: import('../types/index.ts').StageHistoryEntry = {
            id: generateId('hist'),
            applicationId: app.id,
            stage: app.currentStage,
            status: 'evc_scheduled',
            actorRole,
            actorName,
            timestamp: new Date().toISOString(),
            remarks: `EVC scheduled for ${new Date(scheduledDate).toLocaleDateString('en-IN')}. ${remarks}`,
          };
          set(state => ({
            evcRecords: state.evcRecords.map(e => e.id === evcId ? updatedEvc : e),
            applications: state.applications.map(a =>
              a.id === evc.applicationId
                ? { ...a, currentStatus: 'evc_scheduled', processingHistory: [...a.processingHistory, histEntry], updatedAt: new Date().toISOString() }
                : a
            ),
          }));
        } else {
          set(state => ({
            evcRecords: state.evcRecords.map(e => e.id === evcId ? updatedEvc : e),
          }));
        }

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'evc_scheduled',
          affectedEntityType: 'EVCRecord',
          affectedEntityId: evcId,
          affectedEntityName: `EVC for ${evc.institutionName}`,
          newValue: scheduledDate,
          remarks,
        });
      },

      completeEVC: (evcId, remarks, actorRole, actorName) => {
        const { evcRecords, applications } = get();
        const evc = evcRecords.find(e => e.id === evcId);
        if (!evc) return;

        const updatedEvc: EVCRecord = {
          ...evc,
          status: 'completed',
          completionDate: new Date().toISOString(),
          remarks,
          updatedAt: new Date().toISOString(),
        };

        // Advance app to evc_completed
        const app = applications.find(a => a.id === evc.applicationId);
        if (app) {
          const histEntry: import('../types/index.ts').StageHistoryEntry = {
            id: generateId('hist'),
            applicationId: app.id,
            stage: app.currentStage,
            status: 'evc_completed',
            actorRole,
            actorName,
            timestamp: new Date().toISOString(),
            remarks: `EVC inspection completed. ${remarks}`,
          };
          // Find next stage
          const { workflowRoutes } = get();
          const nextStage = getNextStage('evc', app.workflowRouteId, workflowRoutes);
          let newStatus: Application['currentStatus'] = 'evc_completed';
          let newStage = 'evc';
          if (nextStage === 'sac_shc') {
            newStatus = 'pending_sac';
            newStage = 'sac_shc';
          } else if (nextStage === 'approved') {
            newStatus = 'approved';
            newStage = 'approved';
          }

          set(state => ({
            evcRecords: state.evcRecords.map(e => e.id === evcId ? updatedEvc : e),
            applications: state.applications.map(a =>
              a.id === evc.applicationId
                ? {
                    ...a,
                    currentStatus: newStatus,
                    currentStage: newStage,
                    stageEntryDate: new Date().toISOString(),
                    processingHistory: [...a.processingHistory, histEntry],
                    updatedAt: new Date().toISOString(),
                  }
                : a
            ),
          }));
        } else {
          set(state => ({
            evcRecords: state.evcRecords.map(e => e.id === evcId ? updatedEvc : e),
          }));
        }

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'evc_completed',
          affectedEntityType: 'EVCRecord',
          affectedEntityId: evcId,
          affectedEntityName: `EVC for ${evc.institutionName}`,
          previousValue: 'scheduled',
          newValue: 'completed',
          remarks,
        });
      },

      // ---- Undertakings ----
      submitUndertakingEvidence: (undertakingId, evidenceDescription, actorRole, actorName) => {
        const { undertakings } = get();
        const und = undertakings.find(u => u.id === undertakingId);
        if (!und) return;

        set(state => ({
          undertakings: state.undertakings.map(u =>
            u.id === undertakingId
              ? { ...u, submissionStatus: 'awaiting_verification', verificationStatus: 'awaiting_verification', evidenceDescription, submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : u
          ),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'undertaking_submitted',
          affectedEntityType: 'Undertaking',
          affectedEntityId: undertakingId,
          affectedEntityName: und.description.substring(0, 60),
          previousValue: und.submissionStatus,
          newValue: 'awaiting_verification',
          remarks: evidenceDescription,
        });
      },

      verifyUndertaking: (undertakingId, remarks, actorRole, actorName) => {
        const { undertakings } = get();
        const und = undertakings.find(u => u.id === undertakingId);
        if (!und) return;

        set(state => ({
          undertakings: state.undertakings.map(u =>
            u.id === undertakingId
              ? { ...u, submissionStatus: 'verified', verificationStatus: 'verified', verificationRemarks: remarks, verifiedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : u
          ),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'undertaking_verified',
          affectedEntityType: 'Undertaking',
          affectedEntityId: undertakingId,
          affectedEntityName: und.description.substring(0, 60),
          previousValue: 'awaiting_verification',
          newValue: 'verified',
          remarks,
        });
      },

      rejectUndertaking: (undertakingId, reason, actorRole, actorName) => {
        const { undertakings } = get();
        const und = undertakings.find(u => u.id === undertakingId);
        if (!und) return;

        set(state => ({
          undertakings: state.undertakings.map(u =>
            u.id === undertakingId
              ? { ...u, submissionStatus: 'rejected', verificationStatus: 'rejected', verificationRemarks: reason, updatedAt: new Date().toISOString() }
              : u
          ),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'undertaking_rejected',
          affectedEntityType: 'Undertaking',
          affectedEntityId: undertakingId,
          affectedEntityName: und.description.substring(0, 60),
          previousValue: 'awaiting_verification',
          newValue: 'rejected',
          remarks: reason,
        });
      },

      // ---- Documents ----
      submitDocumentRenewal: (docId, evidenceDescription, actorRole, actorName) => {
        const { documents } = get();
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;

        set(state => ({
          documents: state.documents.map(d =>
            d.id === docId
              ? { ...d, submissionStatus: 'renewal_pending_verification', verificationStatus: 'renewal_pending_verification', renewalEvidenceDescription: evidenceDescription, submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : d
          ),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'document_submitted',
          affectedEntityType: 'Document',
          affectedEntityId: docId,
          affectedEntityName: `${doc.documentType} — ${doc.institutionName}`,
          previousValue: doc.submissionStatus,
          newValue: 'renewal_pending_verification',
          remarks: evidenceDescription,
        });
      },

      verifyDocument: (docId, remarks, actorRole, actorName) => {
        const { documents } = get();
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;

        set(state => ({
          documents: state.documents.map(d =>
            d.id === docId
              ? { ...d, submissionStatus: 'renewal_verified', verificationStatus: 'renewal_verified', verificationRemarks: remarks, verifier: actorName, updatedAt: new Date().toISOString() }
              : d
          ),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'document_verified',
          affectedEntityType: 'Document',
          affectedEntityId: docId,
          affectedEntityName: `${doc.documentType} — ${doc.institutionName}`,
          previousValue: 'renewal_pending_verification',
          newValue: 'renewal_verified',
          remarks,
        });
      },

      rejectDocument: (docId, reason, actorRole, actorName) => {
        const { documents } = get();
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;

        set(state => ({
          documents: state.documents.map(d =>
            d.id === docId
              ? { ...d, submissionStatus: 'expired', verificationStatus: 'expired', verificationRemarks: reason, updatedAt: new Date().toISOString() }
              : d
          ),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'document_rejected',
          affectedEntityType: 'Document',
          affectedEntityId: docId,
          affectedEntityName: `${doc.documentType} — ${doc.institutionName}`,
          previousValue: 'renewal_pending_verification',
          newValue: 'expired',
          remarks: reason,
        });
      },

      // ---- Compliance ----
      submitCompliance: (data, actorRole, actorName) => {
        const newSubmission: ComplianceSubmission = {
          id: generateId('cs'),
          institutionId: data.institutionId || '',
          institutionName: data.institutionName || '',
          relatedDocumentId: data.relatedDocumentId,
          relatedUndertakingId: data.relatedUndertakingId,
          relatedApplicationId: data.relatedApplicationId,
          submissionType: data.submissionType || 'general',
          description: data.description || '',
          fileName: data.fileName,
          submittedBy: actorName,
          submittedByRole: actorRole,
          submittedAt: new Date().toISOString(),
          status: 'awaiting_verification',
          previousAttempts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set(state => ({
          complianceSubmissions: [newSubmission, ...state.complianceSubmissions],
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'compliance_submitted',
          affectedEntityType: 'ComplianceSubmission',
          affectedEntityId: newSubmission.id,
          affectedEntityName: newSubmission.description.substring(0, 60),
          newValue: 'awaiting_verification',
          remarks: newSubmission.description,
        });
      },

      verifyCompliance: (submissionId, remarks, actorRole, actorName) => {
        const { complianceSubmissions } = get();
        const sub = complianceSubmissions.find(s => s.id === submissionId);
        if (!sub) return;

        set(state => ({
          complianceSubmissions: state.complianceSubmissions.map(s =>
            s.id === submissionId
              ? { ...s, status: 'verified', verifier: actorName, verificationRemarks: remarks, verifiedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : s
          ),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'compliance_verified',
          affectedEntityType: 'ComplianceSubmission',
          affectedEntityId: submissionId,
          affectedEntityName: sub.description.substring(0, 60),
          previousValue: 'awaiting_verification',
          newValue: 'verified',
          remarks,
        });
      },

      rejectCompliance: (submissionId, reason, actorRole, actorName) => {
        const { complianceSubmissions } = get();
        const sub = complianceSubmissions.find(s => s.id === submissionId);
        if (!sub) return;

        set(state => ({
          complianceSubmissions: state.complianceSubmissions.map(s =>
            s.id === submissionId
              ? { ...s, status: 'rejected', verifier: actorName, verificationRemarks: reason, updatedAt: new Date().toISOString() }
              : s
          ),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'compliance_rejected',
          affectedEntityType: 'ComplianceSubmission',
          affectedEntityId: submissionId,
          affectedEntityName: sub.description.substring(0, 60),
          previousValue: 'awaiting_verification',
          newValue: 'rejected',
          remarks: reason,
        });
      },

      // ---- Alerts ----
      acknowledgeAlert: (alertId, actorRole, actorName) => {
        set(state => ({
          alerts: state.alerts.map(a =>
            a.id === alertId
              ? { ...a, status: 'acknowledged', acknowledgedAt: new Date().toISOString(), acknowledgedBy: actorName }
              : a
          ),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'alert_acknowledged',
          affectedEntityType: 'Alert',
          affectedEntityId: alertId,
          affectedEntityName: alertId,
          previousValue: 'open',
          newValue: 'acknowledged',
        });
      },

      resolveAlert: (alertId, actorRole, actorName) => {
        set(state => ({
          alerts: state.alerts.map(a =>
            a.id === alertId
              ? { ...a, status: 'resolved', resolutionTimestamp: new Date().toISOString() }
              : a
          ),
        }));

        get().addAuditEvent({
          actorRole,
          actorName,
          actionType: 'alert_resolved',
          affectedEntityType: 'Alert',
          affectedEntityId: alertId,
          affectedEntityName: alertId,
          previousValue: 'acknowledged',
          newValue: 'resolved',
        });
      },

      // ---- Alert Engine ----
      evaluateAndCreateAlerts: () => {
        const { applications, evcRecords, undertakings, documents, alerts, workflowConfig } = get();
        const existingIds = new Set(alerts.map(a => a.id));
        const newAlerts: Alert[] = [];

        // Check overdue applications
        applications.forEach(app => {
          if (['approved', 'rejected', 'withdrawn'].includes(app.currentStatus)) return;
          if (isOverdue(app.stageDeadline, app.currentStatus)) {
            const id = generateAlertId('overdue_application', app.id, 'stage');
            if (!existingIds.has(id)) {
              newAlerts.push({
                id,
                alertType: 'overdue_application',
                relatedEntityType: 'Application',
                relatedEntityId: app.id,
                relatedEntityName: app.applicationId,
                responsibleRole: 'regional_officer',
                createdAt: new Date().toISOString(),
                deadline: app.stageDeadline,
                severity: 'critical',
                message: `Application ${app.applicationId} is overdue at ${app.currentStage} stage.`,
                status: 'open',
                escalationLevel: 0,
                escalationHistory: [],
              });
            }
          }

          // Approaching deadline
          const daysLeft = getDaysUntil(app.stageDeadline);
          if (daysLeft >= 0 && daysLeft <= workflowConfig.reminderThresholdDays && !['approved', 'rejected', 'withdrawn'].includes(app.currentStatus)) {
            const id = generateAlertId('approaching_deadline', app.id, 'stage');
            if (!existingIds.has(id)) {
              newAlerts.push({
                id,
                alertType: 'approaching_deadline',
                relatedEntityType: 'Application',
                relatedEntityId: app.id,
                relatedEntityName: app.applicationId,
                responsibleRole: 'regional_officer',
                createdAt: new Date().toISOString(),
                deadline: app.stageDeadline,
                severity: 'medium',
                message: `Application ${app.applicationId} deadline in ${daysLeft} days.`,
                status: 'open',
                escalationLevel: 0,
                escalationHistory: [],
              });
            }
          }
        });

        // Check EVC records
        evcRecords.forEach(evc => {
          if (evc.status === 'completed' || evc.status === 'cancelled') return;
          if (isOverdue(evc.deadline, evc.status)) {
            const id = generateAlertId('evc_overdue', evc.id, 'deadline');
            if (!existingIds.has(id)) {
              newAlerts.push({
                id,
                alertType: 'evc_overdue',
                relatedEntityType: 'EVCRecord',
                relatedEntityId: evc.id,
                relatedEntityName: `EVC for ${evc.institutionName}`,
                responsibleRole: 'evc_coordinator',
                createdAt: new Date().toISOString(),
                deadline: evc.deadline,
                severity: 'high',
                message: `EVC for ${evc.institutionName} is overdue.`,
                status: 'open',
                escalationLevel: 0,
                escalationHistory: [],
              });
            }
          }
        });

        // Check undertakings
        undertakings.forEach(und => {
          if (und.submissionStatus === 'verified') return;
          if (isOverdue(und.dueDate, und.submissionStatus)) {
            const id = generateAlertId('undertaking_overdue', und.id, 'due');
            if (!existingIds.has(id)) {
              newAlerts.push({
                id,
                alertType: 'undertaking_overdue',
                relatedEntityType: 'Undertaking',
                relatedEntityId: und.id,
                relatedEntityName: und.description.substring(0, 50),
                responsibleRole: 'supervisory_admin',
                createdAt: new Date().toISOString(),
                deadline: und.dueDate,
                severity: 'high',
                message: `Undertaking overdue: ${und.description.substring(0, 80)}`,
                status: 'open',
                escalationLevel: 0,
                escalationHistory: [],
              });
            }
          }
          const daysLeft = getDaysUntil(und.dueDate);
          if (daysLeft >= 0 && daysLeft <= workflowConfig.reminderThresholdDays && und.submissionStatus === 'pending') {
            const id = generateAlertId('undertaking_upcoming', und.id, 'due');
            if (!existingIds.has(id)) {
              newAlerts.push({
                id,
                alertType: 'undertaking_upcoming',
                relatedEntityType: 'Undertaking',
                relatedEntityId: und.id,
                relatedEntityName: und.description.substring(0, 50),
                responsibleRole: 'institution_admin',
                createdAt: new Date().toISOString(),
                deadline: und.dueDate,
                severity: 'medium',
                message: `Undertaking due in ${daysLeft} days: ${und.description.substring(0, 60)}`,
                status: 'open',
                escalationLevel: 0,
                escalationHistory: [],
              });
            }
          }
        });

        // Check documents
        documents.forEach(doc => {
          if (['renewal_verified'].includes(doc.submissionStatus)) return;
          const daysLeft = getDaysUntil(doc.expiryDate);
          if (daysLeft < 0 && !['renewal_pending_verification', 'submitted_for_renewal'].includes(doc.submissionStatus)) {
            const id = generateAlertId('document_expired', doc.id, 'expiry');
            if (!existingIds.has(id)) {
              newAlerts.push({
                id,
                alertType: 'document_expired',
                relatedEntityType: 'Document',
                relatedEntityId: doc.id,
                relatedEntityName: `${doc.documentType} — ${doc.institutionName}`,
                responsibleRole: 'supervisory_admin',
                createdAt: new Date().toISOString(),
                deadline: doc.expiryDate,
                severity: 'critical',
                message: `${doc.documentType} for ${doc.institutionName} has expired. Renewal required.`,
                status: 'open',
                escalationLevel: 0,
                escalationHistory: [],
              });
            }
          } else if (daysLeft >= 0 && daysLeft <= 30 && !['renewal_pending_verification', 'submitted_for_renewal', 'expiring_soon'].includes(doc.submissionStatus)) {
            const id = generateAlertId('document_expiry', doc.id, 'expiry');
            if (!existingIds.has(id)) {
              newAlerts.push({
                id,
                alertType: 'document_expiry',
                relatedEntityType: 'Document',
                relatedEntityId: doc.id,
                relatedEntityName: `${doc.documentType} — ${doc.institutionName}`,
                responsibleRole: 'institution_admin',
                createdAt: new Date().toISOString(),
                deadline: doc.expiryDate,
                severity: 'high',
                message: `${doc.documentType} for ${doc.institutionName} expires in ${daysLeft} days.`,
                status: 'open',
                escalationLevel: 0,
                escalationHistory: [],
              });
            }
          }
        });

        if (newAlerts.length > 0) {
          set(state => ({ alerts: [...state.alerts, ...newAlerts] }));
          newAlerts.forEach(alert => {
            get().addAuditEvent({
              actorRole: 'supervisory_admin',
              actorName: 'System (Alert Engine)',
              actionType: 'alert_created',
              affectedEntityType: alert.relatedEntityType,
              affectedEntityId: alert.relatedEntityId,
              affectedEntityName: alert.relatedEntityName,
              newValue: alert.alertType,
              remarks: alert.message,
            });
          });
        }
      },

      // ---- Workflow Config ----
      updateWorkflowConfig: (config) => {
        set(state => ({
          workflowConfig: { ...state.workflowConfig, ...config, updatedAt: new Date().toISOString() },
        }));

        get().addAuditEvent({
          actorRole: get().currentRole,
          actorName: get().currentDemoUser,
          actionType: 'workflow_config_changed',
          affectedEntityType: 'WorkflowConfig',
          affectedEntityId: 'wc-default',
          affectedEntityName: 'Default Workflow Configuration',
          remarks: 'Workflow configuration updated.',
        });
      },

      // ---- Reset ----
      resetDemoData: () => {
        const freshState = generateInitialState();
        set({ ...freshState });
        // Add reset audit event to new state
        const resetEvent: AuditEvent = {
          id: generateId('aud'),
          timestamp: new Date().toISOString(),
          actorRole: 'supervisory_admin',
          actorName: 'Demo User',
          actionType: 'demo_reset',
          affectedEntityType: 'System',
          affectedEntityId: 'all',
          affectedEntityName: 'All Demo Data',
          remarks: 'Demo data reset to initial state.',
        };
        set(state => ({ auditEvents: [resetEvent, ...state.auditEvents] }));
      },
    }),
    {
      name: 'aicte-workflow-demo-v1',
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Validate data version
        if (state && state.dataVersion !== DATA_VERSION) {
          // Reset if version mismatch
          Object.assign(state, generateInitialState());
        }
      },
    }
  )
);
