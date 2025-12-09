import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { FormField } from '../ui/FormField';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { Battery, Circle, Wrench, Package, X, Plus } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';
import { useCreateComponent } from '../../lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queries';

interface ComponentRecordingModalProps {
  vehicleId: string;
  stockyardRequestId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMPONENT_TYPES = [
  { value: 'battery', label: 'Battery', icon: Battery },
  { value: 'tyre', label: 'Tyre', icon: Circle },
  { value: 'spare_part', label: 'Spare Part', icon: Wrench },
];

export const ComponentRecordingModal: React.FC<ComponentRecordingModalProps> = ({
  vehicleId,
  stockyardRequestId,
  open,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateComponent();
  const [componentType, setComponentType] = useState<'battery' | 'tyre' | 'spare_part'>('battery');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty_expires_at: '',
    purchase_cost: '0',
    status: 'active',
    notes: `Component recorded during vehicle entry. Stockyard Request: ${stockyardRequestId}`,
    // Battery-specific
    serial_number: '',
    capacity: '',
    voltage: '',
    // Tyre-specific
    size: '',
    tread_depth_mm: '',
    position: '',
    // Spare part-specific
    part_number: '',
    name: '',
    category: 'engine',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        brand: '',
        model: '',
        purchase_date: new Date().toISOString().split('T')[0],
        warranty_expires_at: '',
        purchase_cost: '0',
        status: 'active',
        notes: `Component recorded during vehicle entry. Stockyard Request: ${stockyardRequestId}`,
        serial_number: '',
        capacity: '',
        voltage: '',
        size: '',
        tread_depth_mm: '',
        position: '',
        part_number: '',
        name: '',
        category: 'engine',
      });
      setValidationErrors({});
      setComponentType('battery');
    }
  }, [open, stockyardRequestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    // Common validation
    if (!formData.brand.trim()) errors.brand = 'Brand is required';
    if (!formData.model.trim()) errors.model = 'Model is required';

    // Type-specific validation
    if (componentType === 'battery') {
      if (!formData.serial_number.trim()) errors.serial_number = 'Serial number is required';
      if (!formData.capacity.trim()) errors.capacity = 'Capacity is required';
      if (!formData.voltage.trim()) errors.voltage = 'Voltage is required';
    } else if (componentType === 'tyre') {
      if (!formData.serial_number.trim()) errors.serial_number = 'Serial number is required';
      if (!formData.size.trim()) errors.size = 'Size is required';
    } else if (componentType === 'spare_part') {
      if (!formData.part_number.trim()) errors.part_number = 'Part number is required';
      if (!formData.name.trim()) errors.name = 'Name is required';
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

    setValidationErrors({});
    setLoading(true);

    try {
      const submitData: any = {
        type: componentType,
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        purchase_date: formData.purchase_date,
        warranty_expires_at: formData.warranty_expires_at || null,
        purchase_cost: Number(formData.purchase_cost) || 0,
        current_vehicle_id: vehicleId,
        status: componentType === 'spare_part' ? 'in_stock' : formData.status,
        notes: formData.notes || null,
      };

      if (componentType === 'battery') {
        submitData.serial_number = formData.serial_number;
        submitData.capacity = formData.capacity;
        submitData.voltage = formData.voltage;
      } else if (componentType === 'tyre') {
        submitData.serial_number = formData.serial_number;
        submitData.size = formData.size;
        submitData.tread_depth_mm = formData.tread_depth_mm ? Number(formData.tread_depth_mm) : null;
        submitData.position = formData.position || null;
      } else if (componentType === 'spare_part') {
        submitData.part_number = formData.part_number;
        submitData.name = formData.name;
        submitData.category = formData.category;
      }

      await createMutation.mutateAsync(submitData);

      // Invalidate queries to refresh component lists
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.components.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.components.custodyEvents() });

      showToast({
        title: 'Success',
        description: `${COMPONENT_TYPES.find(t => t.value === componentType)?.label} recorded successfully`,
        variant: 'success',
      });

      onSuccess?.();
      // Don't close modal - allow recording multiple components
      // Reset form for next component
      setFormData({
        brand: '',
        model: '',
        purchase_date: new Date().toISOString().split('T')[0],
        warranty_expires_at: '',
        purchase_cost: '0',
        status: 'active',
        notes: `Component recorded during vehicle entry. Stockyard Request: ${stockyardRequestId}`,
        serial_number: '',
        capacity: '',
        voltage: '',
        size: '',
        tread_depth_mm: '',
        position: '',
        part_number: '',
        name: '',
        category: 'engine',
      });
      setValidationErrors({});
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to record component',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const TypeIcon = COMPONENT_TYPES.find(t => t.value === componentType)?.icon || Battery;

  return (
    <Modal
      title="Record Component"
      onClose={onClose}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Done
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            <Plus size={16} style={{ marginRight: spacing.xs }} />
            Add Component
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        {/* Component Type Selector */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={{ ...typography.label, marginBottom: spacing.sm, display: 'block' }}>
            Component Type *
          </label>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            {COMPONENT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = componentType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setComponentType(type.value as 'battery' | 'tyre' | 'spare_part');
                    setValidationErrors({});
                  }}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    border: `2px solid ${isSelected ? colors.primary : colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    background: isSelected ? colors.primary + '10' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: spacing.xs,
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={24} color={isSelected ? colors.primary : colors.neutral[600]} />
                  <span style={{ ...typography.body, fontSize: '13px', fontWeight: isSelected ? 600 : 400 }}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Common Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
          <FormField
            label="Brand *"
            value={formData.brand}
            onChange={(value) => setFormData({ ...formData, brand: value })}
            error={validationErrors.brand}
            required
          />
          <FormField
            label="Model *"
            value={formData.model}
            onChange={(value) => setFormData({ ...formData, model: value })}
            error={validationErrors.model}
            required
          />
        </div>

        {/* Type-Specific Fields */}
        {componentType === 'battery' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
              <FormField
                label="Serial Number *"
                value={formData.serial_number}
                onChange={(value) => setFormData({ ...formData, serial_number: value })}
                error={validationErrors.serial_number}
                required
              />
              <FormField
                label="Capacity *"
                value={formData.capacity}
                onChange={(value) => setFormData({ ...formData, capacity: value })}
                error={validationErrors.capacity}
                required
              />
              <FormField
                label="Voltage *"
                value={formData.voltage}
                onChange={(value) => setFormData({ ...formData, voltage: value })}
                error={validationErrors.voltage}
                required
              />
            </div>
          </>
        )}

        {componentType === 'tyre' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
              <FormField
                label="Serial Number *"
                value={formData.serial_number}
                onChange={(value) => setFormData({ ...formData, serial_number: value })}
                error={validationErrors.serial_number}
                required
              />
              <FormField
                label="Size *"
                value={formData.size}
                onChange={(value) => setFormData({ ...formData, size: value })}
                error={validationErrors.size}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
              <FormField
                label="Tread Depth (mm)"
                type="number"
                value={formData.tread_depth_mm}
                onChange={(value) => setFormData({ ...formData, tread_depth_mm: value })}
              />
              <FormField
                label="Position"
                value={formData.position}
                onChange={(value) => setFormData({ ...formData, position: value })}
                placeholder="e.g., Front Left, Rear Right"
              />
            </div>
          </>
        )}

        {componentType === 'spare_part' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
              <FormField
                label="Part Number *"
                value={formData.part_number}
                onChange={(value) => setFormData({ ...formData, part_number: value })}
                error={validationErrors.part_number}
                required
              />
              <FormField
                label="Name *"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                error={validationErrors.name}
                required
              />
            </div>
            <div style={{ marginBottom: spacing.md }}>
              <FormField
                label="Category"
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
              />
            </div>
          </>
        )}

        {/* Optional Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
          <FormField
            label="Purchase Date"
            type="date"
            value={formData.purchase_date}
            onChange={(value) => setFormData({ ...formData, purchase_date: value })}
          />
          <FormField
            label="Warranty Expires"
            type="date"
            value={formData.warranty_expires_at}
            onChange={(value) => setFormData({ ...formData, warranty_expires_at: value })}
          />
        </div>

        <div style={{ marginBottom: spacing.md }}>
          <FormField
            label="Notes"
            value={formData.notes}
            onChange={(value) => setFormData({ ...formData, notes: value })}
          />
        </div>
      </form>
    </Modal>
  );
};


