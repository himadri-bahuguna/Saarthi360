import React from 'react';
import { useStore } from '../../store/index.ts';
import SupervisoryDashboard from './SupervisoryDashboard.tsx';
import InstitutionDashboard from './InstitutionDashboard.tsx';
import RegionalOfficerDashboard from './RegionalOfficerDashboard.tsx';
import EVCCoordinatorDashboard from './EVCCoordinatorDashboard.tsx';

export default function DashboardRouter() {
  const currentRole = useStore(s => s.currentRole);

  switch (currentRole) {
    case 'supervisory_admin': return <SupervisoryDashboard />;
    case 'institution_admin': return <InstitutionDashboard />;
    case 'regional_officer': return <RegionalOfficerDashboard />;
    case 'evc_coordinator': return <EVCCoordinatorDashboard />;
    default: return <SupervisoryDashboard />;
  }
}
