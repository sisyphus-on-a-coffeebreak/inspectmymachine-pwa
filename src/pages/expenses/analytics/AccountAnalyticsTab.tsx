/**
 * Account Analytics Tab
 * 
 * Migrated from AccountsDashboard
 * Shows account-wise expense analysis and management
 */

import React from 'react';
import { AccountsDashboard } from '../AccountsDashboard';

export function AccountAnalyticsTab() {
  // Simply render the existing AccountsDashboard component
  // The AnalyticsContext will provide shared filters
  return <AccountsDashboard />;
}

