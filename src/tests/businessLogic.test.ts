import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDaysAgo,
  getDaysUntil,
  isOverdue,
  isApproachingDeadline,
  getNextStage,
  canAdvanceStage,
  canReturnForDeficiency,
  canResubmit,
  generateAlertId,
  daysAgoISO,
  daysFromNowISO,
  computeDocumentStatus,
  computeUndertakingStatus,
} from '../utils/businessLogic.ts';
import type { Application, WorkflowRoute } from '../types/index.ts';

const mockRoutes: WorkflowRoute[] = [
  { id: 'ROUTE001', name: 'Scrutiny Only', stages: ['scrutiny', 'approved'], requiresEVC: false, description: 'Direct' },
  { id: 'ROUTE002', name: 'Scrutiny + EVC', stages: ['scrutiny', 'evc', 'approved'], requiresEVC: true, description: 'Two-stage' },
];

function createMockApp(overrides: Partial<Application> = {}): Application {
  return {
    id: 'APP-TEST-001',
    applicationId: 'AICTE/2025/TEST/001',
    institutionId: 'INST001',
    institutionName: 'Test Institution',
    region: 'North',
    applicationType: 'New Programme',
    submissionDate: daysAgoISO(10),
    currentStage: 'scrutiny',
    currentStatus: 'under_scrutiny',
    assignedOfficerId: 'OFF001',
    assignedOfficerName: 'Test Officer',
    stageEntryDate: daysAgoISO(5),
    stageDeadline: daysFromNowISO(10),
    workflowRouteId: 'ROUTE002',
    remarks: '',
    deficiencyReasons: [],
    processingHistory: [],
    createdAt: daysAgoISO(10),
    updatedAt: daysAgoISO(5),
    ...overrides,
  };
}

test('1. Valid workflow transitions and route navigation', () => {
  const next = getNextStage('scrutiny', 'ROUTE002', mockRoutes);
  assert.equal(next, 'evc', 'Next stage after scrutiny should be evc');

  const finalStage = getNextStage('evc', 'ROUTE002', mockRoutes);
  assert.equal(finalStage, 'approved', 'Next stage after evc should be approved');

  const afterApproved = getNextStage('approved', 'ROUTE002', mockRoutes);
  assert.equal(afterApproved, null, 'No stage exists after terminal approved stage');
});

test('2. Disallowed / Invalid workflow transitions', () => {
  const appReturned = createMockApp({ currentStatus: 'returned_for_deficiency' });
  assert.equal(canAdvanceStage(appReturned, 'regional_officer'), false, 'Cannot advance stage when returned for deficiency');

  const appApproved = createMockApp({ currentStatus: 'approved' });
  assert.equal(canAdvanceStage(appApproved, 'supervisory_admin'), false, 'Cannot advance stage once already approved');

  const institutionAdmin = 'institution_admin' as const;
  const appUnderScrutiny = createMockApp({ currentStatus: 'under_scrutiny' });
  assert.equal(canAdvanceStage(appUnderScrutiny, institutionAdmin), false, 'Institution Admin cannot advance scrutiny stage');
});

test('3. Application return for deficiency and resubmission permissions', () => {
  const appUnderScrutiny = createMockApp({ currentStatus: 'under_scrutiny' });
  assert.equal(canReturnForDeficiency(appUnderScrutiny, 'regional_officer'), true, 'Regional Officer can return application');
  assert.equal(canReturnForDeficiency(appUnderScrutiny, 'institution_admin'), false, 'Institution cannot return own application');

  const appReturned = createMockApp({ currentStatus: 'returned_for_deficiency' });
  assert.equal(canResubmit(appReturned, 'institution_admin'), true, 'Institution admin can resubmit returned application');
  assert.equal(canResubmit(appUnderScrutiny, 'institution_admin'), false, 'Cannot resubmit application that is not in returned status');
});

test('4. Application ageing calculations', () => {
  const tenDaysAgo = daysAgoISO(10);
  const days = getDaysAgo(tenDaysAgo);
  assert.equal(days >= 9 && days <= 11, true, 'getDaysAgo should accurately return ~10 days');
});

test('5. Upcoming and overdue deadline classification', () => {
  const pastDeadline = daysAgoISO(5);
  const futureDeadline = daysFromNowISO(4);
  const distantDeadline = daysFromNowISO(30);

  // Overdue check
  assert.equal(isOverdue(pastDeadline, 'under_scrutiny'), true, 'Past deadline for active status must be overdue');
  assert.equal(isOverdue(pastDeadline, 'approved'), false, 'Terminal approved status must never be overdue');
  assert.equal(isOverdue(futureDeadline, 'under_scrutiny'), false, 'Future deadline is not overdue');

  // Approaching deadline check (threshold = 7 days)
  assert.equal(isApproachingDeadline(futureDeadline, 7, 'under_scrutiny'), true, 'Due in 4 days should trigger approaching alert');
  assert.equal(isApproachingDeadline(distantDeadline, 7, 'under_scrutiny'), false, 'Due in 30 days should not trigger approaching alert');
});

test('6. Undertaking verification state transitions', () => {
  const pastDue = daysAgoISO(3);
  const statusOverdue = computeUndertakingStatus(pastDue, 'pending');
  assert.equal(statusOverdue, 'overdue', 'Pending undertaking with past due date must be marked overdue');

  const statusAwaiting = computeUndertakingStatus(pastDue, 'awaiting_verification');
  assert.equal(statusAwaiting, 'awaiting_verification', 'Awaiting verification status should be preserved even if past deadline');
});

test('7. Document expiry and renewal status logic', () => {
  const pastExpiry = daysAgoISO(2);
  const soonExpiry = daysFromNowISO(15);
  const safeExpiry = daysFromNowISO(180);

  assert.equal(computeDocumentStatus(pastExpiry, 'valid'), 'expired', 'Document past expiry must be marked expired');
  assert.equal(computeDocumentStatus(soonExpiry, 'valid'), 'expiring_soon', 'Document within 30 days must be expiring_soon');
  assert.equal(computeDocumentStatus(safeExpiry, 'valid'), 'valid', 'Document with distant expiry must remain valid');
  assert.equal(computeDocumentStatus(pastExpiry, 'renewal_pending_verification'), 'renewal_pending_verification', 'Submitted renewal state must be preserved');
});

test('8. Alert deduplication and stable ID generation', () => {
  const id1 = generateAlertId('overdue_application', 'APP-001', 'stage');
  const id2 = generateAlertId('overdue_application', 'APP-001', 'stage');
  const id3 = generateAlertId('overdue_application', 'APP-002', 'stage');

  assert.equal(id1, id2, 'Alert ID for same entity, type, and rule must be deterministic and identical');
  assert.notEqual(id1, id3, 'Alert ID for different entities must be unique');
});
