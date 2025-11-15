/**
 * ComponentTransferChip Component
 * 
 * Visual indicator for component transfers in stockyard module
 * Shows component movement history between vehicles
 */

import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { ArrowRight, ArrowLeft, Package } from 'lucide-react';

export interface ComponentTransfer {
  id: string;
  component_type: 'battery' | 'tyre' | 'spare';
  serial_number: string;
  type: 'install' | 'remove';
  from_vehicle?: string;
  to_vehicle: string;
  transferred_at: string;
  transferred_by?: string;
}

export interface ComponentTransferChipProps {
  transfer: ComponentTransfer;
  onClick?: () => void;
}

const componentIcons: Record<string, string> = {
  battery: '🔋',
  tyre: '🛞',
  spare: '📦',
};

const componentColors: Record<string, { bg: string; border: string; text: string }> = {
  battery: {
    bg: colors.success[100],
    border: colors.success[300],
    text: colors.success[700],
  },
  tyre: {
    bg: colors.warning[100],
    border: colors.warning[300],
    text: colors.warning[700],
  },
  spare: {
    bg: colors.primary + '20',
    border: colors.primary + '40',
    text: colors.primary,
  },
};

export const ComponentTransferChip: React.FC<ComponentTransferChipProps> = ({
  transfer,
  onClick,
}) => {
  const componentStyle = componentColors[transfer.component_type] || componentColors.spare;
  const isInstall = transfer.type === 'install';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.sm}`,
        backgroundColor: componentStyle.bg,
        border: `1px solid ${componentStyle.border}`,
        borderRadius: borderRadius.full,
        fontSize: '12px',
        fontFamily: typography.body.fontFamily,
        color: componentStyle.text,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 2px 8px ${componentStyle.border}`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      onFocus={(e) => {
        if (onClick) {
          e.currentTarget.style.outline = `2px solid ${colors.primary}`;
          e.currentTarget.style.outlineOffset = '2px';
        }
      }}
      onBlur={(e) => {
        if (onClick) {
          e.currentTarget.style.outline = 'none';
        }
      }}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? 'button' : undefined}
      aria-label={`${transfer.component_type} ${transfer.serial_number} ${isInstall ? 'installed to' : 'removed from'} ${transfer.to_vehicle}`}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span style={{ fontSize: '14px' }}>
        {componentIcons[transfer.component_type] || <Package size={14} />}
      </span>
      <span style={{ fontWeight: 600 }}>
        {transfer.component_type.charAt(0).toUpperCase() + transfer.component_type.slice(1)}:
      </span>
      <span>{transfer.serial_number}</span>
      {isInstall ? (
        <>
          <ArrowRight size={12} />
          <span>{transfer.to_vehicle}</span>
        </>
      ) : (
        <>
          <ArrowLeft size={12} />
          <span>{transfer.from_vehicle || 'Stock'}</span>
        </>
      )}
    </div>
  );
};

/**
 * ComponentTransferChipGroup - Container for multiple transfer chips
 */
export const ComponentTransferChipGroup: React.FC<{
  transfers: ComponentTransfer[];
  title?: string;
  onTransferClick?: (transfer: ComponentTransfer) => void;
  className?: string;
}> = ({ transfers, title, onTransferClick, className = '' }) => (
  <div className={`component-transfer-chip-group ${className}`} style={{ marginTop: spacing.md }}>
    {title && (
      <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
        {title}
      </div>
    )}
    {transfers.length === 0 ? (
      <div style={{ ...typography.bodySmall, color: colors.neutral[500], fontStyle: 'italic' }}>
        No component transfers recorded
      </div>
    ) : (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
        {transfers.map((transfer) => (
          <ComponentTransferChip
            key={transfer.id}
            transfer={transfer}
            onClick={onTransferClick ? () => onTransferClick(transfer) : undefined}
          />
        ))}
      </div>
    )}
  </div>
);

export default ComponentTransferChip;

