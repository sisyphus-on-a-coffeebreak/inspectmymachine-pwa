/**
 * Sync Status Widget
 * 
 * Shows inspection sync status for inspectors
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InspectionSyncWidget } from './InspectionSyncWidget';
import { colors, spacing } from '../../../lib/theme';

export function SyncStatusWidget() {
  // Reuse the existing InspectionSyncWidget but in a smaller format
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: spacing.lg,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <InspectionSyncWidget />
    </div>
  );
}


