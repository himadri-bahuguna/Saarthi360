import React, { useState } from 'react';
import { CheckSquare, Upload, Check, X, AlertTriangle, Clock, FileText } from 'lucide-react';
import { useStore } from '../store/index.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { DataTable } from '../components/ui/DataTable.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useToast } from '../components/ui/ToastProvider.tsx';
import { formatDateTime, formatDate } from '../utils/businessLogic.ts';
import type { ComplianceSubmission } from '../types/index.ts';

export default function ComplianceWorkspace() {
  const complianceSubmissions = useStore(s => s.complianceSubmissions);
  const institutions = useStore(s => s.institutions);
  const undertakings = useStore(s => s.undertakings);
  const documents = useStore(s => s.documents);
  const applications = useStore(s => s.applications);
  const currentRole = useStore(s => s.currentRole);
  const currentDemoUser = useStore(s => s.currentDemoUser);
  const submitCompliance = useStore(s => s.submitCompliance);
  const verifyCompliance = useStore(s => s.verifyCompliance);
  const rejectCompliance = useStore(s => s.rejectCompliance);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'queue' | 'submit' | 'history'>('queue');

  // Submit Form state
  const [selectedInstId, setSelectedInstId] = useState('INST001');
  const [submissionType, setSubmissionType] = useState<'document' | 'undertaking' | 'general'>('general');
  const [relatedUndertakingId, setRelatedUndertakingId] = useState('');
  const [relatedDocId, setRelatedDocId] = useState('');
  const [relatedAppId, setRelatedAppId] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');

  // Review Modal state
  const [reviewingSubmission, setReviewingSubmission] = useState<ComplianceSubmission | null>(null);
  const [reviewMode, setReviewMode] = useState<'verify' | 'reject'>('verify');
  const [reviewRemarks, setReviewRemarks] = useState('');

  const pendingQueue = complianceSubmissions.filter(s => s.status === 'awaiting_verification');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Submission description is required');
      return;
    }

    const inst = institutions.find(i => i.id === selectedInstId);
    submitCompliance(
      {
        institutionId: selectedInstId,
        institutionName: inst ? inst.name : 'Unknown Institution',
        submissionType,
        relatedUndertakingId: submissionType === 'undertaking' ? relatedUndertakingId : undefined,
        relatedDocumentId: submissionType === 'document' ? relatedDocId : undefined,
        relatedApplicationId: relatedAppId || undefined,
        description,
        fileName: fileName || 'Compliance_Attachment.pdf',
      },
      currentRole,
      currentDemoUser
    );

    toast.success('Compliance submission recorded successfully!');
    setDescription('');
    setFileName('');
    setActiveTab('queue');
  };

  const handleReviewAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission) return;

    if (reviewMode === 'reject' && !reviewRemarks.trim()) {
      toast.error('Rejection remarks are mandatory.');
      return;
    }

    if (reviewMode === 'verify') {
      verifyCompliance(reviewingSubmission.id, reviewRemarks || 'Verified compliant by scrutiny officer.', currentRole, currentDemoUser);
      toast.success('Submission approved and verified.');
    } else {
      rejectCompliance(reviewingSubmission.id, reviewRemarks, currentRole, currentDemoUser);
      toast.warning('Submission rejected with deficiency grounds.');
    }

    setReviewingSubmission(null);
    setReviewRemarks('');
  };

  const columns = [
    {
      id: 'subId',
      header: 'Submission Ref',
      render: (s: ComplianceSubmission) => (
        <div>
          <span className="font-mono text-xs font-semibold text-blue-700">{s.id}</span>
          <p className="text-[11px] text-gray-500 font-medium truncate max-w-[200px]">{s.institutionName}</p>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Category',
      render: (s: ComplianceSubmission) => (
        <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {s.submissionType}
        </span>
      ),
    },
    {
      id: 'desc',
      header: 'Description & Evidence',
      render: (s: ComplianceSubmission) => (
        <div className="max-w-[260px]">
          <p className="text-xs text-gray-700 line-clamp-2">{s.description}</p>
          {s.fileName && (
            <p className="text-[11px] text-blue-600 mt-0.5 flex items-center gap-1">
              <FileText size={11} /> {s.fileName}
            </p>
          )}
          {s.verificationRemarks && (
            <p className="text-[10px] text-red-600 mt-1 italic">Remarks: {s.verificationRemarks}</p>
          )}
        </div>
      ),
    },
    {
      id: 'submitted',
      header: 'Submitted By / At',
      render: (s: ComplianceSubmission) => (
        <div>
          <p className="text-xs text-gray-700 font-medium">{s.submittedBy}</p>
          <p className="text-[10px] text-gray-400">{formatDateTime(s.submittedAt)}</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      render: (s: ComplianceSubmission) => <StatusBadge status={s.status} size="sm" />,
    },
    {
      id: 'actions',
      header: 'Action',
      render: (s: ComplianceSubmission) => (
        <div>
          {(currentRole === 'regional_officer' || currentRole === 'supervisory_admin') &&
            s.status === 'awaiting_verification' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setReviewingSubmission(s);
                    setReviewMode('verify');
                    setReviewRemarks('');
                  }}
                  className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors flex items-center gap-1"
                >
                  <Check size={11} /> Verify
                </button>
                <button
                  onClick={() => {
                    setReviewingSubmission(s);
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
        title="Compliance Evidence Submission & Verification Center"
        subtitle="Submit, review, and authenticate institutional compliance documentation"
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'queue' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Verification Queue ({pendingQueue.length})
        </button>
        <button
          onClick={() => setActiveTab('submit')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'submit' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Submit New Compliance
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'history' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Submissions History ({complianceSubmissions.length})
        </button>
      </div>

      {activeTab === 'submit' ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Submit Compliance Evidence</h2>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Select Institution</label>
              <select
                value={selectedInstId}
                onChange={(e) => setSelectedInstId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
              >
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.region})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Compliance Requirement Category</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="submissionType"
                    checked={submissionType === 'general'}
                    onChange={() => setSubmissionType('general')}
                  />
                  <span>General Compliance</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="submissionType"
                    checked={submissionType === 'undertaking'}
                    onChange={() => setSubmissionType('undertaking')}
                  />
                  <span>Undertaking Commitment</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="submissionType"
                    checked={submissionType === 'document'}
                    onChange={() => setSubmissionType('document')}
                  />
                  <span>Document Renewal</span>
                </label>
              </div>
            </div>

            {submissionType === 'undertaking' && (
              <div>
                <label className="block font-medium text-gray-700 mb-1">Link to Undertaking</label>
                <select
                  value={relatedUndertakingId}
                  onChange={(e) => setRelatedUndertakingId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs bg-white"
                >
                  <option value="">-- Choose Undertaking --</option>
                  {undertakings.map(u => (
                    <option key={u.id} value={u.id}>{u.id} - {u.description.substring(0, 50)}...</option>
                  ))}
                </select>
              </div>
            )}

            {submissionType === 'document' && (
              <div>
                <label className="block font-medium text-gray-700 mb-1">Link to Document</label>
                <select
                  value={relatedDocId}
                  onChange={(e) => setRelatedDocId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs bg-white"
                >
                  <option value="">-- Choose Document --</option>
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>{d.id} - {d.documentType} ({d.institutionName})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-medium text-gray-700 mb-1">Related Application (Optional)</label>
              <select
                value={relatedAppId}
                onChange={(e) => setRelatedAppId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs bg-white"
              >
                <option value="">-- None / General Institutional Obligation --</option>
                {applications.map(a => (
                  <option key={a.id} value={a.id}>{a.applicationId} - {a.applicationType}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Description of Submitted Evidence <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe certificates, compliance reports, or supporting annexures being submitted..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Attachment File Name</label>
              <input
                type="text"
                placeholder="e.g. FireSafety_Clearance_NOC_2025.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                DEMO: File upload simulated with metadata and audit hashing.
              </p>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-xs"
            >
              Submit Compliance Record
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={activeTab === 'queue' ? pendingQueue : complianceSubmissions}
            keyExtractor={(s) => s.id}
            emptyMessage={activeTab === 'queue' ? 'No compliance submissions awaiting verification.' : 'No compliance submissions found.'}
          />
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewingSubmission}
        onClose={() => setReviewingSubmission(null)}
        title={reviewMode === 'verify' ? 'Verify Compliance Evidence' : 'Reject Compliance Submission'}
      >
        {reviewingSubmission && (
          <form onSubmit={handleReviewAction} className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="font-semibold text-gray-800">{reviewingSubmission.institutionName}</p>
              <p className="text-gray-700 mt-1">{reviewingSubmission.description}</p>
              {reviewingSubmission.fileName && (
                <p className="text-blue-600 mt-1 font-mono text-[11px]">Attachment: {reviewingSubmission.fileName}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                {reviewMode === 'verify' ? 'Verification Observations' : 'Rejection Reason (Mandatory)'}
                {reviewMode === 'reject' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                rows={3}
                required={reviewMode === 'reject'}
                placeholder={
                  reviewMode === 'verify'
                    ? 'Confirm evidence reviewed and verified against handbook requirements...'
                    : 'Specify reason for deficiency or rejection...'
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
                onClick={() => setReviewingSubmission(null)}
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
