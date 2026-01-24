import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Vehicle } from '../../gatePassTypes';
import { colors, spacing, typography } from '@/lib/theme';

interface VehicleCardProps {
  vehicle: Vehicle;
  onChange: () => void;
  disabled?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      style={{
        padding: spacing.md,
        border: `2px solid ${colors.success}`,
        borderRadius: '8px',
        backgroundColor: colors.success + '10',
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.sm,
      }}
    >
      <Check size={20} color={colors.success} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: colors.neutral[900] }}>
          🚛 {vehicle.registration_number}
        </div>
        {(vehicle.make || vehicle.model) && (
          <div style={{ fontSize: '0.75rem', color: colors.neutral[600], marginTop: spacing.xs }}>
            {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
          </div>
        )}
        {vehicle.current_location && (
          <div style={{ fontSize: '0.7rem', color: colors.neutral[500], marginTop: spacing.xs }}>
            📍 {vehicle.current_location}
          </div>
        )}
      </div>
      <Button
        variant="secondary"
        onClick={onChange}
        disabled={disabled}
        style={{ minWidth: '80px' }}
      >
        Change
      </Button>
    </div>
  );
};













