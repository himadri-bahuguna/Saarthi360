import React, { useState } from 'react';
import { Settings, Save, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/index.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { useToast } from '../components/ui/ToastProvider.tsx';
import type { DemoRole, AlertType } from '../types/index.ts';

const ALL_ALERT_TYPES: { id: AlertType; label: string }[] = [
  { id: 'pending_action', label: 'Pending Action Reminders' },
  { id: 'approaching_deadline', label: 'Approaching Deadline Alerts (T-7 days)' },
  { id: 'overdue_application', label: 'Overdue Application Escalation' },
  { id: 'evc_unscheduled', label: 'EVC Unscheduled Notices' },
  { id: 'evc_overdue', label: 'EVC Inspection Overdue Alarms' },
  { id: 'undertaking_upcoming', label: 'Undertaking Due Reminders' },
  { id: 'undertaking_overdue', label: 'Overdue Undertaking Breach Alerts' },
  { id: 'document_expiry', label: 'Document Expiry Warnings (T-30 days)' },
  { id: 'document_expired', label: 'Expired Document Statutory Notices' },
  { id: 'compliance_pending', label: 'Compliance Verification Reminders' },
];

export default function WorkflowSettings() {
  const workflowConfig = useStore(s => s.workflowConfig);
  const workflowRoutes = useStore(s => s.workflowRoutes);
  const updateWorkflowConfig = useStore(s => s.updateWorkflowConfig);
  const currentRole = useStore(s => s.currentRole);
  const toast = useToast();

  const isSupervisory = currentRole === 'supervisory_admin';

  const [reminderDays, setReminderDays] = useState(workflowConfig.reminderThresholdDays);
  const [escalationDays, setEscalationDays] = useState(workflowConfig.escalationDelayDays);
  const [escalationRole, setEscalationRole] = useState<DemoRole>(workflowConfig.escalationRecipientRole);
  const [enabledCategories, setEnabledCategories] = useState<AlertType[]>(workflowConfig.enabledAlertCategories);

  const handleToggleCategory = (cat: AlertType) => {
    if (!isSupervisory) return;
    if (enabledCategories.includes(cat)) {
      setEnabledCategories(enabledCategories.filter(c => c !== cat));
    } else {
      setEnabledCategories([...enabledCategories, cat]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupervisory) {
      toast.error('Only Supervisory Administrator can change workflow rules.');
      return;
    }

    if (reminderDays < 1 || reminderDays > 60) {
      toast.error('Reminder threshold must be between 1 and 60 days');
      return;
    }

    updateWorkflowConfig({
      reminderThresholdDays: Number(reminderDays),
      escalationDelayDays: Number(escalationDays),
      escalationRecipientRole: escalationRole,
      enabledAlertCategories: enabledCategories,
    });

    toast.success('Demonstration workflow rules updated successfully!');
  };

  const handleResetDefaults = () => {
    if (!isSupervisory) return;
    setReminderDays(7);
    setEscalationDays(3);
    setEscalationRole('supervisory_admin');
    setEnabledCategories(ALL_ALERT_TYPES.map(a => a.id));
    toast.info('Settings reset to system defaults.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow Rules & Notification Governance"
        subtitle="Configure stage deadline thresholds, automated escalation paths, and monitoring triggers"
      />

      {/* Role Protection Warning */}
      {!isSupervisory && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-800">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <span>
            You are currently viewing in <span className="font-semibold uppercase">{currentRole.replace(/_/g, ' ')}</span> mode (Read-Only). Switch to <span className="font-semibold">Supervisory Admin</span> in top bar to edit rules.
          </span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thresholds Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Settings size={16} className="text-blue-600" />
              Deadline & Escalation Thresholds
            </h2>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Advance Reminder Threshold (Days before deadline)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                disabled={!isSupervisory}
                value={reminderDays}
                onChange={(e) => setReminderDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
              />
              <p className="text-[10px] text-gray-400 mt-1">Triggers approaching-deadline alerts when items are within this many days.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Overdue Escalation Delay (Days after deadline breach)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                disabled={!isSupervisory}
                value={escalationDays}
                onChange={(e) => setEscalationDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
              />
              <p className="text-[10px] text-gray-400 mt-1">Days overdue before item automatically escalates to designated supervisor.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Default Escalation Recipient Role
              </label>
              <select
                disabled={!isSupervisory}
                value={escalationRole}
                onChange={(e) => setEscalationRole(e.target.value as DemoRole)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 bg-white"
              >
                <option value="supervisory_admin">Supervisory Admin (Council / Member Secretary)</option>
                <option value="regional_officer">Regional Officer (Regional In-Charge)</option>
                <option value="evc_coordinator">EVC Coordinator (Inspection Directorate)</option>
              </select>
            </div>
          </div>

          {/* Workflow Routes Reference */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal-600" />
              Configured Workflow Routes
            </h2>
            <div className="space-y-3">
              {workflowRoutes.map(route => (
                <div key={route.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{route.name}</span>
                    <span className="font-mono text-[10px] text-gray-400">{route.id}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5">{route.description}</p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {route.stages.map((stg, i) => (
                      <span key={stg} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-medium text-gray-700">
                        {i + 1}. {stg}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert Categories Toggles */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Enabled Notification & Alert Categories</h2>
          <p className="text-xs text-gray-400">Toggle active alert triggers evaluated by the background engine.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {ALL_ALERT_TYPES.map(item => {
              const checked = enabledCategories.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isSupervisory ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-80'
                  } ${checked ? 'border-blue-200 bg-blue-50/20' : 'border-gray-200 bg-gray-50/50'}`}
                >
                  <input
                    type="checkbox"
                    disabled={!isSupervisory}
                    checked={checked}
                    onChange={() => handleToggleCategory(item.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-xs text-gray-700 font-medium">{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-500">
          <span className="font-semibold text-gray-700">Demonstration Disclaimer: </span>
          These settings are demonstration parameters representing APH (Approval Process Handbook) processing sequences. In production, workflow routes and statutory deadlines are established strictly by statutory council notifications.
        </div>

        {/* Buttons */}
        {isSupervisory && (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={13} /> Reset to Defaults
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Save size={13} /> Save Workflow Configuration
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
