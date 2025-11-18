import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { Wrench, Calendar, DollarSign, User } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/providers/ToastProvider';

interface ComponentMaintenanceModalProps {
  component: {
    id: string;
    type: 'battery' | 'tyre' | 'spare_part';
    brand?: string;
    model?: string;
    name?: string;
  };
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAINTENANCE_TYPES = [
  { value: 'service', label: 'Service' },
  { value: 'repair', label: 'Repair' },
  { value: 'replacement', label: 'Replacement' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'cleaning', label: 'Cleaning' },
];

export const ComponentMaintenanceModal: React.FC<ComponentMaintenanceModalProps> = ({
  component,
  open,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    maintenance_type: 'service',
    title: '',
    description: '',
    performed_at: new Date().toISOString().split('T')[0],
    next_due_date: '',
    cost: '',
    vendor_name: '',
    notes: '',
  });

  React.useEffect(() => {
    if (open) {
      // Reset form
      setFormData({
        maintenance_type: 'service',
        title: '',
        description: '',
        performed_at: new Date().toISOString().split('T')[0],
        next_due_date: '',
        cost: '',
        vendor_name: '',
        notes: '',
      });
      setValidationErrors({});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.performed_at) {
      errors.performed_at = 'Performed date is required';
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
      await apiClient.post(`/v1/components/${component.type}/${component.id}/maintenance`, {
        maintenance_type: formData.maintenance_type,
        title: formData.title,
        description: formData.description || null,
        performed_at: formData.performed_at,
        next_due_date: formData.next_due_date || null,
        cost: formData.cost ? Number(formData.cost) : null,
        vendor_name: formData.vendor_name || null,
        notes: formData.notes || null,
      });

      showToast({
        title: 'Success',
        description: 'Maintenance record created successfully',
        variant: 'success',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create maintenance record';
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const componentName = component.type === 'spare_part' 
    ? component.name 
    : `${component.brand || ''} ${component.model || ''}`.trim();

  return (
    <Modal
      title="Record Maintenance"
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
            icon={<Wrench size={18} />}
          >
            Save Maintenance
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
            <Wrench size={20} color={colors.primary} />
            <span style={{ ...typography.subheader, fontWeight: 600 }}>Component</span>
          </div>
          <div style={{ ...typography.body, color: colors.neutral[700] }}>
            {componentName}
          </div>
        </div>

        {/* Maintenance Type */}
        <div>
          <Label>
            Maintenance Type <span style={{ color: colors.error[500] }}>*</span>
          </Label>
          <select
            value={formData.maintenance_type}
            onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
            style={{
              width: '100%',
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.neutral[300]}`,
              fontSize: typography.body.fontSize,
              fontFamily: typography.body.fontFamily,
            }}
          >
            {MAINTENANCE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <Label>
            Title <span style={{ color: colors.error[500] }}>*</span>
          </Label>
          <Input
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              setValidationErrors({ ...validationErrors, title: '' });
            }}
            placeholder="e.g., Battery Charging, Tyre Rotation, etc."
            style={{
              borderColor: validationErrors.title ? colors.error[500] : undefined
            }}
          />
          {validationErrors.title && (
            <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
              {validationErrors.title}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <Label>Description</Label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the maintenance performed..."
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

        {/* Dates and Cost */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
          <div>
            <Label>
              Performed Date <span style={{ color: colors.error[500] }}>*</span>
            </Label>
            <Input
              type="date"
              value={formData.performed_at}
              onChange={(e) => {
                setFormData({ ...formData, performed_at: e.target.value });
                setValidationErrors({ ...validationErrors, performed_at: '' });
              }}
              style={{
                borderColor: validationErrors.performed_at ? colors.error[500] : undefined
              }}
            />
            {validationErrors.performed_at && (
              <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                {validationErrors.performed_at}
              </div>
            )}
          </div>
          <div>
            <Label>Next Due Date</Label>
            <Input
              type="date"
              value={formData.next_due_date}
              onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
            />
          </div>
          <div>
            <Label>Cost (₹)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Vendor */}
        <div>
          <Label>Vendor Name</Label>
          <Input
            value={formData.vendor_name}
            onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
            placeholder="Enter vendor/service provider name"
          />
        </div>

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
            rows={3}
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
      </form>
    </Modal>
  );
};


