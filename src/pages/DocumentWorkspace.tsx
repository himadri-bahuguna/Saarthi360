import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, AlertTriangle, CheckCircle, Clock, RefreshCw, Send, Check, X } from 'lucide-react';
import { useStore } from '../store/index.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { DataTable } from '../components/ui/DataTable.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useToast } from '../components/ui/ToastProvider.tsx';
import { formatDate, getDaysUntil } from '../utils/businessLogic.ts';
import type { Document } from '../types/index.ts';

export default function DocumentWorkspace() {
  const navigate = useNavigate();
  const documents = useStore(s => s.documents);
  const currentRole = useStore(s => s.currentRole);
  const currentDemoUser = useStore(s => s.currentDemoUser);
  const submitRenewal = useStore(s => s.submitDocumentRenewal);
  const verifyDocument = useStore(s => s.verifyDocument);
  const rejectDocument = useStore(s => s.rejectDocument);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'expired' | 'pending'>('all');

  // Renewal Modal
  const [renewalDoc, setRenewalDoc] = useState<Document | null>(null);
  const [renewalText, setRenewalText] = useState('');
  const [fileName, setFileName] = useState('');

  // Verification Modal
  const [verifyingDoc, setVerifyingDoc] = useState<Document | null>(null);
  const [verifyMode, setVerifyMode] = useState<'verify' | 'reject'>('verify');
  const [verifyRemarks, setVerifyRemarks] = useState('');

  const getFilteredData = () => {
    switch (activeTab) {
      case 'expiring':
        return documents.filter(d => d.submissionStatus === 'expiring_soon' || (getDaysUntil(d.expiryDate) >= 0 && getDaysUntil(d.expiryDate) <= 30));
      case 'expired':
        return documents.filter(d => d.submissionStatus === 'expired' || d.submissionStatus === 'missing' || getDaysUntil(d.expiryDate) < 0);
      case 'pending':
        return documents.filter(d => d.submissionStatus === 'renewal_pending_verification' || d.submissionStatus === 'submitted_for_renewal');
      default:
        return documents;
    }
  };

  const handleRenewalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalDoc || !renewalText.trim()) {
      toast.error('Renewal evidence description is required');
      return;
    }
    const fullDesc = fileName ? `${renewalText} (Attached: ${fileName})` : renewalText;
    submitRenewal(renewalDoc.id, fullDesc, currentRole, currentDemoUser);
    toast.success('Renewal document submitted for verification.');
    setRenewalDoc(null);
    setRenewalText('');
    setFileName('');
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingDoc) return;

    if (verifyMode === 'reject' && !verifyRemarks.trim()) {
      toast.error('Rejection reason is mandatory.');
      return;
    }

    if (verifyMode === 'verify') {
      verifyDocument(verifyingDoc.id, verifyRemarks || 'Document renewal verified valid.', currentRole, currentDemoUser);
      toast.success('Document renewal approved and verified!');
    } else {
      rejectDocument(verifyingDoc.id, verifyRemarks, currentRole, currentDemoUser);
      toast.warning('Document renewal rejected.');
    }

    setVerifyingDoc(null);
    setVerifyRemarks('');
  };

  const columns = [
    {
      id: 'inst',
      header: 'Institution & Ref',
      render: (d: Document) => (
        <div>
          <span className="font-semibold text-xs text-gray-800">{d.institutionName}</span>
          <p className="text-[11px] font-mono text-gray-400">ID: {d.id} {d.relatedApplicationId && `| App: ${d.relatedApplicationId}`}</p>
        </div>
      ),
    },
    {
      id: 'docType',
      header: 'Prescribed Document',
      render: (d: Document) => <span className="text-xs font-medium text-gray-700">{d.documentType}</span>,
    },
    {
      id: 'status',
      header: 'Validity Status',
      render: (d: Document) => <StatusBadge status={d.submissionStatus} size="sm" />,
    },
    {
      id: 'expiry',
      header: 'Expiry Date',
      render: (d: Document) => {
        const days = getDaysUntil(d.expiryDate);
        const isExp = d.submissionStatus === 'expired' || days < 0;
        return (
          <div>
            <span className={`text-xs font-semibold ${isExp ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
              {isExp ? `Expired ${Math.abs(days)}d ago` : `${days} days valid`}
            </span>
            <p className="text-[10px] text-gray-400">{formatDate(d.expiryDate)}</p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Action',
      render: (d: Document) => (
        <div className="flex items-center gap-2">
          {/* Institution admin can submit renewal */}
          {(currentRole === 'institution_admin' || currentRole === 'supervisory_admin') &&
            (d.submissionStatus === 'expired' || d.submissionStatus === 'expiring_soon' || d.submissionStatus === 'missing') && (
              <button
                onClick={() => {
                  setRenewalDoc(d);
                  setRenewalText('');
                  setFileName('');
                }}
                className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1"
              >
                <RefreshCw size={11} /> Submit Renewal
              </button>
            )}

          {/* Officers can verify renewals */}
          {(currentRole === 'regional_officer' || currentRole === 'supervisory_admin') &&
            d.submissionStatus === 'renewal_pending_verification' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setVerifyingDoc(d);
                    setVerifyMode('verify');
                    setVerifyRemarks('');
                  }}
                  className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors flex items-center gap-1"
                >
                  <Check size={11} /> Verify
                </button>
                <button
                  onClick={() => {
                    setVerifyingDoc(d);
                    setVerifyMode('reject');
                    setVerifyRemarks('');
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
        title="Institutional Document Validity & Renewal Register"
        subtitle="Track lease validity, municipal fire clearances, accreditations, and statutory certifications"
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'all' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'expiring' ? 'text-amber-600 font-bold border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Expiring Soon (≤30 Days) ({documents.filter(d => d.submissionStatus === 'expiring_soon' || (getDaysUntil(d.expiryDate) >= 0 && getDaysUntil(d.expiryDate) <= 30)).length})
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'expired' ? 'text-red-600 font-bold border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Expired / Missing ({documents.filter(d => d.submissionStatus === 'expired' || d.submissionStatus === 'missing' || getDaysUntil(d.expiryDate) < 0).length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'pending' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Awaiting Verification ({documents.filter(d => d.submissionStatus === 'renewal_pending_verification').length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={getFilteredData()}
          keyExtractor={(d) => d.id}
          emptyMessage={`No documents found in ${activeTab} category.`}
        />
      </div>

      {/* Renewal Submission Modal */}
      <Modal
        isOpen={!!renewalDoc}
        onClose={() => setRenewalDoc(null)}
        title="Submit Document Renewal Evidence"
      >
        {renewalDoc && (
          <form onSubmit={handleRenewalSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="font-semibold text-gray-800">{renewalDoc.institutionName}</p>
              <p className="text-gray-700 mt-0.5">Document: <span className="font-medium">{renewalDoc.documentType}</span></p>
              <p className="text-[11px] text-red-600 mt-1">Previous Expiry: {formatDate(renewalDoc.expiryDate)}</p>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Renewal Details / Authority Reference <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Reference number of renewed lease, date of execution, validity period..."
                value={renewalText}
                onChange={(e) => setRenewalText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Simulated Upload Filename</label>
              <input
                type="text"
                placeholder="e.g. Registered_Lease_Deed_2025_Renewed.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRenewalDoc(null)}
                className="px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Submit Renewal
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Verify / Reject Renewal Modal */}
      <Modal
        isOpen={!!verifyingDoc}
        onClose={() => setVerifyingDoc(null)}
        title={verifyMode === 'verify' ? 'Verify Document Renewal' : 'Reject Document Renewal'}
      >
        {verifyingDoc && (
          <form onSubmit={handleVerificationSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="font-semibold text-gray-800">{verifyingDoc.institutionName}</p>
              <p className="text-gray-700">{verifyingDoc.documentType}</p>
              {verifyingDoc.renewalEvidenceDescription && (
                <div className="p-2 bg-white rounded border border-gray-200 mt-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Submitted Renewal Details:</p>
                  <p className="text-gray-700 mt-0.5">{verifyingDoc.renewalEvidenceDescription}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                {verifyMode === 'verify' ? 'Verification Remarks' : 'Rejection Reason (Mandatory)'}
                {verifyMode === 'reject' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                rows={3}
                required={verifyMode === 'reject'}
                placeholder={
                  verifyMode === 'verify'
                    ? 'Confirm renewed certificate details verified with issuing authority...'
                    : 'Specify reason for rejecting renewal (e.g. illegible stamp, unverified authority)...'
                }
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setVerifyingDoc(null)}
                className="px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-1.5 text-white rounded-lg font-medium ${
                  verifyMode === 'verify' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {verifyMode === 'verify' ? 'Confirm Verification' : 'Reject Renewal'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
