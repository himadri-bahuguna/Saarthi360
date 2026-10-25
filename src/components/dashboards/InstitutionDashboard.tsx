import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertTriangle, Clock, FolderOpen, ClipboardList } from 'lucide-react';
import { useStore } from '../../store/index.ts';
import { SummaryCard } from '../ui/SummaryCard.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { DataTable } from '../ui/DataTable.tsx';
import { formatDate, getDaysUntil } from '../../utils/businessLogic.ts';
import type { Application } from '../../types/index.ts';

export default function InstitutionDashboard() {
  const navigate = useNavigate();
  // Demo: Institution Admin sees INST001 (SVIT)
  const DEMO_INST_ID = 'INST001';

  const applications = useStore(s => s.applications).filter(a => a.institutionId === DEMO_INST_ID);
  const undertakings = useStore(s => s.undertakings).filter(u => u.institutionId === DEMO_INST_ID);
  const documents = useStore(s => s.documents).filter(d => d.institutionId === DEMO_INST_ID);
  const alerts = useStore(s => s.alerts).filter(a =>
    applications.some(app => app.id === a.relatedEntityId) ||
    undertakings.some(u => u.id === a.relatedEntityId) ||
    documents.some(d => d.id === a.relatedEntityId)
  );

  const returned = applications.filter(a => a.currentStatus === 'returned_for_deficiency');
  const pendingCompliance = undertakings.filter(u => ['pending', 'rejected'].includes(u.submissionStatus));
  const expiringDocs = documents.filter(d => ['expiring_soon', 'expired', 'missing'].includes(d.submissionStatus));

  const appColumns = [
    { id: 'appId', header: 'App ID', render: (a: Application) => <span className="font-mono text-xs text-gray-700">{a.applicationId}</span> },
    { id: 'type', header: 'Type', render: (a: Application) => <span className="text-xs text-gray-700">{a.applicationType}</span> },
    { id: 'status', header: 'Status', render: (a: Application) => <StatusBadge status={a.currentStatus} size="sm" /> },
    { id: 'deadline', header: 'Deadline', render: (a: Application) => {
      const d = getDaysUntil(a.stageDeadline);
      const cl = d < 0 ? 'text-red-600 font-bold' : d <= 7 ? 'text-amber-600 font-medium' : 'text-gray-600';
      return <span className={`text-xs ${cl}`}>{d < 0 ? `Overdue ${Math.abs(d)}d` : d === 0 ? 'Due today' : `${d} days`}</span>;
    }},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Institution Overview" subtitle="Shri Vivekananda Institute of Technology — DEMO MODE" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard title="My Applications" value={applications.length} Icon={FileText} colorScheme="blue" onClick={() => navigate('/applications')} />
        <SummaryCard title="Returned for Correction" value={returned.length} Icon={AlertTriangle} colorScheme="red" onClick={() => navigate('/applications')} />
        <SummaryCard title="Pending Compliance" value={pendingCompliance.length} Icon={ClipboardList} colorScheme="amber" onClick={() => navigate('/undertakings')} />
        <SummaryCard title="Document Issues" value={expiringDocs.length} Icon={FolderOpen} colorScheme="red" onClick={() => navigate('/documents')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Applications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">My Applications</h2>
            <button onClick={() => navigate('/applications')} className="text-xs text-blue-600 hover:underline">View all →</button>
          </div>
          <DataTable
            columns={appColumns}
            data={applications}
            onRowClick={a => navigate(`/applications/${a.id}`)}
            keyExtractor={a => a.id}
            emptyMessage="No applications found for your institution."
          />
        </div>

        {/* Returned for Correction */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-500" />
            Action Required — Returned Applications
          </h2>
          {returned.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No applications returned for correction</p>
          ) : (
            <div className="space-y-3">
              {returned.map(app => (
                <button
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  className="w-full text-left p-3 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-800">{app.applicationId}</p>
                  <p className="text-xs text-gray-600 mt-1">{app.applicationType}</p>
                  {app.deficiencyReasons.map((r, i) => (
                    <p key={i} className="text-xs text-red-700 mt-1">• {r}</p>
                  ))}
                  <p className="text-xs text-blue-600 mt-2 font-medium">Click to resubmit →</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Undertaking Deadlines */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Undertakings</h2>
            <button onClick={() => navigate('/undertakings')} className="text-xs text-blue-600 hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {undertakings.slice(0, 4).map(u => (
              <div key={u.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate">{u.description.substring(0, 60)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={u.submissionStatus} size="sm" />
                    <span className="text-xs text-gray-400">Due: {formatDate(u.dueDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Validity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Document Validity</h2>
            <button onClick={() => navigate('/documents')} className="text-xs text-blue-600 hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {documents.slice(0, 4).map(d => (
              <div key={d.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{d.documentType}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={d.submissionStatus} size="sm" />
                    <span className="text-xs text-gray-400">Expires: {formatDate(d.expiryDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.filter(a => a.status !== 'resolved').length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-100 p-5">
          <h2 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={15} />
            Your Alerts ({alerts.filter(a => a.status !== 'resolved').length})
          </h2>
          <div className="space-y-2">
            {alerts.filter(a => a.status !== 'resolved').slice(0, 3).map(alert => (
              <div key={alert.id} className="text-xs text-red-700 p-2 bg-white rounded-lg border border-red-100">
                {alert.message}
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/alerts')} className="mt-3 text-xs text-red-600 hover:underline">View all alerts →</button>
        </div>
      )}
    </div>
  );
}
