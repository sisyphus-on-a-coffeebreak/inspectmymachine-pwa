import React from 'react';
import type { UnifiedApproval } from '../../../hooks/useUnifiedApprovals';
import { Button } from '../../../components/ui/button';
import { colors, spacing, typography } from '../../../lib/theme';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalCardProps {
  approval: UnifiedApproval;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
}

const typeConfig: Record<
  UnifiedApproval['type'],
  { icon: string; color: string; label: string }
> = {
  gate_pass: { icon: '🎫', color: colors.primary, label: 'Gate Pass' },
  expense: { icon: '💰', color: colors.success[500], label: 'Expense' },
  transfer: { icon: '📦', color: colors.warning[500], label: 'Transfer' },
};

export function ApprovalCard({
  approval,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onView,
}: ApprovalCardProps) {
  const config = typeConfig[approval.type];

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: spacing.lg,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: `1px solid ${isSelected ? config.color : colors.neutral[200]}`,
        borderLeft: `4px solid ${config.color}`,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onClick={onView}
    >
      <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '4px' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <span style={{ fontSize: '20px' }}>{config.icon}</span>
            <span
              style={{
                ...typography.subheader,
                color: colors.neutral[900],
                fontSize: '16px',
              }}
            >
              {approval.referenceNumber}
            </span>
            <span
              style={{
                padding: '2px 8px',
                backgroundColor: config.color + '20',
                color: config.color,
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {config.label}
            </span>
            <span
              style={{
                ...typography.caption,
                color: colors.neutral[500],
                marginLeft: 'auto',
              }}
            >
              {formatDistanceToNow(approval.requestedAt, { addSuffix: true })}
            </span>
          </div>
          <div
            style={{
              ...typography.body,
              color: colors.neutral[900],
              fontWeight: 600,
              marginBottom: spacing.xs,
            }}
          >
            {approval.title}
          </div>
          <div style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.xs }}>
            {approval.subtitle}
          </div>
          <div style={{ ...typography.caption, color: colors.neutral[500] }}>
            Requested by: {approval.requestedBy.name}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTop: `1px solid ${colors.neutral[200]}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="secondary" size="small" onClick={onView}>
          View
        </Button>
        {approval.actions.canApprove && (
          <>
            <Button variant="primary" size="small" onClick={onApprove}>
              Approve
            </Button>
            <Button variant="secondary" size="small" onClick={onReject}>
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}



