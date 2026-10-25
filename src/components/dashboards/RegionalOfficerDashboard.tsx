import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertTriangle, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/index.ts';
import { SummaryCard } from '../ui/SummaryCard.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { DataTable } from '../ui/DataTable.tsx';
import { isOverdue, isApproachingDeadline, formatDate, getDaysUntil, getAgeingDays } from '../../utils/businessLogic.ts';
import type { Application } from '../../types/index.ts';

export default function RegionalOfficerDashboard() {
  const navigate = useNavigate();
  // Regional Officer (North) reviews North region or assigned applications
  const applications = useStore(s => s.applications).filter(a => a.region === 'North' || a.assignedOfficerId === 'OFF001');
  const auditEvents = useStore(s => s.auditEvents).filter(e => e.actorRole === 'regional_officer');

  const pendingScrutiny = applications.filter(a => a.currentStatus === 'under_scrutiny' || a.currentStatus === 'submitted');
  const resubmitted = applications.filter(a => a.currentStatus === 'resubmitted');
  const returned = applications.filter(a => a.currentStatus === 'returned_for_deficiency');
  const overdueApps = applications.filter(a => isOverdue(a.stageDeadline, a.currentStatus));
  const approachingApps = applications.filter(a => isApproachingDeadline(a.stageDeadline, 7, a.currentStatus));

  const columns = [
    {
      id: 'appId',
      header: 'Application ID',
      render: (a: Application) => (
        <div>
          <span className="font-mono text-xs font-semibold text-blue-700">{a.applicationId}</span>
          <p className="text-[11px] text-gray-500 truncate max-w-[200px]">{a.institutionName}</p>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Application Type',
      render: (a: Application) => <span className="text-xs text-gray-700">{a.applicationType}</span>,
    },
    {
      id: 'stage',
      header: 'Stage & Status',
      render: (a: Application) => (
        <div className="space-y-1">
          <StatusBadge status={a.currentStatus} size="sm" />
          <p className="text-[10px] text-gray-400 capitalize">Stage: {a.currentStage}</p>
        </div>
      ),
    },
    {
      id: 'ageing',
      header: 'Stage Ageing',
      render: (a: Application) => {
        const age = getAgeingDays(a.stageEntryDate);
        return <span className="text-xs text-gray-600">{age} days</span>;
      },
    },
    {
      id: 'deadline',
      header: 'Deadline',
      render: (a: Application) => {
        const d = getDaysUntil(a.stageDeadline);
        const cl = d < 0 ? 'text-red-600 font-bold' : d <= 7 ? 'text-amber-600 font-medium' : 'text-gray-600';
        return (
          <div>
            <span className={`text-xs ${cl}`}>
              {d < 0 ? `Overdue ${Math.abs(d)}d` : d === 0 ? 'Due today' : `${d} days left`}
            </span>
            <p className="text-[10px] text-gray-400">{formatDate(a.stageDeadline)}</p>
          </div>
        );
      },
    },
    {
      id: 'action',
      header: 'Action',
      render: (a: Application) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/applications/${a.id}`);
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          Review <ArrowRight size={12} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regional Officer Scrutiny Console"
        subtitle="Northern Regional Office (NRO) — Scrutiny and Evaluation Workload"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Assigned Applications"
          value={applications.length}
          Icon={FileText}
          colorScheme="blue"
          onClick={() => navigate('/applications')}
          subtitle="In your jurisdiction"
        />
        <SummaryCard
          title="Pending Scrutiny"
          value={pendingScrutiny.length}
          Icon={Clock}
          colorScheme="indigo"
          onClick={() => navigate('/applications')}
          subtitle="Awaiting initial verification"
        />
        <SummaryCard
          title="Approaching Deadline"
          value={approachingApps.length}
          Icon={AlertTriangle}
          colorScheme="amber"
          onClick={() => navigate('/applications')}
          subtitle="Within next 7 days"
        />
        <SummaryCard
          title="Overdue Scrutiny"
          value={overdueApps.length}
          Icon={AlertTriangle}
          colorScheme="red"
          onClick={() => navigate('/applications')}
          subtitle="Action required urgently"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Assigned Applications Queue</h2>
              <p className="text-xs text-gray-400">Applications undergoing scrutiny or awaiting review</p>
            </div>
            <button onClick={() => navigate('/applications')} className="text-xs text-blue-600 hover:underline">
              View all ({applications.length}) →
            </button>
          </div>
          <DataTable
            columns={columns}
            data={applications}
            onRowClick={(a) => navigate(`/applications/${a.id}`)}
            keyExtractor={(a) => a.id}
            emptyMessage="No applications currently assigned."
          />
        </div>

        <div className="space-y-6">
          {/* Resubmissions & Returned */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle size={15} className="text-green-600" />
              Resubmitted by Institutions ({resubmitted.length})
            </h2>
            {resubmitted.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No pending resubmissions</p>
            ) : (
              <div className="space-y-2">
                {resubmitted.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="w-full text-left p-2.5 rounded-lg border border-orange-100 bg-orange-50/50 hover:bg-orange-100/60 transition-colors"
                  >
                    <p className="text-xs font-semibold text-gray-800">{app.applicationId}</p>
                    <p className="text-[11px] text-gray-600 truncate">{app.institutionName}</p>
                    <span className="inline-block mt-1 text-[10px] bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded font-medium">
                      Ready for re-scrutiny
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Applications with Deficiencies */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              Returned with Deficiencies ({returned.length})
            </h2>
            {returned.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No applications currently returned</p>
            ) : (
              <div className="space-y-2">
                {returned.map((app) => (
                  <div key={app.id} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 text-xs">
                    <p className="font-medium text-gray-800">{app.applicationId}</p>
                    <p className="text-gray-500 text-[11px] truncate">{app.institutionName}</p>
                    {app.deficiencyReasons.length > 0 && (
                      <p className="text-red-600 text-[11px] mt-1 line-clamp-2">
                        Reason: {app.deficiencyReasons[app.deficiencyReasons.length - 1]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Officer Audit Logs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">My Recent Actions</h2>
            <div className="space-y-2">
              {auditEvents.slice(0, 4).map((ev) => (
                <div key={ev.id} className="text-xs border-b border-gray-50 pb-2 last:border-0">
                  <p className="font-medium text-gray-700 capitalize">{ev.actionType.replace(/_/g, ' ')}</p>
                  <p className="text-gray-400 text-[10px]">{ev.affectedEntityName} — {formatDate(ev.timestamp)}</p>
                  {ev.remarks && <p className="text-gray-500 text-[11px] truncate mt-0.5">{ev.remarks}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
