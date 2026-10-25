import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertTriangle, ArrowRight, Eye, ShieldAlert } from 'lucide-react';
import { useStore } from '../store/index.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { DataTable } from '../components/ui/DataTable.tsx';
import { isOverdue, isApproachingDeadline, formatDate, getDaysUntil, getAgeingDays, getStageLabel } from '../utils/businessLogic.ts';
import type { Application } from '../types/index.ts';

export default function ApplicationList() {
  const navigate = useNavigate();
  const applications = useStore(s => s.applications);
  const currentRole = useStore(s => s.currentRole);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      // Role filtering if institution_admin
      if (currentRole === 'institution_admin' && app.institutionId !== 'INST001') {
        return false;
      }

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches =
          app.applicationId.toLowerCase().includes(query) ||
          app.institutionName.toLowerCase().includes(query) ||
          app.applicationType.toLowerCase().includes(query) ||
          app.assignedOfficerName.toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (selectedRegion !== 'all' && app.region !== selectedRegion) return false;
      if (selectedStage !== 'all' && app.currentStage !== selectedStage) return false;
      if (selectedStatus !== 'all' && app.currentStatus !== selectedStatus) return false;
      if (overdueOnly && !isOverdue(app.stageDeadline, app.currentStatus)) return false;

      return true;
    });
  }, [applications, currentRole, searchTerm, selectedRegion, selectedStage, selectedStatus, overdueOnly]);

  const columns = [
    {
      id: 'appId',
      header: 'Application ID',
      render: (a: Application) => (
        <div>
          <span className="font-mono text-xs font-semibold text-blue-700">{a.applicationId}</span>
          <p className="text-[11px] text-gray-500 font-medium truncate max-w-[220px]">{a.institutionName}</p>
        </div>
      ),
    },
    {
      id: 'region',
      header: 'Region',
      render: (a: Application) => <span className="text-xs text-gray-600">{a.region}</span>,
    },
    {
      id: 'type',
      header: 'Type',
      render: (a: Application) => (
        <span className="text-xs text-gray-700 max-w-[220px] block truncate" title={a.applicationType}>
          {a.applicationType}
        </span>
      ),
    },
    {
      id: 'stage',
      header: 'Stage & Status',
      render: (a: Application) => (
        <div className="space-y-0.5">
          <StatusBadge status={a.currentStatus} size="sm" />
          <p className="text-[10px] text-gray-400 capitalize">{getStageLabel(a.currentStage)}</p>
        </div>
      ),
    },
    {
      id: 'ageing',
      header: 'Ageing',
      render: (a: Application) => {
        const days = getAgeingDays(a.stageEntryDate);
        return <span className="text-xs text-gray-600 font-medium">{days}d in stage</span>;
      },
    },
    {
      id: 'deadline',
      header: 'Stage Deadline',
      render: (a: Application) => {
        const d = getDaysUntil(a.stageDeadline);
        const overdue = isOverdue(a.stageDeadline, a.currentStatus);
        const approaching = isApproachingDeadline(a.stageDeadline, 7, a.currentStatus);

        return (
          <div>
            <span
              className={`text-xs font-semibold ${
                overdue ? 'text-red-600' : approaching ? 'text-amber-600' : 'text-gray-600'
              }`}
            >
              {overdue ? `Overdue by ${Math.abs(d)}d` : d === 0 ? 'Due Today' : `${d} days left`}
            </span>
            <p className="text-[10px] text-gray-400">{formatDate(a.stageDeadline)}</p>
          </div>
        );
      },
    },
    {
      id: 'assigned',
      header: 'Assigned Officer',
      render: (a: Application) => (
        <span className="text-xs text-gray-700 truncate block max-w-[140px]">{a.assignedOfficerName}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      render: (a: Application) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/applications/${a.id}`);
          }}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="View Details"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Workflow Register"
        subtitle="End-to-end institutional approval tracking and stage transition registry"
      />

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Application ID, Institution name, programme type, or officer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
            >
              <option value="all">All Regions</option>
              <option value="North">North</option>
              <option value="West">West</option>
              <option value="South">South</option>
              <option value="East">East</option>
            </select>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
            >
              <option value="all">All Stages</option>
              <option value="scrutiny">Scrutiny</option>
              <option value="evc">EVC</option>
              <option value="sac_shc">SAC/SHC</option>
              <option value="approved">Approved</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="under_scrutiny">Under Scrutiny</option>
              <option value="returned_for_deficiency">Returned for Deficiency</option>
              <option value="resubmitted">Resubmitted</option>
              <option value="awaiting_evc">Awaiting EVC</option>
              <option value="evc_scheduled">EVC Scheduled</option>
              <option value="approved">Approved</option>
            </select>

            <button
              onClick={() => setOverdueOnly(!overdueOnly)}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors border ${
                overdueOnly
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={13} className={overdueOnly ? 'text-red-500' : 'text-gray-400'} />
                Overdue Only
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredApps}
          onRowClick={(a) => navigate(`/applications/${a.id}`)}
          keyExtractor={(a) => a.id}
          rowClassName={(a) => {
            if (isOverdue(a.stageDeadline, a.currentStatus)) return '!bg-red-50/40 hover:!bg-red-50';
            if (isApproachingDeadline(a.stageDeadline, 7, a.currentStatus)) return '!bg-amber-50/30 hover:!bg-amber-50';
            return '';
          }}
          emptyMessage="No applications match the selected criteria."
        />
      </div>
    </div>
  );
}
