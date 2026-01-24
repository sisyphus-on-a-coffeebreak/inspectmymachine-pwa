import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { colors, spacing, typography } from '@/lib/theme';
import { useSmartKeyboard } from '@/hooks/useSmartKeyboard';

interface NewVehiclePayload {
  registration_number: string;
  make?: string;
  model?: string;
  year?: number;
  vehicle_type?: string;
  yard_id?: string | null;
}

interface CreateVehicleFormProps {
  registrationNumber: string;
  onSubmit: (data: NewVehiclePayload) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  yardId?: string | null;
}

export const CreateVehicleForm: React.FC<CreateVehicleFormProps> = ({
  registrationNumber,
  onSubmit,
  onCancel,
  loading = false,
  yardId = null,
}) => {
  // Enable smart keyboard handling for mobile
  useSmartKeyboard({ enabled: true, scrollOffset: 100 });
  
  const [newVehicleData, setNewVehicleData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
  });

  const handleSubmit = async () => {
    if (!registrationNumber.trim()) {
      return;
    }

    await onSubmit({
      registration_number: registrationNumber.trim().toUpperCase(),
      make: newVehicleData.make.trim() || 'Unknown',
      model: newVehicleData.model.trim() || 'Unknown',
      year: newVehicleData.year ? parseInt(newVehicleData.year, 10) : new Date().getFullYear(),
      vehicle_type: 'commercial',
      yard_id: yardId,
    });
  };

  const isValid = 
    registrationNumber.trim() &&
    newVehicleData.make.trim() &&
    newVehicleData.model.trim() &&
    newVehicleData.year;

  return (
    <div
      style={{
        padding: spacing.md,
        border: `1px solid ${colors.neutral[300]}`,
        borderRadius: '8px',
        backgroundColor: colors.neutral[50],
        marginTop: spacing.md,
      }}
    >
      <div
        style={{
          fontSize: '0.875rem',
          color: colors.neutral[700],
          marginBottom: spacing.md,
          fontWeight: 500,
        }}
      >
        Vehicle not found. Create a new vehicle record:
      </div>

      <div
        className="responsive-vehicle-form-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr', // Single column on mobile
          gap: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <div>
          <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
            Make <span style={{ color: colors.error }}>*</span>
          </label>
          <Input
            type="text"
            inputMode="text"
            autoComplete="organization"
            value={newVehicleData.make}
            onChange={(e) =>
              setNewVehicleData((prev) => ({ ...prev, make: e.target.value }))
            }
            placeholder="e.g., Tata"
            required
            disabled={loading}
            style={{ fontSize: '16px' }} // 16px prevents iOS zoom
          />
        </div>
        <div>
          <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
            Model <span style={{ color: colors.error }}>*</span>
          </label>
          <Input
            type="text"
            inputMode="text"
            autoComplete="off"
            value={newVehicleData.model}
            onChange={(e) =>
              setNewVehicleData((prev) => ({ ...prev, model: e.target.value }))
            }
            placeholder="e.g., Ace"
            required
            disabled={loading}
            style={{ fontSize: '16px' }} // 16px prevents iOS zoom
          />
        </div>
      </div>

      <div style={{ marginBottom: spacing.md }}>
        <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
          Year <span style={{ color: colors.error }}>*</span>
        </label>
        <Input
          type="number"
          inputMode="numeric"
          autoComplete="off"
          value={newVehicleData.year}
          onChange={(e) =>
            setNewVehicleData((prev) => ({ ...prev, year: e.target.value }))
          }
          placeholder={`e.g., ${new Date().getFullYear()}`}
          min="1900"
          max={new Date().getFullYear() + 1}
          required
          disabled={loading}
          style={{ fontSize: '16px' }} // 16px prevents iOS zoom
        />
      </div>

      <div style={{ display: 'flex', gap: spacing.sm }}>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!isValid || loading}
        >
          <Plus size={16} style={{ marginRight: spacing.xs }} />
          {loading ? 'Creating...' : 'Create Vehicle & Continue'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>

      {/* Responsive grid styles */}
      <style>{`
        @media (min-width: 768px) {
          .responsive-vehicle-form-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};




