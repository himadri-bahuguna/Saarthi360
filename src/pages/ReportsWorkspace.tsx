import React, { useState } from 'react';
import { Download, BarChart2, Filter, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../store/index.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { exportToCSV, getStageLabel, getDaysUntil, getAgeingDays, isOverdue } from '../utils/businessLogic.ts';

export default function ReportsWorkspace() {
  const applications = useStore(s => s.applications);
  const evcRecords = useStore(s => s.evcRecords);
  const undertakings = useStore(s => s.undertakings);
  const documents = useStore(s => s.documents);
  const alerts = useStore(s => s.alerts);

  const [activeReport, setActiveReport] = useState<'stage' | 'region' | 'evc' | 'undertaking' | 'docs' | 'overdue'>('stage');

  // 1. Stage-wise report
  const stageStats: Record<string, { total: number; overdue: number; avgAge: number; ages: number[] }> = {};
  applications.forEach(a => {
    if (!stageStats[a.currentStage]) {
      stageStats[a.currentStage] = { total: 0, overdue: 0, avgAge: 0, ages: [] };
    }
    stageStats[a.currentStage].total++;
    const age = getAgeingDays(a.stageEntryDate);
    stageStats[a.currentStage].ages.push(age);
    if (isOverdue(a.stageDeadline, a.currentStatus)) {
      stageStats[a.currentStage].overdue++;
    }
  });

  const stageData = Object.entries(stageStats).map(([stg, data]) => ({
    Stage: getStageLabel(stg),
    TotalApplications: data.total,
    OverdueCount: data.overdue,
    AverageAgeDays: Math.round(data.ages.reduce((sum, v) => sum + v, 0) / data.ages.length || 0),
  }));

  // 2. Region-wise report
  const regions = ['North', 'West', 'South', 'East'];
  const regionData = regions.map(reg => {
    const rApps = applications.filter(a => a.region === reg);
    const pending = rApps.filter(a => !['approved', 'rejected', 'withdrawn'].includes(a.currentStatus));
    const over = rApps.filter(a => isOverdue(a.stageDeadline, a.currentStatus));
    const ages = rApps.map(a => getAgeingDays(a.stageEntryDate));
    return {
      Region: reg,
      TotalApplications: rApps.length,
      PendingProcessing: pending.length,
      OverdueCases: over.length,
      AverageAgeDays: Math.round(ages.reduce((sum, v) => sum + v, 0) / (ages.length || 1)),
    };
  });

  // 3. EVC report
  const evcData = [
    { Status: 'Unscheduled Queue', Count: evcRecords.filter(e => e.status === 'pending').length },
    { Status: 'Scheduled Visits', Count: evcRecords.filter(e => e.status === 'scheduled').length },
    { Status: 'Completed Inspections', Count: evcRecords.filter(e => e.status === 'completed').length },
    { Status: 'Overdue Inspections', Count: evcRecords.filter(e => e.status === 'overdue' || (e.status !== 'completed' && getDaysUntil(e.deadline) < 0)).length },
  ];

  // 4. Undertakings report
  const undertakingData = [
    { Status: 'Pending Submission', Count: undertakings.filter(u => u.submissionStatus === 'pending').length },
    { Status: 'Awaiting Verification', Count: undertakings.filter(u => u.submissionStatus === 'awaiting_verification').length },
    { Status: 'Verified / Fulfilled', Count: undertakings.filter(u => u.submissionStatus === 'verified').length },
    { Status: 'Overdue Commitments', Count: undertakings.filter(u => u.submissionStatus === 'overdue' || (u.submissionStatus !== 'verified' && getDaysUntil(u.dueDate) < 0)).length },
  ];

  // 5. Documents report
  const docData = [
    { Status: 'Valid Documents', Count: documents.filter(d => d.submissionStatus === 'valid').length },
    { Status: 'Expiring Soon (≤30 Days)', Count: documents.filter(d => d.submissionStatus === 'expiring_soon').length },
    { Status: 'Expired / Missing Renewal', Count: documents.filter(d => d.submissionStatus === 'expired' || d.submissionStatus === 'missing').length },
    { Status: 'Renewal Awaiting Verification', Count: documents.filter(d => d.submissionStatus === 'renewal_pending_verification').length },
  ];

  // 6. Overdue cases report
  const overdueData = applications
    .filter(a => isOverdue(a.stageDeadline, a.currentStatus))
    .map(a => ({
      ApplicationId: a.applicationId,
      InstitutionName: a.institutionName,
      Region: a.region,
      CurrentStage: getStageLabel(a.currentStage),
      DaysOverdue: Math.abs(getDaysUntil(a.stageDeadline)),
      AssignedOfficer: a.assignedOfficerName,
    }));

  const handleExport = () => {
    switch (activeReport) {
      case 'stage':
        exportToCSV(stageData, 'AICTE_Pendency_By_Stage_Report');
        break;
      case 'region':
        exportToCSV(regionData, 'AICTE_Region_Wise_Performance_Report');
        break;
      case 'evc':
        exportToCSV(evcData, 'AICTE_EVC_Status_Report');
        break;
      case 'undertaking':
        exportToCSV(undertakingData, 'AICTE_Undertaking_Compliance_Report');
        break;
      case 'docs':
        exportToCSV(docData, 'AICTE_Document_Validity_Report');
        break;
      case 'overdue':
        exportToCSV(overdueData, 'AICTE_Overdue_Applications_Report');
        break;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative & Operational Reports"
        subtitle="Consolidated pendency analytics, regional benchmarks, and statutory compliance indicators"
        actions={
          <button
            onClick={handleExport}
            className="px-3.5 py-2 text-xs font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download size={13} /> Export Current Report as CSV
          </button>
        }
      />

      {/* Report Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-4 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveReport('stage')}
          className={`pb-3 whitespace-nowrap ${activeReport === 'stage' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Stage-wise Pendency
        </button>
        <button
          onClick={() => setActiveReport('region')}
          className={`pb-3 whitespace-nowrap ${activeReport === 'region' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Region-wise Performance
        </button>
        <button
          onClick={() => setActiveReport('evc')}
          className={`pb-3 whitespace-nowrap ${activeReport === 'evc' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          EVC Inspection Status
        </button>
        <button
          onClick={() => setActiveReport('undertaking')}
          className={`pb-3 whitespace-nowrap ${activeReport === 'undertaking' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Undertaking Compliance
        </button>
        <button
          onClick={() => setActiveReport('docs')}
          className={`pb-3 whitespace-nowrap ${activeReport === 'docs' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Document Validity Status
        </button>
        <button
          onClick={() => setActiveReport('overdue')}
          className={`pb-3 whitespace-nowrap ${activeReport === 'overdue' ? 'text-red-600 font-bold border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Overdue Cases Roster
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        {activeReport === 'stage' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Stage-wise Application Pendency Analysis</h2>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold">
                  <th className="py-2.5">Processing Stage</th>
                  <th className="py-2.5 text-center">Total Applications</th>
                  <th className="py-2.5 text-center text-red-600">Overdue Count</th>
                  <th className="py-2.5 text-right">Avg. Ageing (Days)</th>
                </tr>
              </thead>
              <tbody>
                {stageData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2.5 font-medium text-gray-800">{row.Stage}</td>
                    <td className="py-2.5 text-center">{row.TotalApplications}</td>
                    <td className="py-2.5 text-center font-bold text-red-600">{row.OverdueCount}</td>
                    <td className="py-2.5 text-right font-mono">{row.AverageAgeDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'region' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Regional Processing Performance & Pendency</h2>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold">
                  <th className="py-2.5">Regional Office</th>
                  <th className="py-2.5 text-center">Total Intake</th>
                  <th className="py-2.5 text-center">Pending Processing</th>
                  <th className="py-2.5 text-center text-red-600">Overdue Cases</th>
                  <th className="py-2.5 text-right">Average Ageing</th>
                </tr>
              </thead>
              <tbody>
                {regionData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2.5 font-medium text-gray-800">{row.Region} Region</td>
                    <td className="py-2.5 text-center">{row.TotalApplications}</td>
                    <td className="py-2.5 text-center text-blue-600 font-semibold">{row.PendingProcessing}</td>
                    <td className="py-2.5 text-center text-red-600 font-bold">{row.OverdueCases}</td>
                    <td className="py-2.5 text-right font-mono">{row.AverageAgeDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'evc' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Expert Visit Committee (EVC) Operational Pipeline</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {evcData.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">{item.Status}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{item.Count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeReport === 'undertaking' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Undertakings & Institutional Commitments Tracking</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {undertakingData.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">{item.Status}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{item.Count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeReport === 'docs' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Prescribed Document Validity & Lease Renewal Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {docData.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">{item.Status}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{item.Count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeReport === 'overdue' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Overdue Applications Roster Requiring Administrative Escalation</h2>
            {overdueData.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No overdue applications at this time.</p>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold">
                    <th className="py-2.5">Application ID</th>
                    <th className="py-2.5">Institution</th>
                    <th className="py-2.5">Region</th>
                    <th className="py-2.5">Stage</th>
                    <th className="py-2.5 text-center text-red-600">Days Overdue</th>
                    <th className="py-2.5">Assigned Officer</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueData.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2.5 font-mono font-semibold text-blue-700">{row.ApplicationId}</td>
                      <td className="py-2.5 font-medium text-gray-800">{row.InstitutionName}</td>
                      <td className="py-2.5">{row.Region}</td>
                      <td className="py-2.5">{row.CurrentStage}</td>
                      <td className="py-2.5 text-center font-bold text-red-600">{row.DaysOverdue} days</td>
                      <td className="py-2.5 text-gray-600">{row.AssignedOfficer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
