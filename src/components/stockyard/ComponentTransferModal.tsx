import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { ArrowRight, Car, Package } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/providers/ToastProvider';

interface Vehicle {
  id: string;
  registration_number: string;
  make?: string;
  model?: string;
}

interface ComponentTransferModalProps {
  component: {
    id: string;
    type: 'battery' | 'tyre' | 'spare_part';
    brand?: string;
    model?: string;
    name?: string;
    serial_number?: string;
    part_number?: string;
    current_vehicle_id?: string | null;
    current_vehicle?: {
      id: string;
      registration_number: string;
      make?: string;
      model?: string;
    } | null;
  };
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ComponentTransferModal: React.FC<ComponentTransferModalProps> = ({
  component,
  open,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  const [formData, setFormData] = useState({
    to_vehicle_id: '',
    reason: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchVehicles();
      // Reset form
      setFormData({
        to_vehicle_id: '',
        reason: '',
      });
      setValidationErrors({});
    }
  }, [open]);

  const fetchVehicles = async () => {
    try {
      setFetchingVehicles(true);
      const response = await apiClient.get('/v1/vehicles');
      const vehicleData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || []);
      setVehicles(vehicleData);
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to load vehicles',
        variant: 'error',
      });
    } finally {
      setFetchingVehicles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!formData.to_vehicle_id) {
      errors.to_vehicle_id = 'Please select a destination vehicle';
    }

    if (formData.to_vehicle_id === component.current_vehicle_id) {
      errors.to_vehicle_id = 'Component is already assigned to this vehicle';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'error',
      });
      return;
    }

    setLoading(true);
    setValidationErrors({});

    try {
      const response = await apiClient.post(`/v1/components/${component.type}/${component.id}/transfer`, {
        to_vehicle_id: formData.to_vehicle_id,
        reason: formData.reason || null,
      });

      if (response.data.data?.requires_approval) {
        showToast({
          title: 'Transfer Request Created',
          description: 'This high-value component requires supervisor approval. The transfer request has been submitted.',
          variant: 'success',
          duration: 5000,
        });
      } else {
        showToast({
          title: 'Success',
          description: 'Component transferred successfully',
          variant: 'success',
        });
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to transfer component';
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const componentName = component.type === 'spare_part' 
    ? component.name 
    : `${component.brand || ''} ${component.model || ''}`.trim() || component.serial_number || component.part_number;

  if (!open) return null;

  return (
    <Modal
      title="Transfer Component"
      onClose={onClose}
      size="md"
      footer={
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            icon={<ArrowRight size={18} />}
          >
            Transfer Component
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        {/* Component Info */}
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <Package size={20} color={colors.primary} />
            <span style={{ ...typography.subheader, fontWeight: 600 }}>Component</span>
          </div>
          <div style={{ ...typography.body, color: colors.neutral[700] }}>
            {componentName}
          </div>
          {component.serial_number && (
            <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
              Serial: {component.serial_number}
            </div>
          )}
          {component.part_number && (
            <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
              Part Number: {component.part_number}
            </div>
          )}
        </div>

        {/* Current Vehicle */}
        {component.current_vehicle && (
          <div>
            <Label>Current Vehicle</Label>
            <div
              style={{
                padding: spacing.md,
                backgroundColor: colors.neutral[50],
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[200]}`,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <Car size={18} color={colors.neutral[600]} />
              <span style={{ ...typography.body }}>
                {component.current_vehicle.registration_number}
                {component.current_vehicle.make && component.current_vehicle.model && (
                  <> ({component.current_vehicle.make} {component.current_vehicle.model})</>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Destination Vehicle */}
        <div>
          <Label>
            Destination Vehicle <span style={{ color: colors.error[500] }}>*</span>
          </Label>
          {fetchingVehicles ? (
            <div style={{ padding: spacing.md, textAlign: 'center', color: colors.neutral[600] }}>
              Loading vehicles...
            </div>
          ) : (
            <select
              value={formData.to_vehicle_id}
              onChange={(e) => {
                setFormData({ ...formData, to_vehicle_id: e.target.value });
                setValidationErrors({ ...validationErrors, to_vehicle_id: '' });
              }}
              style={{
                width: '100%',
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: borderRadius.md,
                border: `1px solid ${validationErrors.to_vehicle_id ? colors.error[500] : colors.neutral[300]}`,
                fontSize: typography.body.fontSize,
                fontFamily: typography.body.fontFamily,
                backgroundColor: 'white',
              }}
            >
              <option value="">Select destination vehicle</option>
              {vehicles
                .filter((v) => v.id !== component.current_vehicle_id)
                .map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration_number}
                    {vehicle.make && vehicle.model ? ` (${vehicle.make} ${vehicle.model})` : ''}
                  </option>
                ))}
            </select>
          )}
          {validationErrors.to_vehicle_id && (
            <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
              {validationErrors.to_vehicle_id}
            </div>
          )}
        </div>

        {/* Transfer Reason */}
        <div>
          <Label>Transfer Reason (Optional)</Label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Enter reason for transfer..."
            rows={4}
            style={{
              width: '100%',
              padding: spacing.md,
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.neutral[300]}`,
              fontSize: typography.body.fontSize,
              fontFamily: typography.body.fontFamily,
              resize: 'vertical',
            }}
          />
        </div>

        {/* Info Note */}
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.primary + '10',
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.primary}30`,
          }}
        >
          <div style={{ ...typography.caption, color: colors.primary, fontWeight: 600, marginBottom: spacing.xs }}>
            ℹ️ Transfer Information
          </div>
          <div style={{ ...typography.caption, color: colors.neutral[700] }}>
            This transfer will be recorded in the component's custody history. The component will be immediately assigned to the destination vehicle.
          </div>
        </div>
      </form>
    </Modal>
  );
};

