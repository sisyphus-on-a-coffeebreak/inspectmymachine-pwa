/**
 * BulkActionsBar Component
 * 
 * Displays bulk action buttons when users are selected
 */

import React from 'react';
import { Button } from '../ui/button';
import { colors, spacing, typography, cardStyles } from '../../lib/theme';
import { Power, PowerOff, Trash2, X } from 'lucide-react';

export interface BulkActionsBarProps {
  selectedCount: number;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onClear: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  isLoading?: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onActivate,
  onDeactivate,
  onDelete,
  onClear,
  canUpdate = false,
  canDelete = false,
  isLoading = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        ...cardStyles.base,
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.primary + '10',
        border: `2px solid ${colors.primary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: spacing.md,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <span style={{ ...typography.body, fontWeight: 600, color: colors.neutral[900] }}>
          {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          icon={<X size={16} />}
          disabled={isLoading}
        >
          Clear
        </Button>
      </div>

      <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
        {canUpdate && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onActivate}
              icon={<Power size={16} />}
              disabled={isLoading}
            >
              Activate
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onDeactivate}
              icon={<PowerOff size={16} />}
              disabled={isLoading}
            >
              Deactivate
            </Button>
          </>
        )}
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            icon={<Trash2 size={16} />}
            disabled={isLoading}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

