import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastProvider.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import DashboardRouter from './components/dashboards/DashboardRouter.tsx';
import ApplicationList from './pages/ApplicationList.tsx';
import ApplicationDetail from './pages/ApplicationDetail.tsx';
import EVCWorkspace from './pages/EVCWorkspace.tsx';
import UndertakingWorkspace from './pages/UndertakingWorkspace.tsx';
import DocumentWorkspace from './pages/DocumentWorkspace.tsx';
import ComplianceWorkspace from './pages/ComplianceWorkspace.tsx';
import AlertsWorkspace from './pages/AlertsWorkspace.tsx';
import ReportsWorkspace from './pages/ReportsWorkspace.tsx';
import AuditTrail from './pages/AuditTrail.tsx';
import WorkflowSettings from './pages/WorkflowSettings.tsx';

export default function App() {
  return (
    <ToastProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/applications" element={<ApplicationList />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/evc" element={<EVCWorkspace />} />
          <Route path="/undertakings" element={<UndertakingWorkspace />} />
          <Route path="/documents" element={<DocumentWorkspace />} />
          <Route path="/compliance" element={<ComplianceWorkspace />} />
          <Route path="/alerts" element={<AlertsWorkspace />} />
          <Route path="/reports" element={<ReportsWorkspace />} />
          <Route path="/audit" element={<AuditTrail />} />
          <Route path="/settings" element={<WorkflowSettings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </ToastProvider>
  );
}
