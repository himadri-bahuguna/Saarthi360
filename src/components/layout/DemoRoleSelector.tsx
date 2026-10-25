import React from 'react';
import { useStore } from '../../store/index.ts';
import type { DemoRole } from '../../types/index.ts';
import { Building2, UserCheck, Calendar, Shield, ChevronDown } from 'lucide-react';
import { useToast } from '../ui/ToastProvider.tsx';

const roles: { id: DemoRole; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'supervisory_admin', label: 'Supervisory Admin', icon: Shield, color: 'bg-purple-100 text-purple-800' },
  { id: 'regional_officer', label: 'Regional Officer', icon: UserCheck, color: 'bg-blue-100 text-blue-800' },
  { id: 'evc_coordinator', label: 'EVC Coordinator', icon: Calendar, color: 'bg-teal-100 text-teal-800' },
  { id: 'institution_admin', label: 'Institution Admin', icon: Building2, color: 'bg-orange-100 text-orange-800' },
];

export function DemoRoleSelector() {
  const [open, setOpen] = React.useState(false);
  const currentRole = useStore(s => s.currentRole);
  const setRole = useStore(s => s.setRole);
  const toast = useToast();
  const ref = React.useRef<HTMLDivElement>(null);

  const current = roles.find(r => r.id === currentRole)!;
  const CurrentIcon = current.icon;

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-sm"
      >
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${current.color}`}>
          <CurrentIcon size={12} />
          {current.label}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-lg z-50 py-1">
          <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">DEMO: Switch Role</p>
          {roles.map(r => {
            const RIcon = r.icon;
            const isActive = r.id === currentRole;
            return (
              <button
                key={r.id}
                onClick={() => {
                  setRole(r.id);
                  setOpen(false);
                  toast.info(`Switched to ${r.label} (DEMO)`);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
              >
                <RIcon size={15} />
                {r.label}
                {isActive && <span className="ml-auto text-xs text-blue-500">Active</span>}
              </button>
            );
          })}
          <div className="mx-3 my-1.5 p-2 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-xs text-amber-700">Role switching is for demo only. Not production authentication.</p>
          </div>
        </div>
      )}
    </div>
  );
}
