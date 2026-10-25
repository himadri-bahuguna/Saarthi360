import React, { useState } from 'react';
import { History, Search, Shield, Filter } from 'lucide-react';
import { useStore } from '../store/index.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { DataTable } from '../components/ui/DataTable.tsx';
import { formatDateTime } from '../utils/businessLogic.ts';
import type { AuditEvent } from '../types/index.ts';

export default function AuditTrail() {
  const auditEvents = useStore(s => s.auditEvents);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  const filteredEvents = auditEvents.filter(ev => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        ev.actorName.toLowerCase().includes(q) ||
        ev.affectedEntityName.toLowerCase().includes(q) ||
        (ev.remarks && ev.remarks.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filterRole !== 'all' && ev.actorRole !== filterRole) return false;
    if (filterAction !== 'all' && ev.actionType !== filterAction) return false;
    return true;
  });

  const columns = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      render: (e: AuditEvent) => (
        <span className="font-mono text-[11px] text-gray-500">{formatDateTime(e.timestamp)}</span>
      ),
    },
    {
      id: 'actor',
      header: 'Actor & Role',
      render: (e: AuditEvent) => (
        <div>
          <span className="font-semibold text-xs text-gray-800">{e.actorName}</span>
          <p className="text-[10px] text-gray-400 capitalize">{e.actorRole.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Action Taken',
      render: (e: AuditEvent) => (
        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-100 text-gray-700">
          {e.actionType}
        </span>
      ),
    },
    {
      id: 'target',
      header: 'Target Entity',
      render: (e: AuditEvent) => (
        <div>
          <span className="text-xs font-medium text-gray-800">{e.affectedEntityName}</span>
          <p className="text-[10px] text-gray-400 font-mono">{e.affectedEntityType} #{e.affectedEntityId}</p>
        </div>
      ),
    },
    {
      id: 'changes',
      header: 'Values / Transition',
      render: (e: AuditEvent) => (
        <div className="text-xs">
          {e.previousValue && e.newValue ? (
            <p className="font-mono text-[11px] text-gray-600">
              <span className="text-red-600 line-through">{e.previousValue}</span> → <span className="text-green-600 font-semibold">{e.newValue}</span>
            </p>
          ) : e.newValue ? (
            <p className="font-mono text-[11px] text-green-700">{e.newValue}</p>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      ),
    },
    {
      id: 'remarks',
      header: 'Remarks / Observations',
      render: (e: AuditEvent) => (
        <span className="text-xs text-gray-600 italic block max-w-[260px] truncate" title={e.remarks}>
          {e.remarks || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Audit Trail & Governance Log"
        subtitle="Immutable append-only chronological log of all administrative actions, transitions, and reviews"
      />

      {/* Notice Banner */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <Shield size={18} className="text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-0.5">
          <p className="font-semibold">Statutory Governance & Compliance Logging Notice</p>
          <p className="text-blue-700">
            All state transitions, deficiency observations, and verification outcomes are recorded in an append-only structure. In production, this data streams to a WORM (Write Once, Read Many) tamper-evident compliance vault.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search actor name, entity, or remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700"
          >
            <option value="all">All Actor Roles</option>
            <option value="institution_admin">Institution Admin</option>
            <option value="regional_officer">Regional Officer</option>
            <option value="evc_coordinator">EVC Coordinator</option>
            <option value="supervisory_admin">Supervisory Admin</option>
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700"
          >
            <option value="all">All Action Types</option>
            <option value="application_created">Application Created</option>
            <option value="stage_changed">Stage Changed</option>
            <option value="application_returned">Application Returned</option>
            <option value="application_resubmitted">Application Resubmitted</option>
            <option value="evc_scheduled">EVC Scheduled</option>
            <option value="evc_completed">EVC Completed</option>
            <option value="undertaking_submitted">Undertaking Submitted</option>
            <option value="undertaking_verified">Undertaking Verified</option>
            <option value="compliance_submitted">Compliance Submitted</option>
            <option value="alert_acknowledged">Alert Acknowledged</option>
            <option value="demo_reset">Demo Reset</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredEvents}
          keyExtractor={(e) => e.id}
          emptyMessage="No audit trail events match the current criteria."
        />
      </div>
    </div>
  );
}
