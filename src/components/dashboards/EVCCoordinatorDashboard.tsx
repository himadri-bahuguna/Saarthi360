import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, AlertTriangle, Users, PlusCircle } from 'lucide-react';
import { useStore } from '../../store/index.ts';
import { SummaryCard } from '../ui/SummaryCard.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { DataTable } from '../ui/DataTable.tsx';
import { Modal } from '../ui/Modal.tsx';
import { useToast } from '../ui/ToastProvider.tsx';
import { formatDate, getDaysUntil } from '../../utils/businessLogic.ts';
import type { EVCRecord } from '../../types/index.ts';

export default function EVCCoordinatorDashboard() {
  const navigate = useNavigate();
  const evcRecords = useStore(s => s.evcRecords);
  const currentRole = useStore(s => s.currentRole);
  const currentDemoUser = useStore(s => s.currentDemoUser);
  const scheduleEVC = useStore(s => s.scheduleEVC);
  const toast = useToast();

  const [selectedEVC, setSelectedEVC] = useState<EVCRecord | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduleRemarks, setScheduleRemarks] = useState('');

  const unscheduled = evcRecords.filter(e => e.status === 'pending');
  const scheduled = evcRecords.filter(e => e.status === 'scheduled');
  const completed = evcRecords.filter(e => e.status === 'completed');
  const overdue = evcRecords.filter(e => e.status === 'overdue' || (e.status !== 'completed' && getDaysUntil(e.deadline) < 0));

  const handleOpenSchedule = (evc: EVCRecord) => {
    setSelectedEVC(evc);
    setScheduledDate('');
    setScheduleRemarks('');
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEVC || !scheduledDate) {
      toast.error('Please choose a valid inspection date');
      return;
    }
    scheduleEVC(selectedEVC.id, scheduledDate, scheduleRemarks || 'Inspection scheduled with appointed committee.', currentRole, currentDemoUser);
    toast.success(`EVC scheduled successfully for ${selectedEVC.institutionName}`);
    setSelectedEVC(null);
  };

  const columns = [
    {
      id: 'inst',
      header: 'Institution & Ref',
      render: (e: EVCRecord) => (
        <div>
          <p className="font-semibold text-xs text-gray-800">{e.institutionName}</p>
          <p className="text-[11px] font-mono text-gray-500">App: {e.applicationId} | Region: {e.region}</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'EVC Status',
      render: (e: EVCRecord) => <StatusBadge status={e.status} size="sm" />,
    },
    {
      id: 'scheduled',
      header: 'Inspection Date',
      render: (e: EVCRecord) => (
        <span className="text-xs text-gray-700">
          {e.scheduledDate ? formatDate(e.scheduledDate) : <span className="text-amber-600 italic">Not scheduled</span>}
        </span>
      ),
    },
    {
      id: 'deadline',
      header: 'Prescribed Deadline',
      render: (e: EVCRecord) => {
        const d = getDaysUntil(e.deadline);
        const cl = d < 0 ? 'text-red-600 font-bold' : d <= 7 ? 'text-amber-600 font-medium' : 'text-gray-600';
        return (
          <div>
            <span className={`text-xs ${cl}`}>
              {d < 0 ? `Overdue by ${Math.abs(d)}d` : `${d} days left`}
            </span>
            <p className="text-[10px] text-gray-400">{formatDate(e.deadline)}</p>
          </div>
        );
      },
    },
    {
      id: 'action',
      header: 'Action',
      render: (e: EVCRecord) => (
        <div className="flex items-center gap-2">
          {e.status === 'pending' || e.status === 'overdue' ? (
            <button
              onClick={() => handleOpenSchedule(e)}
              className="px-2.5 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded transition-colors"
            >
              Schedule EVC
            </button>
          ) : (
            <button
              onClick={() => navigate('/evc')}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Manage →
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="EVC Committee & Inspection Management"
        subtitle="Expert Visit Committee Scheduling and On-site Verification Tracking"
        actions={
          <button
            onClick={() => navigate('/evc')}
            className="px-3.5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            Open Full EVC Workspace →
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Unscheduled Inspections"
          value={unscheduled.length}
          Icon={Clock}
          colorScheme="amber"
          onClick={() => navigate('/evc')}
          subtitle="Awaiting date & committee"
        />
        <SummaryCard
          title="Scheduled Visits"
          value={scheduled.length}
          Icon={Calendar}
          colorScheme="blue"
          onClick={() => navigate('/evc')}
          subtitle="Visits pending completion"
        />
        <SummaryCard
          title="Completed Inspections"
          value={completed.length}
          Icon={CheckCircle}
          colorScheme="green"
          onClick={() => navigate('/evc')}
          subtitle="Reports submitted"
        />
        <SummaryCard
          title="Overdue EVC Cases"
          value={overdue.length}
          Icon={AlertTriangle}
          colorScheme="red"
          onClick={() => navigate('/evc')}
          subtitle="Immediate scheduling needed"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">EVC Inspection Processing Queue</h2>
            <p className="text-xs text-gray-400">All institutions requiring physical infrastructure verification</p>
          </div>
          <button onClick={() => navigate('/evc')} className="text-xs text-blue-600 hover:underline">
            View full workspace →
          </button>
        </div>

        <DataTable
          columns={columns}
          data={evcRecords}
          keyExtractor={(e) => e.id}
          emptyMessage="No pending EVC records found."
        />
      </div>

      {/* Quick Schedule Modal */}
      <Modal
        isOpen={!!selectedEVC}
        onClose={() => setSelectedEVC(null)}
        title={`Schedule Expert Visit: ${selectedEVC?.institutionName}`}
      >
        {selectedEVC && (
          <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
              <p className="text-gray-500">Application Reference: <span className="font-mono text-gray-800 font-semibold">{selectedEVC.applicationId}</span></p>
              <p className="text-gray-500">Region: <span className="text-gray-800 font-medium">{selectedEVC.region}</span></p>
              <p className="text-gray-500">Prescribed Deadline: <span className="text-red-600 font-medium">{formatDate(selectedEVC.deadline)}</span></p>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Inspection Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Committee Members & Instructions</label>
              <textarea
                rows={3}
                placeholder="List 2-3 expert committee members and any special inspection directives..."
                value={scheduleRemarks}
                onChange={(e) => setScheduleRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedEVC(null)}
                className="px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Confirm Inspection Schedule
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
