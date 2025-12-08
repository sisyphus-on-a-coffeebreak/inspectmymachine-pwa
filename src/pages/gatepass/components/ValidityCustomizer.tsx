import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { colors, spacing, typography } from '../../../lib/theme';
import { getDefaultValidityHours } from '../config/defaults';

interface ValidityCustomizerProps {
  validFrom: string; // ISO string
  validTo: string; // ISO string
  onValidFromChange: (value: string) => void;
  onValidToChange: (value: string) => void;
  passType: 'visitor' | 'vehicle_outbound' | 'vehicle_inbound';
  defaultHours?: number;
}

export const ValidityCustomizer: React.FC<ValidityCustomizerProps> = ({
  validFrom,
  validTo,
  onValidFromChange,
  onValidToChange,
  passType,
  defaultHours,
}) => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [preset, setPreset] = useState<'4h' | '8h' | '24h' | 'custom'>('custom');
  const defaultValidityHours = defaultHours || getDefaultValidityHours(passType);

  // Calculate hours difference for display
  const calculateHours = (from: string, to: string): number => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60));
  };

  const currentHours = calculateHours(validFrom, validTo);

  // Format datetime-local input value (YYYY-MM-DDTHH:mm)
  const formatForInput = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Parse datetime-local input to ISO string
  const parseFromInput = (value: string): string => {
    return new Date(value).toISOString();
  };

  // Handle preset selection
  const handlePreset = (presetHours: number) => {
    const from = new Date(validFrom);
    const to = new Date(from.getTime() + presetHours * 60 * 60 * 1000);
    onValidToChange(to.toISOString());
    setPreset(presetHours === 4 ? '4h' : presetHours === 8 ? '8h' : '24h');
  };

  // Format date-time for display
  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      {!isCustomizing ? (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.neutral[50],
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <Clock size={18} color={colors.neutral[600]} />
            <div>
              <div style={{ ...typography.body, color: colors.neutral[900] }}>
                Valid for {currentHours} {currentHours === 1 ? 'hour' : 'hours'} from now
              </div>
              <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: '2px' }}>
                {formatDateTime(validFrom)} → {formatDateTime(validTo)}
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsCustomizing(true)}
            style={{ minWidth: '100px' }}
          >
            Customize
          </Button>
        </div>
      ) : (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.neutral[50],
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: '8px',
          }}
        >
          {/* Presets */}
          <div style={{ marginBottom: spacing.md }}>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
              Quick Presets
            </label>
            <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Button
                variant={preset === '4h' ? 'primary' : 'secondary'}
                onClick={() => handlePreset(4)}
                style={{ minWidth: '80px' }}
              >
                4 Hours
              </Button>
              <Button
                variant={preset === '8h' ? 'primary' : 'secondary'}
                onClick={() => handlePreset(8)}
                style={{ minWidth: '80px' }}
              >
                8 Hours
              </Button>
              <Button
                variant={preset === '24h' ? 'primary' : 'secondary'}
                onClick={() => handlePreset(24)}
                style={{ minWidth: '80px' }}
              >
                24 Hours
              </Button>
              <Button
                variant={preset === 'custom' ? 'primary' : 'secondary'}
                onClick={() => setPreset('custom')}
                style={{ minWidth: '80px' }}
              >
                Custom
              </Button>
            </div>
          </div>

          {/* Date-Time Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <div>
              <label
                style={{
                  ...typography.label,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  marginBottom: spacing.xs,
                }}
              >
                <Calendar size={16} color={colors.neutral[600]} />
                Valid From
              </label>
              <Input
                type="datetime-local"
                value={formatForInput(validFrom)}
                onChange={(e) => {
                  onValidFromChange(parseFromInput(e.target.value));
                  setPreset('custom');
                }}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label
                style={{
                  ...typography.label,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  marginBottom: spacing.xs,
                }}
              >
                <Clock size={16} color={colors.neutral[600]} />
                Valid To
              </label>
              <Input
                type="datetime-local"
                value={formatForInput(validTo)}
                onChange={(e) => {
                  onValidToChange(parseFromInput(e.target.value));
                  setPreset('custom');
                }}
                min={formatForInput(validFrom)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Summary */}
          <div
            style={{
              marginTop: spacing.md,
              padding: spacing.sm,
              backgroundColor: colors.primary[50],
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: colors.neutral[700],
            }}
          >
            Duration: {currentHours} {currentHours === 1 ? 'hour' : 'hours'}
          </div>

          {/* Done Button */}
          <div style={{ marginTop: spacing.md, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setIsCustomizing(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

