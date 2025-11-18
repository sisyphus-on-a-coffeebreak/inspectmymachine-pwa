/**
 * Stockyard Quick Actions Component
 * 
 * Reusable quick actions panel for stockyard operations
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { colors, spacing, typography, cardStyles } from '../../lib/theme';
import {
  Plus,
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  Map,
  FileText,
  Truck,
  ShoppingBag,
  Bell,
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  variant?: 'primary' | 'secondary';
  color?: string;
}

interface StockyardQuickActionsProps {
  showAll?: boolean;
  compact?: boolean;
}

export const StockyardQuickActions: React.FC<StockyardQuickActionsProps> = ({
  showAll = false,
  compact = false,
}) => {
  const navigate = useNavigate();

  const primaryActions: QuickAction[] = [
    {
      id: 'create-request',
      label: 'Record Movement',
      icon: Plus,
      path: '/app/stockyard/create',
      variant: 'primary',
    },
    {
      id: 'scan-vehicle',
      label: 'Scan Vehicle',
      icon: Search,
      path: '/app/stockyard/scan',
      variant: 'secondary',
    },
  ];

  const secondaryActions: QuickAction[] = [
    {
      id: 'components',
      label: 'Components',
      icon: Package,
      path: '/app/stockyard/components',
      variant: 'secondary',
    },
    {
      id: 'buyer-readiness',
      label: 'Buyer Readiness',
      icon: CheckCircle2,
      path: '/app/stockyard/buyer-readiness',
      variant: 'secondary',
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: AlertCircle,
      path: '/app/stockyard/alerts',
      variant: 'secondary',
    },
  ];

  const actions = showAll ? [...primaryActions, ...secondaryActions] : primaryActions;

  return (
    <div
      style={{
        ...cardStyles.card,
        display: 'flex',
        gap: compact ? spacing.sm : spacing.md,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant={action.variant || 'secondary'}
            onClick={() => navigate(action.path)}
            style={{
              flex: compact ? '0 1 auto' : '1 1 auto',
              minWidth: compact ? 'auto' : '150px',
            }}
          >
            <Icon size={compact ? 16 : 20} style={{ marginRight: spacing.xs }} />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
};


