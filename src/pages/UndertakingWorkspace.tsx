import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle, Clock, AlertTriangle, Send, Check, X, FileText } from 'lucide-react';
import { useStore } from '../store/index.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { DataTable } from '../components/ui/DataTable.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useToast } from '../components/ui/ToastProvider.tsx';
import { formatDate, getDaysUntil, isOverdue } from '../utils/businessLogic.ts';
import type { Undertaking } from '../types/index.ts';

export default function UndertakingWorkspace() {
  const navigate = useNavigate();
  const undertakings = useStore(s => s.undertakings);
  const currentRole = useStore(s => s.currentRole);
  const currentDemoUser = useStore(s => s.currentDemoUser);
  const submitEvidence = useStore(s => s.submitUndertakingEvidence);
  const verifyUndertaking = useStore(s => s.verifyUndertaking);
  const rejectUndertaking = useStore(s => s.rejectUndertaking);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'awaiting' | 'overdue' | 'verified'>('all');

  // Submit Modal
  const [submittingItem, setSubmittingItem] = useState<Undertaking | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [demoFileName, setDemoFileName] = useState('');

  // Verify/Reject Modal
  const [reviewingItem, setReviewingItem] = useState<Undertaking | null>(null);
  const [reviewMode, setReviewMode] = useState<'verify' | 'reject'>('verify');
  const [reviewRemarks, setReviewRemarks] = useState('');

  const getFilteredData = () => {
    switch (activeTab) {
      case 'pending':
        return undertakings.filter(u => u.submissionStatus === 'pending' || u.submissionStatus === 'rejected');
      case 'awaiting':
        return undertakings.filter(u => u.submissionStatus === 'awaiting_verification');
      case 'overdue':
        return undertakings.filter(u => u.submissionStatus === 'overdue' || (u.submissionStatus !== 'verified' && getDaysUntil(u.dueDate) < 0));
      case 'verified':
        return undertakings.filter(u => u.submissionStatus === 'verified');
      default:
        return undertakings;
    }
  };

  const handleSubmitEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingItem || !evidenceText.trim()) {
      toast.error('Evidence description is required');
      return;
    }
    const fullDesc = demoFileName ? `${evidenceText} (Simulated File: ${demoFileName})` : evidenceText;
    submitEvidence(submittingItem.id, fullDesc, currentRole, currentDemoUser);
    toast.success('Undertaking evidence submitted for administrative verification.');
    setSubmittingItem(null);
    setEvidenceText('');
    setDemoFileName('');
  };

  const handleReviewAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem) return;

    if (reviewMode === 'reject' && !reviewRemarks.trim()) {
      toast.error('Rejection reason is mandatory.');
      return;
    }

    if (reviewMode === 'verify') {
      verifyUndertaking(reviewingItem.id, reviewRemarks || 'Condition verified fulfilled.', currentRole, currentDemoUser);
      toast.success('Undertaking marked verified and fulfilled!');
    } else {
      rejectUndertaking(reviewingItem.id, reviewRemarks, currentRole, currentDemoUser);
      toast.warning('Undertaking evidence rejected with deficiency note.');
    }

    setReviewingItem(null);
    setReviewRemarks('');
  };

  const columns = [
    {
      id: 'inst',
      header: 'Institution & Ref',
      render: (u: Undertaking) => (
        <div>
          <span className="font-semibold text-xs text-gray-800">{u.institutionName}</span>
          <p className="text-[11px] font-mono text-gray-400">ID: {u.id} | App: {u.relatedApplicationId}</p>
        </div>
      ),
    },
    {
      id: 'desc',
      header: 'Prescribed Condition / Undertaking',
      render: (u: Undertaking) => (
        <div className="max-w-[280px]">
          <p className="text-xs text-gray-700 line-clamp-2" title={u.description}>{u.description}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Req: {u.requiredEvidence}</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Compliance Status',
      render: (u: Undertaking) => <StatusBadge status={u.submissionStatus} size="sm" />,
    },
    {
      id: 'dueDate',
      header: 'Due Date',
      render: (u: Undertaking) => {
        const d = getDaysUntil(u.dueDate);
        const isOver = u.submissionStatus !== 'verified' && d < 0;
        return (
          <div>
            <span className={`text-xs font-semibold ${isOver ? 'text-red-600' : d <= 7 ? 'text-amber-600' : 'text-gray-600'}`}>
              {isOver ? `Overdue by ${Math.abs(d)}d` : `${d} days left`}
            </span>
            <p className="text-[10px] text-gray-400">{formatDate(u.dueDate)}</p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Action',
      render: (u: Undertaking) => (
        <div className="flex items-center gap-2">
          {/* Institution admin can submit evidence */}
          {(currentRole === 'institution_admin' || currentRole === 'supervisory_admin') &&
            (u.submissionStatus === 'pending' || u.submissionStatus === 'rejected' || u.submissionStatus === 'overdue') && (
              <button
                onClick={() => {
                  setSubmittingItem(u);
                  setEvidenceText('');
                  setDemoFileName('');
                }}
                className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1"
              >
                <Send size={11} /> Submit Evidence
              </button>
            )}

          {/* Officers can verify or reject awaiting verification items */}
          {(currentRole === 'regional_officer' || currentRole === 'supervisory_admin') &&
            u.submissionStatus === 'awaiting_verification' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setReviewingItem(u);
                    setReviewMode('verify');
                    setReviewRemarks('');
                  }}
                  className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors flex items-center gap-1"
                >
                  <Check size={11} /> Verify
                </button>
                <button
                  onClick={() => {
                    setReviewingItem(u);
                    setReviewMode('reject');
                    setReviewRemarks('');
                  }}
                  className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors flex items-center gap-1"
                >
                  <X size={11} /> Reject
                </button>
              </div>
            )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time-Bound Undertakings Register"
        subtitle="Monitor, submit compliance proofs, and authenticate institutional commitments"
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'all' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Undertakings ({undertakings.length})
        </button>
        <button
          onClick={() => setActiveTab('awaiting')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'awaiting' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Awaiting Verification ({undertakings.filter(u => u.submissionStatus === 'awaiting_verification').length})
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'overdue' ? 'text-red-600 font-bold border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Overdue Commitments ({undertakings.filter(u => u.submissionStatus === 'overdue' || (u.submissionStatus !== 'verified' && getDaysUntil(u.dueDate) < 0)).length})
        </button>
        <button
          onClick={() => setActiveTab('verified')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'verified' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Verified / Fulfilled ({undertakings.filter(u => u.submissionStatus === 'verified').length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={getFilteredData()}
          keyExtractor={(u) => u.id}
          emptyMessage={`No ${activeTab} undertakings found.`}
        />
      </div>

      {/* Submit Evidence Modal */}
      <Modal
        isOpen={!!submittingItem}
        onClose={() => setSubmittingItem(null)}
        title="Submit Undertaking Compliance Evidence"
      >
        {submittingItem && (
          <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="font-semibold text-gray-800">{submittingItem.institutionName}</p>
              <p className="text-gray-600 mt-1">{submittingItem.description}</p>
              <p className="text-[11px] text-blue-700 mt-1 font-medium">Prescribed Proof: {submittingItem.requiredEvidence}</p>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Evidence Description / Certification Details <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Details of certificate, issuing authority, reference number, date of issue..."
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Simulated Attachment Filename</label>
              <input
                type="text"
                placeholder="e.g. Lab_Completion_Certificate_2025.pdf"
                value={demoFileName}
                onChange={(e) => setDemoFileName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                DEMO: In production, documents are cryptographically verified and securely stored in S3/Blob storage.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSubmittingItem(null)}
                className="px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Submit for Verification
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Verify / Reject Modal */}
      <Modal
        isOpen={!!reviewingItem}
        onClose={() => setReviewingItem(null)}
        title={reviewMode === 'verify' ? 'Approve & Verify Undertaking Fulfillment' : 'Reject Undertaking Evidence'}
      >
        {reviewingItem && (
          <form onSubmit={handleReviewAction} className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
              <p className="font-semibold text-gray-800">{reviewingItem.institutionName}</p>
              <p className="text-gray-600">{reviewingItem.description}</p>
              {reviewingItem.evidenceDescription && (
                <div className="p-2 bg-white rounded border border-gray-200 mt-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Submitted Evidence Proof:</p>
                  <p className="text-gray-700 mt-0.5">{reviewingItem.evidenceDescription}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                {reviewMode === 'verify' ? 'Verification Remarks' : 'Rejection Reason (Mandatory)'}
                {reviewMode === 'reject' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                rows={3}
                required={reviewMode === 'reject'}
                placeholder={
                  reviewMode === 'verify'
                    ? 'Confirm physical evidence inspected and found compliant...'
                    : 'Specify why the submitted evidence is inadequate or unacceptable...'
                }
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-xs ${
                  reviewMode === 'reject' ? 'border-red-300 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:ring-1 focus:ring-green-500'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-1.5 text-white rounded-lg font-medium ${
                  reviewMode === 'verify' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewMode === 'verify' ? 'Confirm Verification' : 'Reject Submission'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
