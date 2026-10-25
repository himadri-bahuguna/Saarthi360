// ============================================================
// Business Logic Utilities
// ============================================================

import type { Application, ApplicationStatus, AlertSeverity, DocumentStatus, UndertakingStatus, WorkflowRoute, DemoRole } from '../types/index.ts';

/**
 * Returns days since a given date (positive = past)
 */
export function getDaysAgo(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns days until a given date (positive = future, negative = past)
 */
export function getDaysUntil(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate ageing days from a stage entry date
 */
export function getAgeingDays(stageEntryDate: string): number {
  return getDaysAgo(stageEntryDate);
}

/**
 * Is this item overdue? Only checks non-terminal statuses.
 */
export function isOverdue(deadline: string, status: string): boolean {
  const terminalStatuses = ['approved', 'rejected', 'withdrawn', 'completed', 'verified'];
  if (terminalStatuses.includes(status)) return false;
  return getDaysUntil(deadline) < 0;
}

/**
 * Is this approaching deadline within thresholdDays?
 */
export function isApproachingDeadline(deadline: string, thresholdDays: number, status: string): boolean {
  const terminalStatuses = ['approved', 'rejected', 'withdrawn', 'completed', 'verified'];
  if (terminalStatuses.includes(status)) return false;
  const daysLeft = getDaysUntil(deadline);
  return daysLeft >= 0 && daysLeft <= thresholdDays;
}

/**
 * Get the next stage in a workflow route
 */
export function getNextStage(currentStage: string, workflowRouteId: string, workflowRoutes: WorkflowRoute[]): string | null {
  const route = workflowRoutes.find(r => r.id === workflowRouteId);
  if (!route) return null;
  const idx = route.stages.indexOf(currentStage);
  if (idx === -1 || idx >= route.stages.length - 1) return null;
  return route.stages[idx + 1];
}

/**
 * Get the workflow route by ID
 */
export function getWorkflowRoute(routeId: string, workflowRoutes: WorkflowRoute[]): WorkflowRoute | undefined {
  return workflowRoutes.find(r => r.id === routeId);
}

/**
 * Can the given role advance the application stage?
 */
export function canAdvanceStage(app: Application, role: DemoRole): boolean {
  const nonAdvanceStatuses: ApplicationStatus[] = ['approved', 'rejected', 'withdrawn', 'returned_for_deficiency'];
  if (nonAdvanceStatuses.includes(app.currentStatus)) return false;
  if (role === 'supervisory_admin') return true;
  if (role === 'regional_officer' && ['under_scrutiny', 'resubmitted'].includes(app.currentStatus)) return true;
  if (role === 'evc_coordinator' && ['awaiting_evc', 'evc_scheduled'].includes(app.currentStatus)) return true;
  return false;
}

/**
 * Can the given role return the application for deficiency?
 */
export function canReturnForDeficiency(app: Application, role: DemoRole): boolean {
  const returnableStatuses: ApplicationStatus[] = ['under_scrutiny', 'resubmitted', 'awaiting_evc'];
  if (!returnableStatuses.includes(app.currentStatus)) return false;
  return role === 'regional_officer' || role === 'supervisory_admin';
}

/**
 * Can the institution admin resubmit?
 */
export function canResubmit(app: Application, role: DemoRole): boolean {
  return role === 'institution_admin' && app.currentStatus === 'returned_for_deficiency';
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format a datetime string
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Get relative time string
 */
export function getRelativeTime(dateString: string): string {
  if (!dateString) return '—';
  const days = getDaysAgo(dateString);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * Get status display label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    submitted: 'Submitted',
    under_scrutiny: 'Under Scrutiny',
    returned_for_deficiency: 'Returned for Deficiency',
    resubmitted: 'Resubmitted',
    awaiting_evc: 'Awaiting EVC',
    evc_scheduled: 'EVC Scheduled',
    evc_completed: 'EVC Completed',
    pending_sac: 'Pending SAC/SHC',
    approved: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
    // EVC
    pending: 'Pending',
    scheduled: 'Scheduled',
    completed: 'Completed',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    // Undertaking
    awaiting_verification: 'Awaiting Verification',
    verified: 'Verified',
    // Document
    valid: 'Valid',
    expiring_soon: 'Expiring Soon',
    expired: 'Expired',
    submitted_for_renewal: 'Submitted for Renewal',
    renewal_pending_verification: 'Renewal Pending Verification',
    renewal_verified: 'Renewal Verified',
    missing: 'Missing',
    // Submission
    draft: 'Draft',
    // Alert
    open: 'Open',
    acknowledged: 'Acknowledged',
    resolved: 'Resolved',
    escalated: 'Escalated',
  };
  return labels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get stage label for display
 */
export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    scrutiny: 'Scrutiny',
    evc: 'Expert Visit Committee',
    sac_shc: 'SAC/SHC Review',
    approved: 'Final Approval',
  };
  return labels[stage] || stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get Tailwind color classes for a status
 */
export function getStatusColors(status: string): { bg: string; text: string; border: string } {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    submitted: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    under_scrutiny: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
    returned_for_deficiency: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    resubmitted: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    awaiting_evc: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    evc_scheduled: { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' },
    evc_completed: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
    pending_sac: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
    approved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    withdrawn: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
    // EVC
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    overdue: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
    // Doc / Undertaking
    valid: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    expiring_soon: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    expired: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    missing: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    submitted_for_renewal: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    renewal_pending_verification: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    renewal_verified: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    awaiting_verification: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    verified: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    // Submission
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
    // Alert status
    open: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    acknowledged: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    resolved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    escalated: { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-300' },
  };
  return colorMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
}

/**
 * Get severity color classes
 */
export function getSeverityColors(severity: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    low: { bg: 'bg-blue-100', text: 'text-blue-700' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700' },
    critical: { bg: 'bg-red-100', text: 'text-red-700' },
  };
  return map[severity] || { bg: 'bg-gray-100', text: 'text-gray-700' };
}

/**
 * Generate a stable, deduplicated alert ID
 */
export function generateAlertId(type: string, entityId: string, ruleKey: string): string {
  return `alert-${type}-${entityId}-${ruleKey}`;
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV(data: Record<string, string | number>[], filename: string): void {
  if (data.length === 0) {
    alert('No data to export.');
    return;
  }
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '');
        // Escape commas and quotes
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    ),
  ];
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get document status based on expiry date
 */
export function computeDocumentStatus(expiryDate: string, currentStatus: DocumentStatus): DocumentStatus {
  // Don't override renewal/missing states
  if (['missing', 'submitted_for_renewal', 'renewal_pending_verification', 'renewal_verified'].includes(currentStatus)) {
    return currentStatus;
  }
  const daysLeft = getDaysUntil(expiryDate);
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'expiring_soon';
  return 'valid';
}

/**
 * Get undertaking status based on due date
 */
export function computeUndertakingStatus(dueDate: string, currentStatus: UndertakingStatus): UndertakingStatus {
  const terminalStatuses: UndertakingStatus[] = ['verified'];
  if (terminalStatuses.includes(currentStatus)) return currentStatus;
  if (['awaiting_verification', 'submitted'].includes(currentStatus)) return currentStatus;
  if (getDaysUntil(dueDate) < 0) return 'overdue';
  return currentStatus;
}

/**
 * Add days to a date
 */
export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Subtract days from now (returns ISO string)
 */
export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/**
 * Days from now (returns ISO string)
 */
export function daysFromNowISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
