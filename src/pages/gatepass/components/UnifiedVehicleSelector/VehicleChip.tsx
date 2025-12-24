import React from 'react';
import { X } from 'lucide-react';
import type { Vehicle } from '../../gatePassTypes';
import { colors, spacing, typography } from '../../../../lib/theme';

interface VehicleChipProps {
  vehicle: Vehicle;
  onRemove: (vehicleId: string) => void;
  disabled?: boolean;
}

export const VehicleChip: React.FC<VehicleChipProps> = ({
  vehicle,
  onRemove,
  disabled = false,
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.sm}`,
        backgroundColor: colors.primary[50],
        border: `1px solid ${colors.primary[200]}`,
        borderRadius: '6px',
        fontSize: '0.875rem',
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
      }}
    >
      <span style={{ fontWeight: 500, color: colors.neutral[900] }}>
        🚛 {vehicle.registration_number}
      </span>
      {vehicle.make || vehicle.model ? (
        <span style={{ color: colors.neutral[600], fontSize: '0.75rem' }}>
          ({vehicle.make} {vehicle.model})
        </span>
      ) : null}
      <button
        onClick={() => !disabled && onRemove(String(vehicle.id))}
        disabled={disabled}
        style={{
          background: 'none',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          color: disabled ? colors.neutral[400] : colors.neutral[600],
          marginLeft: spacing.xs,
        }}
        aria-label={`Remove ${vehicle.registration_number}`}
      >
        <X size={14} />
      </button>
    </div>
  );
};







