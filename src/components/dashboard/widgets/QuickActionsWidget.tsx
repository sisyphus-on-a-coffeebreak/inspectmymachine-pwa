/**
 * Quick Actions Widget
 * 
 * Displays role-based quick actions
 */

import React from 'react';
import type { WidgetProps } from '@/types/widgets';
import { QuickActionsPanel, getRoleQuickActions } from '../../ui/QuickActionsPanel';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/useAuth';

export const QuickActionsWidget: React.FC<WidgetProps> = ({ config, data }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actions = getRoleQuickActions(
    user?.role || '',
    navigate,
    data?.contextData,
    user // Pass user object for capability checks
  );

  return (
    <QuickActionsPanel
      title={config.title}
      actions={actions}
      columns={config.size === 'small' ? 2 : config.size === 'medium' ? 3 : 4}
      compact={config.size === 'small'}
      contextData={data?.contextData}
    />
  );
};

