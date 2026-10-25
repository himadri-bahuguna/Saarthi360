// ============================================================
// AICTE Workflow System — Core Type Definitions
// ============================================================

export type DemoRole = 'institution_admin' | 'regional_officer' | 'evc_coordinator' | 'supervisory_admin';

export type ApplicationStatus =
  | 'submitted'
  | 'under_scrutiny'
  | 'returned_for_deficiency'
  | 'resubmitted'
  | 'awaiting_evc'
  | 'evc_scheduled'
  | 'evc_completed'
  | 'pending_sac'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export type EVCStatus = 'pending' | 'scheduled' | 'completed' | 'overdue' | 'cancelled';

export type UndertakingStatus =
  | 'pending'
  | 'submitted'
  | 'awaiting_verification'
  | 'verified'
  | 'rejected'
  | 'overdue';

export type DocumentStatus =
  | 'valid'
  | 'expiring_soon'
  | 'expired'
  | 'submitted_for_renewal'
  | 'renewal_pending_verification'
  | 'renewal_verified'
  | 'missing';

export type SubmissionStatus = 'draft' | 'submitted' | 'awaiting_verification' | 'verified' | 'rejected';

export type AlertType =
  | 'pending_action'
  | 'approaching_deadline'
  | 'overdue_application'
  | 'evc_unscheduled'
  | 'evc_deadline'
  | 'evc_overdue'
  | 'undertaking_upcoming'
  | 'undertaking_overdue'
  | 'document_expiry'
  | 'document_expired'
  | 'document_renewal_missing'
  | 'compliance_pending'
  | 'escalation';

export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'escalated';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AuditActionType =
  | 'application_created'
  | 'stage_changed'
  | 'application_returned'
  | 'application_resubmitted'
  | 'assignment_changed'
  | 'evc_scheduled'
  | 'evc_completed'
  | 'undertaking_created'
  | 'undertaking_submitted'
  | 'undertaking_verified'
  | 'undertaking_rejected'
  | 'document_submitted'
  | 'document_verified'
  | 'document_rejected'
  | 'compliance_submitted'
  | 'compliance_verified'
  | 'compliance_rejected'
  | 'alert_created'
  | 'alert_acknowledged'
  | 'alert_resolved'
  | 'escalation_created'
  | 'workflow_config_changed'
  | 'demo_reset';

// ============================================================
// Core Entities
// ============================================================

export interface Institution {
  id: string;
  name: string;
  code: string;
  region: string;
  type: string;
  contactEmail: string;
  address: string;
}

export interface WorkflowStageConfig {
  id: string;
  name: string;
  label: string;
  responsibleRole: DemoRole;
  deadlineDays: number;
  isTerminal: boolean;
  requiresDecision: boolean;
}

export interface WorkflowRoute {
  id: string;
  name: string;
  stages: string[];
  requiresEVC: boolean;
  description: string;
}

export interface StageHistoryEntry {
  id: string;
  applicationId: string;
  stage: string;
  status: ApplicationStatus;
  actorRole: DemoRole;
  actorName: string;
  timestamp: string;
  remarks: string;
  deficiencyReason?: string;
  previousStage?: string;
}

export interface Application {
  id: string;
  applicationId: string;
  institutionId: string;
  institutionName: string;
  region: string;
  applicationType: string;
  submissionDate: string;
  currentStage: string;
  currentStatus: ApplicationStatus;
  assignedOfficerId: string;
  assignedOfficerName: string;
  stageEntryDate: string;
  stageDeadline: string;
  workflowRouteId: string;
  remarks: string;
  deficiencyReasons: string[];
  processingHistory: StageHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface EVCRecord {
  id: string;
  applicationId: string;
  institutionId: string;
  institutionName: string;
  region: string;
  scheduledDate?: string;
  completionDate?: string;
  status: EVCStatus;
  coordinator: string;
  remarks: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface UndertakingEscalation {
  escalatedAt: string;
  escalatedTo: string;
  reason: string;
}

export interface Undertaking {
  id: string;
  institutionId: string;
  institutionName: string;
  relatedApplicationId: string;
  description: string;
  dateRecorded: string;
  dueDate: string;
  requiredEvidence: string;
  submissionStatus: UndertakingStatus;
  verificationStatus: UndertakingStatus;
  assignedVerifier: string;
  verificationRemarks: string;
  submittedAt?: string;
  verifiedAt?: string;
  evidenceDescription: string;
  escalationHistory: UndertakingEscalation[];
  createdAt: string;
  updatedAt: string;
}

export interface RenewalHistoryEntry {
  submittedAt: string;
  evidenceDescription: string;
  status: DocumentStatus;
  verifier?: string;
  verificationRemarks?: string;
}

export interface Document {
  id: string;
  institutionId: string;
  institutionName: string;
  documentType: string;
  relatedApplicationId?: string;
  issueDate: string;
  expiryDate: string;
  submissionStatus: DocumentStatus;
  verificationStatus: DocumentStatus;
  renewalRequired: boolean;
  submittedAt?: string;
  verifier?: string;
  verificationRemarks?: string;
  renewalHistory: RenewalHistoryEntry[];
  renewalEvidenceDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreviousSubmissionAttempt {
  submittedAt: string;
  description: string;
  status: SubmissionStatus;
  verifier?: string;
  verificationRemarks?: string;
}

export interface ComplianceSubmission {
  id: string;
  institutionId: string;
  institutionName: string;
  relatedDocumentId?: string;
  relatedUndertakingId?: string;
  relatedApplicationId?: string;
  submissionType: 'document' | 'undertaking' | 'general';
  description: string;
  fileName?: string;
  submittedBy: string;
  submittedByRole: DemoRole;
  submittedAt: string;
  status: SubmissionStatus;
  verifier?: string;
  verificationRemarks?: string;
  verifiedAt?: string;
  previousAttempts: PreviousSubmissionAttempt[];
  createdAt: string;
  updatedAt: string;
}

export interface EscalationRecord {
  id: string;
  alertId: string;
  escalatedAt: string;
  escalatedFrom: DemoRole;
  escalatedTo: DemoRole;
  reason: string;
  status: 'open' | 'resolved';
}

export interface Alert {
  id: string;
  alertType: AlertType;
  relatedEntityType: string;
  relatedEntityId: string;
  relatedEntityName: string;
  responsibleRole: DemoRole;
  createdAt: string;
  deadline: string;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  escalationLevel: number;
  escalationTimestamp?: string;
  resolutionTimestamp?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  escalationHistory: EscalationRecord[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorRole: DemoRole;
  actorName: string;
  actionType: AuditActionType;
  affectedEntityType: string;
  affectedEntityId: string;
  affectedEntityName: string;
  previousValue?: string;
  newValue?: string;
  remarks?: string;
}

export interface WorkflowConfig {
  id: string;
  reminderThresholdDays: number;
  overdueThresholdDays: number;
  escalationDelayDays: number;
  escalationRecipientRole: DemoRole;
  enabledAlertCategories: AlertType[];
  updatedAt: string;
}

export interface AppState {
  institutions: Institution[];
  applications: Application[];
  evcRecords: EVCRecord[];
  undertakings: Undertaking[];
  documents: Document[];
  complianceSubmissions: ComplianceSubmission[];
  alerts: Alert[];
  auditEvents: AuditEvent[];
  workflowRoutes: WorkflowRoute[];
  workflowConfig: WorkflowConfig;
  currentRole: DemoRole;
  currentDemoUser: string;
  dataVersion: string;
}
