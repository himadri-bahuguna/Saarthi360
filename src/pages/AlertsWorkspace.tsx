import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { useStore } from '../store/index.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { DataTable } from '../components/ui/DataTable.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useToast } from '../components/ui/ToastProvider.tsx';
import { formatDate, formatDateTime, getSeverityColors } from '../utils/businessLogic.ts';
import type { Alert } from '../types/index.ts';

export default function AlertsWorkspace() {
  const alerts = useStore(s => s.alerts);
  const currentRole = useStore(s => s.currentRole);
  const currentDemoUser = useStore(s => s.currentDemoUser);
  const acknowledgeAlert = useStore(s => s.acknowledgeAlert);
  const resolveAlert = useStore(s => s.resolveAlert);
  const evaluateAndCreateAlerts = useStore(s => s.evaluateAndCreateAlerts);
  const toast = useToast();

  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAlertForHistory, setSelectedAlertForHistory] = useState<Alert | null>(null);

  const openCount = alerts.filter(a => a.status === 'open').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
  const escalatedCount = alerts.filter(a => a.status === 'escalated').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  const handleRunEvaluation = () => {
    evaluateAndCreateAlerts();
    toast.info('Alert and escalation engine evaluated current records.');
  };

  const columns = [
    {
      id: 'severity',
      header: 'Severity',
      render: (a: Alert) => {
        const colors = getSeverityColors(a.severity);
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
            {a.severity}
          </span>
        );
      },
    },
    {
      id: 'type',
      header: 'Alert Type',
      render: (a: Alert) => (
        <span className="font-mono text-[11px] text-gray-600 block">
          {a.alertType.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      id: 'message',
      header: 'Message & Record',
      render: (a: Alert) => (
        <div className="max-w-[340px]">
          <p className="text-xs text-gray-800 font-medium">{a.message}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Target: <span className="text-gray-600">{a.relatedEntityType} ({a.relatedEntityName})</span>
          </p>
          {a.escalationHistory.length > 0 && (
            <button
              onClick={() => setSelectedAlertForHistory(a)}
              className="mt-1 text-[10px] text-red-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <ShieldAlert size={11} /> Escalation Trail ({a.escalationHistory.length})
            </button>
          )}
        </div>
      ),
    },
    {
      id: 'recipient',
      header: 'Assigned Role',
      render: (a: Alert) => (
        <span className="text-xs text-gray-600 capitalize">{a.responsibleRole.replace(/_/g, ' ')}</span>
      ),
    },
    {
      id: 'deadline',
      header: 'Prescribed Deadline',
      render: (a: Alert) => (
        <span className="text-xs text-gray-700">{formatDate(a.deadline)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      render: (a: Alert) => <StatusBadge status={a.status} size="sm" />,
    },
    {
      id: 'actions',
      header: 'Action',
      render: (a: Alert) => (
        <div className="flex items-center gap-1.5">
          {a.status === 'open' && (
            <button
              onClick={() => {
                acknowledgeAlert(a.id, currentRole, currentDemoUser);
                toast.success('Alert acknowledged.');
              }}
              className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors"
            >
              Acknowledge
            </button>
          )}

          {(a.status === 'open' || a.status === 'acknowledged' || a.status === 'escalated') && (
            <button
              onClick={() => {
                resolveAlert(a.id, currentRole, currentDemoUser);
                toast.success('Alert marked resolved.');
              }}
              className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
            >
              Resolve
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert Management & Escalation Console"
        subtitle="Automated deadline-driven notifications, deficiency escalations, and incident tracking"
        actions={
          <button
            onClick={handleRunEvaluation}
            className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw size={13} /> Run Alert Evaluation Engine
          </button>
        }
      />

      {/* Summary Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Open Alerts</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{openCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Escalated Cases</p>
          <p className="text-2xl font-bold text-red-800 mt-1">{escalatedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Acknowledged</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{acknowledgedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Resolved Alerts</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="escalated">Escalated</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredAlerts}
          keyExtractor={(a) => a.id}
          emptyMessage="No alerts match the chosen filters."
        />
      </div>

      {/* Escalation History Modal */}
      <Modal
        isOpen={!!selectedAlertForHistory}
        onClose={() => setSelectedAlertForHistory(null)}
        title="Escalation Audit Record"
      >
        {selectedAlertForHistory && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="font-semibold text-red-900">{selectedAlertForHistory.message}</p>
              <p className="text-[11px] text-red-700 mt-1">
                Prescribed Deadline: {formatDate(selectedAlertForHistory.deadline)}
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Escalation Trail
              </h2>
              {selectedAlertForHistory.escalationHistory.map((esc, i) => (
                <div key={esc.id || i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">
                      Escalated from {esc.escalatedFrom.replace(/_/g, ' ')} → {esc.escalatedTo.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDateTime(esc.escalatedAt)}</span>
                  </div>
                  <p className="text-gray-600 mt-1">Grounds: {esc.reason}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedAlertForHistory(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
