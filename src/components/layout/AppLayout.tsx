import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Calendar, ClipboardList, FolderOpen,
  CheckSquare, Bell, BarChart2, History, Settings, Menu, X,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { useStore } from '../../store/index.ts';
import { DemoRoleSelector } from './DemoRoleSelector.tsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';
import { useToast } from '../ui/ToastProvider.tsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/applications', icon: FileText, label: 'Applications' },
  { to: '/evc', icon: Calendar, label: 'EVC Scheduling' },
  { to: '/undertakings', icon: ClipboardList, label: 'Undertakings' },
  { to: '/documents', icon: FolderOpen, label: 'Document Validity' },
  { to: '/compliance', icon: CheckSquare, label: 'Compliance' },
  { to: '/alerts', icon: Bell, label: 'Alerts & Escalations' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/audit', icon: History, label: 'Audit Trail' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const alerts = useStore(s => s.alerts);
  const currentRole = useStore(s => s.currentRole);
  const currentDemoUser = useStore(s => s.currentDemoUser);
  const resetDemoData = useStore(s => s.resetDemoData);
  const toast = useToast();
  const navigate = useNavigate();

  const openAlertCount = alerts.filter(a => a.status === 'open' || a.status === 'escalated').length;

  const handleReset = () => {
    resetDemoData();
    setShowReset(false);
    toast.success('Demo data has been reset to initial state.');
    navigate('/dashboard');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col w-64 transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#0f2557' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <p className="text-white font-bold text-sm leading-tight">AICTE</p>
            <p className="text-blue-200 text-xs">Workflow Management</p>
          </div>
          <button
            className="lg:hidden text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* DEMO Banner */}
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-500/20 border border-amber-400/30 rounded-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-xs font-medium">DEMO MODE — FICTIONAL DATA</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-2">Navigation</p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-colors relative ${
                  isActive
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-white/70 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 inset-y-2 w-0.5 bg-blue-300 rounded-r" />}
                  <item.icon size={16} />
                  <span>{item.label}</span>
                  {item.to === '/alerts' && openAlertCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {openAlertCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Reset Button */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw size={13} />
            Reset Demo Data
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-lg">
                <AlertTriangle size={12} className="text-red-500" />
                <span className="text-xs text-red-600 font-medium">DEMO MODE — FICTIONAL SAMPLE DATA — NOT A LIVE AICTE SYSTEM</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/alerts')}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={`${openAlertCount} open alerts`}
              >
                <Bell size={18} />
                {openAlertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {openAlertCount > 9 ? '9+' : openAlertCount}
                  </span>
                )}
              </button>
              <span className="hidden sm:block text-sm text-gray-500">|</span>
              <span className="hidden sm:block text-xs text-gray-500">{currentDemoUser}</span>
              <DemoRoleSelector />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      <ConfirmDialog
        isOpen={showReset}
        onConfirm={handleReset}
        onCancel={() => setShowReset(false)}
        title="Reset Demo Data"
        message="This will reset all demo records to their initial state. Any changes made during this session will be lost. Continue?"
        confirmLabel="Reset Data"
        variant="warning"
      />
    </div>
  );
}
