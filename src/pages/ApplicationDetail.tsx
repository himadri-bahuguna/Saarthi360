import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, FileText,
  UserCheck, Shield, ChevronRight, Send, RotateCcw, ClipboardList, FolderOpen
} from 'lucide-react';
import { useStore } from '../store/index.ts';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useToast } from '../components/ui/ToastProvider.tsx';
import {
  formatDate, formatDateTime, getDaysUntil, getAgeingDays,
  getStageLabel, canAdvanceStage, canReturnForDeficiency, canResubmit,
  isOverdue, getWorkflowRoute
} from '../utils/businessLogic.ts';

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const applications = useStore(s => s.applications);
  const workflowRoutes = useStore(s => s.workflowRoutes);
  const undertakings = useStore(s => s.undertakings);
  const documents = useStore(s => s.documents);
  const auditEvents = useStore(s => s.auditEvents);
  const currentRole = useStore(s => s.currentRole);
  const currentDemoUser = useStore(s => s.currentDemoUser);

  const advanceStage = useStore(s => s.advanceApplicationStage);
  const returnForDeficiency = useStore(s => s.returnApplicationForDeficiency);
  const resubmitApp = useStore(s => s.resubmitApplication);

  // Action Modals State
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceRemarks, setAdvanceRemarks] = useState('');

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [deficiencyReason, setDeficiencyReason] = useState('');
  const [returnRemarks, setReturnRemarks] = useState('');

  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitRemarks, setResubmitRemarks] = useState('');

  const app = applications.find(a => a.id === id);

  if (!app) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-gray-500">Application not found.</p>
        <button
          onClick={() => navigate('/applications')}
          className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  const route = getWorkflowRoute(app.workflowRouteId, workflowRoutes);
  const appUndertakings = undertakings.filter(u => u.relatedApplicationId === app.id);
  const appDocs = documents.filter(d => d.relatedApplicationId === app.id || d.institutionId === app.institutionId);
  const appAudits = auditEvents.filter(a => a.affectedEntityId === app.id);

  const handleAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    advanceStage(app.id, advanceRemarks || 'Stage completed by authorized officer.', currentRole, currentDemoUser);
    toast.success('Application stage advanced successfully!');
    setShowAdvanceModal(false);
    setAdvanceRemarks('');
  };

  const handleReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deficiencyReason.trim()) {
      toast.error('Deficiency reason is mandatory when returning an application.');
      return;
    }
    returnForDeficiency(app.id, deficiencyReason, returnRemarks, currentRole, currentDemoUser);
    toast.warning('Application returned for institutional deficiency.');
    setShowReturnModal(false);
    setDeficiencyReason('');
    setReturnRemarks('');
  };

  const handleResubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resubmitApp(app.id, resubmitRemarks || 'Corrected compliance evidence submitted.', currentRole, currentDemoUser);
    toast.success('Application resubmitted successfully!');
    setShowResubmitModal(false);
    setResubmitRemarks('');
  };

  const daysLeft = getDaysUntil(app.stageDeadline);
  const overdue = isOverdue(app.stageDeadline, app.currentStatus);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/applications')}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Applications List
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {canAdvanceStage(app, currentRole) && (
            <button
              onClick={() => setShowAdvanceModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} /> Complete Stage & Forward
            </button>
          )}

          {canReturnForDeficiency(app, currentRole) && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Return for Deficiency
            </button>
          )}

          {canResubmit(app, currentRole) && (
            <button
              onClick={() => setShowResubmitModal(true)}
              className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Send size={14} /> Resubmit Application
            </button>
          )}
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {app.applicationId}
              </span>
              <StatusBadge status={app.currentStatus} />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mt-2">{app.institutionName}</h1>
            <p className="text-xs text-gray-600 mt-0.5">{app.applicationType} — <span className="font-medium text-gray-700">{app.region} Region</span></p>
          </div>

          <div className="flex flex-col md:items-end gap-1 text-xs">
            <span className="text-gray-400">Prescribed Stage Deadline</span>
            <span className={`font-semibold ${overdue ? 'text-red-600' : 'text-gray-800'}`}>
              {formatDate(app.stageDeadline)} ({overdue ? `Overdue by ${Math.abs(daysLeft)}d` : `${daysLeft} days left`})
            </span>
            <span className="text-gray-400 mt-1">Stage Ageing: <span className="text-gray-700 font-medium">{getAgeingDays(app.stageEntryDate)} days</span></span>
          </div>
        </div>

        {/* Workflow Path Stepper */}
        {route && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              Workflow Path: {route.name}
            </p>
            <div className="flex items-center flex-wrap gap-2">
              {route.stages.map((stg, idx) => {
                const isCurrent = app.currentStage === stg;
                const isCompleted = route.stages.indexOf(app.currentStage) > idx || app.currentStatus === 'approved';
                return (
                  <React.Fragment key={stg}>
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-400/20'
                          : isCompleted
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={13} className="text-green-600" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px]">
                          {idx + 1}
                        </span>
                      )}
                      <span>{getStageLabel(stg)}</span>
                    </div>
                    {idx < route.stages.length - 1 && (
                      <ChevronRight size={14} className="text-gray-300" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Deficiency Banner if Returned */}
      {app.currentStatus === 'returned_for_deficiency' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-red-800 uppercase tracking-wide">
                Application Returned For Deficiencies
              </h2>
              <p className="text-xs text-red-700">The reviewing officer has identified deficiencies requiring correction:</p>
              <ul className="list-disc pl-4 text-xs text-red-800 space-y-0.5 mt-2">
                {app.deficiencyReasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Processing Assignment</h2>
          <div className="text-xs space-y-2">
            <div>
              <span className="text-gray-400">Assigned Officer:</span>
              <p className="font-medium text-gray-800">{app.assignedOfficerName}</p>
            </div>
            <div>
              <span className="text-gray-400">Submission Date:</span>
              <p className="font-medium text-gray-800">{formatDate(app.submissionDate)}</p>
            </div>
            <div>
              <span className="text-gray-400">Stage Entry Date:</span>
              <p className="font-medium text-gray-800">{formatDate(app.stageEntryDate)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Associated Undertakings</h2>
          {appUndertakings.length === 0 ? (
            <p className="text-xs text-gray-400">No time-bound undertakings attached.</p>
          ) : (
            <div className="space-y-2">
              {appUndertakings.map(u => (
                <div key={u.id} className="text-xs p-2 rounded bg-gray-50 border border-gray-100">
                  <p className="font-medium text-gray-800 line-clamp-1">{u.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <StatusBadge status={u.submissionStatus} size="sm" />
                    <span className="text-[10px] text-gray-400">Due: {formatDate(u.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prescribed Documents</h2>
          {appDocs.length === 0 ? (
            <p className="text-xs text-gray-400">No documents linked.</p>
          ) : (
            <div className="space-y-2">
              {appDocs.slice(0, 3).map(d => (
                <div key={d.id} className="text-xs p-2 rounded bg-gray-50 border border-gray-100">
                  <p className="font-medium text-gray-800 truncate">{d.documentType}</p>
                  <div className="flex items-center justify-between mt-1">
                    <StatusBadge status={d.submissionStatus} size="sm" />
                    <span className="text-[10px] text-gray-400">Exp: {formatDate(d.expiryDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stage Processing History */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Processing Stage History</h2>
        <div className="space-y-3">
          {app.processingHistory.map((hist, i) => (
            <div key={hist.id || i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 text-xs">
              <div className="p-1 bg-blue-100 text-blue-700 rounded mt-0.5">
                <CheckCircle2 size={14} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 capitalize">Stage: {getStageLabel(hist.stage)}</span>
                  <span className="text-gray-400 text-[11px]">{formatDateTime(hist.timestamp)}</span>
                </div>
                <p className="text-gray-600 mt-0.5">
                  Action by <span className="font-medium">{hist.actorName}</span> ({hist.actorRole.replace(/_/g, ' ')})
                </p>
                {hist.remarks && <p className="text-gray-700 mt-1 italic">"{hist.remarks}"</p>}
                {hist.deficiencyReason && (
                  <p className="text-red-700 mt-1 font-medium bg-red-50 p-2 rounded border border-red-100">
                    Deficiency Recorded: {hist.deficiencyReason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail for this Application */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Application Audit Trail</h2>
        {appAudits.length === 0 ? (
          <p className="text-xs text-gray-400">No external audit records recorded.</p>
        ) : (
          <div className="space-y-2">
            {appAudits.map(aud => (
              <div key={aud.id} className="text-xs flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <span className="font-medium text-gray-800 capitalize">{aud.actionType.replace(/_/g, ' ')}</span>
                  <span className="text-gray-500"> by {aud.actorName}</span>
                  {aud.remarks && <span className="text-gray-400"> — {aud.remarks}</span>}
                </div>
                <span className="text-[11px] text-gray-400">{formatDateTime(aud.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals for Authorized Actions */}
      <Modal isOpen={showAdvanceModal} onClose={() => setShowAdvanceModal(false)} title="Complete Processing Stage & Forward">
        <form onSubmit={handleAdvance} className="space-y-4 text-xs">
          <p className="text-gray-600">
            You are about to complete the current stage (<span className="font-semibold">{getStageLabel(app.currentStage)}</span>) and advance this application along its configured route.
          </p>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Scrutiny / Evaluation Remarks</label>
            <textarea
              rows={3}
              placeholder="Record observation notes or recommendations for the next authority..."
              value={advanceRemarks}
              onChange={(e) => setAdvanceRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowAdvanceModal(false)}
              className="px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Confirm Stage Completion
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Return Application for Deficiencies">
        <form onSubmit={handleReturn} className="space-y-4 text-xs">
          <p className="text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-100">
            Returning this application requires clear statutory grounds or document deficiency reasons so the institution may take corrective action.
          </p>
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Deficiency Grounds / Missing Documents <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Specify missing certificates, incorrect annexures, or unfulfilled conditions..."
              value={deficiencyReason}
              onChange={(e) => setDeficiencyReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-xs"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Internal Review Notes</label>
            <input
              type="text"
              placeholder="Optional administrative remarks..."
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowReturnModal(false)}
              className="px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Return Application
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showResubmitModal} onClose={() => setShowResubmitModal(false)} title="Resubmit Corrected Application">
        <form onSubmit={handleResubmit} className="space-y-4 text-xs">
          <p className="text-gray-600">
            Confirm that all deficiencies noted by the regional scrutinizing committee have been addressed with renewed or certified documents.
          </p>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Correction Remarks</label>
            <textarea
              rows={3}
              placeholder="Describe corrections made, newly uploaded annexures, etc..."
              value={resubmitRemarks}
              onChange={(e) => setResubmitRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowResubmitModal(false)}
              className="px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Confirm Resubmission
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
