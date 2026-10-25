import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, AlertTriangle, UserCheck, Plus, Check } from 'lucide-react';
import { useStore } from '../store/index.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { DataTable } from '../components/ui/DataTable.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useToast } from '../components/ui/ToastProvider.tsx';
import { formatDate, getDaysUntil } from '../utils/businessLogic.ts';
import type { EVCRecord } from '../types/index.ts';

export default function EVCWorkspace() {
  const navigate = useNavigate();
  const evcRecords = useStore(s => s.evcRecords);
  const scheduleEVC = useStore(s => s.scheduleEVC);
  const completeEVC = useStore(s => s.completeEVC);
  const currentRole = useStore(s => s.currentRole);
  const currentDemoUser = useStore(s => s.currentDemoUser);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'queue' | 'scheduled' | 'completed' | 'overdue'>('queue');
  const [selectedRecord, setSelectedRecord] = useState<EVCRecord | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduleRemarks, setScheduleRemarks] = useState('');

  const [completingRecord, setCompletingRecord] = useState<EVCRecord | null>(null);
  const [completionRemarks, setCompletionRemarks] = useState('');

  const unscheduled = evcRecords.filter(e => e.status === 'pending');
  const scheduled = evcRecords.filter(e => e.status === 'scheduled');
  const completed = evcRecords.filter(e => e.status === 'completed');
  const overdue = evcRecords.filter(e => e.status === 'overdue' || (e.status !== 'completed' && getDaysUntil(e.deadline) < 0));

  const getFilteredData = () => {
    switch (activeTab) {
      case 'queue': return unscheduled;
      case 'scheduled': return scheduled;
      case 'completed': return completed;
      case 'overdue': return overdue;
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !scheduledDate) {
      toast.error('Inspection date is required');
      return;
    }
    scheduleEVC(selectedRecord.id, scheduledDate, scheduleRemarks, currentRole, currentDemoUser);
    toast.success(`EVC visit scheduled for ${selectedRecord.institutionName}`);
    setSelectedRecord(null);
    setScheduledDate('');
    setScheduleRemarks('');
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingRecord) return;
    completeEVC(completingRecord.id, completionRemarks || 'EVC report submitted and verified.', currentRole, currentDemoUser);
    toast.success(`EVC stage marked completed for ${completingRecord.institutionName}`);
    setCompletingRecord(null);
    setCompletionRemarks('');
  };

  const columns = [
    {
      id: 'inst',
      header: 'Institution & Ref',
      render: (e: EVCRecord) => (
        <div>
          <span className="font-semibold text-xs text-gray-800">{e.institutionName}</span>
          <p className="text-[11px] font-mono text-gray-400">App: {e.applicationId} | Region: {e.region}</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      render: (e: EVCRecord) => <StatusBadge status={e.status} size="sm" />,
    },
    {
      id: 'scheduledDate',
      header: 'Inspection Date',
      render: (e: EVCRecord) => (
        <span className="text-xs text-gray-700">
          {e.scheduledDate ? formatDate(e.scheduledDate) : <span className="text-gray-400 italic">Not set</span>}
        </span>
      ),
    },
    {
      id: 'deadline',
      header: 'EVC Deadline',
      render: (e: EVCRecord) => {
        const d = getDaysUntil(e.deadline);
        const isOver = e.status !== 'completed' && d < 0;
        return (
          <div>
            <span className={`text-xs font-semibold ${isOver ? 'text-red-600' : d <= 7 ? 'text-amber-600' : 'text-gray-600'}`}>
              {isOver ? `Overdue by ${Math.abs(d)}d` : `${d} days left`}
            </span>
            <p className="text-[10px] text-gray-400">{formatDate(e.deadline)}</p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Action',
      render: (e: EVCRecord) => (
        <div className="flex items-center gap-2">
          {e.status !== 'completed' && e.status !== 'scheduled' && (
            <button
              onClick={() => {
                setSelectedRecord(e);
                setScheduledDate('');
                setScheduleRemarks('');
              }}
              className="px-2.5 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded transition-colors"
            >
              Schedule Visit
            </button>
          )}

          {e.status === 'scheduled' && (
            <button
              onClick={() => {
                setCompletingRecord(e);
                setCompletionRemarks('');
              }}
              className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors flex items-center gap-1"
            >
              <Check size={12} /> Complete EVC
            </button>
          )}

          <button
            onClick={() => navigate(`/applications/${e.applicationId}`)}
            className="text-xs text-blue-600 hover:underline"
          >
            App Detail →
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expert Visit Committee (EVC) Operations"
        subtitle="Schedule, track on-site physical inspections, and record completion reports"
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'queue' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Unscheduled Queue ({unscheduled.length})
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'scheduled' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Scheduled Visits ({scheduled.length})
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'overdue' ? 'text-red-600 font-bold border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Overdue EVC Cases ({overdue.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'completed' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed Visits ({completed.length})
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={getFilteredData()}
          keyExtractor={(e) => e.id}
          emptyMessage={`No ${activeTab} EVC records found.`}
        />
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Schedule EVC Inspection: ${selectedRecord?.institutionName}`}
      >
        {selectedRecord && (
          <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-gray-600 font-mono text-[11px]">Ref: {selectedRecord.applicationId}</p>
              <p className="text-gray-800 font-medium mt-1">Prescribed Deadline: {formatDate(selectedRecord.deadline)}</p>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Inspection Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Committee Notes / Assigned Experts</label>
              <textarea
                rows={3}
                placeholder="Mention visiting experts, special infrastructure focus points..."
                value={scheduleRemarks}
                onChange={(e) => setScheduleRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
              >
                Schedule Inspection
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Complete Modal */}
      <Modal
        isOpen={!!completingRecord}
        onClose={() => setCompletingRecord(null)}
        title={`Record EVC Completion: ${completingRecord?.institutionName}`}
      >
        {completingRecord && (
          <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
            <p className="text-gray-600">
              Confirm that the physical on-site committee inspection has concluded and the EVC report has been uploaded to the file record.
            </p>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Inspection Report Findings & Remarks</label>
              <textarea
                rows={3}
                placeholder="Summarize key findings (e.g. labs verified, adequate built-up area confirmed)..."
                value={completionRemarks}
                onChange={(e) => setCompletionRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCompletingRecord(null)}
                className="px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Mark EVC Completed
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
