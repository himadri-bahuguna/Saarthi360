import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, AlertTriangle, Clock, CheckCircle, Calendar,
  ClipboardList, FolderOpen, TrendingUp, Activity
} from 'lucide-react';
import { useStore } from '../../store/index.ts';
import { SummaryCard } from '../ui/SummaryCard.tsx';
import { PageHeader } from '../ui/PageHeader.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { isOverdue, isApproachingDeadline, formatDateTime, getStageLabel, getDaysUntil, formatDate } from '../../utils/businessLogic.ts';

export default function SupervisoryDashboard() {
  const navigate = useNavigate();
  const applications = useStore(s => s.applications);
  const evcRecords = useStore(s => s.evcRecords);
  const undertakings = useStore(s => s.undertakings);
  const documents = useStore(s => s.documents);
  const alerts = useStore(s => s.alerts);
  const auditEvents = useStore(s => s.auditEvents);

  // Derived counts
  const total = applications.length;
  const pending = applications.filter(a => !['approved', 'rejected', 'withdrawn'].includes(a.currentStatus)).length;
  const overdue = applications.filter(a => isOverdue(a.stageDeadline, a.currentStatus)).length;
  const approaching = applications.filter(a => isApproachingDeadline(a.stageDeadline, 7, a.currentStatus)).length;
  const evcQueue = evcRecords.filter(e => e.status !== 'completed' && e.status !== 'cancelled').length;
  const pendingUndertakings = undertakings.filter(u => u.verificationStatus === 'awaiting_verification').length;
  const expiringDocs = documents.filter(d => d.submissionStatus === 'expiring_soon' || d.submissionStatus === 'expired' || d.submissionStatus === 'missing').length;
  const overdueCases = alerts.filter(a => (a.status === 'open' || a.status === 'escalated')).length;

  // Stage-wise pendency
  const stageGroups: Record<string, number> = {};
  applications.filter(a => !['approved', 'rejected', 'withdrawn'].includes(a.currentStatus)).forEach(a => {
    stageGroups[a.currentStage] = (stageGroups[a.currentStage] || 0) + 1;
  });

  // Region-wise summary
  const regions = ['North', 'West', 'South', 'East'];
  const regionSummary = regions.map(r => {
    const regionApps = applications.filter(a => a.region === r);
    return {
      region: r,
      total: regionApps.length,
      pending: regionApps.filter(a => !['approved', 'rejected', 'withdrawn'].includes(a.currentStatus)).length,
      overdue: regionApps.filter(a => isOverdue(a.stageDeadline, a.currentStatus)).length,
    };
  });

  // Priority queue — top overdue/escalated items
  const priorityItems = [
    ...applications.filter(a => isOverdue(a.stageDeadline, a.currentStatus)).map(a => ({
      id: a.id, type: 'Application', name: a.applicationId, institution: a.institutionName,
      issue: 'Overdue at ' + getStageLabel(a.currentStage), severity: 'critical' as const,
      link: `/applications/${a.id}`,
    })),
    ...undertakings.filter(u => u.submissionStatus === 'overdue').map(u => ({
      id: u.id, type: 'Undertaking', name: u.id, institution: u.institutionName,
      issue: 'Overdue undertaking', severity: 'high' as const,
      link: '/undertakings',
    })),
    ...documents.filter(d => d.submissionStatus === 'expired' || d.submissionStatus === 'missing').map(d => ({
      id: d.id, type: 'Document', name: d.documentType, institution: d.institutionName,
      issue: d.submissionStatus === 'expired' ? 'Document expired' : 'Document missing', severity: 'critical' as const,
      link: '/documents',
    })),
  ].slice(0, 6);

  // Upcoming deadlines
  const upcomingDeadlines = [
    ...applications.filter(a => {
      const d = getDaysUntil(a.stageDeadline);
      return d >= 0 && d <= 14 && !['approved', 'rejected', 'withdrawn'].includes(a.currentStatus);
    }).map(a => ({ id: a.id, name: a.applicationId, entity: a.institutionName, deadline: a.stageDeadline, type: 'Application', link: `/applications/${a.id}` })),
    ...undertakings.filter(u => {
      const d = getDaysUntil(u.dueDate);
      return d >= 0 && d <= 14 && !['verified'].includes(u.submissionStatus);
    }).map(u => ({ id: u.id, name: u.id, entity: u.institutionName, deadline: u.dueDate, type: 'Undertaking', link: '/undertakings' })),
    ...documents.filter(d => {
      const days = getDaysUntil(d.expiryDate);
      return days >= 0 && days <= 30 && !['renewal_verified'].includes(d.submissionStatus);
    }).map(d => ({ id: d.id, name: d.documentType, entity: d.institutionName, deadline: d.expiryDate, type: 'Document', link: '/documents' })),
  ].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 5);

  const escalated = alerts.filter(a => a.status === 'escalated').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisory Overview"
        subtitle="Unified operational monitoring dashboard — DEMO MODE"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Applications" value={total} Icon={FileText} colorScheme="blue" onClick={() => navigate('/applications')} subtitle="All tracked applications" />
        <SummaryCard title="Pending Processing" value={pending} Icon={Clock} colorScheme="indigo" onClick={() => navigate('/applications')} subtitle="Awaiting action" />
        <SummaryCard title="Overdue Actions" value={overdue} Icon={AlertTriangle} colorScheme="red" onClick={() => navigate('/applications')} subtitle="Past deadline" />
        <SummaryCard title="Approaching Deadline" value={approaching} Icon={TrendingUp} colorScheme="amber" onClick={() => navigate('/applications')} subtitle="Within 7 days" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard title="EVC Queue" value={evcQueue} Icon={Calendar} colorScheme="purple" onClick={() => navigate('/evc')} subtitle="Pending EVC actions" />
        <SummaryCard title="Undertaking Verification" value={pendingUndertakings} Icon={ClipboardList} colorScheme="indigo" onClick={() => navigate('/undertakings')} subtitle="Awaiting review" />
        <SummaryCard title="Document Issues" value={expiringDocs} Icon={FolderOpen} colorScheme="amber" onClick={() => navigate('/documents')} subtitle="Expiring/expired docs" />
        <SummaryCard title="Open Alerts" value={overdueCases} Icon={AlertTriangle} colorScheme="red" onClick={() => navigate('/alerts')} subtitle={`${escalated} escalated`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage-wise Pendency */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Stage-wise Pendency</h2>
          {Object.keys(stageGroups).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No pending applications</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stageGroups).map(([stage, count]) => (
                <div key={stage} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{getStageLabel(stage)}</span>
                      <span className="text-gray-500 font-semibold">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min((count / pending) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Region-wise Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Region-wise Summary</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 text-left text-gray-400 font-medium">Region</th>
                <th className="pb-2 text-center text-gray-400 font-medium">Total</th>
                <th className="pb-2 text-center text-gray-400 font-medium">Pending</th>
                <th className="pb-2 text-center text-red-400 font-medium">Overdue</th>
              </tr>
            </thead>
            <tbody>
              {regionSummary.map(r => (
                <tr key={r.region} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-700">{r.region}</td>
                  <td className="py-2 text-center text-gray-600">{r.total}</td>
                  <td className="py-2 text-center text-blue-600 font-medium">{r.pending}</td>
                  <td className="py-2 text-center">
                    {r.overdue > 0 ? <span className="text-red-600 font-bold">{r.overdue}</span> : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Escalation Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Escalation & Alert Summary</h2>
          <div className="space-y-3">
            {(['open', 'escalated', 'acknowledged', 'resolved'] as const).map(status => {
              const count = alerts.filter(a => a.status === status).length;
              const colorMap: Record<string, string> = {
                open: 'text-red-600 bg-red-50',
                escalated: 'text-red-800 bg-red-100 font-bold',
                acknowledged: 'text-amber-700 bg-amber-50',
                resolved: 'text-green-700 bg-green-50',
              };
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 capitalize">{status}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorMap[status]}`}>{count}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="mt-4 w-full text-xs text-blue-600 hover:text-blue-700 hover:underline text-center"
          >
            View all alerts →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Action Queue */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-500" />
            Priority Action Queue
          </h2>
          {priorityItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No priority actions required</p>
            </div>
          ) : (
            <div className="space-y-2">
              {priorityItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.link)}
                  className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 truncate">{item.institution}</p>
                      <p className="text-xs text-red-600 mt-0.5">{item.issue}</p>
                    </div>
                    <StatusBadge status={item.severity} size="sm" label={item.severity === 'critical' ? 'Critical' : 'High'} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock size={15} className="text-amber-500" />
            Upcoming Deadlines
          </h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No upcoming deadlines within 14 days</p>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map(item => {
                const daysLeft = getDaysUntil(item.deadline);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.link)}
                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 truncate">{item.entity} — {item.type}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-bold ${daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {daysLeft} days
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(item.deadline)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Activity size={15} className="text-blue-500" />
            Recent Activity
          </h2>
          <button onClick={() => navigate('/audit')} className="text-xs text-blue-600 hover:underline">View all →</button>
        </div>
        <div className="space-y-2">
          {auditEvents.slice(0, 6).map(ev => (
            <div key={ev.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">{ev.actorName}</span>
                  {' '}<span className="text-gray-500">{ev.actionType.replace(/_/g, ' ')}</span>
                  {' '}<span className="font-medium">{ev.affectedEntityName}</span>
                </p>
                {ev.remarks && <p className="text-xs text-gray-400 truncate mt-0.5">{ev.remarks}</p>}
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(ev.timestamp)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
